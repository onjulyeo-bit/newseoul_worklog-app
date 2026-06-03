// 브라우저(클라이언트 컴포넌트)에서 쓰는 Supabase 연결.
// 로그인 버튼 클릭 등 화면에서 직접 Supabase를 부를 때 사용합니다.
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
