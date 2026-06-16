-- ============================================================
-- 0024. 공지 카테고리에 '행사' 추가 (특별행사 공지 게시용)
-- 새서울 CBMC '아름다운 만남'
-- Supabase 대시보드 → SQL Editor 에 붙여넣어 실행. (여러 번 실행해도 안전)
-- ============================================================

alter table public.announcements
  drop constraint if exists announcements_category_check;

alter table public.announcements
  add constraint announcements_category_check
  check (category in ('주간모임', '경조사', '행사', '일반'));
