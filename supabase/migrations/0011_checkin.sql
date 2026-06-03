-- 0011. QR 자가 체크인
--   모임 장소에 QR을 띄우면 회원이 스캔→본인 이름 탭→출석 자동기록.
--   로그인 불필요. 회차마다 비밀 토큰을 두어 아무나 조작 못 하게 한다.
--   보안함수(security definer)로 RLS를 안전하게 우회 — anon이 '출석 true'만 기록 가능(식대 paid는 못 건드림).

-- 1) 회차마다 체크인 토큰(QR에 숨겨질 비밀값). 기존 행에도 채워 넣는다.
alter table public.meetings add column if not exists checkin_token text;

alter table public.meetings
  alter column checkin_token set default substr(md5(random()::text || clock_timestamp()::text), 1, 16);

update public.meetings
  set checkin_token = substr(md5(random()::text || clock_timestamp()::text), 1, 16)
  where checkin_token is null;

-- 2) 체크인 명단 조회: 토큰이 맞아야 회원 이름 목록을 돌려준다(OB 제외).
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
    and coalesce(m.status, '') <> 'OB'
    and exists (
      select 1 from public.meetings mt
      where mt.id = p_meeting and mt.checkin_token = p_token
    )
  order by m.name;
$$;

-- 3) 출석 기록: 토큰이 맞으면 해당 회원 present=true. (식대 paid는 손대지 않음)
create or replace function public.check_in(p_meeting uuid, p_member uuid, p_token text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.meetings
    where id = p_meeting and checkin_token = p_token
  ) then
    raise exception 'invalid_token';
  end if;

  insert into public.attendance (meeting_id, member_id, present)
  values (p_meeting, p_member, true)
  on conflict (meeting_id, member_id) do update set present = true;

  return true;
end;
$$;

-- 4) 로그인 안 한 사용자(anon)도 이 두 함수만 호출할 수 있게 허용.
grant execute on function public.checkin_roster(uuid, text) to anon, authenticated;
grant execute on function public.check_in(uuid, uuid, text) to anon, authenticated;
