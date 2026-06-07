"use client";

// 연간 일정 ⑤ — 클로드디자인 시안 + 기존 전 기능 유지(자동생성·엑셀·이벤트·인라인편집·저장).
import { Fragment, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { generateSchedule, renumber, type Row, type Mode } from "@/lib/generateSchedule";
import { parseScheduleXlsx } from "@/lib/parseScheduleXlsx";
import { downloadXlsx, downloadCsv } from "@/lib/exportTable";
import { saveSchedule, createEvent, deleteEvent } from "./actions";
import { ChevronDown, Sparkles, Save, Upload, Download, Calendar, Star, Trash2, MapPin } from "lucide-react";

export type ExistingRow = { date: string; session: number | null; mode: string; title: string; speaker: string; note: string; program: string };
export type EventRow = { id: string; title: string; date: string; end_date: string | null; type: string | null; location: string | null; link: string | null };

const EVENT_TYPES = ["한국대회", "송년회", "봄소풍", "수련회", "총회", "기타"];
const PROGRAMS = ["", "예배", "포럼", "회만시", "특강", "기타행사"];
const MODES: { v: Mode; label: string }[] = [
  { v: "online", label: "온라인" }, { v: "offline", label: "오프라인" },
  { v: "recess", label: "휴회" }, { v: "pending", label: "미정" },
];
const DAYS = ["일", "월", "화", "수", "목", "금", "토"];
const wd = (date: string) => { const d = new Date(date + "T00:00"); return `${d.getMonth() + 1}/${d.getDate()}(${DAYS[d.getDay()]})`; };
const monthOf = (date: string) => { const d = new Date(date + "T00:00"); return `${d.getFullYear()}년 ${d.getMonth() + 1}월`; };
const nthOf = (date: string) => Math.ceil(new Date(date + "T00:00").getDate() / 7);
const modeTone = (m: string) => (m === "offline" ? "brand" : m === "online" ? "blue" : "gray");
const modeLabelOf = (m: string) => MODES.find((x) => x.v === m)?.label ?? m;

export default function ScheduleBoard({ existing, events, fee, account }: { existing: ExistingRow[]; events: EventRow[]; fee: number | null; account: string | null }) {
  const router = useRouter();
  const [year, setYear] = useState(2026);
  const [anchorDate, setAnchorDate] = useState("2026-05-29");
  const [anchorSession, setAnchorSession] = useState(1385);
  const [feeV, setFeeV] = useState(fee != null ? String(fee) : "");
  const [accountV, setAccountV] = useState(account ?? "");
  const [rows, setRows] = useState<Row[]>(existing.map((e) => ({ date: e.date, nth: nthOf(e.date), mode: e.mode as Mode, session: e.session, title: e.title, speaker: e.speaker, note: e.note, program: e.program })));
  const [genOpen, setGenOpen] = useState(existing.length === 0);
  const [result, setResult] = useState("");
  const [pending, startTransition] = useTransition();

  const [showEvent, setShowEvent] = useState(false);
  const [ev, setEv] = useState({ title: "", date: "", endDate: "", type: "한국대회", location: "", link: "" });
  const setEvF = (k: keyof typeof ev, v: string) => setEv((s) => ({ ...s, [k]: v }));
  const addEvent = () => startTransition(async () => {
    const res = await createEvent({ title: ev.title, date: ev.date, end_date: ev.endDate || null, type: ev.type, location: ev.location || null, link: ev.link || null });
    if (res.error) { setResult("❌ " + res.error); return; }
    setEv({ title: "", date: "", endDate: "", type: "한국대회", location: "", link: "" }); setShowEvent(false); setResult("✅ 이벤트 추가됨"); router.refresh();
  });
  const removeEvent = (id: string, title: string) => { if (!confirm(`'${title}' 이벤트를 삭제할까요?`)) return; startTransition(async () => { await deleteEvent(id); router.refresh(); }); };

  const gen = () => {
    if (rows.length > 0 && !confirm("현재 표를 자동 생성으로 새로 채웁니다.\n(저장 전까지 DB는 그대로예요) 계속할까요?")) return;
    setRows(generateSchedule(year, anchorDate, anchorSession)); setResult("자동 생성됨 — 미정(5번째·공휴일)을 정하고 저장하세요"); setGenOpen(false);
  };
  const setMode = (date: string, mode: Mode) => setRows((prev) => renumber(prev.map((r) => (r.date === date ? { ...r, mode } : r)), anchorDate, anchorSession));
  const setField = (date: string, k: "title" | "speaker" | "program", v: string) => setRows((prev) => prev.map((r) => (r.date === date ? { ...r, [k]: v } : r)));
  const recompute = () => setRows((prev) => renumber([...prev], anchorDate, anchorSession));
  const onSave = () => startTransition(async () => {
    const res = await saveSchedule(rows.map((r) => ({ date: r.date, mode: r.mode, session: r.session, title: r.title, speaker: r.speaker, note: r.note, program: r.program })), feeV ? Number(feeV) : null, accountV || null);
    setResult(res.error ? "❌ " + res.error : `✅ 저장 완료 — ${res.count}개 일정`);
  });
  const exportRows = () => rows.map((r) => ({ 회차: r.session ?? "", 날짜: r.date, 요일: wd(r.date), 모드: modeLabelOf(r.mode), 주제: r.title, 강사: r.speaker, 비고: r.note }));
  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    try { setRows(parseScheduleXlsx(await file.arrayBuffer())); setResult("파일에서 불러옴 — 확인 후 저장하세요"); }
    catch (err) { setResult("❌ " + (err instanceof Error ? err.message : "읽기 실패")); }
  }

  const meetN = rows.filter((r) => r.mode === "online" || r.mode === "offline").length;
  const upcoming = rows.filter((r) => r.date >= new Date().toISOString().slice(0, 10) && (r.mode === "online" || r.mode === "offline")).length;
  const today = new Date().toISOString().slice(0, 10);

  const items = [
    ...rows.map((r) => ({ k: "m" as const, date: r.date, row: r })),
    ...events.map((e) => ({ k: "e" as const, date: e.date, ev: e })),
  ].sort((a, b) => a.date.localeCompare(b.date) || (a.k === "e" ? 1 : -1));
  let lastMonth = "";

  return (
    <div className="moim-sched">
      <style>{SCHED_CSS}</style>

      <div className="page-head">
        <div><h1 className="page-title">연간 일정</h1><p className="page-sub">{year}년 금요 정기모임 · 모임 {meetN}회 · 예정 {upcoming}회</p></div>
        <div className="page-acts">
          {rows.length > 0 && <button className="ui-btn ui-primary ui-sm" onClick={onSave} disabled={pending}><Save size={16} /> {pending ? "저장 중…" : "저장"}</button>}
          <button className="ui-btn ui-ghost ui-sm" onClick={() => setGenOpen((v) => !v)}><Sparkles size={16} /> 자동 생성</button>
          <label className="ui-btn ui-ghost ui-sm" style={{ cursor: "pointer" }}><Upload size={16} /> 업로드<input type="file" accept=".xlsx,.xls,.csv" onChange={onUpload} hidden /></label>
        </div>
      </div>

      <div className="sched-bar">
        <div className="year-pill"><Calendar size={15} /> {year}년</div>
        <div className="legend">
          <span><i className="lg lg-brand" />오프라인</span><span><i className="lg lg-blue" />온라인</span><span><i className="lg lg-gray" />미정·휴회</span>
        </div>
        <div className="sched-tools">
          {rows.length > 0 && <button className="link-act" onClick={recompute}>회차 재계산</button>}
          {rows.length > 0 && <button className="link-act" onClick={() => downloadXlsx(exportRows(), "연간일정")}><Download size={14} /> 엑셀</button>}
          {rows.length > 0 && <button className="link-act" onClick={() => downloadCsv(exportRows(), "연간일정")}><Download size={14} /> CSV</button>}
          <button className="link-act act-star" onClick={() => setShowEvent((v) => !v)}><Star size={14} /> 이벤트 추가</button>
        </div>
      </div>

      {result && <div className="sched-result">{result}</div>}

      {/* 자동 생성 패널 */}
      {genOpen && (
        <div className="panel">
          <p className="panel-warn">⚠️ 누르면 현재 표를 새로 채웁니다(기존 편집 덮어씀). 평소엔 표에서 회차별로 바로 고치세요.</p>
          <div className="panel-grid">
            <label className="cf"><span className="cf-l">연도</span><input className="inp" type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} /></label>
            <label className="cf"><span className="cf-l">기준 날짜</span><input className="inp" type="date" value={anchorDate} onChange={(e) => setAnchorDate(e.target.value)} /></label>
            <label className="cf"><span className="cf-l">기준 회차</span><input className="inp" type="number" value={anchorSession} onChange={(e) => setAnchorSession(Number(e.target.value))} /></label>
            <label className="cf"><span className="cf-l">기본 식대</span><input className="inp" type="number" value={feeV} onChange={(e) => setFeeV(e.target.value)} placeholder="10000" /></label>
            <label className="cf"><span className="cf-l">입금 안내</span><input className="inp" value={accountV} onChange={(e) => setAccountV(e.target.value)} placeholder="하나 123-456" /></label>
          </div>
          <button className="ui-btn ui-primary ui-sm" onClick={gen}><Sparkles size={16} /> 일정 생성</button>
        </div>
      )}

      {/* 이벤트 추가 폼 */}
      {showEvent && (
        <div className="panel panel-ev">
          <p className="panel-t">★ 특별행사 추가 (한국대회·송년회·봄소풍 등)</p>
          <div className="panel-grid">
            <label className="cf"><span className="cf-l">이벤트명 *</span><input className="inp" value={ev.title} onChange={(e) => setEvF("title", e.target.value)} placeholder="제52차 CBMC 한국대회" /></label>
            <label className="cf"><span className="cf-l">시작 날짜 *</span><input className="inp" type="date" value={ev.date} onChange={(e) => setEvF("date", e.target.value)} /></label>
            <label className="cf"><span className="cf-l">종료 날짜</span><input className="inp" type="date" value={ev.endDate} onChange={(e) => setEvF("endDate", e.target.value)} /></label>
            <label className="cf"><span className="cf-l">종류</span><div className="sel-wrap"><select className="inp sel" value={ev.type} onChange={(e) => setEvF("type", e.target.value)}>{EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select><ChevronDown size={16} /></div></label>
            <label className="cf"><span className="cf-l">장소</span><input className="inp" value={ev.location} onChange={(e) => setEvF("location", e.target.value)} placeholder="EXCO" /></label>
            <label className="cf"><span className="cf-l">링크</span><input className="inp" value={ev.link} onChange={(e) => setEvF("link", e.target.value)} placeholder="https://" /></label>
          </div>
          <button className="ui-btn ui-primary ui-sm" onClick={addEvent} disabled={pending}>이벤트 저장</button>
        </div>
      )}

      {/* 표 */}
      {items.length > 0 ? (
        <div className="card table-card">
          <div className="table-scroll">
            <table className="mtable sched-table">
              <thead><tr><th className="th-name">날짜</th><th>회차</th><th>N째</th><th>형태</th><th>프로그램</th><th>주제</th><th>강사</th><th>비고</th></tr></thead>
              <tbody>
                {items.map((it) => {
                  const m = monthOf(it.date);
                  const header = m !== lastMonth ? ((lastMonth = m), m) : null;
                  const headerRow = header && <tr className="month-row"><td colSpan={8}>{header}</td></tr>;
                  if (it.k === "e") {
                    const e = it.ev;
                    return (
                      <Fragment key={"e" + e.id}>{headerRow}
                        <tr className="event-row">
                          <td className="td-name"><span className="ev-tag">★ 행사</span></td>
                          <td className="nowrap">{wd(e.date)}{e.end_date ? `~${wd(e.end_date)}` : ""}</td>
                          <td colSpan={4}><b className="ev-title">{e.title}</b>{e.type && <span className="ev-type">{e.type}</span>}{e.location && <span className="ev-loc"><MapPin size={12} /> {e.location}</span>}{e.link && <a className="ev-link" href={e.link} target="_blank" rel="noreferrer">링크</a>}</td>
                          <td colSpan={2}><button className="row-del" onClick={() => removeEvent(e.id, e.title)}><Trash2 size={13} /> 삭제</button></td>
                        </tr>
                      </Fragment>
                    );
                  }
                  const r = it.row; const past = r.date < today;
                  return (
                    <Fragment key={r.date}>{headerRow}
                      <tr className={`${past ? "row-past" : ""} ${r.mode === "recess" ? "row-recess" : ""}`}>
                        <td className="td-name"><span className="sc-date">{wd(r.date)}</span>{r.date === today && <span className="today-tag">오늘</span>}</td>
                        <td>{r.session != null ? <span className="mono sc-round">{r.session}회</span> : <span className="fld-empty">—</span>}</td>
                        <td className="muted">{r.nth}</td>
                        <td><div className="inline-sel"><select className="prog-sel mode-sel" value={r.mode} onChange={(e) => setMode(r.date, e.target.value as Mode)}>{MODES.map((mm) => <option key={mm.v} value={mm.v}>{mm.label}</option>)}</select><ChevronDown size={14} /></div></td>
                        <td><div className="inline-sel"><select className="prog-sel" value={r.program} onChange={(e) => setField(r.date, "program", e.target.value)}>{PROGRAMS.map((p) => <option key={p} value={p}>{p || "—"}</option>)}</select><ChevronDown size={14} /></div></td>
                        <td><input className="cell-inp w-topic" value={r.title} onChange={(e) => setField(r.date, "title", e.target.value)} placeholder={past ? "—" : "주제"} /></td>
                        <td><input className="cell-inp w-spk" value={r.speaker} onChange={(e) => setField(r.date, "speaker", e.target.value)} placeholder="강사" /></td>
                        <td className="nowrap sc-note">{r.note}</td>
                      </tr>
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card empty-card">아직 일정이 없어요. <b>자동 생성</b>으로 1년치를 만들거나 <b>이벤트 추가</b>로 행사를 넣어 보세요.</div>
      )}
    </div>
  );
}

const SCHED_CSS = `
.moim-sched{
  --brand:#0066cc; --brand-strong:#0052a8; --brand-soft:#e8f1fc; --brand-softer:#f3f8fe;
  --ink:#16181d; --ink-2:#3d424d; --ink-3:#767d8a; --line:#ecedf0; --bg:#ffffff; --bg-warm:#fafafb;
  --green:#0a7d3f; --warning:#c47d1a;
  --radius-btn:14px; --radius-card:20px;
  --shadow-sm:0 1px 2px rgba(20,24,34,.04), 0 3px 12px rgba(20,24,34,.045);
  color:var(--ink); line-height:1.5; letter-spacing:-0.01em;
}
.moim-sched *{ box-sizing:border-box; }
.moim-sched h1,.moim-sched p{ margin:0; }
.moim-sched .card{ background:var(--bg); border:1px solid var(--line); border-radius:var(--radius-card); box-shadow:var(--shadow-sm); }
.moim-sched .ui-btn{ display:inline-flex; align-items:center; justify-content:center; gap:6px; font-weight:600; border-radius:var(--radius-btn); border:0; cursor:pointer; transition:background .15s; white-space:nowrap; }
.moim-sched .ui-btn:disabled{ opacity:.55; cursor:default; }
.moim-sched .ui-sm{ font-size:13px; padding:9px 14px; }
.moim-sched .ui-primary{ background:var(--brand); color:#fff; box-shadow:0 5px 14px rgba(0,102,204,.22); }
.moim-sched .ui-ghost{ background:#fff; color:var(--ink-2); border:1px solid var(--line); }
.moim-sched .ui-ghost:hover{ background:#f7f8f9; }
.moim-sched .page-head{ display:flex; align-items:flex-end; justify-content:space-between; gap:14px; margin-bottom:16px; flex-wrap:wrap; }
.moim-sched .page-title{ font-size:clamp(21px,5vw,26px); font-weight:800; letter-spacing:-0.04em; }
.moim-sched .page-sub{ color:var(--ink-3); font-size:14px; margin-top:5px; font-weight:500; }
.moim-sched .page-acts{ display:flex; gap:8px; flex-wrap:wrap; }

.moim-sched .sched-bar{ display:flex; align-items:center; gap:12px; flex-wrap:wrap; margin-bottom:14px; }
.moim-sched .year-pill{ display:inline-flex; align-items:center; gap:6px; font-size:14px; font-weight:700; color:var(--ink); background:#fff; border:1px solid var(--line); border-radius:11px; padding:8px 13px; }
.moim-sched .legend{ display:flex; gap:14px; font-size:12.5px; color:var(--ink-3); font-weight:600; flex-wrap:wrap; }
.moim-sched .legend span{ display:inline-flex; align-items:center; gap:5px; }
.moim-sched .lg{ width:9px; height:9px; border-radius:3px; display:inline-block; }
.moim-sched .lg-brand{ background:var(--brand); } .moim-sched .lg-blue{ background:#0b62c4; } .moim-sched .lg-gray{ background:#b8bdc6; }
.moim-sched .sched-tools{ display:flex; gap:12px; flex-wrap:wrap; margin-left:auto; }
.moim-sched .link-act{ display:inline-flex; align-items:center; gap:4px; font-size:13px; font-weight:700; color:var(--ink-3); background:none; border:0; cursor:pointer; }
.moim-sched .link-act:hover{ color:var(--brand); }
.moim-sched .act-star{ color:var(--brand); }
.moim-sched .sched-result{ font-size:14px; font-weight:600; color:var(--ink); background:var(--brand-softer); border:1px solid var(--brand-soft); border-radius:12px; padding:10px 14px; margin-bottom:14px; }

.moim-sched .panel{ border:1px solid var(--line); border-radius:16px; background:#fff; padding:16px; margin-bottom:14px; box-shadow:var(--shadow-sm); }
.moim-sched .panel-ev{ border-color:#bcd6f5; background:var(--brand-softer); }
.moim-sched .panel-warn{ font-size:13px; color:var(--warning); font-weight:600; margin-bottom:12px; }
.moim-sched .panel-t{ font-size:14px; font-weight:800; color:var(--ink-2); margin-bottom:12px; }
.moim-sched .panel-grid{ display:grid; grid-template-columns:repeat(2,1fr); gap:11px; margin-bottom:14px; }
.moim-sched .cf{ display:flex; flex-direction:column; gap:5px; }
.moim-sched .cf-l{ font-size:12px; color:var(--ink-3); font-weight:700; }
.moim-sched .inp{ font-family:inherit; font-size:14px; color:var(--ink); background:#fff; border:1px solid var(--line); border-radius:10px; padding:9px 11px; outline:0; width:100%; }
.moim-sched .inp:focus{ border-color:var(--brand); box-shadow:0 0 0 3px var(--brand-soft); }
.moim-sched .sel-wrap{ position:relative; display:flex; align-items:center; }
.moim-sched .sel-wrap svg{ position:absolute; right:11px; color:var(--ink-3); pointer-events:none; }
.moim-sched .sel{ appearance:none; -webkit-appearance:none; padding-right:32px; cursor:pointer; }

.moim-sched .table-card{ overflow:hidden; }
.moim-sched .table-scroll{ overflow-x:auto; }
.moim-sched .mtable{ width:100%; border-collapse:collapse; font-size:13.5px; }
.moim-sched .sched-table{ min-width:760px; }
.moim-sched .mtable th{ text-align:left; font-weight:700; color:var(--ink-3); font-size:12.5px; padding:12px 12px; border-bottom:1px solid var(--line); white-space:nowrap; background:var(--bg-warm); }
.moim-sched .mtable td{ padding:8px 12px; border-bottom:1px solid var(--line); color:var(--ink-2); vertical-align:middle; }
.moim-sched .th-name,.moim-sched .td-name{ padding-left:16px !important; }
.moim-sched .td-name{ white-space:nowrap; }
.moim-sched .nowrap{ white-space:nowrap; }
.moim-sched .muted{ color:var(--ink-3); }
.moim-sched .mono{ font-variant-numeric:tabular-nums; }
.moim-sched .sc-date{ font-weight:700; color:var(--ink); }
.moim-sched .sc-round{ color:var(--ink-2); font-weight:700; }
.moim-sched .sc-note{ color:var(--warning); font-weight:500; font-size:12.5px; }
.moim-sched .fld-empty{ color:#c2c7cf; }
.moim-sched .row-past{ opacity:.55; }
.moim-sched .row-recess td{ background:var(--bg-warm); }
.moim-sched .today-tag{ font-size:11px; font-weight:800; color:#fff; background:var(--brand); padding:2px 8px; border-radius:999px; margin-left:8px; }
.moim-sched .month-row td{ background:var(--brand-softer); color:var(--brand-strong); font-size:12px; font-weight:800; padding:6px 16px; }
.moim-sched .inline-sel{ position:relative; display:inline-flex; align-items:center; }
.moim-sched .prog-sel{ appearance:none; -webkit-appearance:none; font-family:inherit; font-size:13px; font-weight:700; color:var(--ink-2); background:var(--bg-warm); border:1px solid var(--line); border-radius:9px; padding:6px 26px 6px 11px; cursor:pointer; }
.moim-sched .prog-sel:hover{ border-color:#cdd3db; }
.moim-sched .inline-sel svg{ position:absolute; right:8px; color:var(--ink-3); pointer-events:none; }
.moim-sched .cell-inp{ font-family:inherit; font-size:13px; color:var(--ink); background:#fff; border:1px solid var(--line); border-radius:9px; padding:7px 9px; outline:0; }
.moim-sched .cell-inp:focus{ border-color:var(--brand); box-shadow:0 0 0 3px var(--brand-soft); }
.moim-sched .w-topic{ width:180px; }
.moim-sched .w-spk{ width:120px; }
.moim-sched .event-row td{ background:rgba(0,102,204,.05); }
.moim-sched .ev-tag{ font-size:12px; font-weight:800; color:var(--brand); }
.moim-sched .ev-title{ font-weight:800; color:var(--ink); }
.moim-sched .ev-type{ margin-left:8px; font-size:11px; font-weight:800; color:var(--brand-strong); background:var(--brand-soft); padding:2px 8px; border-radius:999px; }
.moim-sched .ev-loc{ margin-left:8px; font-size:12.5px; color:var(--ink-3); display:inline-flex; align-items:center; gap:3px; }
.moim-sched .ev-link{ margin-left:8px; font-size:12.5px; font-weight:700; color:var(--brand); text-decoration:none; }
.moim-sched .row-del{ display:inline-flex; align-items:center; gap:3px; font-size:12px; font-weight:700; color:#c8392c; background:none; border:0; cursor:pointer; }
.moim-sched .empty-card{ padding:40px 20px; text-align:center; color:var(--ink-3); font-size:15px; }

@media (min-width:760px){ .moim-sched .panel-grid{ grid-template-columns:repeat(5,1fr); } .moim-sched .panel-ev .panel-grid{ grid-template-columns:repeat(3,1fr); } }
`;
