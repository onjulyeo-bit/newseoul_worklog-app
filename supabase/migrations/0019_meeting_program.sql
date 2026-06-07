-- 0019. 회차(주차)에 프로그램 형태 — 예배/포럼/회만시/특강/기타행사
--   연간 일정에서 입력 → 출석 통계에서 프로그램별 집계.

alter table public.meetings add column if not exists program text;
