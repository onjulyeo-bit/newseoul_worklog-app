// 서버(서버 컴포넌트·라우트 핸들러)에서 쓰는 Supabase 연결.
// 로그인 세션을 "쿠키"로 읽어와, 서버에서 "지금 로그인한 사람이 누구인지" 알 수 있게 합니다.
// Next.js 16에서는 cookies()가 비동기라 await 로 받습니다.
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // 서버 컴포넌트 렌더링 중에는 쿠키 쓰기가 안 됩니다(읽기만 가능).
            // 세션 갱신은 미들웨어/라우트 핸들러가 담당하므로 여기서는 무시해도 안전합니다.
          }
        },
      },
    },
  );
}
