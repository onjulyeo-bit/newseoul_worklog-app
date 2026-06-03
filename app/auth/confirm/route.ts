// 매직링크 처리 (token_hash 방식 — 브라우저/기기를 가리지 않음).
// 메일 링크를 어느 브라우저·폰에서 열든, 링크에 담긴 token_hash를 그 자리에서 검증해 로그인합니다.
import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/";

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      // 로그인 성공 → 홈으로
      return NextResponse.redirect(`${origin}${next}`);
    }
    console.error("[auth/confirm] verifyOtp 실패:", error.message);
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`,
    );
  }

  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent("링크 정보(token_hash) 없음")}`,
  );
}
