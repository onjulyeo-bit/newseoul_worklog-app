-- ============================================================
-- 0042. 예정 권한에 '읽기 운영진(viewer)' 추가
-- 새서울 CBMC '아름다운 만남'
-- Supabase 대시보드 → SQL Editor 에 붙여넣어 실행. (여러 번 실행해도 안전)
--
-- members.intended_role: null=회원 / 'admin'=운영진 예정 / 'viewer'=읽기 운영진 예정.
-- 연결(이메일 자동/수동) 시 handle_new_user가 intended_role 값을 그대로 적용하므로,
-- 제약만 풀면 viewer 예정도 자동으로 '읽기 운영진' 권한이 부여된다.
-- ============================================================

alter table public.members drop constraint if exists members_intended_role_check;
alter table public.members
  add constraint members_intended_role_check
  check (intended_role is null or intended_role in ('admin', 'viewer'));

comment on column public.members.intended_role is '연결 시 적용할 예정 권한. null=회원, admin=운영진, viewer=읽기 운영진.';
