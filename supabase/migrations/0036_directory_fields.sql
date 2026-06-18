-- ============================================================
-- 0036. 회원안내(회원 명단) 공개 항목 확장 — 이메일·직위·업종 추가
-- 새서울 CBMC '아름다운 만남'
-- Supabase 대시보드 → SQL Editor 에 붙여넣어 실행. (여러 번 실행해도 안전)
--
-- 일반 회원(member)에게 공개: 이름·연락처·회사 + 이메일·직위·업종.
-- ⚠️ create or replace view 는 기존 컬럼(순서) 유지 + 뒤에만 추가 가능 → 새 항목은 끝에.
-- 뷰는 정의자 권한으로 돌아 members RLS 우회하되, 노출 컬럼만 보임(주민번호·차량 등 제외).
-- ============================================================

create or replace view public.members_directory as
  select id, name, phone, company, email, "position", industry
  from public.members
  where chapter_id = '새서울';

revoke all on public.members_directory from anon;
grant select on public.members_directory to authenticated;
