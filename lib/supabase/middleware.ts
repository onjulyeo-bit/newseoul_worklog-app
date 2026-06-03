// 매 요청마다 로그인 세션을 "신선하게" 유지해 주는 도우미.
// (로그인 토큰은 시간이 지나면 만료되는데, 이게 자동으로 갱신해 줍니다.)
// Next 16의 proxy.ts(구 middleware)에서 호출합니다.
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // ⚠️ createServerClient와 getUser() 사이에 다른 코드를 넣지 마세요(세션이 꼬일 수 있음).
  // getUser() 호출이 만료된 토큰을 갱신하고, 위 setAll로 새 쿠키가 응답에 실립니다.
  await supabase.auth.getUser();

  return supabaseResponse;
}
