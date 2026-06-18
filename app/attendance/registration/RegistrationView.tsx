"use client";

// 회원등록현황 (통계) — 연도·회원구분 검색 + 인포그래픽.
// 기준=업로드한 연도별 회비(annual_dues, 구분). 신입=회원 가입일(joined_on). 통장 연회비는 교차확인 보조.
// 부부정회원은 '정회원'으로 분류(인원은 2명으로 집계). 구분이 비면 금액으로 추정.
import { useMemo, useState } from "react";
import { Crown, UserCheck, Sparkles, Wallet } from "lucide-react";
import StatsTabs from "../StatsTabs";
import { jungOf, junOf } from "@/lib/parseDuesXlsx";

export type DueRow = { name: string; year: number; amount: number; grade: string | null };
export type MemRow = { name: string; grade: string | null; status: string | null; joined_on: string | null };
export type TxRow = { txn_date: string; amount: number; counterparty: string | null };

const won = (n: number) => "₩" + (n || 0).toLocaleString("ko-KR");
const man = (n: number) => (n ? Math.round(n / 10000) + "만" : "—");
// 부부/정회원 → '정회원', 준회원 → '준회원', 비면 금액 추정
function kindOf(grade: string | null, amount: number): "정회원" | "준회원" | null {
  if (grade === "부부" || grade === "정회원") return "정회원";
  if (grade === "준회원") return "준회원";
  if (jungOf(null, amount) > 0) return "정회원";
  if (amount > 0) return "준회원";
  return null;
}

const C = { jung: "#0066cc", jun: "#0a7d3f", neu: "#e8643c", line: "#ecedf0", ink3: "#767d8a" };

export default function RegistrationView({ dues, members, txns }: { dues: DueRow[]; members: MemRow[]; txns: TxRow[] }) {
  const years = useMemo(() => {
    const s = new Set<string>();
    dues.forEach((d) => s.add(String(d.year)));
    members.forEach((m) => { const y = (m.joined_on ?? "").slice(0, 4); if (/^\d{4}$/.test(y)) s.add(y); });
    txns.forEach((t) => { const y = (t.txn_date ?? "").slice(0, 4); if (/^\d{4}$/.test(y)) s.add(y); });
    return [...s].sort((a, b) => Number(b) - Number(a));
  }, [dues, members, txns]);

  const [year, setYear] = useState(years[0] ?? "2026");
  const [tab, setTab] = useState<"전체" | "정회원" | "준회원" | "신입회원">("전체");

  // 연도별 집계 (그래프용) — 오래된→최신 순
  const yearly = useMemo(() => years.slice().sort((a, b) => Number(a) - Number(b)).map((y) => {
    const paid = dues.filter((d) => String(d.year) === y && d.amount > 0);
    const jung = paid.reduce((s, d) => s + jungOf(d.grade, d.amount), 0);
    const jun = paid.reduce((s, d) => s + junOf(d.grade, d.amount), 0);
    const income = paid.reduce((s, d) => s + d.amount, 0);
    const newCount = members.filter((m) => (m.joined_on ?? "").slice(0, 4) === y).length;
    return { year: y, jung, jun, income, newCount };
  }), [dues, members, years]);

  // 선택 연도 상세
  const cur = useMemo(() => {
    const paid = dues.filter((d) => String(d.year) === year && d.amount > 0);
    const jung = paid.reduce((s, d) => s + jungOf(d.grade, d.amount), 0);
    const jun = paid.reduce((s, d) => s + junOf(d.grade, d.amount), 0);
    const income = paid.reduce((s, d) => s + d.amount, 0);
    const roster = paid.map((d) => ({ name: d.name, kind: kindOf(d.grade, d.amount), couple: d.grade === "부부", amount: d.amount }))
      .sort((a, b) => a.name.localeCompare(b.name, "ko"));
    const newby = members.filter((m) => (m.joined_on ?? "").slice(0, 4) === year)
      .map((m) => ({ name: m.name, month: parseInt((m.joined_on ?? "").slice(5, 7), 10) || 0, grade: m.grade }))
      .sort((a, b) => a.month - b.month || a.name.localeCompare(b.name, "ko"));
    const newMonthly = Array.from({ length: 12 }, (_, i) => newby.filter((n) => n.month === i + 1).length);
    // 통장 교차확인: 그 해 연회비 입금 중 명단(dues)에 이름 없는 입금
    const duesNames = [...new Set(paid.map((d) => d.name))];
    const unmatched = txns.filter((t) => (t.txn_date ?? "").slice(0, 4) === year)
      .filter((t) => { const c = t.counterparty ?? ""; return !duesNames.some((n) => c.includes(n)); })
      .map((t) => ({ name: t.counterparty || "(이름 없음)", amount: t.amount || 0, date: (t.txn_date ?? "").slice(0, 10) }));
    return { jung, jun, income, roster, newby, newMonthly, unmatched };
  }, [dues, members, txns, year]);

  const list = tab === "신입회원" ? null
    : cur.roster.filter((r) => tab === "전체" ? true : r.kind === tab);

  return (
    <div className="moim-reg"><style>{REG_CSS}</style>
      <StatsTabs />

      <div className="rg-head">
        <div><h1 className="rg-title">회원등록현황</h1><p className="rg-sub">연도별 회비 납부·회원구분 집계 (업로드 기준) · 신입은 가입일 기준</p></div>
        <div className="rg-years">
          {years.length ? years.map((y) => (
            <button key={y} className={`rg-ypill ${y === year ? "on" : ""}`} onClick={() => setYear(y)}>{y}년</button>
          )) : <span className="rg-ypill on">{year}년</span>}
        </div>
      </div>

      {/* 요약 카드 */}
      <div className="rg-cards">
        <div className="rg-card"><span className="rg-ic" style={{ background: "#e8f1fc", color: C.jung }}><Crown size={19} /></span><div><div className="rg-cl">정회원</div><div className="rg-cv">{cur.jung}명</div><div className="rg-cs">부부정회원 2명 포함</div></div></div>
        <div className="rg-card"><span className="rg-ic" style={{ background: "#e4f6ec", color: C.jun }}><UserCheck size={19} /></span><div><div className="rg-cl">준회원</div><div className="rg-cv">{cur.jun}명</div></div></div>
        <div className="rg-card"><span className="rg-ic" style={{ background: "#fcefe7", color: C.neu }}><Sparkles size={19} /></span><div><div className="rg-cl">신입(올해)</div><div className="rg-cv">{cur.newby.length}명</div><div className="rg-cs">{year}년 가입</div></div></div>
        <div className="rg-card"><span className="rg-ic" style={{ background: "#eef0f3", color: "#3d424d" }}><Wallet size={19} /></span><div><div className="rg-cl">회비 수입</div><div className="rg-cv">{won(cur.income)}</div></div></div>
      </div>

      {/* 그래프 */}
      <div className="rg-charts">
        <div className="rg-chart">
          <div className="rg-ct">연도별 정·준회원 수</div>
          <GroupBars groups={yearly.map((y) => ({ label: y.year.slice(2) + "년", values: [y.jung, y.jun] }))} series={[{ name: "정회원", color: C.jung }, { name: "준회원", color: C.jun }]} unit="명" />
        </div>
        <div className="rg-chart">
          <div className="rg-ct">연도별 회비 수입</div>
          <GroupBars groups={yearly.map((y) => ({ label: y.year.slice(2) + "년", values: [Math.round(y.income / 10000)] }))} series={[{ name: "회비(만원)", color: "#7c5cff" }]} unit="만" />
        </div>
        <div className="rg-chart">
          <div className="rg-ct">{year}년 회원구분</div>
          <Donut parts={[{ label: "정회원", value: cur.jung, color: C.jung }, { label: "준회원", value: cur.jun, color: C.jun }]} />
        </div>
        <div className="rg-chart">
          <div className="rg-ct">{year}년 월별 신입</div>
          <GroupBars groups={cur.newMonthly.map((n, i) => ({ label: `${i + 1}`, values: [n] }))} series={[{ name: "신입", color: C.neu }]} unit="명" compact />
        </div>
      </div>

      {/* 구분 탭 + 명단 */}
      <div className="rg-tabs">
        {(["전체", "정회원", "준회원", "신입회원"] as const).map((t) => (
          <button key={t} className={`rg-tab ${tab === t ? "on" : ""}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {tab === "신입회원" ? (
        <div className="rg-tablewrap">
          <table className="rg-table"><thead><tr><th>이름</th><th>가입월</th><th>회원구분</th></tr></thead>
            <tbody>
              {cur.newby.length ? cur.newby.map((n, i) => (
                <tr key={n.name + i}><td className="b">{n.name}</td><td>{n.month ? `${n.month}월` : "—"}</td><td className="muted">{n.grade ?? "—"}</td></tr>
              )) : <tr><td colSpan={3} className="rg-empty">{year}년 가입한 신입회원이 없어요.</td></tr>}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rg-tablewrap">
          <table className="rg-table"><thead><tr><th>이름</th><th>회원구분</th><th style={{ textAlign: "right" }}>납부액</th></tr></thead>
            <tbody>
              {list && list.length ? list.map((r, i) => (
                <tr key={r.name + i}>
                  <td className="b">{r.name}</td>
                  <td><span className={`rg-badge ${r.kind === "정회원" ? "j" : "u"}`}>{r.kind}{r.couple ? " · 부부" : ""}</span></td>
                  <td className="mono" style={{ textAlign: "right" }}>{man(r.amount)}</td>
                </tr>
              )) : <tr><td colSpan={3} className="rg-empty">{year}년 {tab === "전체" ? "" : tab} 납부 내역이 없어요.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* 통장 교차확인(보조) */}
      {cur.unmatched.length > 0 && (
        <div className="rg-cross">
          <div className="rg-ct">통장 입금 교차확인 <span className="muted">— 명단에 없는 ‘연회비’ 입금 {cur.unmatched.length}건. 누락·이름불일치 확인용.</span></div>
          <div className="rg-tablewrap">
            <table className="rg-table"><thead><tr><th>입금자</th><th style={{ textAlign: "right" }}>금액</th><th>날짜</th></tr></thead>
              <tbody>{cur.unmatched.map((u, i) => (
                <tr key={i}><td className="b">{u.name}</td><td className="mono" style={{ textAlign: "right" }}>{won(u.amount)}</td><td className="muted">{u.date}</td></tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      <p className="rg-note">※ 정회원 수 = 부부정회원 2명 포함. 회원구분은 회계 ‘연도별 회비’ 탭에서 엑셀 업로드·수정해요. 신입회원은 회원관리의 가입일(연·월) 기준. 통장 입금은 교차확인용 참고입니다.</p>
    </div>
  );
}

// ── SVG 그래프 ───────────────────────────────────────────
function GroupBars({ groups, series, unit = "", compact = false }: {
  groups: { label: string; values: number[] }[]; series: { name: string; color: string }[]; unit?: string; compact?: boolean;
}) {
  const max = Math.max(1, ...groups.flatMap((g) => g.values));
  const n = groups.length || 1;
  const W = 320, H = compact ? 120 : 150, padB = 22, padT = 14, padL = 6;
  const gw = (W - padL * 2) / n;
  const bw = Math.min(compact ? 14 : 22, (gw - 6) / series.length);
  const chartH = H - padB - padT;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="rg-svg" preserveAspectRatio="xMidYMid meet">
      <line x1={padL} y1={H - padB} x2={W - padL} y2={H - padB} stroke={C.line} />
      {groups.map((g, gi) => {
        const gx = padL + gi * gw + gw / 2;
        const totW = series.length * bw + (series.length - 1) * 3;
        return (
          <g key={gi}>
            {g.values.map((v, si) => {
              const h = (v / max) * chartH;
              const x = gx - totW / 2 + si * (bw + 3);
              const y = H - padB - h;
              return (
                <g key={si}>
                  <rect x={x} y={y} width={bw} height={Math.max(0, h)} rx={3} fill={series[si].color} opacity={v ? 1 : 0.18} />
                  {v > 0 && <text x={x + bw / 2} y={y - 3} textAnchor="middle" className="rg-bv">{v}</text>}
                </g>
              );
            })}
            <text x={gx} y={H - padB + 14} textAnchor="middle" className="rg-bl">{g.label}</text>
          </g>
        );
      })}
      {unit && <text x={W - padL} y={padT - 2} textAnchor="end" className="rg-unit">단위 {unit}</text>}
    </svg>
  );
}

function Donut({ parts }: { parts: { label: string; value: number; color: string }[] }) {
  const total = parts.reduce((s, p) => s + p.value, 0);
  const R = 52, r = 32, cx = 70, cy = 70;
  let acc = 0;
  const arc = (start: number, frac: number, rad: number) => {
    const a0 = start - Math.PI / 2, a1 = start + 2 * Math.PI * frac - Math.PI / 2;
    return [cx + rad * Math.cos(a0), cy + rad * Math.sin(a0), cx + rad * Math.cos(a1), cy + rad * Math.sin(a1), frac > 0.5 ? 1 : 0] as const;
  };
  return (
    <div className="rg-donut">
      <svg viewBox="0 0 140 140" className="rg-dsvg">
        {total === 0 ? <circle cx={cx} cy={cy} r={(R + r) / 2} fill="none" stroke={C.line} strokeWidth={R - r} />
          : parts.map((p, i) => {
            const frac = p.value / total; if (!frac) return null;
            const start = 2 * Math.PI * acc; acc += frac;
            if (frac >= 0.999) return <circle key={i} cx={cx} cy={cy} r={(R + r) / 2} fill="none" stroke={p.color} strokeWidth={R - r} />;
            const [x0, y0, x1, y1, large] = arc(start, frac, (R + r) / 2);
            return <path key={i} d={`M ${x0} ${y0} A ${(R + r) / 2} ${(R + r) / 2} 0 ${large} 1 ${x1} ${y1}`} fill="none" stroke={p.color} strokeWidth={R - r} strokeLinecap="butt" />;
          })}
        <text x={cx} y={cy - 2} textAnchor="middle" className="rg-dnum">{total}</text>
        <text x={cx} y={cy + 14} textAnchor="middle" className="rg-dlbl">명</text>
      </svg>
      <div className="rg-legend">
        {parts.map((p, i) => <div key={i} className="rg-leg"><span className="rg-dot" style={{ background: p.color }} />{p.label} <b>{p.value}</b></div>)}
      </div>
    </div>
  );
}

const REG_CSS = `
.moim-reg{ --ink:#16181d; --ink2:#3d424d; --ink3:#767d8a; --line:#ecedf0; --card:#fff; color:var(--ink); letter-spacing:-0.01em; }
.moim-reg *{ box-sizing:border-box; }
.moim-reg .rg-head{ display:flex; align-items:flex-end; justify-content:space-between; gap:12px; flex-wrap:wrap; margin-bottom:18px; }
.moim-reg .rg-title{ font-size:clamp(21px,5vw,26px); font-weight:800; letter-spacing:-0.04em; margin:0; }
.moim-reg .rg-sub{ font-size:14px; color:var(--ink3); margin:5px 0 0; font-weight:500; }
.moim-reg .rg-years{ display:flex; gap:6px; flex-wrap:wrap; }
.moim-reg .rg-ypill{ font-size:13px; font-weight:700; padding:7px 13px; border-radius:999px; border:1px solid var(--line); background:#fff; color:var(--ink3); cursor:pointer; }
.moim-reg .rg-ypill.on{ background:#0066cc; color:#fff; border-color:#0066cc; box-shadow:0 2px 8px rgba(0,102,204,.25); }
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
.moim-reg .rg-donut{ display:flex; align-items:center; gap:14px; }
.moim-reg .rg-dsvg{ width:120px; height:120px; flex-shrink:0; }
.moim-reg .rg-dnum{ fill:var(--ink); font-size:22px; font-weight:800; }
.moim-reg .rg-dlbl{ fill:var(--ink3); font-size:10px; font-weight:600; }
.moim-reg .rg-legend{ display:flex; flex-direction:column; gap:7px; }
.moim-reg .rg-leg{ font-size:13px; color:var(--ink2); font-weight:600; display:flex; align-items:center; gap:7px; }
.moim-reg .rg-leg b{ color:var(--ink); }
.moim-reg .rg-dot{ width:10px; height:10px; border-radius:3px; display:inline-block; }
.moim-reg .rg-tabs{ display:inline-flex; gap:4px; background:var(--card); border:1px solid var(--line); border-radius:13px; padding:5px; margin-bottom:12px; }
.moim-reg .rg-tab{ font-size:13.5px; font-weight:700; padding:8px 15px; border-radius:9px; border:0; background:none; color:var(--ink3); cursor:pointer; }
.moim-reg .rg-tab.on{ background:#0066cc; color:#fff; box-shadow:0 2px 8px rgba(0,102,204,.22); }
.moim-reg .rg-tablewrap{ overflow:hidden; border:1px solid var(--line); border-radius:16px; background:var(--card); }
.moim-reg .rg-table{ width:100%; border-collapse:collapse; font-size:14px; }
.moim-reg .rg-table th{ text-align:left; font-size:12px; font-weight:700; color:var(--ink3); padding:11px 14px; background:#fafafb; border-bottom:1px solid var(--line); }
.moim-reg .rg-table td{ padding:11px 14px; border-top:1px solid var(--line); color:var(--ink2); }
.moim-reg .rg-table td.b{ font-weight:700; color:var(--ink); }
.moim-reg .rg-table td.muted{ color:var(--ink3); }
.moim-reg .mono{ font-variant-numeric:tabular-nums; }
.moim-reg .rg-badge{ font-size:12px; font-weight:700; padding:3px 9px; border-radius:999px; }
.moim-reg .rg-badge.j{ background:#e8f1fc; color:#0052a8; }
.moim-reg .rg-badge.u{ background:#e4f6ec; color:#0a7d3f; }
.moim-reg .rg-empty{ text-align:center; color:var(--ink3); padding:28px; font-weight:500; }
.moim-reg .rg-cross{ margin-top:20px; }
.moim-reg .rg-note{ font-size:12.5px; color:var(--ink3); margin-top:14px; line-height:1.6; }
.moim-reg .muted{ color:var(--ink3); font-weight:500; }
@media (min-width:720px){ .moim-reg .rg-cards{ grid-template-columns:repeat(4,1fr); } }
@media (max-width:560px){ .moim-reg .rg-charts{ grid-template-columns:1fr; } }
`;
