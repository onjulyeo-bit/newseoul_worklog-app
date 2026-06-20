-- 0045. 운영 매뉴얼 재구성(실제 운영자료 반영). 0044 실행 여부와 무관하게 이 파일만 실행하면 됨.
--   4섹션: 모임 진행 순서(문서·표) · 모임 준비 체크리스트(체크 기능) · 간사 업무 매뉴얼(문서) · 연락처/계좌(문서)
--   manual_sections = 마크다운 문서, manual_checklist = 공유 체크리스트.

-- ── 1) 문서 테이블 (없으면 생성) ─────────────────────────────
create table if not exists public.manual_sections (
  id uuid primary key default gen_random_uuid(),
  chapter_id text not null default '새서울',
  key text not null,
  body text,
  updated_at timestamptz not null default now(),
  unique (chapter_id, key)
);
alter table public.manual_sections enable row level security;
drop policy if exists manual_read_staff  on public.manual_sections;
drop policy if exists manual_write_admin on public.manual_sections;
create policy manual_read_staff  on public.manual_sections for select using (public.is_staff());
create policy manual_write_admin on public.manual_sections for all    using (public.is_admin()) with check (public.is_admin());

create or replace function public.touch_manual_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end $$;
drop trigger if exists trg_manual_touch on public.manual_sections;
create trigger trg_manual_touch before update on public.manual_sections
  for each row execute function public.touch_manual_updated_at();

-- 0044 구버전 시드 정리(있으면)
delete from public.manual_sections where chapter_id='새서울' and key in ('worship-guide','role-todo','how-when','breakfast');

-- ── 2) 체크리스트 테이블 ────────────────────────────────────
create table if not exists public.manual_checklist (
  id uuid primary key default gen_random_uuid(),
  chapter_id text not null default '새서울',
  label text not null,
  roles text,        -- 콤마구분 역할 태그 (간사,총무 ...)
  when_label text,   -- 시기 (요일 등)
  note text,
  sort_order int not null default 0,
  checked boolean not null default false,
  checked_at timestamptz
);
alter table public.manual_checklist enable row level security;
drop policy if exists checklist_read_staff  on public.manual_checklist;
drop policy if exists checklist_write_admin on public.manual_checklist;
create policy checklist_read_staff  on public.manual_checklist for select using (public.is_staff());
create policy checklist_write_admin on public.manual_checklist for all    using (public.is_admin()) with check (public.is_admin());

-- ── 3) 문서 시드 (편집본 보존: on conflict do nothing) ────────
insert into public.manual_sections (chapter_id, key, body) values
('새서울', 'worship-order', $md$## 온라인 예배 순서

| 순서 | 진행 | 시간 | 안내 |
|---|---|---|---|
| 1 | 개회 및 CBMC 정체성 | 7:00 (1') | 개회 후 CBMC 정체성 합독 · 전체방 |
| 2 | 여는 기도 | (1') | 사회자 · 전체방 |
| 3 | 찬양 | 7:05 (4~5') | 간사 · 전체방 |
| 4 | 설교 | 7:10 (25') | 목사님 · 본문말씀 합독 · 전체방 |
| 5 | 소그룹 나눔 | 7:35 (10') | 소회의실 · 주제 없으면 은혜대로 나누도록 안내 |
| 6 | 조별 발표 | 7:45 (10') | 한 조당 2분 · 조장 발표 · 전체방 |
| 7 | 삼겹줄 기도 | 7:55 (3') | 소회의실서 기도제목 나누고 전체방서 합심 (안내 필수) |
| 8 | 합심기도 & 마침기도 | (2') | 합심 후 목사님 마침기도 · 전체방 |
| 9 | 광고 | 8:05 | 총무 · 일정·공지·게스트 소개 |
| 10 | 폐회 | 8:10 | 사회자 |

## 오프라인 예배 순서

| 순서 | 진행 | 시간 | 안내 |
|---|---|---|---|
| 1 | 개회 | 7:00 (1') | CBMC 정체성 합독 |
| 2 | 여는 기도 | (1') | 사회자 |
| 3 | 허깅 | (2') | 다함께 |
| 4 | 찬양 | 7:05 (4~5') | 간사 |
| 5 | 설교 | 7:10 (25') | 목사님 · 본문말씀 합독 |
| 6 | 대그룹 나눔 | 7:35 (10') | 질의응답·은혜나누기 · 사회자 시간 조절 |
| 7 | 삼겹줄 기도 | 7:45 (5') | 세 명씩 기도제목 나눔 · 전체 합심기도 |
| 8 | 합심기도 & 마침기도 | 7:50 (2') | 목사님이 마침기도까지 안내 |
| * | 신입회원 회원증 전달 | 7:55 (5') | 회장 / 신입회원 |
| 9 | 광고 | 8:00 | 총무 · 일정·공지·게스트 소개 |
| 10 | 폐회 | 8:10 | 사회자 |

**기도카드** — 백색은 자리에 두고, 파란색은 나눠 가져가 기도합니다.$md$),

('새서울', 'staff-guide', $md$## 주간 업무 흐름
- **월요일** — 강사 안내 문자 (강의제목·성경구절·PPT 요청)
- **화요일** — 지회 카톡방 공지
- **목요일** — 카톡방 공지 / 임원방 노션 주보 / 마침기도자 주보 전달
- **금요일** — 06:00 카톡방에 노션·주보, 06:30 Zoom 링크 게시

## 현장 작업 순서
1. 6:30 도착, 세팅된 테이블 준비
2. 빔프로젝터·노트북 셋팅 / PPT 준비
3. 주보·기도제목·카드·명찰·출석표
4. 식비·주차비 카드/현금
5. 강사비 현금 또는 계좌이체
6. 조찬 사진·동영상 촬영 (한국대회·송년회 자료용)

## 식대 정산 (식사기도 후)
1. 식사 인원 파악 후 계산
2. **카드부터** 계산(카드 받은 경우)
3. 카드 결제분은 영수증 따로 + 본인 사인
4. 그날의 **총영수증 1장** 수령
5. 카드 후 잔액은 현금으로 계산
6. 남은 금액은 현금 보유 또는 CBMC 계좌 입금
7. 기도제목 카드·명찰 회수
8. 총영수증은 영수증 노트에 보관

## 회계 정리
- 수입/지출 기록, 월 회계보고 (회장·부회장·총무께 매달 또는 요청 시 메일)
- 회비 = **입회비 + 연회비**
- 입회비: 신입회원이 납부 / 연회비: 전 회원 연 1회 (신입은 둘 다)
- 기부금영수증 — **가능**: 임원분담금·연합회/지회 찬조금·중앙회 사역헌금·기타 특정 헌금 / **불가**: 중앙회비·입회비·지회 연(월)회비

## 그 외 주요 업무
- 소식·광고 메일/문자/카톡 발송 (화~목 조찬 기도회 홍보)
- 새로 오신 분 메일 추가
- 강사 성경말씀 사전 수령, 주보 제작
- 회원 주소록은 회장 동의 하에만 제공, 기도용지는 중앙회 신청$md$),

('새서울', 'contacts', $md$## CBMC 중앙회
- 전화 02-717-0111 / 팩스 02-717-6716
- 이메일 cbmc@cbmc.or.kr
- 기부금영수증 담당 — 김유리 간사 (ylkimmm@cbmc.or.kr)

## 회비 안내
- 중앙회비 — 기존회원 15만원 / 신입회원 20만원
- 남부연합회비 — 지회당 연 30만원
- 입회비 / 연회비 — 운영진 회의 기준에 따름

## 계좌
- 송금 계좌(중앙회·남부연합회·강사 등)는 **회계 ▸ 계좌관리**에서 등록·조회합니다. (번호는 가려 표시·복사만)

**메모** — 새 계좌가 생기면 계좌관리에 추가해 한 곳에서 관리하세요.$md$)
on conflict (chapter_id, key) do nothing;

-- ── 4) 체크리스트 시드 (비어있을 때만) ──────────────────────
insert into public.manual_checklist (chapter_id, label, roles, when_label, note, sort_order)
select * from (values
  ('새서울','강사연락','간사','월·수요일',null,1),
  ('새서울','모임공지','간사','화요일·목요일·오전 12시 이후',null,2),
  ('새서울','순서지 편집 (노션)','간사','수~목요일·목요일 컨펌','주보 편집 시 중앙회 홈피 행사안내 참고',3),
  ('새서울','강의자료 PPT 편집','간사','목요일',null,4),
  ('새서울','명찰 제작·출력 (신입·분실자)','간사,총무','목요일',null,5),
  ('새서울','장소 사용·셋팅 확인','간사,총무','금요일',null,6),
  ('새서울','프로젝터·노트북·마이크 셋팅','간사,총무','금요일',null,7),
  ('새서울','테이블 셋팅 (명찰·주보·기도용지)','간사,부총무','금요일','장소에 따라 음료 등',8),
  ('새서울','출석 및 식대체크 리스트','간사,부총무','금요일',null,9),
  ('새서울','주차 관리','간사,총무','금요일',null,10),
  ('새서울','모임 후 장소 정리','간사,총무',null,null,11),
  ('새서울','사진 촬영·편집·카톡방 업로드','직임자',null,null,12),
  ('새서울','신입회원 연락처 등록·카톡방 초대','총무,회장',null,null,13),
  ('새서울','행사 공지 (한국대회·송년회 등)','총무',null,null,14),
  ('새서울','신입회원 입회서류 등록','간사,총무',null,null,15),
  ('새서울','공지사항 전달','총무,회장',null,null,16),
  ('새서울','주차별 입·출금 관리','간사,직임자,회장',null,null,17),
  ('새서울','연말 유보회원 등록','간사,총무',null,null,18),
  ('새서울','정회원비 납부','간사,직임자,회장',null,null,19),
  ('새서울','남부연합회비 납부','간사,직임자,회장',null,null,20),
  ('새서울','강사료 송금','간사',null,null,21),
  ('새서울','연회비 관리','간사,직임자',null,null,22),
  ('새서울','기부금영수증 발급 (중앙회)','간사',null,null,23),
  ('새서울','진행자·기도자 섭외','회장','매달 첫째 주·수요일까지 확정',null,24)
) as v
where not exists (select 1 from public.manual_checklist where chapter_id='새서울');
