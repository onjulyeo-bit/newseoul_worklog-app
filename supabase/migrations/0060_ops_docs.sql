-- 0060: 지회 운영 허브 · 보관 서류 (2026-09-10)
--   1) chapter_docs — 운영진 직접 업로드 서류 (파일은 base64 로 DB 보관, ≤5MB. service_role 미사용 원칙)
--   2) sign_requests.doc_category — 서명 완료본이 보관 서류에 들어갈 분류
--   3) 서명 4개 테이블 읽기 정책을 is_staff() 로 완화 (읽기 운영진 viewer 도 목록·현황판 조회 가능). 쓰기는 is_admin() 유지.
-- 적용: Supabase SQL Editor 에 통째로 실행. 전제: 0032(is_staff), 0057~0059 적용됨.

-- ── 1) chapter_docs ─────────────────────────────────────────────
create table if not exists public.chapter_docs (
  id          uuid primary key default gen_random_uuid(),
  chapter_id  text not null default '새서울',
  title       text not null,
  category    text not null,
  note        text,
  file_name   text not null,
  file_mime   text not null,
  file_size   integer not null,
  file_data   text not null,                 -- base64 (원본 ≤ 5MB)
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists chapter_docs_chapter_created on public.chapter_docs (chapter_id, created_at desc);

alter table public.chapter_docs enable row level security;

drop policy if exists chapter_docs_read on public.chapter_docs;
create policy chapter_docs_read on public.chapter_docs
  for select using (public.is_staff());

drop policy if exists chapter_docs_insert on public.chapter_docs;
create policy chapter_docs_insert on public.chapter_docs
  for insert with check (public.is_admin());

drop policy if exists chapter_docs_update on public.chapter_docs;
create policy chapter_docs_update on public.chapter_docs
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists chapter_docs_delete on public.chapter_docs;
create policy chapter_docs_delete on public.chapter_docs
  for delete using (public.is_admin());

-- ── 2) sign_requests.doc_category ───────────────────────────────
alter table public.sign_requests
  add column if not exists doc_category text not null default '임원·연임 서류';

-- ── 3) 서명 테이블: 읽기 is_staff / 쓰기 is_admin ───────────────
-- sign_requests
drop policy if exists sign_requests_admin on public.sign_requests;
drop policy if exists sign_requests_read  on public.sign_requests;
drop policy if exists sign_requests_write on public.sign_requests;
create policy sign_requests_read  on public.sign_requests for select using (public.is_staff());
create policy sign_requests_write on public.sign_requests for insert with check (public.is_admin());
drop policy if exists sign_requests_update on public.sign_requests;
create policy sign_requests_update on public.sign_requests for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists sign_requests_delete on public.sign_requests;
create policy sign_requests_delete on public.sign_requests for delete using (public.is_admin());

-- sign_slots
drop policy if exists sign_slots_admin on public.sign_slots;
drop policy if exists sign_slots_read  on public.sign_slots;
drop policy if exists sign_slots_write on public.sign_slots;
create policy sign_slots_read  on public.sign_slots for select using (public.is_staff());
create policy sign_slots_write on public.sign_slots for insert with check (public.is_admin());
drop policy if exists sign_slots_update on public.sign_slots;
create policy sign_slots_update on public.sign_slots for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists sign_slots_delete on public.sign_slots;
create policy sign_slots_delete on public.sign_slots for delete using (public.is_admin());

-- sign_signers
drop policy if exists sign_signers_admin on public.sign_signers;
drop policy if exists sign_signers_read  on public.sign_signers;
drop policy if exists sign_signers_write on public.sign_signers;
create policy sign_signers_read  on public.sign_signers for select using (public.is_staff());
create policy sign_signers_write on public.sign_signers for insert with check (public.is_admin());
drop policy if exists sign_signers_update on public.sign_signers;
create policy sign_signers_update on public.sign_signers for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists sign_signers_delete on public.sign_signers;
create policy sign_signers_delete on public.sign_signers for delete using (public.is_admin());

-- sign_events
drop policy if exists sign_events_admin on public.sign_events;
drop policy if exists sign_events_read  on public.sign_events;
drop policy if exists sign_events_write on public.sign_events;
create policy sign_events_read  on public.sign_events for select using (public.is_staff());
create policy sign_events_write on public.sign_events for insert with check (public.is_admin());
drop policy if exists sign_events_update on public.sign_events;
create policy sign_events_update on public.sign_events for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists sign_events_delete on public.sign_events;
create policy sign_events_delete on public.sign_events for delete using (public.is_admin());

-- 확인: select policyname, cmd from pg_policies where tablename in ('chapter_docs','sign_requests');
