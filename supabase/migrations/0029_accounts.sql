-- ============================================================
-- 0029. 계좌관리 (accounts) — 회계 '계좌관리' 탭
-- 새서울 CBMC '아름다운 만남'
-- Supabase 대시보드 → SQL Editor 에 붙여넣어 실행. (여러 번 실행해도 안전)
--
-- 송금/수금 계좌 모음(중앙회·남부연합회·강사·간사·지회 등).
-- ⚠️ 계좌번호는 운영진(admin)만 열람(RLS). 화면엔 마스킹 표시 + 복사 버튼으로만 사용.
-- ============================================================

create table if not exists public.accounts (
  id          uuid primary key default gen_random_uuid(),
  chapter_id  text not null default '새서울',
  purpose     text,           -- 용도 (중앙회비·남부연합회비·강사비·간사급여·지회운영·식대·기타)
  payee       text,           -- 받는 곳 / 이름
  bank        text,           -- 은행
  account_no  text,           -- 계좌번호 (마스킹 표시·복사 전용)
  holder      text,           -- 예금주
  note        text,
  created_at  timestamptz not null default now()
);

comment on table public.accounts is '송금/수금 계좌. 운영진만 열람(RLS), 화면 마스킹+복사. 회계 계좌관리 탭.';

alter table public.accounts enable row level security;

drop policy if exists accounts_read on public.accounts;
create policy accounts_read on public.accounts for select using (public.is_admin());

drop policy if exists accounts_write on public.accounts;
create policy accounts_write on public.accounts for all using (public.is_admin()) with check (public.is_admin());
