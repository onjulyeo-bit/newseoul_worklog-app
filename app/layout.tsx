import type { Metadata } from "next";
import "./globals.css";
import SiteNav from "./SiteNav";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "새서울지회 · 아름다운 만남",
  description: "환영합니다. 축복합니다. 카카오 로그인하세요",
  openGraph: {
    title: "새서울지회 · 아름다운 만남",
    description: "환영합니다. 축복합니다. 카카오 로그인하세요",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let role: string | null = null;
  let isOwner = false;
  if (user) {
    const { data } = await supabase.from("profiles").select("role, is_owner").eq("id", user.id).single();
    role = data?.role ?? "guest";
    isOwner = data?.is_owner === true;
  }
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
          href="https://fonts.googleapis.com/css2?family=Nanum+Myeongjo:wght@400;700;800&family=Black+Han+Sans&family=Gaegu:wght@400;700&family=Nanum+Pen+Script&family=Do+Hyeon&family=Jua&family=Gowun+Dodum&family=Gowun+Batang:wght@400;700&family=Sunflower:wght@300;500;700&family=Song+Myung&family=Nanum+Gothic:wght@400;700;800&family=Noto+Serif+KR:wght@400;600;900&family=Gamja+Flower&family=Hi+Melody&family=Poor+Story&family=Kirang+Haerang&family=Dongle:wght@400;700&family=Yeon+Sung&family=Stylish&display=swap"
        />
      </head>
      <body>
        {/* 앱 셸: 헤더 + 가로 메뉴 (역할별 · /checkin·랜딩·익명에선 자동 숨김) */}
        <SiteNav role={role} email={user?.email} isOwner={isOwner} />

        <main className="mx-auto max-w-[1120px] px-[18px] pb-20 pt-6 md:px-6">
          {children}
        </main>
      </body>
    </html>
  );
}
