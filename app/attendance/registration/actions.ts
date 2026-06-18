"use server";

// 연도별 회원등록 현황 — 결산 확정값 저장(연도별 upsert). RLS상 운영진만.
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type SummaryInput = {
  year: number;
  jung_count: number; jun_count: number; new_count: number;
  fee_income: number; donation: number; note?: string | null;
};

export async function saveAnnualSummary(s: SummaryInput): Promise<{ ok?: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("annual_summary").upsert({
    chapter_id: "새서울", year: s.year,
    jung_count: s.jung_count, jun_count: s.jun_count, new_count: s.new_count,
    fee_income: s.fee_income, donation: s.donation, note: s.note ?? null,
    updated_at: new Date().toISOString(),
  }, { onConflict: "chapter_id,year" });
  if (error) return { error: error.message };
  revalidatePath("/attendance/registration");
  return { ok: true };
}
