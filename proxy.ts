// Next.js 16의 "proxy"(이전 이름: middleware). 모든 요청 전에 서버에서 먼저 실행됩니다.
// 여기서는 Supabase 로그인 세션을 자동 갱신하는 일만 합니다.
import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  // 정적 파일·이미지·favicon 등은 제외하고, 실제 페이지 요청에만 적용
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
