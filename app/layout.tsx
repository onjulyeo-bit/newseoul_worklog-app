import type { Metadata } from "next";
import "./globals.css";
import SiteNav from "./SiteNav";

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
        {/* 포스터 편집기용 한글 폰트 (명조·굵은제목·손글씨·펜글씨) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Nanum+Myeongjo:wght@400;700;800&family=Black+Han+Sans&family=Gaegu:wght@400;700&family=Nanum+Pen+Script&family=Do+Hyeon&display=swap"
        />
      </head>
      <body>
        {/* 헤더 + 관리자 메뉴 (회원용 /checkin 에선 자동 숨김) */}
        <SiteNav />

        <main className="mx-auto max-w-[1320px] px-5 pb-20 pt-6">
          {children}
        </main>
      </body>
    </html>
  );
}
