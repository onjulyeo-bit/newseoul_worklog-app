// 권한 설정 (서버) — 메인 관리자(owner)만. 로그인 계정(profiles) + 명단 회원(members) 불러오기.
import { createClient } from "@/lib/supabase/server";
import RolesBoard, { type Profile, type MemberOpt } from "./RolesBoard";

export default async function RolesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let isOwner = false;
  if (user) { const { data } = await supabase.from("profiles").select("is_owner").eq("id", user.id).single(); isOwner = data?.is_owner === true; }
  if (!isOwner) return <p className="rounded-lg border border-line bg-card px-4 py-10 text-center text-[15px] text-ink-soft">메인 관리자 전용 화면이에요. (서브 관리자는 권한을 바꿀 수 없어요)</p>;

  const [{ data: profs }, { data: mems }] = await Promise.all([
    supabase.from("profiles").select("id, email, role, is_owner, member_id, created_at").order("created_at", { ascending: true }),
    supabase.from("members").select("id, name, email, intended_role").eq("chapter_id", "새서울").order("name", { ascending: true }),
  ]);

  return <RolesBoard initial={(profs as Profile[]) ?? []} members={(mems as MemberOpt[]) ?? []} myId={user!.id} />;
}
