-- 0016. 출석 취소 (회원 QR 화면에서 잘못 누른 경우 되돌리기)
--   토큰 검증 후 present=false. 로그인 없이 anon 호출.

create or replace function public.check_out(p_meeting uuid, p_member uuid, p_token text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.meetings where id = p_meeting and checkin_token = p_token
  ) then
    raise exception 'invalid_token';
  end if;
  update public.attendance set present = false, paid = false
    where meeting_id = p_meeting and member_id = p_member;
  return true;
end; $$;

grant execute on function public.check_out(uuid, uuid, text) to anon, authenticated;
