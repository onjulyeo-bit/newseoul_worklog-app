-- 0044. 운영 매뉴얼 — 운영진 전용 참고문서(섹션별 마크다운 본문).
--   읽기 = is_staff(운영진+읽기운영진), 쓰기 = is_admin(운영진).
--   본문은 마크다운. 4개 섹션 전문가 초안 시드(on conflict do nothing → 재실행해도 편집본 보존).

create table if not exists public.manual_sections (
  id          uuid primary key default gen_random_uuid(),
  chapter_id  text not null default '새서울',
  key         text not null,
  body        text,
  updated_at  timestamptz not null default now(),
  unique (chapter_id, key)
);

alter table public.manual_sections enable row level security;

drop policy if exists manual_read_staff  on public.manual_sections;
drop policy if exists manual_write_admin on public.manual_sections;
create policy manual_read_staff  on public.manual_sections for select using (public.is_staff());
create policy manual_write_admin on public.manual_sections for all    using (public.is_admin()) with check (public.is_admin());

-- updated_at 자동 갱신
create or replace function public.touch_manual_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists trg_manual_touch on public.manual_sections;
create trigger trg_manual_touch before update on public.manual_sections
  for each row execute function public.touch_manual_updated_at();

-- ── 초안 시드 ──────────────────────────────────────────────
insert into public.manual_sections (chapter_id, key, body) values
('새서울', 'worship-guide', $md$## 모임 진행 순서
1. 개회 및 환영 인사
2. 찬양 / 경배
3. 대표 기도
4. 말씀 · 강의 (강사 소개 후)
5. 나눔 / 토의
6. 광고 및 공지
7. 마무리 기도 / 폐회

## 사회 멘트 예시
**개회** — "반갑습니다. 새서울지회 모임을 시작하겠습니다. 바쁜 중에도 함께해 주신 여러분을 진심으로 환영합니다."
**강사 소개** — "오늘 귀한 말씀을 전해 주실 ○○○ 님을 소개합니다. 큰 박수로 맞아 주시기 바랍니다."
**나눔 안내** — "이제 조별로 나눔의 시간을 갖겠습니다. 오늘 받은 은혜를 서로 짧게 나눠 주세요."
**폐회** — "다음 모임은 ○월 ○일입니다. 한 주간도 일터에서 그리스도의 향기 나는 한 주 되시길 바랍니다."

## 진행 팁
- 시작 5분 전 마이크·화면(온라인 Zoom) 점검
- 강사·기도·찬양 담당자에게 사전 확인
- 시간 배분: 강의 30분, 나눔 20분 권장
- 광고는 짧게, 핵심 공지 위주로$md$),

('새서울', 'role-todo', $md$역할별 주요 책임입니다. 실제 직임 구성에 맞게 고쳐 쓰세요.

## 지회장
- 지회 전반 운영 총괄, 월례 운영진 회의 주재
- 연간 일정·비전 수립, 신입회원 면담
- 중앙회·남부연합회 행사 참석 및 대표

## 총무
- 주간 모임 준비 총괄 (장소·강사·사회자 확인)
- 공지 작성·전달, 출석 관리
- 운영진 회의 안건 정리

## 회계
- 회비 수납·지출 집행, 월별 결산 보고
- 연간 결산 및 예산안 작성
- 계좌 관리, 영수증 보관

## 서기
- 회의록 작성·보관
- 회원 명부 업데이트

## 신입회원 분과
- 신입·방문자 환영 및 안내
- 입회 절차 안내, 지회장 면담 연결$md$),

('새서울', 'how-when', $md$무엇을 언제·어떻게 하는지에 대한 연중 안내입니다.

## 주간 (매주 금요일 모임)
- 모임 3일 전: 강사·사회자·식대 확인
- 모임 1일 전: 공지·포스터 게시
- 모임 당일: 체크인 QR 준비, 식대 정산

## 월간
- 매월 초: 전월 회계 결산 보고
- 매월 운영진 회의 (안건 정리 · 회의록 작성)

## 연간
- 연초: 연간 일정·예산 수립, 신년 운영계획
- 분기: 비전워크숍 / 특별행사
- 연말: 송년회, 차년도 비전워크숍, 연간 결산

## 회비
- 납부 시기·방법은 운영진 회의에서 정해 공지
- 미납 안내는 앱의 안내 문구·문자로 전달 (자동 발송 아님)$md$),

('새서울', 'breakfast', $md$## 개요
운영진(또는 희망 회원)의 조찬 모임 — 친교와 현안 논의를 위한 자리입니다.

## 시기 · 장소
- 시기: 예) 매월 셋째 주 ○요일 오전 7시 — 운영진 회의에서 확정
- 장소: 예) ○○○ / 온라인 병행 가능

## 진행
1. 식사 및 친교
2. 기도
3. 현안 나눔 · 의견 교환
4. 마무리 기도

## 준비
- 참석 인원 사전 확인 (장소 예약)
- 안건이 있으면 총무가 사전 정리$md$)
on conflict (chapter_id, key) do nothing;
