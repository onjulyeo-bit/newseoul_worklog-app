// 강사풀 (서버) — instructors 불러오기 + 운영진 확인.
import { createClient } from "@/lib/supabase/server";
import InstructorsBoard, { type Instructor } from "./InstructorsBoard";

export default async function InstructorsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let role: string | null = null;
  if (user) { const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single(); role = data?.role ?? null; }
  if (role !== "admin" && role !== "viewer") return <p className="rounded-lg border border-line bg-card px-4 py-10 text-center text-[15px] text-ink-soft">운영진 전용 화면이에요.</p>;

  const { data } = await supabase.from("instructors").select("id, name, kind, is_external, org, phone, field, fee_note, note, email, company, position, intro, photo_url, business_card_url").eq("chapter_id", "새서울").neq("kind", "간사").order("created_at", { ascending: false });
  return <InstructorsBoard rows={(data as Instructor[]) ?? []} canEdit={role === "admin"} />;
}
