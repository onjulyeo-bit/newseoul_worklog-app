"use server";

// 연도별 회비 — 매트릭스 업로드 저장(전체 교체) + 화면 인라인 수정. RLS상 운영진만.
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

type Row = { name: string; year: number; amount: number; grade: string | null };

export async function importDues(rows: Row[]): Promise<{ ok?: boolean; count?: number; error?: string }> {
  const supabase = await createClient();
  // (이름·연도) 중복 정리 — 같은 사람·연도가 두 번 나오면 큰 금액만 유지(unique 제약 충돌 방지)
  const dedup = new Map<string, Row>();
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

// 한 사람의 회원구분을 모든 연도에 일괄 적용 (오류 수정용)
export async function setDuesGrade(name: string, grade: string | null): Promise<{ ok?: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("annual_dues").update({ grade }).eq("chapter_id", "새서울").eq("name", name);
  if (error) return { error: error.message };
  revalidatePath("/finance/dues");
  return { ok: true };
}

// 특정 (이름·연도) 금액 수정 (오타 정정용). 0이면 그 칸 삭제.
export async function setDuesAmount(name: string, year: number, amount: number): Promise<{ ok?: boolean; error?: string }> {
  const supabase = await createClient();
  if (!amount) {
    const { error } = await supabase.from("annual_dues").delete().eq("chapter_id", "새서울").eq("name", name).eq("year", year);
    if (error) return { error: error.message };
  } else {
    // 기존 행이 있으면 update, 없으면 insert (upsert: unique chapter_id,name,year)
    const { error } = await supabase.from("annual_dues").upsert({ chapter_id: "새서울", name, year, amount }, { onConflict: "chapter_id,name,year" });
    if (error) return { error: error.message };
  }
  revalidatePath("/finance/dues");
  return { ok: true };
}
