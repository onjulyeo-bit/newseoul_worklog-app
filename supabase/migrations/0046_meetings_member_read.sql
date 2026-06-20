-- 0046. 연간일정(meetings)을 회원에게도 공개 — 읽기를 '로그인한 모두'로 확대.
--   쓰기(추가·수정·삭제)는 그대로 운영진(is_admin)만. events는 이미 로그인 전체 공개.
drop policy if exists meetings_read_staff on public.meetings;
create policy meetings_read_all on public.meetings
  for select using (auth.uid() is not null);
