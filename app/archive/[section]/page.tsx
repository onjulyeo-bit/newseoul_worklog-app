// 아카이브 섹션 (서버) — 한 섹션의 항목 불러오기. params는 Next16이라 await.
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { sectionByKey } from "../sections";
import SectionBoard, { type ArchiveItem } from "./SectionBoard";

export default async function ArchiveSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section: key } = await params;
  const section = sectionByKey(key);
  if (!section) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <p className="rounded-lg border border-line bg-card px-4 py-10 text-center text-[15px] text-ink-soft">로그인하면 아카이브를 볼 수 있어요.</p>;

  const { data: p } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const isAdmin = p?.role === "admin";

  const asc = section.layout === "timeline" || section.layout === "people"; // 연혁·역대지회장은 오래된→최신(1대부터), 나머지는 최신→오래된
  const { data } = await supabase
    .from("archive")
    .select("id, category, title, event_date, content, image_url, link")
    .eq("chapter_id", "새서울")
    .eq("category", section.category)
    .order("event_date", { ascending: asc, nullsFirst: false });

  return <SectionBoard section={section} items={(data as ArchiveItem[]) ?? []} isAdmin={isAdmin} />;
}
