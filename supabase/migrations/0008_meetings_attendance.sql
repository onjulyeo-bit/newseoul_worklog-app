-- 0008. 모임(meetings, 연간일정 원본) + 출석·식대(attendance)
--   meetings = 연간 일정의 한 줄. 회차(session_no)·모드(온라인/오프라인/휴회) 포함.

create table if not exists public.meetings (
  id           uuid primary key default gen_random_uuid(),
  chapter_id   text not null default '새서울' references public.chapters (chapter_id),
  date         date not null,
  session_no   integer,        -- 회차 (예: 350). 휴회는 null
  mode         text not null default 'pending'
               check (mode in ('online', 'offline', 'recess', 'pending')),  -- 온라인/오프라인/휴회/미정
  title        text,           -- 주제·프로그램
  speaker      text,
  fee          integer,        -- 1인 식대(원)
  account_info text,           -- 입금 안내
  note         text,           -- 휴회 사유 등
  created_at   timestamptz not null default now(),
  unique (chapter_id, date)
);

create table if not exists public.attendance (
  id         uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.meetings (id) on delete cascade,
  member_id  uuid not null references public.members (id) on delete cascade,
  present    boolean not null default false,
  paid       boolean not null default false,
  unique (meeting_id, member_id)
);

alter table public.meetings   enable row level security;
alter table public.attendance enable row level security;

drop policy if exists meetings_admin on public.meetings;
create policy meetings_admin on public.meetings
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists attendance_admin on public.attendance;
create policy attendance_admin on public.attendance
  for all using (public.is_admin()) with check (public.is_admin());
