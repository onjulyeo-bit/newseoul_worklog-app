"use server";

// 연도별 회비 — 매트릭스 업로드 저장(전체 교체). RLS상 운영진만.
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function importDues(rows: { name: string; year: number; amount: number }[]): Promise<{ ok?: boolean; count?: number; error?: string }> {
  const supabase = await createClient();
  const del = await supabase.from("annual_dues").delete().eq("chapter_id", "새서울");
  if (del.error) return { error: del.error.message };
  if (rows.length) {
    const ins = await supabase.from("annual_dues").insert(rows.map((r) => ({ ...r, chapter_id: "새서울" })));
    if (ins.error) return { error: ins.error.message };
  }
  revalidatePath("/finance/dues");
  return { ok: true, count: rows.length };
}
