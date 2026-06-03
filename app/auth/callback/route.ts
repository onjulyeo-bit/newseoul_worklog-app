// 메일 속 로그인 링크를 클릭하면 이 주소로 돌아옵니다.
// 링크에 담긴 일회용 코드(code)를 진짜 로그인 세션으로 교환한 뒤, 홈으로 보냅니다.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    // 진단용: 실패 원인을 서버 로그 + 화면에 노출
    console.error("[auth/callback] exchange 실패:", error.message);
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`,
    );
  }

  return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent("코드 없음")}`);
}
