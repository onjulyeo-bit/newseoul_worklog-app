-- ============================================================
-- 0025. 회원구분(grade)·상태(status) 개편
-- 새서울 CBMC '아름다운 만남'
-- Supabase 대시보드 → SQL Editor 에 붙여넣어 실행. (여러 번 실행해도 안전)
--
-- 변경:
--  - grade: 부부회원 → 가족회원 (이름변경), VIP 추가
--    최종 = 정회원·가족회원·준회원·신입회원·명예회원·유보회원·VIP
--  - status: 비활동 제거 (기존 비활동 → 휴면). 최종 = 활동·휴면·OB
--  ※ 데이터 먼저 옮긴 뒤 제약을 교체해야 위반이 안 난다.
-- ============================================================

-- 1) grade: 부부회원 → 가족회원 -----------------------------
update public.members set grade = '가족회원' where grade = '부부회원';

alter table public.members drop constraint if exists members_grade_check;
alter table public.members
  add constraint members_grade_check
  check (grade in ('정회원','가족회원','준회원','신입회원','명예회원','유보회원','VIP'));

-- 2) status: 비활동 → 휴면, 비활동 제거 ---------------------
update public.members set status = '휴면' where status = '비활동';

alter table public.members drop constraint if exists members_status_check;
alter table public.members
  add constraint members_status_check
  check (status in ('활동','휴면','OB'));
