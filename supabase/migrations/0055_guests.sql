-- 0055. 게스트(방문자) 명단 — 모임별. 이름 + 지회명. QR 체크인에도 표시.
--   외부 지회에서 방문한 게스트를 회차(meeting)별로 관리한다. 회원(members)과 별개.
--   회원 체크인과 동일한 보안 패턴: 익명(anon)은 SECURITY DEFINER RPC로만 접근,
--   present(참석)만 조작 가능하고 paid(식대)는 손대지 못한다. 등록·삭제는 관리자(RLS)만.

create table if not exists public.guests (
  id          uuid primary key default gen_random_uuid(),
  meeting_id  uuid not null references public.meetings (id) on delete cascade,
  chapter_id  text not null default '새서울' references public.chapters (chapter_id),
  name        text not null,
  branch      text,                          -- 지회명 (예: 다니엘, 153, 무역센터, 윤중y)
  present     boolean not null default false,
  paid        boolean not null default false,
  sort_order  integer,                       -- 입력 순서 유지 (1..n)
  created_at  timestamptz not null default now()
);
create index if not exists guests_meeting_idx on public.guests (meeting_id);

alter table public.guests enable row level security;

drop policy if exists guests_admin on public.guests;
create policy guests_admin on public.guests
  for all using (public.is_admin()) with check (public.is_admin());

-- 체크인: 게스트 명단 조회 (토큰 검증, 로그인 없이 anon 호출).
create or replace function public.checkin_guests(p_meeting uuid, p_token text)
returns table (guest_id uuid, name text, branch text, present boolean)
language sql
security definer
set search_path = public
as $$
  select g.id, g.name, g.branch, g.present
  from public.guests g
  where g.meeting_id = p_meeting
    and exists (
      select 1 from public.meetings mt
      where mt.id = p_meeting and mt.checkin_token = p_token
    )
  order by g.sort_order nulls last, g.created_at;
$$;

-- 게스트 출석 기록: 토큰이 맞으면 해당 게스트 present=true. (식대 paid는 손대지 않음)
create or replace function public.check_in_guest(p_meeting uuid, p_guest uuid, p_token text)
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
  update public.guests set present = true
    where id = p_guest and meeting_id = p_meeting;
  return true;
end;
$$;

-- 게스트 출석 취소: present=false (식대 paid도 함께 초기화).
create or replace function public.check_out_guest(p_meeting uuid, p_guest uuid, p_token text)
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
  update public.guests set present = false, paid = false
    where id = p_guest and meeting_id = p_meeting;
  return true;
end;
$$;

grant execute on function public.checkin_guests(uuid, text)          to anon, authenticated;
grant execute on function public.check_in_guest(uuid, uuid, text)    to anon, authenticated;
grant execute on function public.check_out_guest(uuid, uuid, text)   to anon, authenticated;
