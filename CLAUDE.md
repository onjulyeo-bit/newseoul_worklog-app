# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

> ⚠️ Next.js 16 + React 19 — async `layout`/`page`, `await params`/`searchParams`. See AGENTS.md before writing Next-specific code.

# 정본(定本) 운영 룰

- 이 프로젝트의 **단일 진실**은 `docs/report/정본/`이다. (한장본 + 01-개요 + 02-변경이력 + 03-할일과-참고)
- 문서(옛 사양서·DESIGN.md·design-briefs)와 코드가 다르면 **언제나 현재 코드가 진실**. 디자인 토큰은 `app/globals.css`를, 기능은 실제 라우트를 기준으로 한다.
- 작업을 하면 `02-변경이력.md`에 한 줄 추가하고, 상태가 바뀌면 `한장본.md` 표지를 갱신한다.
- 불명확한 것은 지어내지 말고 `03-할일과-참고.md`에 "확인 필요"로 적는다.
- 새서울(운영) vs 모임온(판매 SaaS) 범위를 섞지 말 것. 모임온화는 현재 미착수 상태(03 참고).

## Commands

```bash
npm run dev      # local dev (localhost:3000)
npm run build    # verify changes compile — there is NO test suite, so build is the gate
npm run lint     # eslint
```

Deploy: `git push origin main` then `npx vercel --prod --yes`.

**Verification (no tests):** run `npm run build`, then check behavior with the Preview MCP (navigate the route + screenshot). Admin-gated pages can't be seen logged-out — render the component via a throwaway `app/preview-shell/page.tsx` (or a `?preview=1` branch) with mock props, screenshot, then **delete it before committing**. Scope mock-only escape hatches behind an obvious flag and remove them.

## Orientation (full architecture lives in `docs/report/정본/01-개요.md` — read it first)

Only the non-obvious seams a coding agent needs immediately:

- **Auth/roles**: magic-link login (`signInWithOtp`); role in `profiles.role` = `admin`/`member`/`guest` (signup default `guest`). Access control is **RLS, not UI hiding** — `is_admin()` is a SECURITY DEFINER fn used inside policies. Anon flows (QR check-in, meal settings) go through token-gated SECURITY DEFINER **RPCs** (`checkin_roster`/`check_in`/`check_out`/`checkin_info`, `get/set_meal_settings`), never direct table access. `lib/supabase/{client,server}.ts` for client vs server components.
- **Multi-tenant seam**: every domain table carries `chapter_id` (always `"새서울"` today). Don't add new chapter strings without intent.
- **Migrations are applied manually** in the Supabase SQL Editor — a new file in `supabase/migrations/` does NOT auto-run. Sequence DB changes (column/bucket) before deploying code that reads them, or the query errors/returns empty. Storage buckets: `backgrounds`, `posters`, `member-photos`, `archive` (public read, admin write via RLS).
- **`/` role branch** (`app/page.tsx`): anon → `<Welcome>` (login); member/guest → `<NoticesBoard>` (read-only 공지 home); admin → `<MembersList>`. `<SiteNav>` (in `layout.tsx`) is hidden for anon/`/checkin`.
- **UI convention** — each redesigned screen scopes its CSS under a `.moim-*` root with an injected `<style>{CONST_CSS}</style>` (prefix every selector) to avoid global leakage; tokens duplicated as CSS vars matching `app/globals.css` `@theme`. Server page = thin data loader → presentational `*View`/`*Board` component (e.g. `dashboard/page.tsx`→`DashboardView`). When restyling from a Claude Design mockup, **keep existing logic and swap only visuals** — mockups drop real features (meal-paid tracking, unpaid `sms:` reminders, poster AI/stock/library sources, schedule generate/import).
- **Domain logic is in `lib/`**: `classifyTxn.ts` (bank-Excel → track A/B + categories, drives `/finance/import`), `generateSchedule.ts`/`parseScheduleXlsx.ts` (`/schedule`), `parseMembersXlsx.ts`, `exportTable.ts`. Poster export = `html-to-image`, QR = `qrcode`, sheets = `xlsx`.
- **API routes** (`app/api/`): `poster-bg` (Cloudflare Flux free / Recraft paid), `stock` (Pixabay), `occasion-extract` (Gemini vision/URL → 경조사 fields).

## Hard constraints

- No sensitive PII stored (no 주민번호/계좌번호; transactions keep only 이름·금액·내용). No KakaoTalk auto-send / bank auto-verification — unpaid reminders use copy + per-member `sms:` prefill (user taps send). Officer names come from data, not code.
