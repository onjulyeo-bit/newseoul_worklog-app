-- 0021. grade 제약에 '유보회원' 추가 (소급 기록)
--   배경: 과거 SQL 에디터에서 수동으로 members_grade_check에 '유보회원'을 추가하고
--         회원 1명(석주완 등)을 유보회원으로 지정했음. 그 변경이 마이그레이션 파일에
--         빠져 있어(0002는 5종만) 파일과 라이브 DB가 어긋났다(드리프트).
--   2026-06-10 라이브 조회로 확인: 등급 분포에 유보회원 1명 실재 = 제약이 이미 6종 허용.
--   이 파일은 그 수동 변경을 "소급 기록"해 파일=DB를 일치시킨다.
--   라이브엔 이미 적용돼 있으므로 idempotent하게 재선언만 한다(데이터 영향 없음).

alter table public.members drop constraint if exists members_grade_check;
alter table public.members
  add constraint members_grade_check
  check (grade in ('명예회원','정회원','부부회원','준회원','신입회원','유보회원'));
