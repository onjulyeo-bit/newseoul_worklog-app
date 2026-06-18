"use client";

// 연간결산(회계) — 연도별 수입합계·지출합계 입력(이월금=수입-지출 자동). 2026~는 '자동집계'로 거래에서 채움.
// 인포그래픽: 연도별 수입·지출 막대, 이월금 추이, 최신연도 수입 구성(지출/이월) 도넛.
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { TrendingUp, TrendingDown, PiggyBank, RefreshCw } from "lucide-react";
import { saveAnnualFinance } from "./actions";
import { FIN_CSS } from "../finCss";

export type FinRow = { year: number; income_total: number; expense_total: number };
export type TxSuggest = { year: number; aIn: number; aOut: number };

const START_YEAR = 2021;
const won = (n: number) => "₩" + (n || 0).toLocaleString("ko-KR");
const man = (n: number) => Math.round((n || 0) / 10000);
const C = { in: "#00559e", out: "#e8643c", carry: "#0a7d3f", line: "#ecedf0", ink3: "#767d8a" };

type Row = { income: number; expense: number };

export default function AnnualBoard({ fin, suggest, canEdit, tabs }: { fin: FinRow[]; suggest: TxSuggest[]; canEdit: boolean; tabs?: React.ReactNode }) {
  const router = useRouter();
  const nowYear = new Date().getFullYear();
  const maxYear = Math.max(nowYear, ...fin.map((f) => f.year), START_YEAR);
  const years = useMemo(() => { const a: number[] = []; for (let y = maxYear; y >= START_YEAR; y--) a.push(y); return a; }, [maxYear]);
  const sugMap = useMemo(() => new Map(suggest.map((s) => [s.year, s])), [suggest]);

  const init = useMemo(() => {
    const m = new Map<number, Row>();
    years.forEach((y) => m.set(y, { income: 0, expense: 0 }));
    fin.forEach((f) => m.set(f.year, { income: f.income_total, expense: f.expense_total }));
    return m;
  }, [years, fin]);

  const [rows, setRows] = useState<Map<number, Row>>(init);
  const [, startT] = useTransition();
  const [toast, setToast] = useState("");
  const showToast = (t: string) => { setToast(t); setTimeout(() => setToast(""), 1800); };

  const get = (y: number) => rows.get(y) ?? { income: 0, expense: 0 };
  const carry = (y: number) => get(y).income - get(y).expense; // 이월금 = 수입 - 지출
  const setField = (y: number, k: keyof Row, v: number) => setRows((m) => { const n = new Map(m); n.set(y, { ...get(y), [k]: v }); return n; });
  const saveRow = (y: number) => { const r = get(y); startT(async () => { const res = await saveAnnualFinance(y, r.income, r.expense); showToast(res.error ? "저장 실패" : `${y}년 저장됨`); router.refresh(); }); };
  const autoFill = (y: number) => {
    const s = sugMap.get(y); if (!s) return;
    const prevCarry = get(y - 1).income - get(y - 1).expense; // 전년 이월금
    setRows((m) => { const n = new Map(m); n.set(y, { income: prevCarry + s.aIn, expense: s.aOut }); return n; });
  };

  const asc = [...years].sort((a, b) => a - b);
  const t = get(maxYear);
  const tCarry = carry(maxYear);

  return (
    <div className="moim-fin"><style>{FIN_CSS}</style><style>{AN_CSS}</style>
      {tabs}
      <div className="page-head"><div><h1 className="page-title">연간결산</h1><p className="page-sub">연도별 수입·지출·이월금 ({START_YEAR}~) · 과거는 결산서 입력, 2026~는 거래 자동집계</p></div></div>

      {/* 최신연도 요약 */}
      <div className="an-cards">
        <div className="an-card"><span className="an-ic" style={{ background: "#e8f1fc", color: C.in }}><TrendingUp size={19} /></span><div><div className="an-l">수입 ({maxYear})</div><div className="an-v">{won(t.income)}</div></div></div>
        <div className="an-card"><span className="an-ic" style={{ background: "#fcefe7", color: C.out }}><TrendingDown size={19} /></span><div><div className="an-l">지출</div><div className="an-v">{won(t.expense)}</div></div></div>
        <div className="an-card"><span className="an-ic" style={{ background: "#e4f6ec", color: C.carry }}><PiggyBank size={19} /></span><div><div className="an-l">이월금</div><div className="an-v" style={{ color: C.carry }}>{won(tCarry)}</div></div></div>
      </div>

      {/* 인포그래픽 */}
      <div className="an-charts">
        <div className="an-chart">
          <div className="an-ct">연도별 수입·지출 (만원)</div>
          <GroupBars groups={asc.map((y) => ({ label: String(y).slice(2) + "년", values: [man(get(y).income), man(get(y).expense)] }))} series={[{ name: "수입", color: C.in }, { name: "지출", color: C.out }]} />
        </div>
        <div className="an-chart">
          <div className="an-ct">{maxYear}년 수입 구성</div>
          <Donut parts={[{ label: "지출", value: Math.max(0, t.expense), color: C.out }, { label: "이월금", value: Math.max(0, tCarry), color: C.carry }]} center={won(t.income)} centerSub="수입" />
        </div>
      </div>

      {/* 연도별 입력/표 */}
      <div className="an-ct" style={{ marginBottom: 8 }}>연도별 결산 {canEdit ? "입력" : "현황"}</div>
      <div className="card scroll-card">
        <table className="mtable fin-table">
          <thead><tr><th className="th-name">연도</th><th style={{ textAlign: "right" }}>수입</th><th style={{ textAlign: "right" }}>지출</th><th style={{ textAlign: "right" }}>이월금</th>{canEdit && <th></th>}</tr></thead>
          <tbody>
            {years.map((y) => {
              const r = get(y); const s = sugMap.get(y);
              return (
                <tr key={y}>
                  <td className="td-name">{y}년</td>
                  <td style={{ textAlign: "right" }}>
                    {canEdit ? <input className="an-num" inputMode="numeric" value={r.income ? r.income.toLocaleString("ko-KR") : ""} placeholder="0"
                      onChange={(e) => setField(y, "income", parseInt(e.target.value.replace(/[^0-9]/g, ""), 10) || 0)} onBlur={() => saveRow(y)} /> : <span className="mono">{won(r.income)}</span>}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {canEdit ? <input className="an-num" inputMode="numeric" value={r.expense ? r.expense.toLocaleString("ko-KR") : ""} placeholder="0"
                      onChange={(e) => setField(y, "expense", parseInt(e.target.value.replace(/[^0-9]/g, ""), 10) || 0)} onBlur={() => saveRow(y)} /> : <span className="mono">{won(r.expense)}</span>}
                  </td>
                  <td style={{ textAlign: "right", fontWeight: 700, color: C.carry }} className="mono">{won(carry(y))}</td>
                  {canEdit && <td style={{ textAlign: "right" }}>{s && (s.aIn || s.aOut) ? <button className="an-auto" onClick={() => autoFill(y)} title={`거래 자동집계: 입금 ${won(s.aIn)} · 출금 ${won(s.aOut)} (전년 이월 합산)`}><RefreshCw size={13} /> 자동집계</button> : null}</td>}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {canEdit ? <p className="an-note">※ 수입·지출을 입력하면 <b>이월금=수입−지출</b>로 자동 계산·저장돼요(수입은 전년 이월금 포함). <b>자동집계</b>는 회비통장 거래(입금·출금)와 전년 이월을 합쳐 채워줍니다 — 결산서와 대조해 확정하세요.</p>
        : <p className="an-note">※ 이월금 = 수입 − 지출. 연말 결산 기준입니다.</p>}
      {toast && <div className="an-toast">{toast}</div>}
    </div>
  );
}

function GroupBars({ groups, series }: { groups: { label: string; values: number[] }[]; series: { name: string; color: string }[] }) {
  const max = Math.max(1, ...groups.flatMap((g) => g.values));
  const n = groups.length || 1;
  const W = 340, H = 160, padB = 22, padT = 16, padL = 6;
  const gw = (W - padL * 2) / n; const bw = Math.min(20, (gw - 6) / series.length); const chartH = H - padB - padT;
  return (<>
    <svg viewBox={`0 0 ${W} ${H}`} className="an-svg" preserveAspectRatio="xMidYMid meet">
      <line x1={padL} y1={H - padB} x2={W - padL} y2={H - padB} stroke={C.line} />
      {groups.map((g, gi) => {
        const gx = padL + gi * gw + gw / 2; const totW = series.length * bw + (series.length - 1) * 3;
        return (<g key={gi}>
          {g.values.map((v, si) => { const h = (v / max) * chartH; const x = gx - totW / 2 + si * (bw + 3); const yy = H - padB - h;
            return (<g key={si}><rect x={x} y={yy} width={bw} height={Math.max(0, h)} rx={3} fill={series[si].color} opacity={v ? 1 : 0.16} />{v > 0 && <text x={x + bw / 2} y={yy - 3} textAnchor="middle" className="an-bv">{v.toLocaleString()}</text>}</g>); })}
          <text x={gx} y={H - padB + 14} textAnchor="middle" className="an-bl">{g.label}</text>
        </g>);
      })}
    </svg>
    <div className="an-leg-row">{series.map((s, i) => <span key={i} className="an-leg"><i style={{ background: s.color }} />{s.name}</span>)}</div>
  </>);
}

function Donut({ parts, center, centerSub }: { parts: { label: string; value: number; color: string }[]; center: string; centerSub: string }) {
  const total = parts.reduce((s, p) => s + p.value, 0);
  const R = 52, r = 33, cx = 70, cy = 70; let acc = 0;
  const arc = (start: number, frac: number, rad: number) => {
    const a0 = start - Math.PI / 2, a1 = start + 2 * Math.PI * frac - Math.PI / 2;
    return [cx + rad * Math.cos(a0), cy + rad * Math.sin(a0), cx + rad * Math.cos(a1), cy + rad * Math.sin(a1), frac > 0.5 ? 1 : 0] as const;
  };
  return (
    <div className="an-donut">
      <svg viewBox="0 0 140 140" className="an-dsvg">
        {total === 0 ? <circle cx={cx} cy={cy} r={(R + r) / 2} fill="none" stroke={C.line} strokeWidth={R - r} />
          : parts.map((p, i) => { const frac = p.value / total; if (!frac) return null; const start = 2 * Math.PI * acc; acc += frac;
            if (frac >= 0.999) return <circle key={i} cx={cx} cy={cy} r={(R + r) / 2} fill="none" stroke={p.color} strokeWidth={R - r} />;
            const [x0, y0, x1, y1, large] = arc(start, frac, (R + r) / 2);
            return <path key={i} d={`M ${x0} ${y0} A ${(R + r) / 2} ${(R + r) / 2} 0 ${large} 1 ${x1} ${y1}`} fill="none" stroke={p.color} strokeWidth={R - r} />; })}
        <text x={cx} y={cy - 1} textAnchor="middle" className="an-dnum">{center}</text>
        <text x={cx} y={cy + 14} textAnchor="middle" className="an-dlbl">{centerSub}</text>
      </svg>
      <div className="an-legend">{parts.map((p, i) => <div key={i} className="an-leg2"><span style={{ background: p.color }} />{p.label} <b>{won(p.value)}</b></div>)}</div>
    </div>
  );
}

const AN_CSS = `
.moim-fin .an-cards{ display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-bottom:18px; }
.moim-fin .an-card{ display:flex; gap:12px; align-items:center; background:#fff; border:1px solid var(--line); border-radius:18px; padding:15px; }
.moim-fin .an-ic{ width:40px; height:40px; border-radius:12px; display:grid; place-items:center; flex-shrink:0; }
.moim-fin .an-l{ font-size:12.5px; color:var(--ink-3); font-weight:600; }
.moim-fin .an-v{ font-size:18px; font-weight:800; letter-spacing:-0.03em; margin-top:2px; }
.moim-fin .an-charts{ display:grid; grid-template-columns:1.3fr 1fr; gap:12px; margin-bottom:20px; }
.moim-fin .an-chart{ background:#fff; border:1px solid var(--line); border-radius:18px; padding:14px 16px; min-width:0; }
.moim-fin .an-ct{ font-size:13px; font-weight:800; color:var(--ink-2); margin-bottom:8px; }
.moim-fin .an-svg{ width:100%; height:auto; display:block; }
.moim-fin .an-bv{ fill:var(--ink-2); font-size:8px; font-weight:700; }
.moim-fin .an-bl{ fill:var(--ink-3); font-size:9px; font-weight:600; }
.moim-fin .an-leg-row{ display:flex; gap:14px; justify-content:center; margin-top:8px; }
.moim-fin .an-leg{ font-size:12px; color:var(--ink-2); font-weight:600; display:flex; align-items:center; gap:5px; }
.moim-fin .an-leg i{ width:10px; height:10px; border-radius:3px; display:inline-block; }
.moim-fin .an-donut{ display:flex; align-items:center; gap:12px; }
.moim-fin .an-dsvg{ width:120px; height:120px; flex-shrink:0; }
.moim-fin .an-dnum{ fill:var(--ink); font-size:13px; font-weight:800; }
.moim-fin .an-dlbl{ fill:var(--ink-3); font-size:10px; font-weight:600; }
.moim-fin .an-legend{ display:flex; flex-direction:column; gap:7px; }
.moim-fin .an-leg2{ font-size:12.5px; color:var(--ink-2); font-weight:600; display:flex; align-items:center; gap:6px; }
.moim-fin .an-leg2 span{ width:10px; height:10px; border-radius:3px; }
.moim-fin .an-num{ width:120px; text-align:right; font:inherit; font-variant-numeric:tabular-nums; border:1px solid var(--line); border-radius:8px; padding:6px 8px; outline:none; background:#fff; }
.moim-fin .an-num:focus{ border-color:var(--brand); box-shadow:0 0 0 3px var(--brand-soft); }
.moim-fin .an-auto{ display:inline-flex; align-items:center; gap:4px; font-size:12px; font-weight:700; color:var(--brand-strong); background:var(--brand-soft); border:0; border-radius:8px; padding:6px 10px; cursor:pointer; white-space:nowrap; }
.moim-fin .an-note{ font-size:12.5px; color:var(--ink-3); margin-top:12px; line-height:1.6; }
.moim-fin .an-toast{ position:fixed; bottom:26px; left:50%; transform:translateX(-50%); z-index:80; background:#16181d; color:#fff; font-size:13.5px; font-weight:600; padding:11px 18px; border-radius:999px; }
@media (max-width:600px){ .moim-fin .an-cards{ grid-template-columns:1fr; } .moim-fin .an-charts{ grid-template-columns:1fr; } }
`;
