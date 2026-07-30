-- 0055. 게스트 체크인 (한 번만 오는 방문자)
--   명단에 없는 방문자를 이름 없이 '인원수'로만 집계한다(운영자가 실명단은 따로 보유).
--   게스트는 무조건 식대 포함 → 회차별 게스트 총원 = 식대 인원.
--   회원 QR과 동일한 회차 토큰을 재사용(별도 QR 불필요). 보안함수로 anon이 +1/취소만 가능.

-- 1) 게스트 체크인 기록 (이름 없이 인원수만; 시각으로 취소 시 최근 것 되돌리기)
create table if not exists public.guest_checkins (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  chapter_id text not null default '새서울',
  created_at timestamptz not null default now()
);
create index if not exists guest_checkins_meeting_idx on public.guest_checkins(meeting_id);

alter table public.guest_checkins enable row level security;

-- 운영진만 직접 조회/수정(서버 집계·수동 보정용). 실제 +1/취소는 아래 보안함수로 처리.
drop policy if exists guest_checkins_admin_all on public.guest_checkins;
create policy guest_checkins_admin_all on public.guest_checkins
  for all using (public.is_admin()) with check (public.is_admin());

-- 2) 게스트 체크인(+1). 토큰이 맞으면 한 명 추가하고 현재 총원을 돌려준다. anon 호출.
create or replace function public.guest_check_in(p_meeting uuid, p_token text)
returns integer
language plpgsql security definer set search_path = public as $$
declare cnt integer;
begin
  if not exists (
    select 1 from public.meetings where id = p_meeting and checkin_token = p_token
  ) then
    raise exception 'invalid_token';
  end if;
  insert into public.guest_checkins (meeting_id) values (p_meeting);
  select count(*) into cnt from public.guest_checkins where meeting_id = p_meeting;
  return cnt;
end; $$;

-- 3) 게스트 취소(-1). 가장 최근 게스트 1건 삭제 후 현재 총원 반환. anon 호출.
create or replace function public.guest_check_out(p_meeting uuid, p_token text)
returns integer
language plpgsql security definer set search_path = public as $$
declare cnt integer;
begin
  if not exists (
    select 1 from public.meetings where id = p_meeting and checkin_token = p_token
  ) then
    raise exception 'invalid_token';
  end if;
  delete from public.guest_checkins
   where id = (
     select id from public.guest_checkins
     where meeting_id = p_meeting order by created_at desc limit 1
   );
  select count(*) into cnt from public.guest_checkins where meeting_id = p_meeting;
  return cnt;
end; $$;

-- 4) 현재 게스트 총원 조회(토큰 검증). anon 호출.
create or replace function public.guest_count(p_meeting uuid, p_token text)
returns integer
language sql security definer set search_path = public as $$
  select count(*)::int from public.guest_checkins g
  where g.meeting_id = p_meeting
    and exists (
      select 1 from public.meetings mt
      where mt.id = p_meeting and mt.checkin_token = p_token
    );
$$;

grant execute on function public.guest_check_in(uuid, text)  to anon, authenticated;
grant execute on function public.guest_check_out(uuid, text) to anon, authenticated;
grant execute on function public.guest_count(uuid, text)     to anon, authenticated;
