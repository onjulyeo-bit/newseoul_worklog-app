-- 0009. 특별행사(events) — 한국대회·송년회·봄소풍 등. 회원도 열람, 임원만 수정.

create table if not exists public.events (
  id         uuid primary key default gen_random_uuid(),
  chapter_id text not null default '새서울' references public.chapters (chapter_id),
  title      text not null,
  date       date not null,
  end_date   date,
  type       text,           -- 한국대회/송년회/봄소풍/수련회/총회/기타
  location   text,
  link       text,
  note       text,
  created_at timestamptz not null default now()
);

alter table public.events enable row level security;

-- 로그인한 사람은 누구나 열람(회원 포함), 수정은 임원만
drop policy if exists events_read on public.events;
create policy events_read on public.events
  for select using (auth.uid() is not null);

drop policy if exists events_write on public.events;
create policy events_write on public.events
  for all using (public.is_admin()) with check (public.is_admin());
