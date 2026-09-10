-- 0061. 서명 단체(공용) 링크 — 요청당 링크 1개를 단톡방에 올리면, 서명자가 명단에서 본인을 눌러 각자 서명.
--   보안 모델: QR 체크인과 동일한 '신뢰 기반 본인 선택'(닫힌 단톡방 전제) + 서명 자체가 자필 + IP·UA 증빙 기록.
--   개인별 링크(/s/[token])는 그대로 유효 — 단체 링크는 그 위의 편의 계층.

-- 1) 요청에 단체 토큰 (기존 행 백필 포함)
alter table public.sign_requests add column if not exists group_token text unique;
update public.sign_requests
   set group_token = 'g' || replace(gen_random_uuid()::text, '-', '')
 where group_token is null;

-- 2) 단체 링크로 명단 조회 (익명, 토큰 게이트 SECURITY DEFINER — 기존 sign_fetch 패턴)
--    진행중/완료 요청만. 서명자별 개인 토큰을 함께 반환(이름 탭 → /s/[token] 이동용).
create or replace function public.sign_group_fetch(p_group_token text)
returns json
language sql
security definer
set search_path = public
as $$
  select json_build_object(
    'request_id', r.id,
    'title', r.title,
    'description', r.description,
    'status', r.status,
    'expires_at', r.expires_at,
    'signers', (
      select coalesce(json_agg(json_build_object(
               'name', s.name,
               'label', sl.label,
               'status', s.status,
               'signed_at', s.signed_at,
               'token', s.token
             ) order by sl.order_no), '[]'::json)
        from public.sign_signers s
        join public.sign_slots sl on sl.id = s.slot_id
       where s.request_id = r.id
    )
  )
  from public.sign_requests r
 where r.group_token = p_group_token
   and r.status in ('active', 'completed')
   and (r.expires_at is null or r.expires_at > now() or r.status = 'completed');
$$;

grant execute on function public.sign_group_fetch(text) to anon, authenticated;
