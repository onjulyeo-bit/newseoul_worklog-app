# 2026-06-11 — 카카오 로그인 추가 사전 진단

작업: 카카오 로그인 도입에 앞서 현재 인증/로그인 구조를 진단. **코드 수정 없이 현황 파악만 진행.**

## 1. 인증 스택 — Supabase Auth (SSR)

`@supabase/ssr` + `@supabase/supabase-js` 표준 구성.

- `lib/supabase/client.ts` — 브라우저용 (`createBrowserClient`)
- `lib/supabase/server.ts` — 서버 컴포넌트/라우트용 (쿠키 기반)
- `lib/supabase/middleware.ts` + `proxy.ts` — Next.js 16 `proxy`(구 middleware)에서 매 요청 세션 갱신
- 환경변수: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 2. 로그인 방식 — 매직링크(이메일 OTP), 소셜 로그인 없음

- `app/login/page.tsx` → `app/Welcome.tsx` 렌더 (홈 `/`의 비로그인 화면과 동일)
- 비밀번호 없음: 이메일 입력 → `signInWithOtp()` → 메일 링크 클릭 → 로그인
- 콜백 라우트 2개:
  - `app/auth/callback/route.ts` — `?code=` 방식 (`exchangeCodeForSession`)
  - `app/auth/confirm/route.ts` — `token_hash` 방식 (기기/브라우저 무관)
- 로그아웃: `app/auth/signout/route.ts`
- **카카오/OAuth 코드는 전혀 없음** (`signInWithOAuth` 호출 없음) → 0에서 추가해야 함

## 3. "나만 로그인되는" 상태의 정체

코드는 **누구나 로그인 가능하게 열려 있음.** 막고 있는 건 코드가 아님:

- `signInWithOtp`는 `shouldCreateUser` 기본 `true` → 처음 보는 이메일도 가입+로그인
- 신규 가입 시 트리거 `handle_new_user`가 `profiles` 행 자동 생성 (role 기본 `guest`)
- `0001_profiles_and_roles.sql` 맨 아래에서 `onjulyeo@gmail.com`만 `admin` 지정 → 그래서 "본인만 임원 화면"

→ "나만 로그인된다"의 실제 원인은 **Supabase 이메일 발송 설정**일 가능성이 큼. 기본 내장 메일러는 인증된(팀) 주소에만 매직링크를 실제 발송하고 외부 주소로는 막히거나 강하게 제한됨. **(미확정 — Supabase 대시보드 Auth → Email/SMTP 설정을 봐야 확정)**

> 권한 게이트는 미들웨어가 아니라 각 페이지에서 개별 `getUser()`로 처리. `proxy.ts`/`middleware.ts`는 세션 갱신만, 리다이렉트 차단은 안 함.

## 4. RLS와 chapter_id

- **RLS 정책 30개 중 `chapter_id`를 조건으로 쓰는 정책은 0개.** 전부 순수 역할 기반:
  - `members`: `is_admin()`만 전체 권한
  - `chapters`/`officer_terms`: 로그인 시 조회, 수정은 `is_admin()`
  - `is_admin()`는 `SECURITY DEFINER` 함수, `profiles.role='admin'`만 검사 (chapter 무관)
- `chapter_id`는 컬럼으로는 존재(기본값 `'새서울'`)하지만, 격리는 **앱 쿼리의 `.eq("chapter_id", "새서울")`로만** 수행
- `"새서울"` 문자열이 **앱 코드 28개 파일에 총 55회 하드코딩**

→ 사실상 단일 지회 전용 구조. RLS는 chapter 격리를 안 하므로 다른 지회 데이터가 들어오면 임원이 그것까지 보게 됨. 현재는 데이터가 새서울뿐이라 드러나지 않음.

## 결정한 방향 — 선택지 1: "Amy는 이메일 유지, 회원만 카카오"

- **임원/운영자(Amy = onjulyeo@gmail.com)**: 기존 **이메일 매직링크 로그인 유지**
- **일반 회원**: **카카오 로그인** 신규 도입
- 즉 카카오는 회원용 진입 경로로 추가하고, 임원 인증 경로는 건드리지 않음

## 다음 작업(내일 맥북에서) 할 일 / 정해야 할 것

1. `signInWithOAuth({ provider: 'kakao' })` 추가 — 콜백은 기존 `app/auth/callback/route.ts`(code 교환) 재사용 가능
2. Supabase 대시보드에서 Kakao provider 활성화 + 카카오 개발자 콘솔 REST API 키/redirect URI 설정 (코드 외 작업)
3. **카카오는 이메일이 없을 수 있음** — 현재 권한/회원 식별이 이메일 기준(`email='onjulyeo@gmail.com'`, `user.email.split("@")[0]`)이라, 카카오 가입자(이메일 없음/다름)를 `profiles`·회원(`members`)과 **어떻게 매칭할지** 먼저 정해야 함
4. (확인) Supabase Auth 이메일 발송 제한이 "나만 로그인" 원인이 맞는지 대시보드에서 검증
