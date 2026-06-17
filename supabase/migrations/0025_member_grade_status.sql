-- ============================================================
-- 0025. 회원구분(grade)·상태(status) 개편
-- 새서울 CBMC '아름다운 만남'
-- Supabase 대시보드 → SQL Editor 에 붙여넣어 실행. (여러 번 실행해도 안전)
--
-- 변경:
--  - grade: 부부회원 → 가족회원. (정·가족·준·신입·명예·유보·VIP 사용)
--  - status: 전원 '활동'으로 초기화. 이후 임원이 화면에서 휴면/OB 직접 지정.
--  - 옛 CHECK 제약 제거: 값은 앱 드롭다운이 관리(운영진만 수정·RLS). 해마다 변동 유연.
--
-- ⚠️ 순서 중요: 옛 제약이 '가족회원/VIP'를 막으므로 **제약을 먼저 삭제한 뒤** 값을 바꾼다.
-- (제약을 그대로 둔 채 새 값으로 UPDATE하면 옛 members_grade_check 위반으로 실패)
-- ============================================================

-- 1) 옛 CHECK 제약 먼저 제거
alter table public.members drop constraint if exists members_grade_check;
alter table public.members drop constraint if exists members_status_check;

-- 2) 값 변경 (막는 제약이 없으니 통과)
update public.members set grade = '가족회원' where grade = '부부회원';
update public.members set status = '활동';
