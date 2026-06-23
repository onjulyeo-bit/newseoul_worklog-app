-- 0053. 연간일정(meetings)에 성경본문·찬양 컬럼 추가
--   연간일정에서 회차별로 미리 적어두면 콘텐츠(주보·공지·포스터)로 자동 연동된다.
--   (찬양 '유튜브 링크'와 설교 '본문 전문'은 콘텐츠에서 입력 — 여기엔 구절 표기/곡 제목만)
alter table public.meetings add column if not exists verse  text;  -- 성경본문 (예: 행 9:10-22)
alter table public.meetings add column if not exists praise text;  -- 찬양 (곡 제목)
