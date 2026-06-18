"use server";

// 연간결산(회계) — 연도별 수입합계·지출합계 저장(upsert). RLS상 운영진만.
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function saveAnnualFinance(year: number, income: number, expense: number): Promise<{ ok?: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("annual_finance").upsert({
    chapter_id: "새서울", year, income_total: income, expense_total: expense, updated_at: new Date().toISOString(),
  }, { onConflict: "chapter_id,year" });
  if (error) return { error: error.message };
  revalidatePath("/finance/annual");
  return { ok: true };
}
