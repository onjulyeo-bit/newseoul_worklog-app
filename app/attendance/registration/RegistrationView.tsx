"use client";

// 연도별 회원등록 현황 — 연말 '결산 확정값'을 연도별로 입력(운영진) → 그래프·표로 현황 파악.
// 과거 데이터 오류가 많아 자동분류 대신 사람이 확정한 숫자를 단일 진실로 둔다. 참고 추정은 입력 보조용.
import { useMemo, useState, useTransition } from "react";
import { Crown, UserCheck, Sparkles, Wallet, Gift } from "lucide-react";
import StatsTabs from "../StatsTabs";
import { saveAnnualSummary } from "./actions";

export type SummaryRow = { year: number; jung_count: number; jun_count: number; new_count: number; fee_income: number; donation: number; note: string | null };
export type SuggestRow = { year: number; jung: number; jun: number; newC: number; income: number };

const START_YEAR = 2021; // 자료가 있는 2021년부터
const won = (n: number) => "₩" + (n || 0).toLocaleString("ko-KR");
const C = { jung: "#0066cc", jun: "#0a7d3f", fee: "#7c5cff", don: "#e8643c", line: "#ecedf0", ink3: "#767d8a" };

type Row = { year: number; jung_count: number; jun_count: number; new_count: number; fee_income: number; donation: number };
const FIELDS: { k: keyof Omit<Row, "year">; label: string }[] = [
  { k: "jung_count", label: "정회원" }, { k: "jun_count", label: "준회원" }, { k: "new_count", label: "신입" },
  { k: "fee_income", label: "회비수입" }, { k: "donation", label: "후원금" },
];

export default function RegistrationView({ summaries, suggest, canEdit }: { summaries: SummaryRow[]; suggest: SuggestRow[]; canEdit: boolean }) {
  const nowYear = new Date().getFullYear();
  const maxYear = Math.max(nowYear, ...summaries.map((s) => s.year), START_YEAR);
  const years = useMemo(() => { const a: number[] = []; for (let y = maxYear; y >= START_YEAR; y--) a.push(y); return a; }, [maxYear]);
  const sugMap = useMemo(() => new Map(suggest.map((s) => [s.year, s])), [suggest]);

  const init = useMemo(() => {
    const m = new Map<number, Row>();
    years.forEach((y) => m.set(y, { year: y, jung_count: 0, jun_count: 0, new_count: 0, fee_income: 0, donation: 0 }));
    summaries.forEach((s) => m.set(s.year, { year: s.year, jung_count: s.jung_count, jun_count: s.jun_count, new_count: s.new_count, fee_income: s.fee_income, donation: s.donation }));
    return m;
  }, [years, summaries]);

  const [rows, setRows] = useState<Map<number, Row>>(init);
  const [, startT] = useTransition();
  const [toast, setToast] = useState("");
  const showToast = (t: string) => { setToast(t); setTimeout(() => setToast(""), 1800); };

  const get = (y: number) => rows.get(y) ?? { year: y, jung_count: 0, jun_count: 0, new_count: 0, fee_income: 0, donation: 0 };
  const setField = (y: number, k: keyof Omit<Row, "year">, v: number) =>
    setRows((m) => { const n = new Map(m); n.set(y, { ...get(y), [k]: v }); return n; });
  const saveRow = (y: number) => { const r = get(y); startT(async () => { const res = await saveAnnualSummary(r); showToast(res.error ? "저장 실패" : `${y}년 저장됨`); }); };
  const fillSuggest = (y: number) => {
    const s = sugMap.get(y); if (!s) return;
    setRows((m) => { const n = new Map(m); n.set(y, { ...get(y), jung_count: s.jung, jun_count: s.jun, new_count: s.newC, fee_income: s.income }); return n; });
  };

  const asc = [...years].sort((a, b) => a - b);
  const totalsThis = get(maxYear);

  return (
    <div className="moim-reg"><style>{REG_CSS}</style>
      <StatsTabs />

      <div className="rg-head">
        <div><h1 className="rg-title">연도별 회원등록 현황</h1><p className="rg-sub">연말 <b>결산에서 확정한 숫자</b>를 연도별로 입력 · {START_YEAR}년부터</p></div>
      </div>

      {/* 올해(또는 최신연도) 요약 카드 */}
      <div className="rg-cards">
        <div className="rg-card"><span className="rg-ic" style={{ background: "#e8f1fc", color: C.jung }}><Crown size={19} /></span><div><div className="rg-cl">정회원</div><div className="rg-cv">{totalsThis.jung_count}명</div><div className="rg-cs">{maxYear}년</div></div></div>
        <div className="rg-card"><span className="rg-ic" style={{ background: "#e4f6ec", color: C.jun }}><UserCheck size={19} /></span><div><div className="rg-cl">준회원</div><div className="rg-cv">{totalsThis.jun_count}명</div></div></div>
        <div className="rg-card"><span className="rg-ic" style={{ background: "#fcefe7", color: C.don }}><Sparkles size={19} /></span><div><div className="rg-cl">신입</div><div className="rg-cv">{totalsThis.new_count}명</div></div></div>
        <div className="rg-card"><span className="rg-ic" style={{ background: "#efeafe", color: C.fee }}><Wallet size={19} /></span><div><div className="rg-cl">회비 수입</div><div className="rg-cv">{won(totalsThis.fee_income)}</div></div></div>
      </div>

      {/* 그래프 */}
      <div className="rg-charts">
        <div className="rg-chart">
          <div className="rg-ct">연도별 정·준회원 수</div>
          <GroupBars groups={asc.map((y) => ({ label: String(y).slice(2) + "년", values: [get(y).jung_count, get(y).jun_count] }))} series={[{ name: "정회원", color: C.jung }, { name: "준회원", color: C.jun }]} unit="명" />
        </div>
        <div className="rg-chart">
          <div className="rg-ct">연도별 회비 수입·후원금</div>
          <GroupBars groups={asc.map((y) => ({ label: String(y).slice(2) + "년", values: [Math.round(get(y).fee_income / 10000), Math.round(get(y).donation / 10000)] }))} series={[{ name: "회비(만원)", color: C.fee }, { name: "후원금(만원)", color: C.don }]} unit="만" />
        </div>
      </div>

      {/* 연도별 결산 입력/표 */}
      <div className="rg-ct" style={{ marginBottom: 8 }}>연도별 결산 {canEdit ? "입력" : "현황"}</div>
      <div className="rg-tablewrap">
        <table className="rg-table">
          <thead><tr><th>연도</th>{FIELDS.map((f) => <th key={f.k} style={{ textAlign: "right" }}>{f.label}</th>)}{canEdit && <th></th>}</tr></thead>
          <tbody>
            {years.map((y) => {
              const r = get(y); const s = sugMap.get(y);
              return (
                <tr key={y}>
                  <td className="b">{y}년</td>
                  {FIELDS.map((f) => (
                    <td key={f.k} style={{ textAlign: "right" }}>
                      {canEdit ? (
                        <input className="rg-num" inputMode="numeric" value={r[f.k] ? String(r[f.k]) : ""}
                          onChange={(e) => setField(y, f.k, parseInt(e.target.value.replace(/[^0-9]/g, ""), 10) || 0)}
                          onBlur={() => saveRow(y)} placeholder="0" />
                      ) : <span className="mono">{f.k === "fee_income" || f.k === "donation" ? won(r[f.k]) : r[f.k] || "—"}</span>}
                    </td>
                  ))}
                  {canEdit && <td style={{ textAlign: "right" }}>{s && (s.jung || s.jun || s.newC || s.income) ? <button className="rg-sug" onClick={() => fillSuggest(y)} title={`납부내역 추정: 정${s.jung}·준${s.jun}·신입${s.newC}·회비${won(s.income)}`}>추정값</button> : null}</td>}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {canEdit && <p className="rg-note">※ 숫자를 입력하고 칸을 벗어나면 자동 저장돼요. <b>추정값</b> 버튼은 납부내역(회비)·가입일로 계산한 참고치를 채워넣습니다 — 결산에 맞게 고쳐 확정하세요. 후원금=명예회원 입금 등.</p>}
      {!canEdit && <p className="rg-note">※ 연말 결산에서 확정한 숫자 기준입니다.</p>}
      {toast && <div className="rg-toast">{toast}</div>}
    </div>
  );
}

// ── SVG 막대 그래프 ──────────────────────────────────────
function GroupBars({ groups, series, unit = "" }: { groups: { label: string; values: number[] }[]; series: { name: string; color: string }[]; unit?: string }) {
  const max = Math.max(1, ...groups.flatMap((g) => g.values));
  const n = groups.length || 1;
  const W = 340, H = 156, padB = 22, padT = 16, padL = 6;
  const gw = (W - padL * 2) / n;
  const bw = Math.min(20, (gw - 6) / series.length);
  const chartH = H - padB - padT;
  return (
    <>
      <svg viewBox={`0 0 ${W} ${H}`} className="rg-svg" preserveAspectRatio="xMidYMid meet">
        <line x1={padL} y1={H - padB} x2={W - padL} y2={H - padB} stroke={C.line} />
        {groups.map((g, gi) => {
          const gx = padL + gi * gw + gw / 2; const totW = series.length * bw + (series.length - 1) * 3;
          return (
            <g key={gi}>
              {g.values.map((v, si) => {
                const h = (v / max) * chartH; const x = gx - totW / 2 + si * (bw + 3); const yy = H - padB - h;
                return (<g key={si}>
                  <rect x={x} y={yy} width={bw} height={Math.max(0, h)} rx={3} fill={series[si].color} opacity={v ? 1 : 0.16} />
                  {v > 0 && <text x={x + bw / 2} y={yy - 3} textAnchor="middle" className="rg-bv">{v}</text>}
                </g>);
              })}
              <text x={gx} y={H - padB + 14} textAnchor="middle" className="rg-bl">{g.label}</text>
            </g>
          );
        })}
        {unit && <text x={W - padL} y={padT - 4} textAnchor="end" className="rg-unit">단위 {unit}</text>}
      </svg>
      <div className="rg-leg-row">{series.map((s, i) => <span key={i} className="rg-leg"><i style={{ background: s.color }} />{s.name}</span>)}</div>
    </>
  );
}

const REG_CSS = `
.moim-reg{ --ink:#16181d; --ink2:#3d424d; --ink3:#767d8a; --line:#ecedf0; --card:#fff; color:var(--ink); letter-spacing:-0.01em; }
.moim-reg *{ box-sizing:border-box; }
.moim-reg .rg-head{ margin-bottom:18px; }
.moim-reg .rg-title{ font-size:clamp(21px,5vw,26px); font-weight:800; letter-spacing:-0.04em; margin:0; }
.moim-reg .rg-sub{ font-size:14px; color:var(--ink3); margin:5px 0 0; font-weight:500; }
.moim-reg .rg-cards{ display:grid; grid-template-columns:repeat(2,1fr); gap:12px; margin-bottom:18px; }
.moim-reg .rg-card{ display:flex; gap:12px; align-items:center; background:var(--card); border:1px solid var(--line); border-radius:18px; padding:15px; }
.moim-reg .rg-ic{ width:40px; height:40px; border-radius:12px; display:grid; place-items:center; flex-shrink:0; }
.moim-reg .rg-cl{ font-size:12.5px; color:var(--ink3); font-weight:600; }
.moim-reg .rg-cv{ font-size:21px; font-weight:800; letter-spacing:-0.03em; margin-top:2px; }
.moim-reg .rg-cs{ font-size:11.5px; color:var(--ink3); margin-top:1px; }
.moim-reg .rg-charts{ display:grid; grid-template-columns:repeat(2,1fr); gap:12px; margin-bottom:20px; }
.moim-reg .rg-chart{ background:var(--card); border:1px solid var(--line); border-radius:18px; padding:14px 16px; min-width:0; }
.moim-reg .rg-ct{ font-size:13px; font-weight:800; color:var(--ink2); margin-bottom:8px; }
.moim-reg .rg-svg{ width:100%; height:auto; display:block; }
.moim-reg .rg-bv{ fill:var(--ink2); font-size:9px; font-weight:700; }
.moim-reg .rg-bl{ fill:var(--ink3); font-size:9px; font-weight:600; }
.moim-reg .rg-unit{ fill:#b6bcc6; font-size:8.5px; font-weight:600; }
.moim-reg .rg-leg-row{ display:flex; gap:14px; justify-content:center; margin-top:8px; }
.moim-reg .rg-leg{ font-size:12px; color:var(--ink2); font-weight:600; display:flex; align-items:center; gap:5px; }
.moim-reg .rg-leg i{ width:10px; height:10px; border-radius:3px; display:inline-block; }
.moim-reg .rg-tablewrap{ overflow-x:auto; border:1px solid var(--line); border-radius:16px; background:var(--card); }
.moim-reg .rg-table{ width:100%; border-collapse:collapse; font-size:14px; min-width:520px; }
.moim-reg .rg-table th{ text-align:left; font-size:12px; font-weight:700; color:var(--ink3); padding:11px 12px; background:#fafafb; border-bottom:1px solid var(--line); white-space:nowrap; }
.moim-reg .rg-table td{ padding:9px 12px; border-top:1px solid var(--line); color:var(--ink2); white-space:nowrap; }
.moim-reg .rg-table td.b{ font-weight:700; color:var(--ink); }
.moim-reg .mono{ font-variant-numeric:tabular-nums; }
.moim-reg .rg-num{ width:92px; text-align:right; font:inherit; font-variant-numeric:tabular-nums; border:1px solid var(--line); border-radius:8px; padding:6px 8px; outline:none; background:#fff; }
.moim-reg .rg-num:focus{ border-color:#0066cc; box-shadow:0 0 0 3px #e8f1fc; }
.moim-reg .rg-sug{ font-size:12px; font-weight:700; color:#6b46d9; background:#efeafe; border:0; border-radius:8px; padding:6px 10px; cursor:pointer; white-space:nowrap; }
.moim-reg .rg-note{ font-size:12.5px; color:var(--ink3); margin-top:14px; line-height:1.6; }
.moim-reg .rg-toast{ position:fixed; bottom:26px; left:50%; transform:translateX(-50%); z-index:80; background:#16181d; color:#fff; font-size:13.5px; font-weight:600; padding:11px 18px; border-radius:999px; }
@media (min-width:720px){ .moim-reg .rg-cards{ grid-template-columns:repeat(4,1fr); } }
@media (max-width:560px){ .moim-reg .rg-charts{ grid-template-columns:1fr; } }
`;
