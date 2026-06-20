"use server";

// 운영 매뉴얼 섹션 본문 저장 (RLS상 admin만). upsert by (chapter_id, key).
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
