-- 0057. 서명 수집 모듈 (e-Sign) — 문서 1건에 여러 서명자, 토큰 링크로 자가 서명.
--   첫 실전: 2027 지회장 연임 건의서·동의서·권면문 (증경회장 13명 + 확인자 + 수락자, 2026-09).
--   설계: docs/사양서/SPEC_서명모듈.md
--
-- 아키텍처 결정(초안 헤더의 '고칠 것' 반영):
--  1) chapter_id = text('새서울') references chapters(chapter_id). (이 앱은 uuid 아님)
--  2) 쓰기=is_admin() / 읽기=관리자 직접(is_admin). 서명자는 테이블 직접 접근 금지.
--  3) created_by = auth.uid() references profiles(id). (members(id) 아님 — 이 앱 관례)
--  4) 서명자 접근 = 체크인과 동일 패턴의 토큰 게이트 SECURITY DEFINER RPC(anon):
--     - sign_fetch(token): 문서 메타 + 본인 슬롯 조회 (열람 확인용)
--     - sign_mark_viewed(token): 열람 기록
--     서명 PNG 업로드·PDF 합성·private storage signed URL 은 SQL로 못 하므로
--     서버 Route Handler(service_role)에서 처리 (SUPABASE_SERVICE_ROLE_KEY 필요 — 구현 시 Vercel 추가).
--  5) Storage 버킷 'sign' = private. 서버(service_role)만 업로드/열람. 클라 정책은 관리자 read만.

-- ── 테이블 ────────────────────────────────────────────────
create table if not exists public.sign_requests (
  id              uuid primary key default gen_random_uuid(),
  chapter_id      text not null default '새서울' references public.chapters (chapter_id),
  title           text not null,
  description     text,
  source_pdf_path text not null,                          -- sign/{chapter_id}/{id}/source.pdf
  final_pdf_path  text,                                   -- 전원 완료 후 합성본
  status          text not null default 'draft'
                  check (status in ('draft','active','completed','expired','cancelled')),
  expires_at      timestamptz,
  created_by      uuid default auth.uid() references public.profiles (id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists public.sign_slots (
  id         uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.sign_requests (id) on delete cascade,
  label      text not null,                               -- "김세중", "유선 동의 확인자" 등
  page       int  not null,
  x numeric not null, y numeric not null, w numeric not null, h numeric not null,  -- PDF pt, 좌하단 원점
  order_no   int not null default 0
);

create table if not exists public.sign_signers (
  id             uuid primary key default gen_random_uuid(),
  request_id     uuid not null references public.sign_requests (id) on delete cascade,
  slot_id        uuid not null references public.sign_slots (id) on delete cascade,
  member_id      uuid references public.members (id),     -- 회원이면 연결(비회원 임시 서명자 허용)
  name           text not null,
  phone          text,
  token          text not null unique,                    -- nanoid(32), URL용
  status         text not null default 'pending'
                 check (status in ('pending','viewed','signed','declined')),
  viewed_at      timestamptz,
  signed_at      timestamptz,
  signature_path text,                                    -- sign/{chapter_id}/{request_id}/sig_{signer_id}.png
  ip             text,
  user_agent     text,
  auth_kakao_id  text,                                    -- 카카오 로그인 상태였다면 기록
  created_at     timestamptz not null default now()
);

create table if not exists public.sign_events (
  id         bigserial primary key,
  request_id uuid references public.sign_requests (id) on delete cascade,
  signer_id  uuid references public.sign_signers (id) on delete set null,
  event      text not null,                               -- created|link_sent|viewed|signed|declined|reminded|completed
  meta       jsonb,
  created_at timestamptz not null default now()
);

create index if not exists sign_slots_request_idx   on public.sign_slots (request_id);
create index if not exists sign_signers_request_idx on public.sign_signers (request_id);
create index if not exists sign_signers_token_idx   on public.sign_signers (token);
create index if not exists sign_events_request_idx  on public.sign_events (request_id, created_at);

-- ── RLS: 관리자만 직접 접근. 서명자는 아래 토큰 RPC(SECURITY DEFINER)로만. ──
alter table public.sign_requests enable row level security;
alter table public.sign_slots    enable row level security;
alter table public.sign_signers  enable row level security;
alter table public.sign_events   enable row level security;

drop policy if exists sign_requests_admin on public.sign_requests;
create policy sign_requests_admin on public.sign_requests
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists sign_slots_admin on public.sign_slots;
create policy sign_slots_admin on public.sign_slots
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists sign_signers_admin on public.sign_signers;
create policy sign_signers_admin on public.sign_signers
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists sign_events_admin on public.sign_events;
create policy sign_events_admin on public.sign_events
  for all using (public.is_admin()) with check (public.is_admin());

-- ── 서명자 조회 (토큰 게이트, anon 호출). 문서 메타 + 본인 슬롯 1건. ──
--   상태 draft/expired/cancelled 이거나 만료 지났으면 아무 행도 반환하지 않음.
create or replace function public.sign_fetch(p_token text)
returns table (
  signer_id uuid, signer_name text, signer_status text, signed_at timestamptz,
  request_id uuid, req_title text, req_description text, req_status text, expires_at timestamptz,
  source_pdf_path text,
  slot_page int, slot_x numeric, slot_y numeric, slot_w numeric, slot_h numeric, slot_label text
)
language sql
security definer
set search_path = public
as $$
  select s.id, s.name, s.status, s.signed_at,
         r.id, r.title, r.description, r.status, r.expires_at,
         r.source_pdf_path,
         sl.page, sl.x, sl.y, sl.w, sl.h, sl.label
  from public.sign_signers s
  join public.sign_requests r on r.id = s.request_id
  join public.sign_slots    sl on sl.id = s.slot_id
  where s.token = p_token
    and r.status = 'active'
    and (r.expires_at is null or r.expires_at > now());
$$;

-- ── 열람 기록 (토큰 게이트, anon 호출). pending → viewed. ──
create or replace function public.sign_mark_viewed(p_token text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare v_signer uuid; v_request uuid;
begin
  select s.id, s.request_id into v_signer, v_request
  from public.sign_signers s
  join public.sign_requests r on r.id = s.request_id
  where s.token = p_token
    and r.status = 'active'
    and (r.expires_at is null or r.expires_at > now());
  if v_signer is null then return false; end if;

  update public.sign_signers
    set status = 'viewed', viewed_at = coalesce(viewed_at, now())
    where id = v_signer and status = 'pending';

  insert into public.sign_events (request_id, signer_id, event, meta)
    values (v_request, v_signer, 'viewed', jsonb_build_object('at', now()));
  return true;
end;
$$;

grant execute on function public.sign_fetch(text)       to anon, authenticated;
grant execute on function public.sign_mark_viewed(text) to anon, authenticated;

-- ── Storage 버킷 'sign' (private). 서버(service_role)만 사용. 클라는 관리자 read만. ──
insert into storage.buckets (id, name, public) values ('sign', 'sign', false)
  on conflict (id) do nothing;
drop policy if exists "sign_admin_read" on storage.objects;
create policy "sign_admin_read" on storage.objects for select
  using (bucket_id = 'sign' and public.is_admin());
-- 업로드·삭제·서명자 열람은 서버 Route Handler(service_role, RLS 우회)에서만 수행.
