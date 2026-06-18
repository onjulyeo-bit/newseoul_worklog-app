// 연간결산 (서버 로더) — 연도별 수입·지출(annual_finance) + 거래 자동집계 추정(2026~).
import { createClient } from "@/lib/supabase/server";
import AnnualBoard, { type FinRow, type TxSuggest } from "./AnnualBoard";

export default async function AnnualPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let role: string | null = null;
  if (user) { const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single(); role = data?.role ?? null; }
  if (role !== "admin" && role !== "viewer") return <p className="rounded-lg border border-line bg-card px-4 py-10 text-center text-[15px] text-ink-soft">운영진 전용 화면이에요.</p>;

  const [finR, txR] = await Promise.all([
    supabase.from("annual_finance").select("year, income_total, expense_total").eq("chapter_id", "새서울"),
    supabase.from("transactions").select("txn_date, direction, amount, track").eq("chapter_id", "새서울").eq("track", "A"),
  ]);
  const fin = (finR.data ?? []) as FinRow[];
  const txns = txR.data ?? [];

  // 연도별 거래 자동집계(회비통장 A): 당해 입금/출금 합계 → 자동입력 추정
  const byYear = new Map<number, { aIn: number; aOut: number }>();
  txns.forEach((t) => {
    const y = parseInt((t.txn_date ?? "").slice(0, 4), 10); if (!y) return;
    const e = byYear.get(y) ?? { aIn: 0, aOut: 0 };
    if (t.direction === "입금") e.aIn += t.amount || 0; else e.aOut += Math.abs(t.amount || 0);
    byYear.set(y, e);
  });
  const suggest: TxSuggest[] = [...byYear.entries()].map(([year, v]) => ({ year, aIn: v.aIn, aOut: v.aOut }));

  return <AnnualBoard fin={fin} suggest={suggest} canEdit={role === "admin"} />;
}
