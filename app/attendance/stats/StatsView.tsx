// 출석 통계 표현부 ⑧ — 클로드디자인 시안. 데이터는 page.tsx(서버)에서 주입.
import Link from "next/link";
import { CalendarCheck, Percent, Award, Medal, ChevronRight } from "lucide-react";

export type ProgRow = { name: string; meetings: number; avg: number; rate: number };
export type SessRow = { id: string; round: number | string; topic: string; online: boolean; present: number; total: number; rate: number };
export type MemRow = { name: string; attended: number; rate: number; award: boolean };

const rateClass = (r: number) => (r >= 90 ? "rate-hi" : r >= 75 ? "rate-mid" : "rate-lo");
const Bar = ({ r }: { r: number }) => <div className="bar"><div className="bar-fill" style={{ width: `${Math.max(4, r)}%` }} /></div>;

export default function StatsView({
  curYear, years, held, avgRate, awardCount, progRows, sessRows, memRows, totalMembers, denom, hasData,
}: {
  curYear: string; years: string[]; held: number; avgRate: number; awardCount: number;
  progRows: ProgRow[]; sessRows: SessRow[]; memRows: MemRow[]; totalMembers: number; denom: number; hasData: boolean;
}) {
  return (
    <div className="moim-stats">
      <style>{STATS_CSS}</style>

      <div className="page-head">
        <div><h1 className="page-title">출석 통계</h1><p className="page-sub">{curYear || "—"}년 출석 현황과 출석상 후보</p></div>
        <div className="page-acts">
          {years.length > 1 ? years.map((y) => (
            <Link key={y} href={`/attendance/stats?year=${y}`} className={`year-pill ${y === curYear ? "on" : ""}`}>{y}년</Link>
          )) : <span className="year-pill">{curYear || "—"}년</span>}
        </div>
      </div>

      {!hasData ? (
        <div className="card empty-card">아직 모임이 없어요. <Link href="/schedule" className="lnk">연간 일정</Link>을 만들어 주세요.</div>
      ) : (
        <>
          <div className="stat-grid three mb">
            <div className="card stat"><div className="stat-ic t-brand"><CalendarCheck size={20} /></div><div className="stat-body"><div className="stat-label">진행된 모임</div><div className="stat-value">{held}회</div></div></div>
            <div className="card stat"><div className="stat-ic t-green"><Percent size={20} /></div><div className="stat-body"><div className="stat-label">평균 출석률</div><div className="stat-value">{avgRate}%</div></div></div>
            <div className="card stat"><div className="stat-ic t-warm"><Award size={20} /></div><div className="stat-body"><div className="stat-label">출석상 후보</div><div className="stat-value">{awardCount}명</div><div className="stat-sub">출석률 90% 이상</div></div></div>
          </div>

          <section className="dash-sec">
            <div className="sec-row"><h2 className="sec-title">프로그램별 출석률</h2></div>
            <div className="card scroll-card">
              {progRows.length === 0 ? <p className="t-empty">연간 일정에서 회차마다 <b>프로그램</b>을 지정하면 비교돼요.</p> : (
                <table className="mtable stat-table">
                  <thead><tr><th className="th-name">프로그램</th><th>모임 수</th><th>평균 출석</th><th className="th-bar">출석률</th></tr></thead>
                  <tbody>
                    {progRows.map((p) => (
                      <tr key={p.name}><td className="td-name">{p.name}</td><td className="mono">{p.meetings}회</td><td className="mono">{p.avg}명</td>
                        <td className="td-bar"><div className="bar-row"><Bar r={p.rate} /><span className={`rate ${rateClass(p.rate)}`}>{p.rate}%</span></div></td></tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>

          <section className="dash-sec">
            <div className="sec-row"><h2 className="sec-title">회차별 출석률</h2><span className="sec-sub2">최근 {sessRows.length}회</span>
              <Link className="link-btn" href="/attendance">출석 관리 <ChevronRight size={15} /></Link></div>
            <div className="card scroll-card">
              <table className="mtable stat-table">
                <thead><tr><th className="th-name">회차</th><th>주제</th><th>출석</th><th className="th-bar">출석률</th></tr></thead>
                <tbody>
                  {sessRows.map((m) => (
                    <tr key={m.id}><td className="td-name"><span className="mono sc-round">{m.round}회</span>{m.online ? " 💻" : ""}</td>
                      <td><span className="sc-topic">{m.topic}</span></td><td className="mono nowrap">{m.present}/{m.total}</td>
                      <td className="td-bar"><div className="bar-row"><Bar r={m.rate} /><span className={`rate ${rateClass(m.rate)}`}>{m.rate}%</span></div></td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="dash-sec">
            <div className="sec-row"><h2 className="sec-title">회원별 출석률</h2><span className="sec-sub2">진행된 {denom}회 기준 · 90%↑ 출석상</span></div>
            <div className="card scroll-card">
              <table className="mtable stat-table">
                <thead><tr><th className="th-name">순위·이름</th><th>출석</th><th className="th-bar">출석률</th></tr></thead>
                <tbody>
                  {memRows.map((m, i) => (
                    <tr key={m.name + i}><td className="td-name"><span className={`rank ${i < 3 ? "rank-top" : ""}`}>{i + 1}</span><span className="td-nm">{m.name}</span>
                      {m.award && <span className="award-tag"><Medal size={13} /> 출석상</span>}</td>
                      <td className="mono nowrap">{m.attended}/{denom}</td>
                      <td className="td-bar"><div className="bar-row"><Bar r={m.rate} /><span className={`rate ${rateClass(m.rate)}`}>{m.rate}%</span></div></td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <p className="stats-note">※ 출석률 = 출석 인원 / 전체 회원({totalMembers}명) · 송년회 출석상 후보 = 90% 이상 🏅</p>
        </>
      )}
    </div>
  );
}

const STATS_CSS = `
.moim-stats{
  --brand:#0066cc; --brand-strong:#0052a8; --brand-soft:#e8f1fc; --brand-softer:#f3f8fe;
  --ink:#16181d; --ink-2:#3d424d; --ink-3:#767d8a; --line:#ecedf0; --bg:#ffffff; --bg-warm:#fafafb;
  --green:#0a7d3f; --green-soft:#e4f6ec;
  --radius-card:20px; --shadow-sm:0 1px 2px rgba(20,24,34,.04), 0 3px 12px rgba(20,24,34,.045);
  color:var(--ink); line-height:1.5; letter-spacing:-0.01em;
}
.moim-stats *{ box-sizing:border-box; }
.moim-stats h1,.moim-stats h2,.moim-stats p{ margin:0; }
.moim-stats .card{ background:var(--bg); border:1px solid var(--line); border-radius:var(--radius-card); box-shadow:var(--shadow-sm); }
.moim-stats .lnk{ color:var(--brand); font-weight:700; text-decoration:none; }
.moim-stats .page-head{ display:flex; align-items:flex-start; justify-content:space-between; gap:12px; flex-wrap:wrap; margin-bottom:20px; }
.moim-stats .page-title{ font-size:clamp(21px,5.5vw,26px); font-weight:800; letter-spacing:-0.04em; }
.moim-stats .page-sub{ color:var(--ink-3); font-size:14px; margin-top:4px; font-weight:500; }
.moim-stats .page-acts{ display:flex; gap:6px; flex-wrap:wrap; }
.moim-stats .year-pill{ display:inline-flex; align-items:center; gap:6px; font-size:13px; font-weight:700; color:var(--ink-2); background:#fff; border:1px solid var(--line); border-radius:11px; padding:8px 13px; text-decoration:none; }
.moim-stats .year-pill.on{ background:var(--brand); color:#fff; border-color:var(--brand); }
.moim-stats .empty-card{ padding:36px 20px; text-align:center; color:var(--ink-3); font-size:15px; }

.moim-stats .stat-grid{ display:grid; grid-template-columns:1fr; gap:12px; }
.moim-stats .stat-grid.mb{ margin-bottom:8px; }
.moim-stats .stat{ padding:16px; display:flex; gap:13px; align-items:flex-start; }
.moim-stats .stat-ic{ width:40px; height:40px; border-radius:12px; display:grid; place-items:center; flex-shrink:0; }
.moim-stats .stat-ic.t-brand{ background:var(--brand-soft); color:var(--brand); }
.moim-stats .stat-ic.t-green{ background:var(--green-soft); color:var(--green); }
.moim-stats .stat-ic.t-warm{ background:#fcefe7; color:#b5562a; }
.moim-stats .stat-label{ font-size:12.5px; color:var(--ink-3); font-weight:600; }
.moim-stats .stat-value{ font-size:20px; font-weight:800; letter-spacing:-0.03em; margin-top:3px; }
.moim-stats .stat-sub{ font-size:11.5px; color:var(--ink-3); margin-top:3px; font-weight:500; }

.moim-stats .dash-sec{ margin-top:26px; }
.moim-stats .sec-row{ display:flex; align-items:center; gap:10px; margin-bottom:12px; }
.moim-stats .sec-title{ font-size:17px; font-weight:800; letter-spacing:-0.03em; }
.moim-stats .sec-sub2{ font-size:12.5px; color:var(--ink-3); font-weight:600; }
.moim-stats .link-btn{ margin-left:auto; display:inline-flex; align-items:center; gap:2px; font-size:13.5px; font-weight:600; color:var(--brand); text-decoration:none; }
.moim-stats .scroll-card{ overflow-x:auto; }
.moim-stats .t-empty{ padding:20px; color:var(--ink-3); font-size:13.5px; }

.moim-stats .mtable{ width:100%; border-collapse:collapse; font-size:13.5px; }
.moim-stats .stat-table{ min-width:440px; }
.moim-stats .mtable th{ text-align:left; font-weight:700; color:var(--ink-3); font-size:12.5px; padding:13px 14px; border-bottom:1px solid var(--line); white-space:nowrap; background:var(--bg-warm); }
.moim-stats .mtable td{ padding:11px 14px; border-bottom:1px solid var(--line); color:var(--ink-2); white-space:nowrap; vertical-align:middle; }
.moim-stats .mtable tbody tr:last-child td{ border-bottom:0; }
.moim-stats .th-name,.moim-stats .td-name{ padding-left:18px !important; }
.moim-stats .td-name{ display:flex; align-items:center; gap:8px; font-weight:700; color:var(--ink); }
.moim-stats .mono{ font-variant-numeric:tabular-nums; }
.moim-stats .nowrap{ white-space:nowrap; }
.moim-stats .sc-round{ color:var(--ink-2); font-weight:700; }
.moim-stats .sc-topic{ color:var(--ink); font-weight:600; }
.moim-stats .th-bar{ width:42%; }
.moim-stats .bar-row{ display:flex; align-items:center; gap:10px; }
.moim-stats .bar{ flex:1; height:8px; background:var(--bg-warm); border:1px solid var(--line); border-radius:999px; overflow:hidden; min-width:70px; }
.moim-stats .bar-fill{ height:100%; background:var(--brand); border-radius:999px; }
.moim-stats .rate{ font-size:13px; font-weight:800; min-width:40px; text-align:right; font-variant-numeric:tabular-nums; }
.moim-stats .rate-hi{ color:var(--green); } .moim-stats .rate-mid{ color:var(--brand-strong); } .moim-stats .rate-lo{ color:var(--ink-3); }
.moim-stats .rank{ display:inline-grid; place-items:center; width:24px; height:24px; border-radius:7px; background:var(--bg-warm); border:1px solid var(--line); font-size:12px; font-weight:800; color:var(--ink-3); flex-shrink:0; }
.moim-stats .rank-top{ background:var(--brand); color:#fff; border-color:var(--brand); }
.moim-stats .award-tag{ display:inline-flex; align-items:center; gap:3px; font-size:11.5px; font-weight:800; color:#b5562a; background:#fcefe7; padding:2px 8px; border-radius:999px; }
.moim-stats .stats-note{ margin-top:14px; font-size:12px; color:var(--ink-3); font-weight:500; }

@media (min-width:760px){ .moim-stats .stat-grid.three{ grid-template-columns:repeat(3,1fr); } }
`;
