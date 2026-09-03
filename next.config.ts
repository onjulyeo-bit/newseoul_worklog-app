import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 서명 합성(pdf-lib)이 fs 로 읽는 한글 폰트를 서버리스 함수 번들에 포함 (Vercel).
  outputFileTracingIncludes: {
    "/api/sign/**": ["./lib/fonts/**"],
    "/sign/**": ["./lib/fonts/**"],
  },
};

export default nextConfig;
