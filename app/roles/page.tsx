// 역할 관리 (서버) — 임원만. 로그인한 사람들(profiles) 목록 + 권한 지정.
import { createClient } from "@/lib/supabase/server";
import RolesBoard, { type Profile } from "./RolesBoard";

export default async function RolesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let isAdmin = false;
  if (user) { const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single(); isAdmin = data?.role === "admin"; }
  if (!isAdmin) return <p className="rounded-lg border border-line bg-card px-4 py-10 text-center text-[15px] text-ink-soft">관리자 전용 화면이에요.</p>;

  const { data } = await supabase.from("profiles").select("id, email, role, created_at").order("created_at", { ascending: true });
  return <RolesBoard initial={(data as Profile[]) ?? []} myId={user!.id} />;
}
