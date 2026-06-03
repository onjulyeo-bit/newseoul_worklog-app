// 히스토리 아카이브 (서버) — 항목 불러오기 + 임원 여부 확인.
import { createClient } from "@/lib/supabase/server";
import ArchiveBoard, { type ArchiveItem } from "./ArchiveBoard";

export default async function ArchivePage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  let isAdmin = false;
  if (user) {
    const { data: p } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    isAdmin = p?.role === "admin";
  }

  const { data } = await supabase
    .from("archive")
    .select("id, category, title, event_date, content, image_url, link")
    .eq("chapter_id", "새서울")
    .order("event_date", { ascending: true, nullsFirst: false });

  const items: ArchiveItem[] = data ?? [];
  return <ArchiveBoard items={items} isAdmin={isAdmin} loggedIn={!!user} />;
}
