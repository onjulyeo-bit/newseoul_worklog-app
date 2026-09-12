import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // fs 로 읽는 자산을 서버리스 함수 번들에 포함 (Vercel).
  //   - 서명 합성(pdf-lib) 한글 폰트  - 링크 미리보기(OG) 카드의 흰색 CBMC 로고
  outputFileTracingIncludes: {
    "/api/sign/**": ["./lib/fonts/**"],
    "/sign/**": ["./lib/fonts/**"],
    "/opengraph-image": ["./public/cbmc-logo-white.png", "./lib/fonts/NanumSquare*.ttf"],
    "/my-info/opengraph-image": ["./public/cbmc-logo-white.png", "./lib/fonts/NanumSquare*.ttf"],
    "/instructor-form/opengraph-image": ["./public/cbmc-logo-white.png", "./lib/fonts/NanumSquare*.ttf"],
    "/s/g/**": ["./public/cbmc-logo-white.png", "./lib/fonts/NanumSquare*.ttf"],
  },
};

export default nextConfig;
