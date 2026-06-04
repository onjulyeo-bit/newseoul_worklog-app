"use client";

// 통합 보고서 — 월별/분기별/연/전체. 수입·지출 요약 + 연회비 현황 + 식대 정산 + 잔액.
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { A_INCOME, A_EXPENSE } from "@/lib/classifyTxn";

const won = (n: number) => n.toLocaleString("ko-KR");
// 이름 정규화: "공성덕 _신입"·"조성오- 신입" → "공성덕"·"조성오"
const coreName = (s: string) => (s || "").split(/[(_\-]/)[0].replace(/\s/g, "").trim();
type Row = { txn_date: string; direction: "입금" | "출금"; amount: number; balance: number | null; category: string; track: "A" | "B"; counterparty: string };

export default function ReportPage() {
  const [supabase] = useState(() => createClient());
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [ptype, setPtype] = useState<"month" | "quarter" | "year" | "all">("month");
  const [pkey, setPkey] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("transactions").select("txn_date, direction, amount, balance, category, track, counterparty").eq("chapter_id", "새서울").order("txn_date", { ascending: true });
      setRows((data as Row[]) ?? []); setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const keyOf = (d: string) => ptype === "month" ? d.slice(0, 7) : ptype === "year" ? d.slice(0, 4) : `${d.slice(0, 4)}-Q${Math.floor((+d.slice(5, 7) - 1) / 3) + 1}`;
  const periods = useMemo(() => {
    if (ptype === "all") return [];
    return Array.from(new Set(rows.map((r) => keyOf(r.txn_date)))).sort().reverse();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, ptype]);
  const period = ptype === "all" ? "all" : (pkey && periods.includes(pkey) ? pkey : periods[0]) ?? "";

  const tx = useMemo(() => rows.filter((r) => ptype === "all" || keyOf(r.txn_date) === period), [rows, ptype, period]); // eslint-disable-line react-hooks/exhaustive-deps

  // 수입·지출 요약 (A)
  const summary = useMemo(() => {
    const a = tx.filter((r) => r.track === "A");
    const net: Record<string, number> = {};
    a.forEach((r) => { net[r.category] = (net[r.category] || 0) + (r.direction === "입금" ? r.amount : -Math.abs(r.amount)); });
    const income = A_INCOME.map((c) => ({ c, v: net[c] || 0 })).filter((x) => x.v !== 0);
    const expense = A_EXPENSE.map((c) => ({ c, v: -(net[c] || 0) })).filter((x) => x.v !== 0);
    const b = tx.filter((r) => r.track === "B");
    const sIn = b.filter((r) => r.direction === "입금").reduce((s, r) => s + r.amount, 0);
    const sOut = b.filter((r) => r.direction === "출금").reduce((s, r) => s + Math.abs(r.amount), 0);
    const sDiff = sIn - sOut;
    if (sDiff < 0) expense.push({ c: "식대정산 차액", v: -sDiff });
    else if (sDiff > 0) income.push({ c: "식대정산 차액", v: sDiff });
    const totalIn = income.reduce((s, x) => s + x.v, 0);
    const totalOut = expense.reduce((s, x) => s + x.v, 0);
    return { income, expense, totalIn, totalOut, net: totalIn - totalOut, sIn, sOut, sDiff, sCount: b.filter((r) => r.direction === "입금").length, sOutCount: b.filter((r) => r.direction === "출금").length };
  }, [tx]);

  // 연회비 현황 — 사람(이름) 기준. 부부=정회원1+부부회원1. 준회원은 정회원/부부에 없는 이름만.
  const dues = useMemo(() => {
    const y = tx.filter((r) => r.track === "A" && r.category === "연회비" && r.direction === "입금");
    const jung = new Set<string>(), bubu = new Set<string>(), junCand = new Set<string>();
    let sum = 0;
    y.forEach((r) => {
      sum += r.amount;
      const names = (r.counterparty || "").split(/[,，]/).map(coreName).filter(Boolean);
      const n0 = names[0] || (r.counterparty || "?");
      if (r.amount >= 800000) { jung.add(n0); (names.slice(1).length ? names.slice(1) : [n0 + " 배우자"]).forEach((n) => bubu.add(n)); }
      else if (r.amount >= 600000) jung.add(n0);
      else if (r.amount >= 50000 && r.amount < 100000) names.forEach((n) => junCand.add(n));
    });
    const jun = [...junCand].filter((n) => !jung.has(n) && !bubu.has(n));
    return { jung: [...jung], bubu: [...bubu], jun, sum };
  }, [tx]);

  const balance = tx.length ? tx[tx.length - 1].balance : null;

  const fmtD = (d: string) => d.slice(0, 10).replace(/-/g, ".");
  const periodLabel = ptype === "all" ? "전체 기간" : ptype === "month" ? `${period.slice(0, 4)}년 ${+period.slice(5, 7)}월` : ptype === "year" ? `${period}년` : `${period.slice(0, 4)}년 ${period.slice(6)}분기`;
  const range = tx.length ? `${fmtD(tx[0].txn_date)} ~ ${fmtD(tx[tx.length - 1].txn_date)}` : "—";

  const sec = "rounded-lg border border-line bg-card p-5";
  const th = "px-3 py-2 text-left text-[12px] font-bold text-ink-soft";

  return (
    <div className="mx-auto max-w-[900px]">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/finance" className="text-[13px] font-semibold text-primary hover:underline">← 회계</Link>
        <Link href="/finance/transactions" className="text-[13px] font-semibold text-primary hover:underline">거래 내역</Link>
        <button onClick={() => window.print()} className="ml-auto rounded-full border border-line px-4 py-1.5 text-[13px] font-semibold text-ink-soft hover:border-primary hover:text-primary">🖨 인쇄 · PDF 저장</button>
      </div>
      <h1 className="mt-1 text-[22px] font-bold text-ink">회계 보고서</h1>
      {!loading && rows.length > 0 && (
        <p className="mt-0.5 text-[14px] text-ink-soft">정산 기간: <b className="text-ink">{periodLabel}</b> <span className="text-muted">({range})</span></p>
      )}

      {/* 기간 선택 */}
      <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-line bg-card px-3 py-2">
        {(([["month", "월별"], ["quarter", "분기별"], ["year", "연별"], ["all", "전체"]]) as const).map(([v, l]) => (
          <button key={v} onClick={() => setPtype(v)} className={`rounded-full px-3 py-1 text-[13px] font-semibold ${ptype === v ? "bg-primary text-white" : "border border-line text-ink-soft hover:border-primary"}`}>{l}</button>
        ))}
        {ptype !== "all" && (
          <select value={period} onChange={(e) => setPkey(e.target.value)} className="ml-1 min-h-[34px] rounded-md border border-line bg-card px-2 text-[13px]">
            {periods.map((p) => <option key={p} value={p}>{p.replace("-", ". ").replace("Q", "분기 ")}</option>)}
          </select>
        )}
        <span className="ml-auto text-[12px] text-ink-soft">{tx.length}건</span>
      </div>

      {loading ? (
        <p className="mt-6 text-center text-[15px] text-ink-soft">불러오는 중…</p>
      ) : rows.length === 0 ? (
        <p className="mt-6 rounded-lg border border-line bg-card px-4 py-10 text-center text-[15px] text-ink-soft">저장된 거래가 없어요. <Link href="/finance/import" className="font-semibold text-primary hover:underline">거래 업로드</Link>부터 해주세요.</p>
      ) : (
        <div className="mt-4 flex flex-col gap-4">
          {/* 1. 수입·지출 요약 */}
          <section className={sec}>
            <h2 className="text-[16px] font-bold text-ink">1. 수입 · 지출 요약</h2>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <div>
                <div className="mb-1 text-[13px] font-bold text-success">수입</div>
                <table className="w-full text-[14px]">
                  <tbody>
                    {summary.income.map((x) => <tr key={x.c} className="border-b border-line"><td className="py-1.5 text-ink">{x.c}</td><td className="py-1.5 text-right font-semibold text-ink">{won(x.v)}</td></tr>)}
                    <tr><td className="py-1.5 font-bold text-ink">합계</td><td className="py-1.5 text-right font-bold text-success">{won(summary.totalIn)}</td></tr>
                  </tbody>
                </table>
              </div>
              <div>
                <div className="mb-1 text-[13px] font-bold text-unpaid">지출</div>
                <table className="w-full text-[14px]">
                  <tbody>
                    {summary.expense.map((x) => <tr key={x.c} className="border-b border-line"><td className="py-1.5 text-ink">{x.c}</td><td className="py-1.5 text-right font-semibold text-ink">{won(x.v)}</td></tr>)}
                    <tr><td className="py-1.5 font-bold text-ink">합계</td><td className="py-1.5 text-right font-bold text-unpaid">{won(summary.totalOut)}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between rounded-md bg-surface-soft px-4 py-2.5">
              <span className="text-[14px] font-bold text-ink">수입 − 지출</span>
              <span className={`text-[18px] font-black ${summary.net >= 0 ? "text-success" : "text-unpaid"}`}>{won(summary.net)}원</span>
            </div>
          </section>

          {/* 2. 연회비 현황 */}
          <section className={sec}>
            <h2 className="text-[16px] font-bold text-ink">2. 연회비 현황</h2>
            <div className="mt-3 grid grid-cols-3 gap-3 text-center">
              {([["정회원", dues.jung.length], ["부부회원", dues.bubu.length], ["준회원", dues.jun.length]] as const).map(([l, v]) => (
                <div key={l} className="rounded-lg border border-line px-3 py-2">
                  <div className="text-[20px] font-black text-deep">{v}명</div>
                  <div className="text-[12px] font-bold text-ink-soft">{l}</div>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">
              납부 합계 <b className="text-ink">{won(dues.sum)}원</b> · 총 <b className="text-ink">{dues.jung.length + dues.bubu.length + dues.jun.length}명</b><br />
              정회원: {dues.jung.join(", ") || "—"}<br />
              부부회원: {dues.bubu.join(", ") || "—"}<br />
              준회원: {dues.jun.join(", ") || "—"}
            </p>
          </section>

          {/* 3. 식대 정산 */}
          <section className={sec}>
            <h2 className="text-[16px] font-bold text-ink">3. 식대 정산</h2>
            <table className="mt-3 w-full text-[14px]">
              <thead><tr className="border-b-[1.5px] border-line"><th className={th}>항목</th><th className={th + " text-right"}>인원/건수</th><th className={th + " text-right"}>금액</th></tr></thead>
              <tbody>
                <tr className="border-b border-line"><td className="px-3 py-2 text-ink">식대 입금</td><td className="px-3 py-2 text-right">{summary.sCount}명</td><td className="px-3 py-2 text-right font-semibold text-present">{won(summary.sIn)}</td></tr>
                <tr className="border-b border-line"><td className="px-3 py-2 text-ink">식대 결재</td><td className="px-3 py-2 text-right">{summary.sOutCount}건</td><td className="px-3 py-2 text-right font-semibold text-warning">-{won(summary.sOut)}</td></tr>
                <tr><td className="px-3 py-2 font-bold text-ink">차액</td><td /><td className={`px-3 py-2 text-right font-bold ${summary.sDiff >= 0 ? "text-success" : "text-unpaid"}`}>{won(summary.sDiff)}</td></tr>
              </tbody>
            </table>
            <p className="mt-1 text-[12px] text-muted">※ 보고서엔 인원수만 (개인정보 최소화) · 차액은 위 ‘식대정산 차액’으로 회계에 반영됨</p>
          </section>

          {/* 4. 잔액 */}
          <section className={sec}>
            <h2 className="text-[16px] font-bold text-ink">4. 잔액</h2>
            <p className="mt-2 text-[15px] text-ink">기간 마지막 거래 후 통장 잔액: <b className="text-[18px] text-deep">{balance != null ? won(balance) + "원" : "—"}</b></p>
          </section>
        </div>
      )}
    </div>
  );
}
