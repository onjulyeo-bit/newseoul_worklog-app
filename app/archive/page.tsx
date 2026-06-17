// 아카이브 허브 (서버) — 6섹션 카드 + 섹션별 개수.
import { createClient } from "@/lib/supabase/server";
import ArchiveHub from "./ArchiveHub";

export default async function ArchivePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <p className="rounded-lg border border-line bg-card px-4 py-10 text-center text-[15px] text-ink-soft">로그인하면 아카이브를 볼 수 있어요.</p>;

  const { data: p } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const isAdmin = p?.role === "admin";

  const { data } = await supabase.from("archive").select("category").eq("chapter_id", "새서울");
  const counts: Record<string, number> = {};
  (data ?? []).forEach((r) => { if (r.category) counts[r.category] = (counts[r.category] ?? 0) + 1; });

  return <ArchiveHub counts={counts} isAdmin={isAdmin} />;
}
