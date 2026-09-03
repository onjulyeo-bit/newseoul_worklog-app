-- 0058. 서명 모듈 — service_role 없이 동작하도록 조정 (1단계 실전용).
--   사용자 원칙: service_role 키는 앱에 넣지 않는다(.env.local 주석). 그래서:
--   - 원본 PDF·서명 PNG 를 private 스토리지 대신 DB(base64)에 보관 → 토큰 게이트 RPC로만 접근.
--     (anon 스토리지 읽기 정책을 주면 파일 목록 열거가 가능해져 경로 비밀이 깨짐. DB 보관이 유일하게 안전.)
--   - 서명 제출은 서버 Route Handler 가 IP·UA 를 붙여 sign_submit RPC 호출 (anon 키).
--   - PDF 합성(3단계)은 관리자 세션(is_admin RLS)으로 수행 → service_role 불필요.
--   스토리지 버킷 'sign'·source_pdf_path 는 향후 대용량/서명URL 전환용으로 남겨둠(지금은 미사용).
--   크기 한도: 원본 PDF 5MB, 서명 PNG 200KB (앱+RPC 이중 검사).

alter table public.sign_requests alter column source_pdf_path drop not null;
alter table public.sign_requests add column if not exists source_pdf_data text;   -- base64 PDF
alter table public.sign_signers  add column if not exists signature_data  text;   -- base64 PNG (data URL 제외 순수 base64)

-- ── 원본 PDF 내려받기 (토큰 게이트, anon). 메타(sign_fetch)와 분리해 필요할 때만 큰 데이터 전송. ──
create or replace function public.sign_fetch_pdf(p_token text)
returns text
language sql
security definer
set search_path = public
as $$
  select r.source_pdf_data
  from public.sign_signers s
  join public.sign_requests r on r.id = s.request_id
  where s.token = p_token
    and r.status = 'active'
    and (r.expires_at is null or r.expires_at > now());
$$;

-- ── 서명 제출 (토큰 게이트, anon). pending/viewed → signed. 서명 PNG ≤ 200KB(base64 ≈ 273KB). ──
create or replace function public.sign_submit(p_token text, p_signature text, p_ip text, p_ua text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare v_signer uuid; v_request uuid; v_status text;
begin
  if p_signature is null or length(p_signature) < 100 then
    raise exception 'empty_signature';
  end if;
  if length(p_signature) > 280000 then
    raise exception 'signature_too_large';
  end if;

  select s.id, s.request_id, s.status into v_signer, v_request, v_status
  from public.sign_signers s
  join public.sign_requests r on r.id = s.request_id
  where s.token = p_token
    and r.status = 'active'
    and (r.expires_at is null or r.expires_at > now());
  if v_signer is null then raise exception 'invalid_token'; end if;
  if v_status not in ('pending', 'viewed') then raise exception 'already_signed'; end if;

  update public.sign_signers set
    status = 'signed', signed_at = now(),
    signature_data = p_signature,
    ip = p_ip, user_agent = p_ua
  where id = v_signer;

  insert into public.sign_events (request_id, signer_id, event, meta)
    values (v_request, v_signer, 'signed', jsonb_build_object('at', now()));

  -- 전원 서명 완료 시 요청 상태를 completed 로 (합성 PDF 는 관리자가 현황판에서 생성)
  if not exists (
    select 1 from public.sign_signers where request_id = v_request and status <> 'signed'
  ) then
    update public.sign_requests set status = 'completed', updated_at = now() where id = v_request;
    insert into public.sign_events (request_id, event, meta)
      values (v_request, 'completed', jsonb_build_object('at', now()));
  end if;

  return true;
end;
$$;

grant execute on function public.sign_fetch_pdf(text)                  to anon, authenticated;
grant execute on function public.sign_submit(text, text, text, text)   to anon, authenticated;
