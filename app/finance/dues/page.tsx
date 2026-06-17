// 연도별 회비 (서버) — annual_dues 불러오기 + 운영진 확인.
import { createClient } from "@/lib/supabase/server";
import DuesBoard, { type DuesRow } from "./DuesBoard";

export default async function DuesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let isAdmin = false;
  if (user) { const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single(); isAdmin = data?.role === "admin"; }
  if (!isAdmin) return <p className="rounded-lg border border-line bg-card px-4 py-10 text-center text-[15px] text-ink-soft">운영진 전용 화면이에요.</p>;

  const { data } = await supabase.from("annual_dues").select("name, year, amount").eq("chapter_id", "새서울");
  return <DuesBoard rows={(data as DuesRow[]) ?? []} />;
}
