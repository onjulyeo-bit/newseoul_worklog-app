import type { Metadata, Viewport } from "next";
import "./globals.css";
import SiteNav from "./SiteNav";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "새서울지회 · 아름다운 만남",
  description: "환영합니다. 축복합니다. 카카오 로그인하세요",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "새서울CBMC" },
  icons: { icon: "/icon-192.png", apple: "/apple-touch-icon.png" },
  openGraph: {
    title: "새서울지회 · 아름다운 만남",
    description: "환영합니다. 축복합니다. 카카오 로그인하세요",
  },
};

export const viewport: Viewport = { themeColor: "#1e2353" };

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
        {/* 포스터 편집기용 한글 폰트 — fonts-archive(jsDelivr) + 일부 noonnu + Google(고운바탕) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Gowun+Batang:wght@400;700&display=swap" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/fonts-archive/Paperlogy/Paperlogy.css" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/fonts-archive/GmarketSans/GmarketSans.css" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/fonts-archive/S-CoreDream/S-CoreDream.css" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/fonts-archive/NanumSquare/NanumSquare.css" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/fonts-archive/Aggro/Aggro.css" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/fonts-archive/Freesentation/Freesentation.css" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/fonts-archive/ChosunGu/ChosunGu.css" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/fonts-archive/MaruBuri/MaruBuri.css" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/fonts-archive/Recipekorea/Recipekorea.css" />
        {/* 에이투지체(A2Z, 9굵기) · 온글잎 콘콘체 — noonnu CDN */}
        <style dangerouslySetInnerHTML={{ __html: `
@font-face{font-family:'A2Z';font-weight:100;font-display:swap;src:url('https://cdn.jsdelivr.net/gh/projectnoonnu/2601-6@1.0/%EC%97%90%EC%9D%B4%ED%88%AC%EC%A7%80%EC%B2%B4-1Thin.woff2') format('woff2');}
@font-face{font-family:'A2Z';font-weight:200;font-display:swap;src:url('https://cdn.jsdelivr.net/gh/projectnoonnu/2601-6@1.0/%EC%97%90%EC%9D%B4%ED%88%AC%EC%A7%80%EC%B2%B4-2ExtraLight.woff2') format('woff2');}
@font-face{font-family:'A2Z';font-weight:300;font-display:swap;src:url('https://cdn.jsdelivr.net/gh/projectnoonnu/2601-6@1.0/%EC%97%90%EC%9D%B4%ED%88%AC%EC%A7%80%EC%B2%B4-3Light.woff2') format('woff2');}
@font-face{font-family:'A2Z';font-weight:400;font-display:swap;src:url('https://cdn.jsdelivr.net/gh/projectnoonnu/2601-6@1.0/%EC%97%90%EC%9D%B4%ED%88%AC%EC%A7%80%EC%B2%B4-4Regular.woff2') format('woff2');}
@font-face{font-family:'A2Z';font-weight:500;font-display:swap;src:url('https://cdn.jsdelivr.net/gh/projectnoonnu/2601-6@1.0/%EC%97%90%EC%9D%B4%ED%88%AC%EC%A7%80%EC%B2%B4-5Medium.woff2') format('woff2');}
@font-face{font-family:'A2Z';font-weight:600;font-display:swap;src:url('https://cdn.jsdelivr.net/gh/projectnoonnu/2601-6@1.0/%EC%97%90%EC%9D%B4%ED%88%AC%EC%A7%80%EC%B2%B4-6SemiBold.woff2') format('woff2');}
@font-face{font-family:'A2Z';font-weight:700;font-display:swap;src:url('https://cdn.jsdelivr.net/gh/projectnoonnu/2601-6@1.0/%EC%97%90%EC%9D%B4%ED%88%AC%EC%A7%80%EC%B2%B4-7Bold.woff2') format('woff2');}
@font-face{font-family:'A2Z';font-weight:800;font-display:swap;src:url('https://cdn.jsdelivr.net/gh/projectnoonnu/2601-6@1.0/%EC%97%90%EC%9D%B4%ED%88%AC%EC%A7%80%EC%B2%B4-8ExtraBold.woff2') format('woff2');}
@font-face{font-family:'A2Z';font-weight:900;font-display:swap;src:url('https://cdn.jsdelivr.net/gh/projectnoonnu/2601-6@1.0/%EC%97%90%EC%9D%B4%ED%88%AC%EC%A7%80%EC%B2%B4-9Black.woff2') format('woff2');}
@font-face{font-family:'Ownglyph CornCorn';font-weight:400;font-display:swap;src:url('https://cdn.jsdelivr.net/gh/projectnoonnu/2412-1@1.0/Ownglyph_corncorn-Rg.woff2') format('woff2');}
` }} />
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
