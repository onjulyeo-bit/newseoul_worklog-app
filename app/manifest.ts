import type { MetadataRoute } from "next";

// PWA — 핸드폰 홈 화면에 설치 가능하게(앱처럼 전체화면 실행).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "새서울 CBMC",
    short_name: "새서울CBMC",
    description: "새서울 CBMC 아름다운 만남 — 회원·일정·콘텐츠",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#1e2353",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
