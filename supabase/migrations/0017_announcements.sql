-- 0017. 공지 게시판 (관리자 게시 → 회원 읽기)
--   주간 모임 안내·경조사 공지·일반 공지를 저장해 회원에게 보여줌.
--   관리자: 전체 권한 / 로그인한 회원: 읽기.

create table if not exists public.announcements (
  id          uuid primary key default gen_random_uuid(),
  chapter_id  text not null default '새서울' references public.chapters (chapter_id),
  category    text not null default '일반' check (category in ('주간모임','경조사','일반')),
  title       text not null,
  body        text not null,
  created_at  timestamptz not null default now()
);

create index if not exists announcements_date_idx on public.announcements (chapter_id, created_at desc);

alter table public.announcements enable row level security;

-- 관리자: 작성·수정·삭제
drop policy if exists ann_admin on public.announcements;
create policy ann_admin on public.announcements
  for all using (public.is_admin()) with check (public.is_admin());

-- 로그인한 사용자(회원 포함): 읽기
drop policy if exists ann_read on public.announcements;
create policy ann_read on public.announcements
  for select using (auth.uid() is not null);
