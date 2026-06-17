// 정회원 등록 현황 (서버) — 올해 '연회비' 입금 거래를 회원 이름과 매칭해 납부/미납 표시.
import { createClient } from "@/lib/supabase/server";
import { memberJudge } from "@/lib/classifyTxn";
import RegistrationView, { type RegRow, type UnmatchedRow } from "./RegistrationView";

export default async function RegistrationPage({ searchParams }: { searchParams: Promise<{ year?: string }> }) {
  const { year } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let isAdmin = false;
  if (user) { const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single(); isAdmin = data?.role === "admin"; }
  if (!isAdmin) return <p className="rounded-lg border border-line bg-card px-4 py-10 text-center text-[15px] text-ink-soft">관리자 전용 화면이에요.</p>;

  const [memR, txR] = await Promise.all([
    supabase.from("members").select("id, name, grade").eq("chapter_id", "새서울").order("name", { ascending: true }),
    supabase.from("transactions").select("txn_date, amount, counterparty").eq("chapter_id", "새서울").eq("category", "연회비").eq("direction", "입금"),
  ]);
  const members = memR.data ?? [];
  const txns = txR.data ?? [];

  const years = Array.from(new Set(txns.map((t) => (t.txn_date ?? "").slice(0, 4)).filter(Boolean))).sort().reverse();
  const fallbackYear = new Date().toISOString().slice(0, 4);
  const curYear = year && years.includes(year) ? year : (years[0] ?? fallbackYear);
  const yearTxns = txns.filter((t) => (t.txn_date ?? "").slice(0, 4) === curYear);

  // 회원별 연회비 합계 (입금자 이름에 회원 이름이 포함되면 매칭)
  const usedTxn = new Set<number>();
  const rows: RegRow[] = members.map((m) => {
    let sum = 0;
    yearTxns.forEach((t, i) => {
      if ((t.counterparty ?? "").includes(m.name)) { sum += t.amount || 0; usedTxn.add(i); }
    });
    return { name: m.name, grade: m.grade, paid: sum > 0, amount: sum, judge: sum > 0 ? memberJudge(sum, m.name) : null };
  });

  // 명단에서 못 찾은 입금 (이름 불일치·외부) → 운영진이 직접 확인
  const unmatched: UnmatchedRow[] = yearTxns
    .filter((_, i) => !usedTxn.has(i))
    .map((t) => ({ name: t.counterparty || "(이름 없음)", amount: t.amount || 0, date: (t.txn_date ?? "").slice(0, 10) }));

  const paidCount = rows.filter((r) => r.paid).length;
  const total = rows.reduce((s, r) => s + r.amount, 0) + unmatched.reduce((s, u) => s + u.amount, 0);

  return (
    <RegistrationView
      curYear={curYear} years={years} rows={rows} unmatched={unmatched}
      paidCount={paidCount} unpaidCount={rows.length - paidCount} total={total}
    />
  );
}
