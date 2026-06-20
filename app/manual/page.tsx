// 운영 매뉴얼 허브 (서버) — 운영진(is_staff) 전용 게이트 + 섹션별 수정일.
import { createClient } from "@/lib/supabase/server";
import { roleFlags } from "@/lib/role";
import ManualHub from "./ManualHub";

export const metadata = { title: "운영 매뉴얼 · CBMC 새서울지회" };

export default async function ManualPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <p className="rounded-lg border border-line bg-card px-4 py-10 text-center text-[15px] text-ink-soft">로그인 후 이용해 주세요.</p>;

  const { data: p } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const { isStaff } = roleFlags(p?.role);
  if (!isStaff) return <p className="rounded-lg border border-line bg-card px-4 py-10 text-center text-[15px] text-ink-soft">운영 매뉴얼은 운영진만 볼 수 있어요.</p>;

  const { data } = await supabase.from("manual_sections").select("key, updated_at").eq("chapter_id", "새서울");
  const updated: Record<string, string> = {};
  (data ?? []).forEach((r) => { if (r.key) updated[r.key] = r.updated_at; });

  return <ManualHub updated={updated} />;
}
