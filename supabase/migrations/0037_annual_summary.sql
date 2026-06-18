-- ============================================================
-- 0037. 연도별 회원등록 현황(결산 확정) — annual_summary
-- 새서울 CBMC '아름다운 만남'
-- Supabase 대시보드 → SQL Editor 에 붙여넣어 실행. (여러 번 실행해도 안전)
--
-- '연도별 회원등록 현황' 통계의 근거. 연말 결산 후 확정된 숫자를 연도별로 직접 입력.
-- 과거 통장·업로드 데이터에 오류가 많아, 사람이 결산에서 확정한 값을 단일 진실로 둔다.
-- 읽기=운영진+읽기운영진(is_staff), 쓰기=운영진(is_admin).
-- ============================================================

create table if not exists public.annual_summary (
  chapter_id  text not null default '새서울',
  year        int  not null,
  jung_count  int  not null default 0,  -- 정회원 수(부부정회원 포함 인원)
  jun_count   int  not null default 0,  -- 준회원 수
  new_count   int  not null default 0,  -- 신입 수
  fee_income  bigint not null default 0, -- 회비 수입
  donation    bigint not null default 0, -- 후원금(명예회원 입금 등)
  note        text,
  updated_at  timestamptz not null default now(),
  unique (chapter_id, year)
);

comment on table public.annual_summary is '연도별 회원등록 현황(결산 확정값). 통계 화면 전용. 수기 입력.';

alter table public.annual_summary enable row level security;

drop policy if exists annual_summary_read  on public.annual_summary;
drop policy if exists annual_summary_write on public.annual_summary;
create policy annual_summary_read  on public.annual_summary for select using (public.is_staff());
create policy annual_summary_write on public.annual_summary for all    using (public.is_admin()) with check (public.is_admin());
