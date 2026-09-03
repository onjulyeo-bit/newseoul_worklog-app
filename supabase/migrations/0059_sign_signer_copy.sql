-- 0059. 서명자 본인 서명본 PDF — 서명 직후 완료 화면에서 바로 보기/저장.
--   1) sign_fetch / sign_fetch_pdf: 전원 완료(completed)된 문서도 서명자가 다시 열 수 있게 (기존엔 active 만 → 완료 후 재접속 시 '만료'로 보이던 문제 수정)
--   2) sign_fetch_my_signature(token): 본인 서명 PNG·시각·IP 를 토큰으로 조회 → 서버 라우트 /api/sign/[token]/pdf 가 본인 서명만 합성해 내려줌.
--   서명 제출(sign_submit)은 그대로 active 에서만 가능.

create or replace function public.sign_fetch(p_token text)
returns table (
  signer_id uuid, signer_name text, signer_status text, signed_at timestamptz,
  request_id uuid, req_title text, req_description text, req_status text, expires_at timestamptz,
  source_pdf_path text,
  slot_page int, slot_x numeric, slot_y numeric, slot_w numeric, slot_h numeric, slot_label text
)
language sql security definer set search_path = public as $$
  select s.id, s.name, s.status, s.signed_at,
         r.id, r.title, r.description, r.status, r.expires_at,
         r.source_pdf_path,
         sl.page, sl.x, sl.y, sl.w, sl.h, sl.label
  from public.sign_signers s
  join public.sign_requests r on r.id = s.request_id
  join public.sign_slots    sl on sl.id = s.slot_id
  where s.token = p_token
    and r.status in ('active', 'completed')
    and (r.status = 'completed' or r.expires_at is null or r.expires_at > now());
$$;

create or replace function public.sign_fetch_pdf(p_token text)
returns text
language sql security definer set search_path = public as $$
  select r.source_pdf_data
  from public.sign_signers s
  join public.sign_requests r on r.id = s.request_id
  where s.token = p_token
    and r.status in ('active', 'completed')
    and (r.status = 'completed' or r.expires_at is null or r.expires_at > now());
$$;

create or replace function public.sign_fetch_my_signature(p_token text)
returns table (signature_data text, signed_at timestamptz, ip text, auth_kakao_id text)
language sql security definer set search_path = public as $$
  select s.signature_data, s.signed_at, s.ip, s.auth_kakao_id
  from public.sign_signers s
  join public.sign_requests r on r.id = s.request_id
  where s.token = p_token
    and s.status = 'signed'
    and r.status in ('active', 'completed');
$$;

grant execute on function public.sign_fetch(text)              to anon, authenticated;
grant execute on function public.sign_fetch_pdf(text)          to anon, authenticated;
grant execute on function public.sign_fetch_my_signature(text) to anon, authenticated;
