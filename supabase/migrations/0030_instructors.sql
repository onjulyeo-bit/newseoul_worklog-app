-- ============================================================
-- 0030. 강사·간사 (instructors) — 별도 메뉴 '강사·간사'
-- 새서울 CBMC '아름다운 만남'
-- Supabase 대시보드 → SQL Editor 에 붙여넣어 실행. (여러 번 실행해도 안전)
--
-- 회원(members)과 분리된 강사·간사 풀. 외부 강사도 기록해 데이터로 쌓음.
-- (회원인 간사/강사는 회원관리의 직책 태그로도 표시 — 여긴 외부 포함 풀)
-- ============================================================

create table if not exists public.instructors (
  id          uuid primary key default gen_random_uuid(),
  chapter_id  text not null default '새서울',
  name        text not null,
  kind        text,           -- 강사 / 간사
  is_external boolean not null default true, -- 외부 여부
  org         text,           -- 소속 / 직함
  phone       text,
  field       text,           -- 전문분야 / 주제
  fee_note    text,           -- 강사비 / 급여 메모
  note        text,
  created_at  timestamptz not null default now()
);

comment on table public.instructors is '강사·간사 풀(외부 포함). 회원과 분리. 운영진만. 회계 강사비·연간일정 강사와 연동 예정.';

alter table public.instructors enable row level security;

drop policy if exists instructors_read on public.instructors;
create policy instructors_read on public.instructors for select using (public.is_admin());

drop policy if exists instructors_write on public.instructors;
create policy instructors_write on public.instructors for all using (public.is_admin()) with check (public.is_admin());
