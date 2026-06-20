// 운영 매뉴얼 섹션 상세 (서버) — 운영진 게이트 + kind별 분기(문서/체크리스트).
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { roleFlags } from "@/lib/role";
import { manualSectionByKey } from "../sections";
import ManualSection from "./ManualSection";
import ManualChecklist, { type ChecklistItem } from "./ManualChecklist";

export default async function ManualSectionPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const meta = manualSectionByKey(key);
  if (!meta) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <p className="rounded-lg border border-line bg-card px-4 py-10 text-center text-[15px] text-ink-soft">로그인 후 이용해 주세요.</p>;

  const { data: p } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const { isStaff, canEdit } = roleFlags(p?.role);
  if (!isStaff) return <p className="rounded-lg border border-line bg-card px-4 py-10 text-center text-[15px] text-ink-soft">운영 매뉴얼은 운영진만 볼 수 있어요.</p>;

  if (meta.kind === "checklist") {
    const { data } = await supabase.from("manual_checklist")
      .select("id, label, roles, when_label, note, checked").eq("chapter_id", "새서울").order("sort_order", { ascending: true });
    return <ManualChecklist items={(data as ChecklistItem[]) ?? []} canEdit={canEdit} />;
  }

  const { data } = await supabase.from("manual_sections").select("body").eq("chapter_id", "새서울").eq("key", key).maybeSingle();
  return <ManualSection sectionKey={key} label={meta.label} desc={meta.desc} body={data?.body ?? ""} canEdit={canEdit} />;
}
