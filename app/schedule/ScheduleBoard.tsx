"use client";

// 연간 일정 — 월별 한눈에 보기 + 각 회차 인라인 편집 + 저장/내보내기/업로드.
// '전체 자동 생성'은 접어두고(처음·연도 새로 짤 때만), 평소엔 표에서 바로 편집.
import { Fragment, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { generateSchedule, renumber, type Row, type Mode } from "@/lib/generateSchedule";
import { parseScheduleXlsx } from "@/lib/parseScheduleXlsx";
import { downloadXlsx, downloadCsv } from "@/lib/exportTable";
import { saveSchedule, createEvent, deleteEvent } from "./actions";

export type ExistingRow = { date: string; session: number | null; mode: string; title: string; speaker: string; note: string };
export type EventRow = { id: string; title: string; date: string; end_date: string | null; type: string | null; location: string | null; link: string | null };

const EVENT_TYPES = ["한국대회", "송년회", "봄소풍", "수련회", "총회", "기타"];

const MODES: { v: Mode; label: string }[] = [
  { v: "online", label: "온라인" }, { v: "offline", label: "오프라인" },
  { v: "recess", label: "휴회" }, { v: "pending", label: "미정" },
];
const DAYS = ["일", "월", "화", "수", "목", "금", "토"];
function wd(date: string) { const d = new Date(date + "T00:00"); return `${d.getMonth() + 1}/${d.getDate()}(${DAYS[d.getDay()]})`; }
function monthOf(date: string) { const d = new Date(date + "T00:00"); return `${d.getFullYear()}년 ${d.getMonth() + 1}월`; }
function nthOf(date: string) { return Math.ceil(new Date(date + "T00:00").getDate() / 7); }

export default function ScheduleBoard({ existing, events, fee, account }: { existing: ExistingRow[]; events: EventRow[]; fee: number | null; account: string | null }) {
  const router = useRouter();
  const [year, setYear] = useState(2026);
  const [anchorDate, setAnchorDate] = useState("2026-05-29");
  const [anchorSession, setAnchorSession] = useState(1385);
  const [feeV, setFeeV] = useState(fee != null ? String(fee) : "");
  const [accountV, setAccountV] = useState(account ?? "");
  const [rows, setRows] = useState<Row[]>(
    existing.map((e) => ({ date: e.date, nth: nthOf(e.date), mode: e.mode as Mode, session: e.session, title: e.title, speaker: e.speaker, note: e.note })),
  );
  const [genOpen, setGenOpen] = useState(existing.length === 0);
  const [result, setResult] = useState("");
  const [pending, startTransition] = useTransition();

  // 특별행사(이벤트)
  const [showEvent, setShowEvent] = useState(false);
  const [ev, setEv] = useState({ title: "", date: "", endDate: "", type: "한국대회", location: "", link: "" });
  const setEvF = (k: keyof typeof ev, v: string) => setEv((s) => ({ ...s, [k]: v }));
  const addEvent = () => startTransition(async () => {
    const res = await createEvent({ title: ev.title, date: ev.date, end_date: ev.endDate || null, type: ev.type, location: ev.location || null, link: ev.link || null });
    if (res.error) { setResult("❌ " + res.error); return; }
    setEv({ title: "", date: "", endDate: "", type: "한국대회", location: "", link: "" });
    setShowEvent(false);
    setResult("✅ 이벤트 추가됨");
    router.refresh();
  });
  const removeEvent = (id: string, title: string) => {
    if (!confirm(`'${title}' 이벤트를 삭제할까요?`)) return;
    startTransition(async () => { await deleteEvent(id); router.refresh(); });
  };

  const gen = () => {
    if (rows.length > 0 && !confirm("현재 표를 자동 생성으로 새로 채웁니다.\n(저장 전까지 DB는 그대로예요) 계속할까요?")) return;
    setRows(generateSchedule(year, anchorDate, anchorSession));
    setResult("자동 생성됨 — 미정(5번째·공휴일)을 정하고 저장하세요");
    setGenOpen(false);
  };
  const setMode = (date: string, mode: Mode) => setRows((prev) => renumber(prev.map((r) => (r.date === date ? { ...r, mode } : r)), anchorDate, anchorSession));
  const setField = (date: string, k: "title" | "speaker", v: string) => setRows((prev) => prev.map((r) => (r.date === date ? { ...r, [k]: v } : r)));
  const recompute = () => setRows((prev) => renumber([...prev], anchorDate, anchorSession));

  const onSave = () => startTransition(async () => {
    const res = await saveSchedule(rows.map((r) => ({ date: r.date, mode: r.mode, session: r.session, title: r.title, speaker: r.speaker, note: r.note })), feeV ? Number(feeV) : null, accountV || null);
    setResult(res.error ? "❌ " + res.error : `✅ 저장 완료 — ${res.count}개 일정`);
  });

  const modeLabel = (m: Mode) => MODES.find((x) => x.v === m)?.label ?? m;
  const exportRows = () => rows.map((r) => ({ 회차: r.session ?? "", 날짜: r.date, 요일: wd(r.date), 모드: modeLabel(r.mode), 주제: r.title, 강사: r.speaker, 비고: r.note }));
  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    try { setRows(parseScheduleXlsx(await file.arrayBuffer())); setResult("파일에서 불러옴 — 확인 후 저장하세요"); }
    catch (err) { setResult("❌ " + (err instanceof Error ? err.message : "읽기 실패")); }
  }

  // 통계
  const meetN = rows.filter((r) => r.mode === "online" || r.mode === "offline").length;
  const onN = rows.filter((r) => r.mode === "online").length;
  const offN = rows.filter((r) => r.mode === "offline").length;
  const recN = rows.filter((r) => r.mode === "recess").length;
  const penN = rows.filter((r) => r.mode === "pending").length;

  const btn = "min-h-[40px] rounded-full border border-line px-4 text-[14px] font-semibold text-ink-soft hover:border-primary hover:text-primary";
  const small = "min-h-[36px] rounded-md border border-line bg-card px-2 text-[13px] outline-none focus:border-primary-focus";

  // 모임 + 이벤트를 날짜순으로 합쳐 월별 렌더
  const items = [
    ...rows.map((r) => ({ k: "m" as const, date: r.date, row: r })),
    ...events.map((e) => ({ k: "e" as const, date: e.date, ev: e })),
  ].sort((a, b) => a.date.localeCompare(b.date) || (a.k === "e" ? 1 : -1));
  let lastMonth = "";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h1 className="text-[22px] font-bold text-ink">연간 일정</h1>
        {rows.length > 0 && (
          <span className="text-[13px] text-ink-soft">
            모임 <b className="text-ink">{meetN}</b>회 (온 {onN} · 오프 {offN}) · 휴회 {recN} · 미정 {penN}
          </span>
        )}
      </div>

      {/* 메인 툴바: 평소 작업 */}
      <div className="flex flex-wrap items-center gap-2">
        {rows.length > 0 && <button onClick={onSave} disabled={pending} className="min-h-[40px] rounded-full bg-primary px-5 text-[14px] font-semibold text-white hover:bg-primary-pressed disabled:opacity-50">{pending ? "저장 중…" : "저장"}</button>}
        {rows.length > 0 && <button onClick={recompute} className={btn}>회차 재계산</button>}
        {rows.length > 0 && <button onClick={() => downloadXlsx(exportRows(), "연간일정")} className={btn}>⬇ 엑셀</button>}
        {rows.length > 0 && <button onClick={() => downloadCsv(exportRows(), "연간일정")} className={btn}>⬇ CSV</button>}
        <label className={`flex cursor-pointer items-center ${btn}`}>⬆ 업로드<input type="file" accept=".xlsx,.xls,.csv" onChange={onUpload} className="hidden" /></label>
        <button onClick={() => setShowEvent((v) => !v)} className="min-h-[40px] rounded-full border border-primary px-4 text-[14px] font-semibold text-primary hover:bg-[rgba(0,102,204,.06)]">★ 이벤트 추가</button>
        {result && <span className="self-center text-[14px] font-semibold text-ink">{result}</span>}
      </div>

      {/* 특별행사(이벤트) 추가 폼 */}
      {showEvent && (
        <div className="rounded-lg border border-primary/40 bg-[rgba(0,102,204,.04)] p-4">
          <p className="mb-2 text-[14px] font-bold text-ink-soft">★ 특별행사 추가 (한국대회·송년회·봄소풍 등)</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div><label className="mb-1 block text-[13px] font-bold text-ink-soft">이벤트명 *</label><input value={ev.title} onChange={(e) => setEvF("title", e.target.value)} placeholder="제52차 CBMC 한국대회" className={small} /></div>
            <div><label className="mb-1 block text-[13px] font-bold text-ink-soft">시작 날짜 *</label><input type="date" value={ev.date} onChange={(e) => setEvF("date", e.target.value)} className={small} /></div>
            <div><label className="mb-1 block text-[13px] font-bold text-ink-soft">종료 날짜 (여러 날이면)</label><input type="date" value={ev.endDate} onChange={(e) => setEvF("endDate", e.target.value)} className={small} /></div>
            <div><label className="mb-1 block text-[13px] font-bold text-ink-soft">종류</label><select value={ev.type} onChange={(e) => setEvF("type", e.target.value)} className={small}>{EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
            <div><label className="mb-1 block text-[13px] font-bold text-ink-soft">장소</label><input value={ev.location} onChange={(e) => setEvF("location", e.target.value)} placeholder="EXCO" className={small} /></div>
            <div><label className="mb-1 block text-[13px] font-bold text-ink-soft">링크</label><input value={ev.link} onChange={(e) => setEvF("link", e.target.value)} placeholder="https://" className={small} /></div>
          </div>
          <button onClick={addEvent} disabled={pending} className="mt-3 min-h-[40px] rounded-full bg-primary px-5 text-[14px] font-semibold text-white hover:bg-primary-pressed disabled:opacity-50">이벤트 저장</button>
        </div>
      )}

      {/* 전체 자동 생성 (접이식 — 처음/특별한 경우만) */}
      <div className="rounded-lg border border-line bg-card">
        <button onClick={() => setGenOpen((v) => !v)} className="flex w-full items-center justify-between px-4 py-3 text-left text-[15px] font-bold text-ink-soft">
          <span>⚙️ 전체 자동 생성 (처음 / 연도 새로 짤 때만)</span>
          <span>{genOpen ? "▲" : "▼"}</span>
        </button>
        {genOpen && (
          <div className="border-t border-line p-4">
            <p className="mb-3 text-[14px] text-warning">⚠️ 누르면 현재 표를 새로 채웁니다(기존 편집 덮어씀). 평소엔 아래 표에서 회차별로 바로 고치세요.</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              <div><label className="mb-1 block text-[13px] font-bold text-ink-soft">연도</label><input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} className={small} /></div>
              <div><label className="mb-1 block text-[13px] font-bold text-ink-soft">기준 날짜</label><input type="date" value={anchorDate} onChange={(e) => setAnchorDate(e.target.value)} className={small} /></div>
              <div><label className="mb-1 block text-[13px] font-bold text-ink-soft">기준 회차</label><input type="number" value={anchorSession} onChange={(e) => setAnchorSession(Number(e.target.value))} className={small} /></div>
              <div><label className="mb-1 block text-[13px] font-bold text-ink-soft">기본 식대</label><input type="number" value={feeV} onChange={(e) => setFeeV(e.target.value)} placeholder="10000" className={small} /></div>
              <div><label className="mb-1 block text-[13px] font-bold text-ink-soft">입금 안내</label><input value={accountV} onChange={(e) => setAccountV(e.target.value)} placeholder="하나 123-456" className={small} /></div>
            </div>
            <button onClick={gen} className="mt-3 min-h-[40px] rounded-full bg-primary px-5 text-[14px] font-semibold text-white hover:bg-primary-pressed">일정 생성</button>
          </div>
        )}
      </div>

      {/* 일정 표 (월별 한눈에) */}
      {items.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-line bg-card">
          <table className="w-full border-collapse text-[14px]">
            <thead>
              <tr className="border-b-[1.5px] border-line text-left">
                {["회차", "날짜", "N째", "모드", "주제", "강사·발제", "비고"].map((h) => (
                  <th key={h} className="whitespace-nowrap px-3 py-2.5 text-[12px] font-bold text-ink-soft">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((it) => {
                const m = monthOf(it.date);
                const header = m !== lastMonth ? ((lastMonth = m), m) : null;
                const headerRow = header && (
                  <tr className="bg-surface-soft"><td colSpan={7} className="px-3 py-1.5 text-[12px] font-bold text-deep">{header}</td></tr>
                );
                if (it.k === "e") {
                  const e = it.ev;
                  return (
                    <Fragment key={"e" + e.id}>
                      {headerRow}
                      <tr className="border-b border-line bg-[rgba(0,102,204,.05)]">
                        <td className="whitespace-nowrap px-3 py-2 text-[13px] font-bold text-primary">★ 행사</td>
                        <td className="whitespace-nowrap px-3 py-2 text-ink">{wd(e.date)}{e.end_date ? `~${wd(e.end_date)}` : ""}</td>
                        <td colSpan={4} className="px-3 py-2">
                          <span className="font-bold text-ink">{e.title}</span>
                          {e.type && <span className="ml-2 rounded-full bg-[rgba(0,102,204,.12)] px-2 py-0.5 text-[11px] font-bold text-primary">{e.type}</span>}
                          {e.location && <span className="ml-2 text-[13px] text-ink-soft">📍 {e.location}</span>}
                          {e.link && <a href={e.link} target="_blank" rel="noreferrer" className="ml-2 text-[13px] font-semibold text-primary hover:underline">링크</a>}
                        </td>
                        <td className="px-3 py-2"><button onClick={() => removeEvent(e.id, e.title)} className="text-[12px] font-bold text-unpaid hover:underline">삭제</button></td>
                      </tr>
                    </Fragment>
                  );
                }
                const r = it.row;
                return (
                  <Fragment key={r.date}>
                    {headerRow}
                    <tr className={`border-b border-line ${r.mode === "recess" ? "bg-surface-soft/50" : ""}`}>
                      <td className="whitespace-nowrap px-3 py-1.5 font-bold text-deep">{r.session != null ? `${r.session}회` : "—"}</td>
                      <td className="whitespace-nowrap px-3 py-1.5 text-ink">{wd(r.date)}</td>
                      <td className="px-3 py-1.5 text-muted">{r.nth}</td>
                      <td className="px-3 py-1.5">
                        <select value={r.mode} onChange={(e) => setMode(r.date, e.target.value as Mode)} className="min-h-[34px] rounded-md border border-line bg-card px-2 text-[13px] font-semibold outline-none focus:border-primary-focus">
                          {MODES.map((mm) => <option key={mm.v} value={mm.v}>{mm.label}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-1.5"><input value={r.title} onChange={(e) => setField(r.date, "title", e.target.value)} placeholder="주제/북토크" className="min-h-[34px] w-[170px] rounded-md border border-line bg-card px-2 text-[13px] outline-none focus:border-primary-focus" /></td>
                      <td className="px-3 py-1.5"><input value={r.speaker} onChange={(e) => setField(r.date, "speaker", e.target.value)} placeholder="발제자" className="min-h-[34px] w-[120px] rounded-md border border-line bg-card px-2 text-[13px] outline-none focus:border-primary-focus" /></td>
                      <td className="whitespace-nowrap px-3 py-1.5 text-[12px] text-warning">{r.note}</td>
                    </tr>
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="rounded-lg border border-line bg-card px-4 py-10 text-center text-[15px] text-ink-soft">
          아직 일정이 없어요. 위 <b>⚙️ 전체 자동 생성</b>으로 1년치를 만들거나 <b>★ 이벤트 추가</b>로 행사를 넣어 보세요.
        </p>
      )}
    </div>
  );
}
