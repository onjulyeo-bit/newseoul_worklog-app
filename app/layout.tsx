import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "새서울 CBMC 아름다운 만남",
  description: "새서울 CBMC 조찬모임 운영 — 회원관리",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        {/* 폰트: Pretendard 하나로 통일(DESIGN.md). 한국어 UI 표준·고가독성 */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.min.css"
        />
      </head>
      <body>
        {/* 상단 헤더 밴드 (DESIGN.md header-band): 흰 배경 + 하단 1px 라인.
            영문 라벨은 강조 파랑(primary), 한글 제목은 ink 700 */}
        <header className="border-b border-line bg-card">
          {/* 로고 위치: flex-col(세로) + items-start(왼쪽). 가운데로 옮기려면 items-start → items-center */}
          {/* 로고·제목 클릭 시 홈(회원 목록)으로 */}
          <Link href="/" className="mx-auto flex max-w-[1320px] flex-col items-start gap-2 px-5 py-6 transition hover:opacity-80">
            {/* 로고 크기: 아래 h-10 숫자를 바꾸면 됩니다 (h-8 더작게 · h-10 작게(현재) · h-14 보통 · h-20 크게) */}
            <img src="/cbmc-logo.png" alt="CBMC" className="h-10 w-auto" />
            <h1 className="text-[26px] font-bold tracking-tight text-ink">
              새서울 CBMC 아름다운 만남
            </h1>
          </Link>
        </header>

        {/* 상단 메뉴 */}
        <nav className="border-b border-line bg-card">
          <div className="mx-auto flex max-w-[1320px] gap-1 px-5 py-2 text-[15px] font-semibold">
            <a href="/" className="rounded-md px-3 py-1.5 text-ink-soft hover:bg-surface-soft hover:text-primary">회원 관리</a>
            <a href="/schedule" className="rounded-md px-3 py-1.5 text-ink-soft hover:bg-surface-soft hover:text-primary">연간 일정</a>
            <a href="/attendance" className="rounded-md px-3 py-1.5 text-ink-soft hover:bg-surface-soft hover:text-primary">출석·식대</a>
            <a href="/content" className="rounded-md px-3 py-1.5 text-ink-soft hover:bg-surface-soft hover:text-primary">콘텐츠 생성</a>
            <a href="/archive" className="rounded-md px-3 py-1.5 text-ink-soft hover:bg-surface-soft hover:text-primary">아카이브</a>
          </div>
        </nav>

        <main className="mx-auto max-w-[1320px] px-5 pb-20 pt-6">
          {children}
        </main>
      </body>
    </html>
  );
}
