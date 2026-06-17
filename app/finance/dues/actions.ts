"use server";

// 연도별 회비 — 매트릭스 업로드 저장(전체 교체). RLS상 운영진만.
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function importDues(rows: { name: string; year: number; amount: number }[]): Promise<{ ok?: boolean; count?: number; error?: string }> {
  const supabase = await createClient();
  // (이름·연도) 중복 정리 — 같은 사람·연도가 두 번 나오면 큰 금액만 유지(unique 제약 충돌 방지)
  const dedup = new Map<string, { name: string; year: number; amount: number }>();
  for (const r of rows) {
    const k = `${r.name}|${r.year}`;
    const cur = dedup.get(k);
    if (!cur || r.amount > cur.amount) dedup.set(k, r);
  }
  const clean = [...dedup.values()];
  const del = await supabase.from("annual_dues").delete().eq("chapter_id", "새서울");
  if (del.error) return { error: del.error.message };
  if (clean.length) {
    const ins = await supabase.from("annual_dues").insert(clean.map((r) => ({ ...r, chapter_id: "새서울" })));
    if (ins.error) return { error: ins.error.message };
  }
  revalidatePath("/finance/dues");
  return { ok: true, count: clean.length };
}
