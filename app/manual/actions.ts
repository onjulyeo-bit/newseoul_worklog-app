"use server";

// 운영 매뉴얼 서버 액션 (RLS상 admin만 쓰기). 문서 저장 + 체크리스트 토글/초기화/추가/삭제.
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { manualSectionByKey } from "./sections";

export async function updateManualSection(key: string, body: string): Promise<{ ok?: boolean; error?: string }> {
  if (!manualSectionByKey(key)) return { error: "알 수 없는 섹션이에요." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("manual_sections")
    .upsert({ chapter_id: "새서울", key, body }, { onConflict: "chapter_id,key" });
  if (error) return { error: error.message };
  revalidatePath(`/manual/${key}`);
  revalidatePath("/manual");
  return { ok: true };
}

export async function toggleChecklistItem(id: string, checked: boolean): Promise<{ ok?: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("manual_checklist")
    .update({ checked, checked_at: checked ? new Date().toISOString() : null }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/manual/prep-checklist");
  return { ok: true };
}

export async function resetChecklist(): Promise<{ ok?: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("manual_checklist")
    .update({ checked: false, checked_at: null }).eq("chapter_id", "새서울").eq("checked", true);
  if (error) return { error: error.message };
  revalidatePath("/manual/prep-checklist");
  return { ok: true };
}

export async function addChecklistItem(item: { label: string; roles: string; when_label: string; note: string }): Promise<{ ok?: boolean; error?: string }> {
  if (!item.label.trim()) return { error: "작업 이름을 입력해 주세요." };
  const supabase = await createClient();
  const { data: maxRow } = await supabase.from("manual_checklist").select("sort_order").eq("chapter_id", "새서울").order("sort_order", { ascending: false }).limit(1).maybeSingle();
  const sort = (maxRow?.sort_order ?? 0) + 1;
  const { error } = await supabase.from("manual_checklist").insert({
    chapter_id: "새서울", label: item.label.trim(),
    roles: item.roles.trim() || null, when_label: item.when_label.trim() || null, note: item.note.trim() || null, sort_order: sort,
  });
  if (error) return { error: error.message };
  revalidatePath("/manual/prep-checklist");
  return { ok: true };
}

export async function deleteChecklistItem(id: string): Promise<{ ok?: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("manual_checklist").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/manual/prep-checklist");
  return { ok: true };
}
