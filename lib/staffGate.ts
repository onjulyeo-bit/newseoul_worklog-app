// 서버 컴포넌트용 권한 확인 — 로그인 사용자의 role 을 읽어 플래그로 반환. (RLS 가 최종 방어선, 이건 UI 가드)
import { createClient } from "@/lib/supabase/server";
import { roleFlags } from "@/lib/role";

export async function getStaffGate() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let role: string | null = null;
  if (user) {
    const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    role = data?.role ?? null;
  }
  return { supabase, user, role, ...roleFlags(role) };
}
