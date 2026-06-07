"use client";

// 회계 보고서 ⑪ — 클로드디자인 시안 이식. 수입지출·연회비현황·식대정산·잔액 (실 계산 로직 보존).
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { A_INCOME, A_EXPENSE } from "@/lib/classifyTxn";
import { Printer } from "lucide-react";
import FinanceTabs from "../FinanceTabs";
import { FIN_CSS } from "../finCss";

const won = (n: number) => (n || 0).toLocaleString("ko-KR");
const coreName = (s: string) => (s || "").split(/[(_\-]/)[0].replace(/\s/g, "").trim();
type Row = { txn_date: string; direction: "입금" | "출금"; amount: number; balance: number | null; category: string; track: "A" | "B"; counterparty: string };
type Meeting = { session_no: number | null; date: string };

export default function ReportPage() {
  const [supabase] = useState(() => createClient());
  const [rows, setRows] = useState<Row[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [ptype, setPtype] = useState<"month" | "quarter" | "year" | "all">("month");
  const [pkey, setPkey] = useState("");

  useEffect(() => {
    (async () => {
      const [txR, mtR] = await Promise.all([
        supabase.from("transactions").select("txn_date, direction, amount, balance, category, track, counterparty").eq("chapter_id", "새서울").order("txn_date", { ascending: true }),
        supabase.from("meetings").select("session_no, date").eq("chapter_id", "새서울").eq("mode", "offline").order("date", { ascending: true }),
      ]);
      setRows((txR.data as Row[]) ?? []); setMeetings((mtR.data as Meeting[]) ?? []); setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const keyOf = (d: string) => ptype === "month" ? d.slice(0, 7) : ptype === "year" ? d.slice(0, 4) : `${d.slice(0, 4)}-Q${Math.floor((+d.slice(5, 7) - 1) / 3) + 1}`;
  const periods = useMemo(() => ptype === "all" ? [] : Array.from(new Set(rows.map((r) => keyOf(r.txn_date)))).sort().reverse(), [rows, ptype]); // eslint-disable-line react-hooks/exhaustive-deps
  const period = ptype === "all" ? "all" : (pkey && periods.includes(pkey) ? pkey : periods[0]) ?? "";
  const tx = useMemo(() => rows.filter((r) => ptype === "all" || keyOf(r.txn_date) === period), [rows, ptype, period]); // eslint-disable-line react-hooks/exhaustive-deps

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
    if (sDiff < 0) expense.push({ c: "식대정산 차액", v: -sDiff }); else if (sDiff > 0) income.push({ c: "식대정산 차액", v: sDiff });
    const totalIn = income.reduce((s, x) => s + x.v, 0); const totalOut = expense.reduce((s, x) => s + x.v, 0);
    return { income, expense, totalIn, totalOut, net: totalIn - totalOut, sIn, sOut, sDiff, sCount: b.filter((r) => r.direction === "입금").length };
  }, [tx]);

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

  const sikByMeeting = useMemo(() => {
    const b = tx.filter((r) => r.track === "B");
    const nearest = (d: string) => {
      let best: Meeting | null = null, bestDiff = Infinity;
      for (const m of meetings) { const diff = Math.abs(new Date(d).getTime() - new Date(m.date + "T00:00").getTime()) / 86400000; if (diff < bestDiff) { bestDiff = diff; best = m; } }
      return bestDiff <= 10 ? best : null;
    };
    const map = new Map<string, { session: number | null; date: string; inCount: number; inSum: number; out: number }>();
    let etcInCount = 0, etcIn = 0, etcOut = 0;
    for (const r of b) {
      const m = nearest(r.txn_date);
      if (!m) { if (r.direction === "입금") { etcInCount++; etcIn += r.amount; } else etcOut += Math.abs(r.amount); continue; }
      if (!map.has(m.date)) map.set(m.date, { session: m.session_no, date: m.date, inCount: 0, inSum: 0, out: 0 });
      const e = map.get(m.date)!;
      if (r.direction === "입금") { e.inCount++; e.inSum += r.amount; } else e.out += Math.abs(r.amount);
    }
    return { list: [...map.values()].sort((a, c) => a.date.localeCompare(c.date)), etcInCount, etcIn, etcOut };
  }, [tx, meetings]);

  const balance = tx.length ? tx[tx.length - 1].balance : null;
  const fmtD = (d: string) => d.slice(0, 10).replace(/-/g, ".");
  const periodLabel = ptype === "all" ? "전체 기간" : ptype === "month" ? `${period.slice(0, 4)}.${period.slice(5, 7)}` : ptype === "year" ? `${period}년` : `${period.slice(0, 4)} ${period.slice(6)}분기`;
  const range = tx.length ? `${fmtD(tx[0].txn_date)} ~ ${fmtD(tx[tx.length - 1].txn_date)}` : "—";
  const duesTotal = dues.jung.length + dues.bubu.length + dues.jun.length;

  return (
    <div className="moim-fin"><style>{FIN_CSS + REP_CSS}</style>
      <div className="page-head"><div><h1 className="page-title">회계</h1><p className="page-sub">정산 기간의 수입·지출·연회비·식대·잔액을 한 보고서로.</p></div></div>
      <FinanceTabs />

      <div className="rep-bar">
        <div className="rep-period">
          {(([["month", "월"], ["quarter", "분기"], ["year", "연간"], ["all", "전체"]]) as const).map(([v, l]) => (
            <button key={v} className={`pchip ${ptype === v ? "on" : ""}`} onClick={() => setPtype(v)}>{l}</button>
          ))}
          {ptype !== "all" && periods.length > 0 && (
            <select className="month-sel" value={period} onChange={(e) => setPkey(e.target.value)} style={{ marginLeft: 8 }}>
              {periods.map((p) => <option key={p} value={p}>{p.replace("-", ". ").replace("Q", "분기 ")}</option>)}
            </select>
          )}
        </div>
        <button className="ui-btn ui-ghost ui-sm" onClick={() => window.print()}><Printer size={16} /> 인쇄 / PDF</button>
      </div>

      {loading ? (
        <div className="card empty">불러오는 중…</div>
      ) : rows.length === 0 ? (
        <div className="card empty">저장된 거래가 없어요. <b>거래 가져오기</b>부터 해주세요.</div>
      ) : (
        <div className="rep-doc">
          <div className="rep-head">
            <div className="rep-title-row">
              <span className="rep-brand">새서울 CBMC <span className="rep-brand-sub">아름다운 만남</span></span>
              <span className="rep-tag">회계 보고서</span>
            </div>
            <h2 className="rep-h2">정산 기간 · {periodLabel} <span className="rep-range">({range})</span></h2>
          </div>

          <div className="rep-sum">
            <div className="rep-sc"><span className="rep-sc-l">총 수입</span><span className="rep-sc-v in mono">{won(summary.totalIn)}</span></div>
            <div className="rep-sc"><span className="rep-sc-l">총 지출</span><span className="rep-sc-v out mono">{won(summary.totalOut)}</span></div>
            <div className="rep-sc"><span className="rep-sc-l">당기 수지</span><span className="rep-sc-v mono">{won(summary.net)}</span></div>
            <div className="rep-sc hl"><span className="rep-sc-l">기말 잔액 (통장)</span><span className="rep-sc-v mono">{balance != null ? won(balance) : "—"}</span></div>
          </div>

          <div className="rep-cols">
            <section className="rep-block">
              <h3 className="rep-bt">수입 내역</h3>
              <table className="rep-table"><tbody>
                {summary.income.map((x) => <tr key={x.c}><td>{x.c}</td><td className="mono num in">{won(x.v)}</td></tr>)}
                <tr className="rep-trow"><td>수입 합계</td><td className="mono num">{won(summary.totalIn)}</td></tr>
              </tbody></table>
            </section>
            <section className="rep-block">
              <h3 className="rep-bt">지출 내역</h3>
              <table className="rep-table"><tbody>
                {summary.expense.map((x) => <tr key={x.c}><td>{x.c}</td><td className="mono num out">{won(x.v)}</td></tr>)}
                <tr className="rep-trow"><td>지출 합계</td><td className="mono num">{won(summary.totalOut)}</td></tr>
              </tbody></table>
            </section>
          </div>

          <section className="rep-block">
            <h3 className="rep-bt">연회비 납부 현황</h3>
            <table className="rep-table">
              <thead><tr><th>등급</th><th className="num">납부 인원</th></tr></thead>
              <tbody>
                <tr><td>정회원</td><td className="mono num">{dues.jung.length}명</td></tr>
                <tr><td>부부회원</td><td className="mono num">{dues.bubu.length}명</td></tr>
                <tr><td>준회원</td><td className="mono num">{dues.jun.length}명</td></tr>
                <tr className="rep-trow"><td>합계 · {won(dues.sum)}원</td><td className="mono num">{duesTotal}명</td></tr>
              </tbody>
            </table>
            <p className="rep-note" style={{ marginTop: 8 }}>정회원: {dues.jung.join(", ") || "—"} / 부부회원: {dues.bubu.join(", ") || "—"} / 준회원: {dues.jun.join(", ") || "—"}</p>
          </section>

          <section className="rep-block">
            <h3 className="rep-bt">식대 정산 (회차별)</h3>
            <table className="rep-table">
              <thead><tr><th>회차</th><th>날짜</th><th className="num">입금</th><th className="num">식대 수입</th><th className="num">식대 지출</th><th className="num">잔액</th></tr></thead>
              <tbody>
                {sikByMeeting.list.map((m) => { const diff = m.inSum - m.out; return (
                  <tr key={m.date}><td className="mono">{m.session != null ? `${m.session}회` : "—"}</td><td>{m.date.slice(5).replace("-", "/")}</td>
                    <td className="num">{m.inCount}명</td><td className="mono num in">{won(m.inSum)}</td><td className="mono num out">{m.out ? won(m.out) : "—"}</td><td className="mono num">{won(diff)}</td></tr>
                ); })}
                {(sikByMeeting.etcInCount > 0 || sikByMeeting.etcOut > 0) && (
                  <tr><td colSpan={2}>기타(미매칭)</td><td className="num">{sikByMeeting.etcInCount}명</td><td className="mono num">{won(sikByMeeting.etcIn)}</td><td className="mono num">{sikByMeeting.etcOut ? won(sikByMeeting.etcOut) : "—"}</td><td className="mono num">{won(sikByMeeting.etcIn - sikByMeeting.etcOut)}</td></tr>
                )}
                <tr className="rep-trow"><td colSpan={2}>합계</td><td className="num">{summary.sCount}명</td><td className="mono num">{won(summary.sIn)}</td><td className="mono num">{summary.sOut ? won(summary.sOut) : "—"}</td><td className="mono num">{won(summary.sDiff)}</td></tr>
              </tbody>
            </table>
            {sikByMeeting.list.length === 0 && <p className="rep-note" style={{ marginTop: 8 }}>이 기간 식대 거래가 없거나 매칭할 오프라인 회차가 없어요.</p>}
          </section>

          <div className="rep-foot">
            <div className="rep-foot-l">당기 수지 {won(summary.net)}원 · 식대 차액 {won(summary.sDiff)}원</div>
            <div className="rep-closing"><span>기말 잔액</span><strong className="mono">{balance != null ? won(balance) : "—"}원</strong></div>
          </div>
          <p className="rep-note">※ 거래일 기준 가장 가까운 오프라인 회차(±10일)에 식대 자동 매칭 · 계좌번호 등 민감정보는 저장하지 않습니다 · 모임온 자동 생성 보고서</p>
        </div>
      )}
    </div>
  );
}

const REP_CSS = `
.moim-fin .rep-bar{ display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:16px; flex-wrap:wrap; }
.moim-fin .rep-period{ display:flex; align-items:center; gap:4px; background:#fff; border:1px solid var(--line); border-radius:12px; padding:4px; }
.moim-fin .pchip{ font-size:13px; font-weight:700; color:var(--ink-3); padding:7px 14px; border-radius:9px; border:0; background:none; cursor:pointer; }
.moim-fin .pchip.on{ background:var(--brand); color:#fff; }
.moim-fin .rep-doc{ background:#fff; border:1px solid var(--line); border-radius:20px; box-shadow:var(--shadow-sm); padding:28px; }
.moim-fin .rep-head{ border-bottom:2px solid var(--ink); padding-bottom:16px; margin-bottom:22px; }
.moim-fin .rep-title-row{ display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap; }
.moim-fin .rep-brand{ font-size:17px; font-weight:800; letter-spacing:-0.03em; color:var(--brand-strong); }
.moim-fin .rep-brand-sub{ color:var(--ink-3); font-weight:600; font-size:14px; }
.moim-fin .rep-tag{ font-size:13px; font-weight:700; color:var(--ink-3); }
.moim-fin .rep-h2{ font-size:18px; font-weight:800; letter-spacing:-0.03em; margin-top:14px; }
.moim-fin .rep-range{ font-size:13px; color:var(--ink-3); font-weight:500; }
.moim-fin .rep-sum{ display:grid; grid-template-columns:repeat(2,1fr); gap:12px; margin-bottom:24px; }
.moim-fin .rep-sc{ border:1px solid var(--line); border-radius:14px; padding:15px; display:flex; flex-direction:column; gap:6px; min-width:0; }
.moim-fin .rep-sc-l{ font-size:12.5px; color:var(--ink-3); font-weight:600; }
.moim-fin .rep-sc-v{ font-size:18px; font-weight:800; letter-spacing:-0.03em; font-variant-numeric:tabular-nums; }
.moim-fin .rep-sc-v.in{ color:#0b62c4; } .moim-fin .rep-sc-v.out{ color:#c8392c; }
.moim-fin .rep-sc.hl{ background:var(--brand); border-color:var(--brand); }
.moim-fin .rep-sc.hl .rep-sc-l{ color:rgba(255,255,255,.85); } .moim-fin .rep-sc.hl .rep-sc-v{ color:#fff; }
.moim-fin .rep-cols{ display:grid; grid-template-columns:1fr; gap:0; }
.moim-fin .rep-block{ margin-bottom:22px; }
.moim-fin .rep-bt{ font-size:14px; font-weight:800; letter-spacing:-0.02em; margin-bottom:10px; padding-bottom:8px; border-bottom:1px solid var(--line); }
.moim-fin .rep-table{ width:100%; border-collapse:collapse; font-size:13.5px; }
.moim-fin .rep-table th{ text-align:left; font-size:12px; color:var(--ink-3); font-weight:700; padding:8px 10px; border-bottom:1px solid var(--line); }
.moim-fin .rep-table th.num,.moim-fin .rep-table td.num{ text-align:right; }
.moim-fin .rep-table td{ padding:9px 10px; border-bottom:1px solid var(--line); color:var(--ink-2); font-weight:500; }
.moim-fin .rep-table td.num{ font-weight:700; color:var(--ink); font-variant-numeric:tabular-nums; }
.moim-fin .rep-table td.in{ color:#0b62c4; } .moim-fin .rep-table td.out{ color:#c8392c; }
.moim-fin .rep-trow td{ border-top:2px solid var(--ink); border-bottom:0; font-weight:800; color:var(--ink); background:var(--bg-warm); }
.moim-fin .rep-foot{ display:flex; align-items:center; justify-content:space-between; gap:12px; margin-top:8px; padding-top:18px; border-top:2px solid var(--ink); flex-wrap:wrap; }
.moim-fin .rep-foot-l{ font-size:13px; color:var(--ink-3); font-weight:600; }
.moim-fin .rep-closing{ display:flex; align-items:center; gap:10px; }
.moim-fin .rep-closing span{ font-size:14px; font-weight:700; }
.moim-fin .rep-closing strong{ font-size:22px; font-weight:800; color:var(--brand-strong); letter-spacing:-0.03em; }
.moim-fin .rep-note{ font-size:11.5px; color:var(--ink-3); margin-top:4px; font-weight:500; line-height:1.6; }
@media (min-width:680px){ .moim-fin .rep-sum{ grid-template-columns:repeat(4,1fr); } .moim-fin .rep-cols{ grid-template-columns:1fr 1fr; gap:28px; } }
@media print {
  .moim-fin .page-head, .moim-fin .fin-subtabs, .moim-fin .rep-bar{ display:none !important; }
  .moim-fin .rep-doc{ border:0; box-shadow:none; border-radius:0; padding:0; }
}
`;
