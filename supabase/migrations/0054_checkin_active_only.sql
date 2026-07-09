-- 0054. 체크인 명단 = '활동중' 회원만.
--   기존엔 status가 'OB'만 제외(활동중·유보·등록전 모두 노출)했으나,
--   운영 요청으로 status='활동중'인 활동회원만 체크인 화면에 표시한다.
create or replace function public.checkin_roster(p_meeting uuid, p_token text)
returns table (member_id uuid, name text, present boolean)
language sql
security definer
set search_path = public
as $$
  select m.id, m.name, coalesce(a.present, false)
  from public.members m
  left join public.attendance a
    on a.meeting_id = p_meeting and a.member_id = m.id
  where m.chapter_id = '새서울'
    and m.status = '활동중'
    and exists (
      select 1 from public.meetings mt
      where mt.id = p_meeting and mt.checkin_token = p_token
    )
  order by m.name;
$$;

grant execute on function public.checkin_roster(uuid, text) to anon, authenticated;
