-- 0047. 연간일정 회차별 자료 — 포스터(수동 지정용) + 영상 링크.
--   포스터는 평소엔 공지 포스터를 '자동 매칭'해서 보여주고, 필요 시 poster_url로 직접 지정(덮어쓰기).
--   영상은 유튜브(미등록) 등 외부 링크만 저장(용량 0).
alter table public.meetings add column if not exists poster_url   text;  -- 수동 지정 포스터(자동 매칭보다 우선)
alter table public.meetings add column if not exists recording_url text;  -- 녹화 영상 링크(유튜브 미등록 등)
