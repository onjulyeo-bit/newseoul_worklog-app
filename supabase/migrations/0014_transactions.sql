-- 0014. 회계 — 거래내역(transactions)
--   카뱅 엑셀 업로드분을 자동분류해 저장. 계좌번호 등 민감정보는 저장하지 않음(이름·금액·내용까지만).
--   관리자 전체권한. (감사 열람권한은 추후 역할 추가 시)

create table if not exists public.transactions (
  id            uuid primary key default gen_random_uuid(),
  chapter_id    text not null default '새서울' references public.chapters (chapter_id),
  txn_date      timestamptz not null,                 -- 거래일시
  direction     text not null check (direction in ('입금','출금')),
  amount        integer not null,                     -- 금액(출금은 음수)
  balance       integer,                              -- 거래 후 잔액
  category      text,                                 -- 자동분류 항목
  track         text not null default 'A' check (track in ('A','B')),  -- A 메인회계 / B 식대정산
  counterparty  text,                                 -- 비고란 이름
  memo          text,                                 -- 적요(분류 키워드 원문)
  is_confirmed  boolean not null default false,       -- 사람 확정 여부
  meeting_id    uuid references public.meetings (id), -- B트랙: 회차 연결(선택)
  created_at    timestamptz not null default now(),
  -- 같은 거래 중복 업로드 방지
  unique (chapter_id, txn_date, amount, memo, counterparty)
);

create index if not exists transactions_date_idx on public.transactions (chapter_id, txn_date);

alter table public.transactions enable row level security;

drop policy if exists txn_admin on public.transactions;
create policy txn_admin on public.transactions
  for all using (public.is_admin()) with check (public.is_admin());
