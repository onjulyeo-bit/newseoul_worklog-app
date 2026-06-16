// 역할 관리 (서버) — 메인 관리자(owner)만. 로그인한 사람들(profiles) 목록 + 권한 지정.
import { createClient } from "@/lib/supabase/server";
import RolesBoard, { type Profile } from "./RolesBoard";

export default async function RolesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let isOwner = false;
  if (user) { const { data } = await supabase.from("profiles").select("is_owner").eq("id", user.id).single(); isOwner = data?.is_owner === true; }
  if (!isOwner) return <p className="rounded-lg border border-line bg-card px-4 py-10 text-center text-[15px] text-ink-soft">메인 관리자 전용 화면이에요. (서브 관리자는 역할을 바꿀 수 없어요)</p>;

  const { data } = await supabase.from("profiles").select("id, email, role, is_owner, created_at").order("created_at", { ascending: true });
  return <RolesBoard initial={(data as Profile[]) ?? []} myId={user!.id} />;
}
