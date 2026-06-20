-- 0049. 아카이브 정렬 순서(sort_order) — 역대지회장 등 직접 순서 조정용.
--   역대지회장 초기값 = 기존 event_date 순서로 채움(현재 순서 보존). 재실행 안전.
alter table public.archive add column if not exists sort_order int;

with ord as (
  select id, row_number() over (order by event_date asc nulls last, title asc) as rn
  from public.archive
  where chapter_id = '새서울' and category = '역대지회장'
)
update public.archive a
set sort_order = ord.rn
from ord
where a.id = ord.id and a.sort_order is null;
