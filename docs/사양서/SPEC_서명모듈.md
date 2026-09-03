# 서명 수집 모듈 (e-Sign) 기능 사양서

> 새서울 CBMC 앱(cbmc-app) 신규 모듈. MoimON 공통 기능 후보.
> 첫 실전: 2027년 지회장 연임 건의서·동의서·권면문 서명 (증경회장 13명, 2026년 9월)
> 작성: 2026-09-03

---

## 0. 원칙

- **한 화면 서명.** 서명자는 링크를 열면 문서 미리보기 → 서명 칸 → 완료, 세 단계 이상 없음. 회원가입·로그인 강제 금지 (카카오 로그인은 선택, 되어 있으면 자동 매칭).
- **종이 병행.** 1단계는 실사용 테스트. 실패해도 총회 일정에 영향 없어야 함.
- **chapter_id 필수.** 모든 테이블에 chapter_id 포함 (멀티테넌트 원칙 유지).
- **기존 스택만 사용.** Next.js(App Router) + Supabase(Postgres/Storage/RLS) + Tailwind + Vercel. 새 서비스 추가 금지.

## 1. 사용자 역할

| 역할 | 할 수 있는 일 |
|---|---|
| 관리자 (총무·간사·증경회장단 대표) | 문서 등록, 서명 위치 지정, 서명자 선택, 링크 생성·공유, 현황 확인, 완료 PDF 다운로드 |
| 서명자 | 자기 링크로 문서 보기, 서명, 완료. 다른 사람 서명 불가 |
| 열람자 (지회장·임원) | 완료 PDF 열람 |

## 2. 화면 흐름

### 관리자
1. `/admin/sign` — 서명 요청 목록 (진행중 / 완료 / 만료)
2. `/admin/sign/new` — 3단계 마법사
   - ① PDF 업로드 (제목, 설명, 만료일)
   - ② 서명 위치 지정: PDF 페이지 렌더(pdf.js) 위에 드래그로 서명 박스 배치. 박스마다 "서명자 슬롯" 라벨 (예: 김세중 / 확인자 / 수락자)
   - ③ 슬롯 ↔ 회원 매핑: 회원 명부에서 검색·선택 (이력태그 "증경회장" 필터 제공). 비회원은 이름+전화만 입력하는 임시 서명자 허용
3. `/admin/sign/[id]` — 현황판: 슬롯별 상태(대기/열람/완료), 링크 복사 버튼, 카톡 공유 버튼(Web Share API), 리마인드, 완료 PDF 다운로드

### 서명자
1. `/s/[token]` — 토큰 링크. 문서 전체 미리보기(스크롤), 내 서명 위치 하이라이트
2. 하단 고정 "서명하기" → 전체화면 서명 패드 (가로 회전 안내), 지우기/다시쓰기
3. 확인 문구 체크 ("본인은 위 문서 내용에 동의하며 서명합니다") → 완료
4. 완료 화면: "서명이 저장되었습니다" + 내 서명본 PDF 보기

## 3. 데이터 모델

```
sign_requests            서명 요청(문서 1건)
  id uuid pk
  chapter_id uuid fk
  title text
  description text
  source_pdf_path text      -- storage: sign/{chapter_id}/{id}/source.pdf
  final_pdf_path text       -- 전원 완료 후 합성본
  status text               -- draft | active | completed | expired | cancelled
  expires_at timestamptz
  created_by uuid fk members
  created_at, updated_at

sign_slots               서명 박스(문서 내 위치)
  id uuid pk
  request_id uuid fk sign_requests
  label text                -- "김세중", "유선동의 확인자" 등
  page int
  x, y, w, h numeric        -- PDF 좌표(pt), 좌하단 원점 기준
  order_no int

sign_signers             서명자(슬롯에 배정된 사람)
  id uuid pk
  request_id uuid fk
  slot_id uuid fk sign_slots
  member_id uuid null fk members   -- 회원이면 연결
  name text
  phone text
  token text unique          -- 32자 랜덤, URL용
  status text                -- pending | viewed | signed | declined
  viewed_at, signed_at timestamptz
  signature_path text        -- storage: sign/{chapter_id}/{request_id}/sig_{signer_id}.png
  ip text, user_agent text   -- 증빙
  auth_kakao_id text null    -- 카카오 로그인 상태였다면 기록

sign_events              감사 로그
  id bigserial pk
  request_id, signer_id uuid
  event text                 -- created | link_sent | viewed | signed | declined | reminded | completed
  meta jsonb
  created_at
```

**RLS 원칙**
- `sign_requests`, `sign_slots`, `sign_events`: 관리자 role만 read/write (chapter_id 일치)
- `sign_signers`: 관리자 전체 / 서명자는 **토큰 기반 서버 라우트**로만 접근 (클라이언트에서 테이블 직접 조회 금지)
- Storage 버킷 `sign`: private. 서명자 미리보기는 서버에서 signed URL 발급(유효 10분)

## 4. 핵심 처리

### 서명 저장 (POST /api/sign/[token])
1. 토큰 조회 → 상태 pending/viewed 확인, 만료 확인
2. 서명 PNG(base64) 수신 → 크기 제한 200KB → Storage 저장
3. `sign_signers` 상태 signed, 시각·IP·UA 기록, 이벤트 로그
4. 해당 request의 미완료 서명자 0명이면 → **합성 작업** 호출

### PDF 합성 (서버, pdf-lib)
1. source.pdf 로드
2. 각 slot 위치에 서명 PNG 삽입 (박스 안 비율 유지, 여백 6%)
3. 서명 아래 7pt 회색으로 `서명일시 YYYY.MM.DD HH:mm` 자동 기입
4. 마지막 페이지 뒤에 **서명 증빙 페이지** 1장 추가: 문서 제목, 각 서명자 이름·일시·인증방식(카카오/링크)·IP 앞 두 자리 마스킹
5. final.pdf 저장, request status completed, 관리자에게 완료 알림(1단계는 현황판 표시만)

### 미완료 상태 PDF
- 현황판에서 "현재까지 서명본 다운로드" 제공 (일부 서명만 합성). 종이 병행 시 유용.

## 5. 라이브러리

| 용도 | 패키지 | 비고 |
|---|---|---|
| 서명 패드 | `signature_pad` | 터치 압력·속도 반영, 가벼움 |
| PDF 렌더(미리보기·위치지정) | `pdfjs-dist` | 클라이언트 |
| PDF 합성 | `pdf-lib` | 서버(Route Handler). 한글 폰트 임베드 필요 → Pretendard 서브셋 or `@pdf-lib/fontkit` |
| 토큰 | `nanoid` (32) | |
| 공유 | Web Share API → 미지원 시 클립보드 복사 | 카톡 알림톡은 2단계 |

## 6. 작업 순서 (Claude Code 세션 단위)

1. **마이그레이션** — `supabase/migrations/xxxx_sign_module.sql` (아래 SQL), Storage 버킷 `sign` 생성, RLS
2. **서명자 화면 먼저** `/s/[token]` — 가장 위험한 부분(모바일 서명 UX). 더미 요청 1건으로 실기기 테스트
3. **합성 라우트** — pdf-lib 한글 폰트 임베드 확인
4. **관리자 마법사** — 업로드 → 위치지정 → 매핑
5. **현황판 + 공유**
6. **실전 데이터 등록** — 2027 연임 서류 3종, 증경회장 13명 + 확인자(안성희) + 수락자(조강민)

각 단계 끝에 worklog 기록. 2단계 전까지 관리자 UI는 없어도 됨 (SQL로 직접 insert해서 테스트).

## 7. 이번 실전 매핑

| 문서 | 슬롯 | 서명자 |
|---|---|---|
| 건의서+동의서 (2p) | 동의서 표 서명란 13개 | 두상달, 김세중, 안성희, 이정수, 배영호, 김용태, 조명환, 윤용근, 강권수, 오우용, 김영근, 박경선, 팽경인 |
| 〃 | 유선 동의 확인자 | 안성희 |
| 권면문 (1p) | 수락 확인 서명란 | 조강민 |

앱으로 서명을 받으면 동의서의 "유선 동의 (9. 1)" 인쇄 문구는 제거하고 전원 빈칸으로 재출력할 것.

## 8. 2단계 후보 (지금은 하지 않음)
- 카카오 알림톡 자동 발송 (비용·템플릿 심사)
- 문서 템플릿 엔진 (건의서·동의서 자동 생성)
- 타임스탬프 인증(TSA) 등 고급 증빙
- 다단계 순차 서명(A 완료 후 B)
- MoimON 공통 모듈로 분리
