-- 0054. 체크인 명단 = 활동회원만 (비활동 상태 제외).
--   실제 운영 데이터의 status 값은 '활동' / '휴면'. (스키마 초기 enum과 다름)
--   전체가 사라지지 않도록 '활동중만' 화이트리스트가 아니라 '비활동 상태 제외' 블랙리스트 방식 사용.
--   → '활동'(및 그 외 미지정)은 표시, '휴면·유보·등록전·OB'는 숨김.
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
    and coalesce(m.status, '') not in ('휴면', '유보', '등록전', 'OB')
    and exists (
      select 1 from public.meetings mt
      where mt.id = p_meeting and mt.checkin_token = p_token
    )
  order by m.name;
$$;

grant execute on function public.checkin_roster(uuid, text) to anon, authenticated;
