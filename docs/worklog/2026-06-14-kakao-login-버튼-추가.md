# 2026-06-14 — 카카오 로그인 버튼 추가 (회원용)

작업: 6/11 진단·방향 결정(선택지 1)에 이어, 로그인 화면에 카카오 로그인 버튼을 실제로 구현. 참고: `docs/worklog/2026-06-11-kakao-login-진단.md`

## 적용한 설계 결정
- 임원(onjulyeo@gmail.com)은 기존 이메일 매직링크 유지, 회원은 카카오 로그인
- 카카오 신규 사용자는 기존 `handle_new_user` 트리거로 `profiles.role='guest'` 자동 생성 (DB 변경 없음)
- 이메일 없는 카카오 계정도 통과 (Supabase "Allow users without email" ON)

## 변경 파일 — `app/Welcome.tsx` 한 곳만
- `signInKakao()` 핸들러 추가: `supabase.auth.signInWithOAuth({ provider:'kakao', options:{ redirectTo: \`${origin}/auth/callback\` }})`. 기존 `status`/`errMsg` state 재사용.
- `KakaoIcon` 인라인 SVG(말풍선) 추가 — lucide에 카카오 로고 없음.
- 버튼 UI: 이메일 폼 아래 "또는" 구분선 + 노란 "카카오로 로그인" 버튼 (`status !== "sent"` 카드 안, `<form>` 바깥).
- CSS: `.btn-kakao`(#FEE500/#191600), `.login-divider` 추가.

## 변경 없음
- `app/auth/callback/route.ts` — `exchangeCodeForSession(code)` 그대로 재사용 (OAuth PKCE에 적합)
- DB/마이그레이션 — 없음

## 검증 결과
- preview: 로그인 화면 정상 렌더(버튼·구분선 스크린샷 확인), 콘솔 에러 없음
- OAuth 배선 end-to-end(실제 Supabase 프로젝트 대상): `signInWithOAuth` 에러 없이 authorize URL 생성 → 그 URL이 **`kauth.kakao.com` 카카오 로그인 페이지로 302 리다이렉트**
  → **Supabase 카카오 provider가 이미 활성화돼 있고 `redirect_to`(/auth/callback)도 허용됨**이 확인됨
- preview 헤드리스 브라우저는 외부 도메인 top-level 이동을 막아 버튼 클릭 시 화면 전환은 안 보임(코드 문제 아님)
- 마지막 실제 카카오 계정 로그인은 사람이 직접 해야 확인 가능(자동 검증 불가)

## 참고/주의
- 검증 시 메인 체크아웃의 `.env.local`을 워크트리에 잠깐 복사 후 삭제. 워크트리에서 `npm run dev` 하려면 `.env.local` 필요(gitignore).
- 기존 lint 경고 1건(`Welcome.tsx` useEffect의 setState-in-effect)은 이번 변경과 무관한 기존 코드 — 손대지 않음.

## 다음(범위 밖, 남은 일)
- 이메일 없는 카카오 계정을 기존 `members` 레코드와 매칭/연결하는 로직
- 회원 역할 자동 승격(guest → member) 정책
- 실제 카카오 계정으로 로그인 e2e 확인
