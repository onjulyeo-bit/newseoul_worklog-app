-- 0052. 로그인 후 '본인 확인' — 카카오 로그인한 사람이 이름+전화 뒷4자리로 직접 명단과 연결.
--   매칭되면 내 profiles.member_id 연결 + 회원 권한(guest일 때만). 운영진 승급은 자동 X(/roles에서만) — 안전.
create or replace function public.member_self_claim(p_name text, p_last4 text)
returns json language plpgsql security definer set search_path = public as $$
declare m_id uuid; m_name text;
begin
  if auth.uid() is null then return json_build_object('ok', false, 'reason', 'no_auth'); end if;

  select id, name into m_id, m_name from public.members
   where chapter_id = '새서울' and name = btrim(p_name)
     and (phone is null or phone = '' or right(regexp_replace(coalesce(phone, ''), '[^0-9]', '', 'g'), 4) = btrim(p_last4))
   order by created_at nulls last
   limit 1;

  if m_id is null then return json_build_object('ok', false, 'reason', 'no_match'); end if;

  -- 내 프로필만 갱신(SECURITY DEFINER). 이미 운영진이면 권한 유지, guest면 회원으로.
  update public.profiles
     set member_id = m_id,
         role = case when role = 'guest' then 'member' else role end
   where id = auth.uid();

  return json_build_object('ok', true, 'name', m_name);
end; $$;

grant execute on function public.member_self_claim(text, text) to authenticated;
