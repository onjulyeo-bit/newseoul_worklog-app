-- ============================================================
-- 0032. 읽기 운영진(viewer) 역할 — 보기만 가능, 수정 불가
-- 새서울 CBMC '아름다운 만남'
-- Supabase 대시보드 → SQL Editor 에 붙여넣어 실행. (여러 번 실행해도 안전)
--
-- profiles.role: 'admin'(운영진) | 'viewer'(읽기 운영진) | 'member'(회원) | 'guest'(관심)
-- is_staff() = admin 또는 viewer  → 운영 데이터 '읽기'에 사용
-- is_admin() = admin 만           → '쓰기'(추가/수정/삭제)는 그대로 운영진만
-- 핵심: 읽기 정책은 is_staff(), 쓰기 정책은 is_admin() 으로 분리.
-- 따라서 viewer 는 UI와 무관하게 DB 차원에서 절대 수정 불가(안전).
-- ============================================================

-- 1) role 제약에 'viewer' 추가 -------------------------------
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('admin', 'viewer', 'member', 'guest'));

-- 2) is_staff(): 운영진(admin) 또는 읽기 운영진(viewer) ------
create or replace function public.is_staff()
returns boolean
language sql security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'viewer')
  );
$$;
grant execute on function public.is_staff() to authenticated;

-- 3) 운영 데이터 테이블: 읽기=is_staff(), 쓰기=is_admin() ----
-- members
drop policy if exists members_admin_all on public.members;
drop policy if exists members_read_staff on public.members;
drop policy if exists members_write_admin on public.members;
create policy members_read_staff  on public.members for select using (public.is_staff());
create policy members_write_admin on public.members for all    using (public.is_admin()) with check (public.is_admin());

-- meetings (다음 모임/통계에서 viewer도 조회)
drop policy if exists meetings_admin on public.meetings;
drop policy if exists meetings_read_staff on public.meetings;
drop policy if exists meetings_write_admin on public.meetings;
create policy meetings_read_staff  on public.meetings for select using (public.is_staff());
create policy meetings_write_admin on public.meetings for all    using (public.is_admin()) with check (public.is_admin());

-- attendance
drop policy if exists attendance_admin on public.attendance;
drop policy if exists attendance_read_staff on public.attendance;
drop policy if exists attendance_write_admin on public.attendance;
create policy attendance_read_staff  on public.attendance for select using (public.is_staff());
create policy attendance_write_admin on public.attendance for all    using (public.is_admin()) with check (public.is_admin());

-- transactions
drop policy if exists txn_admin on public.transactions;
drop policy if exists txn_read_staff on public.transactions;
drop policy if exists txn_write_admin on public.transactions;
create policy txn_read_staff  on public.transactions for select using (public.is_staff());
create policy txn_write_admin on public.transactions for all    using (public.is_admin()) with check (public.is_admin());

-- annual_dues
drop policy if exists annual_dues_read on public.annual_dues;
drop policy if exists annual_dues_write on public.annual_dues;
create policy annual_dues_read  on public.annual_dues for select using (public.is_staff());
create policy annual_dues_write on public.annual_dues for all    using (public.is_admin()) with check (public.is_admin());

-- accounts (계좌 — 읽기 운영진도 조회/복사 가능, 수정은 운영진만)
drop policy if exists accounts_read on public.accounts;
drop policy if exists accounts_write on public.accounts;
create policy accounts_read  on public.accounts for select using (public.is_staff());
create policy accounts_write on public.accounts for all    using (public.is_admin()) with check (public.is_admin());

-- instructors
drop policy if exists instructors_read on public.instructors;
drop policy if exists instructors_write on public.instructors;
create policy instructors_read  on public.instructors for select using (public.is_staff());
create policy instructors_write on public.instructors for all    using (public.is_admin()) with check (public.is_admin());
