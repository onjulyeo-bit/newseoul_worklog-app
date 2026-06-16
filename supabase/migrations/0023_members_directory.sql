-- ============================================================
-- 0023. 회원 명단(제한) 뷰 — 회원끼리 이름·연락처·회사만 열람
-- 새서울 CBMC '아름다운 만남'
-- Supabase 대시보드 → SQL Editor 에 붙여넣어 실행. (여러 번 실행해도 안전)
--
-- members 원본 표는 임원만(RLS). 회원은 이 '뷰'를 통해 3개 항목만 본다.
-- 뷰는 정의자(definer) 권한으로 돌아 members RLS를 우회하되, 노출 컬럼이
-- 이름·연락처·회사뿐이라 민감정보가 새지 않는다. 로그인(authenticated)만 허용.
-- ============================================================

create or replace view public.members_directory as
  select id, name, phone, company
  from public.members
  where chapter_id = '새서울';

comment on view public.members_directory is '회원 열람용 제한 명단(이름·연락처·회사). 로그인 사용자만, 민감정보 제외.';

-- 권한: 비로그인(anon) 차단, 로그인(authenticated)만 조회 허용
revoke all on public.members_directory from anon;
grant select on public.members_directory to authenticated;
