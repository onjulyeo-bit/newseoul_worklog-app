-- ============================================================
-- 0028. 연도별 회비 납부내역 (annual_dues) — 회계 '연도별 회비' 탭 전용
-- 새서울 CBMC '아름다운 만남'
-- Supabase 대시보드 → SQL Editor 에 붙여넣어 실행. (여러 번 실행해도 안전)
--
-- 이름 × 연도 금액 매트릭스를 행 단위로 저장. 통장 거래(transactions)와 분리.
-- 정회원 수 집계는 화면에서: 80만↑=2명(부부), 60만↑=1명.
-- ============================================================

create table if not exists public.annual_dues (
  id          uuid primary key default gen_random_uuid(),
  chapter_id  text not null default '새서울',
  name        text not null,
  year        int  not null,
  amount      integer not null default 0,
  unique (chapter_id, name, year)
);

comment on table public.annual_dues is '연도별 회비 납부내역(이름·연도·금액). 회계 연도별 회비 탭 전용, 거래와 분리.';

alter table public.annual_dues enable row level security;

-- 회계 데이터 → 운영진(admin)만 보고 수정
drop policy if exists annual_dues_read on public.annual_dues;
create policy annual_dues_read on public.annual_dues for select using (public.is_admin());

drop policy if exists annual_dues_write on public.annual_dues;
create policy annual_dues_write on public.annual_dues for all using (public.is_admin()) with check (public.is_admin());
