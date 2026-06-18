-- ============================================================
-- 0038. 연간결산(회계) — annual_finance
-- 새서울 CBMC '아름다운 만남'
-- Supabase 대시보드 → SQL Editor 에 붙여넣어 실행. (여러 번 실행해도 안전)
--
-- 회계 '연간결산' 탭의 근거. 연도별 수입합계·지출합계만 저장(이월금=수입-지출 자동).
-- 과거연도(2021~2025)는 결산서 보고 수기 입력, 2026~는 거래내역 자동집계 후 확정 저장.
-- 회원 '수'는 통계(annual_summary)에, '돈'은 여기로 일원화.
-- 읽기=운영진+읽기운영진(is_staff), 쓰기=운영진(is_admin).
-- ============================================================

create table if not exists public.annual_finance (
  chapter_id    text not null default '새서울',
  year          int  not null,
  income_total  bigint not null default 0, -- 수입 합계(전년 이월금 포함)
  expense_total bigint not null default 0, -- 지출 합계
  note          text,
  updated_at    timestamptz not null default now(),
  unique (chapter_id, year)
);

comment on table public.annual_finance is '연간결산(수입합계·지출합계). 이월금=수입-지출. 회계 연간결산 탭 전용.';

alter table public.annual_finance enable row level security;

drop policy if exists annual_finance_read  on public.annual_finance;
drop policy if exists annual_finance_write on public.annual_finance;
create policy annual_finance_read  on public.annual_finance for select using (public.is_staff());
create policy annual_finance_write on public.annual_finance for all    using (public.is_admin()) with check (public.is_admin());
