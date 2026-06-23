"use client";

// 연간 일정 ⑤ — 클로드디자인 시안 + 기존 전 기능 유지(자동생성·엑셀·이벤트·인라인편집·저장).
import { Fragment, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { generateSchedule, renumber, type Row, type Mode } from "@/lib/generateSchedule";
import { parseScheduleXlsx } from "@/lib/parseScheduleXlsx";
import { downloadXlsx, downloadCsv } from "@/lib/exportTable";
import { saveSchedule, createEvent, deleteEvent, setMeetingMedia } from "./actions";
import { createClient } from "@/lib/supabase/client";
import { ChevronDown, Sparkles, Save, Upload, Download, Calendar, Star, Trash2, MapPin, Image as ImageIcon, Film, X, Paperclip } from "lucide-react";
import { useCanEdit } from "@/lib/useCanEdit";

export type ExistingRow = { date: string; session: number | null; mode: string; title: string; speaker: string; host: string; verse: string; praise: string; note: string; program: string };
export type EventRow = { id: string; title: string; date: string; end_date: string | null; type: string | null; location: string | null; link: string | null };
export type MediaMap = Record<string, { poster: string | null; posterManual: string | null; recording: string | null }>;

const EVENT_TYPES = ["한국대회", "송년회", "봄소풍", "수련회", "총회", "기타"];
const PROGRAMS = ["", "예배", "포럼", "특강", "회만시", "기도회", "특별행사", "기타"];
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

export default function ScheduleBoard({ existing, events, fee, account, media = {} }: { existing: ExistingRow[]; events: EventRow[]; fee: number | null; account: string | null; media?: MediaMap }) {
  const canEdit = useCanEdit();
  const router = useRouter();
  // 회차별 자료 편집(포스터 직접지정·영상 링크)
  const [mediaDate, setMediaDate] = useState<string | null>(null);
  const [mPoster, setMPoster] = useState("");
  const [mRec, setMRec] = useState("");
  const [mBusy, setMBusy] = useState(false);
  const openMedia = (date: string) => { const md = media[date]; setMediaDate(date); setMPoster(md?.posterManual ?? ""); setMRec(md?.recording ?? ""); };
  async function uploadPoster(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    setMBusy(true);
    const sb = createClient();
    const ext = (f.name.split(".").pop() || "jpg").toLowerCase();
    const path = `poster-${mediaDate}-${Date.now()}.${ext}`;
    const up = await sb.storage.from("posters").upload(path, f, { upsert: true, contentType: f.type });
    if (!up.error) setMPoster(sb.storage.from("posters").getPublicUrl(path).data.publicUrl);
    setMBusy(false);
  }
  async function saveMedia() {
    if (!mediaDate) return;
    setMBusy(true);
    await setMeetingMedia(mediaDate, mPoster || null, mRec || null);
    setMBusy(false); setMediaDate(null); router.refresh();
  }
  const [year, setYear] = useState(2026);
  const [anchorDate, setAnchorDate] = useState("2026-05-29");
  const [anchorSession, setAnchorSession] = useState(1385);
  const [feeV, setFeeV] = useState(fee != null ? String(fee) : "");
  const [accountV, setAccountV] = useState(account ?? "");
  const [rows, setRows] = useState<Row[]>(existing.map((e) => ({ date: e.date, nth: nthOf(e.date), mode: e.mode as Mode, session: e.session, title: e.title, speaker: e.speaker, host: e.host, verse: e.verse, praise: e.praise, note: e.note, program: e.program })));
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
  const setField = (date: string, k: "title" | "speaker" | "host" | "program" | "verse" | "praise", v: string) => setRows((prev) => prev.map((r) => (r.date === date ? { ...r, [k]: v } : r)));
  const recompute = () => setRows((prev) => renumber([...prev], anchorDate, anchorSession));
  const onSave = () => startTransition(async () => {
    const res = await saveSchedule(rows.map((r) => ({ date: r.date, mode: r.mode, session: r.session, title: r.title, speaker: r.speaker, host: r.host, verse: r.verse, praise: r.praise, note: r.note, program: r.program })), feeV ? Number(feeV) : null, accountV || null);
    setResult(res.error ? "❌ " + res.error : `✅ 저장 완료 — ${res.count}개 일정`);
  });
  const exportRows = () => rows.map((r) => ({ 날짜: r.date, 회차: r.session ?? "", 모임형식: r.program, 구분: modeLabelOf(r.mode), "강사(진행자)": r.speaker, "제목(주제)": r.title, 성경본문: r.verse, 찬양: r.praise, 사회자: r.host, 비고: r.note }));
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

  // 회원용 읽기뷰 — 월별 그룹 + 월별 모임 횟수
  type Item = (typeof items)[number];
  const monthGroups: { month: string; list: Item[] }[] = [];
  for (const it of items) {
    const m = monthOf(it.date);
    if (!monthGroups.length || monthGroups[monthGroups.length - 1].month !== m) monthGroups.push({ month: m, list: [] });
    monthGroups[monthGroups.length - 1].list.push(it);
  }

  return (
    <div className="moim-sched">
      <style>{SCHED_CSS}</style>

      <div className="page-head">
        <div><h1 className="page-title">연간 일정</h1><p className="page-sub">{year}년 금요 정기모임 · 모임 {meetN}회 · 예정 {upcoming}회</p></div>
        <div className="page-acts">
          {canEdit && rows.length > 0 && <button className="ui-btn ui-primary ui-sm" onClick={onSave} disabled={pending}><Save size={16} /> {pending ? "저장 중…" : "저장"}</button>}
          {canEdit && <button className="ui-btn ui-ghost ui-sm" onClick={() => setGenOpen((v) => !v)}><Sparkles size={16} /> 자동 생성</button>}
          {canEdit && <label className="ui-btn ui-ghost ui-sm" style={{ cursor: "pointer" }}><Upload size={16} /> 업로드<input type="file" accept=".xlsx,.xls,.csv" onChange={onUpload} hidden /></label>}
        </div>
      </div>

      <div className="sched-bar">
        <div className="year-pill"><Calendar size={15} /> {year}년</div>
        <div className="legend">
          <span><i className="lg lg-brand" />오프라인</span><span><i className="lg lg-blue" />온라인</span><span><i className="lg lg-gray" />미정·휴회</span>
        </div>
        <div className="sched-tools">
          {canEdit && rows.length > 0 && <button className="link-act" onClick={recompute}>회차 재계산</button>}
          {rows.length > 0 && <button className="link-act" onClick={() => downloadXlsx(exportRows(), "연간일정")}><Download size={14} /> 엑셀</button>}
          {rows.length > 0 && <button className="link-act" onClick={() => downloadCsv(exportRows(), "연간일정")}><Download size={14} /> CSV</button>}
          {canEdit && <button className="link-act act-star" onClick={() => setShowEvent((v) => !v)}><Star size={14} /> 이벤트 추가</button>}
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

      {/* 회원용 읽기뷰 — 월별 카드 */}
      {!canEdit && (
        items.length === 0 ? (
          <div className="card empty-card">아직 등록된 일정이 없어요.</div>
        ) : (
          <div className="sc-ro">
            {monthGroups.map(({ month, list }) => {
              const meets = list.filter((x) => x.k === "m" && (x.row.mode === "online" || x.row.mode === "offline")).length;
              return (
                <section key={month} className="sc-mo">
                  <div className="sc-mo-h"><span className="sc-mo-name">{month}</span>{meets > 0 && <span className="sc-mo-cnt">모임 {meets}회</span>}</div>
                  <div className="sc-mo-list">
                    {list.map((it) => {
                      if (it.k === "e") {
                        const e = it.ev;
                        return (
                          <div key={"e" + e.id} className="sc-card sc-ev">
                            <div className="sc-card-date"><span className="sc-ev-star">★</span><span className="sc-d-md">{wd(e.date)}{e.end_date ? `~${wd(e.end_date)}` : ""}</span></div>
                            <div className="sc-card-body">
                              <div className="sc-card-title">{e.title}</div>
                              <div className="sc-card-sub">{[e.type, e.location].filter(Boolean).join(" · ") || "특별행사"}{e.link && <> · <a className="sc-card-link" href={e.link} target="_blank" rel="noreferrer">링크</a></>}</div>
                            </div>
                          </div>
                        );
                      }
                      const r = it.row; const past = r.date < today; const recess = r.mode === "recess"; const pending = r.mode === "pending";
                      return (
                        <div key={r.date} className={`sc-card ${past ? "is-past" : ""} ${r.date === today ? "is-today" : ""}`}>
                          <div className="sc-card-date">
                            <span className="sc-d-md">{wd(r.date)}</span>
                            {r.session != null && <span className="sc-d-no">{r.session}회</span>}
                          </div>
                          <div className="sc-card-body">
                            {recess || pending ? (
                              <div className="sc-card-title sc-muted">{recess ? "휴회" : "미정"}{r.title ? ` · ${r.title}` : ""}{r.note ? ` · ${r.note}` : ""}</div>
                            ) : (
                              <>
                                <div className="sc-tags">
                                  <span className={`sc-tag t-${modeTone(r.mode)}`}>{modeLabelOf(r.mode)}</span>
                                  {r.program && <span className="sc-tag t-prog">{r.program}</span>}
                                </div>
                                <div className="sc-card-title">{r.title || (past ? "—" : "주제 미정")}</div>
                                {(r.speaker || r.host) && <div className="sc-card-sub">{r.speaker && `강사 ${r.speaker}`}{r.speaker && r.host ? " · " : ""}{r.host && `사회 ${r.host}`}</div>}
                                {(media[r.date]?.poster || media[r.date]?.recording) && (
                                  <div className="sc-media">
                                    {media[r.date]?.poster && <a className="sc-mbtn" href={media[r.date]!.poster!} target="_blank" rel="noreferrer"><ImageIcon size={13} /> 포스터</a>}
                                    {media[r.date]?.recording && <a className="sc-mbtn sc-mbtn-vid" href={media[r.date]!.recording!} target="_blank" rel="noreferrer"><Film size={13} /> 영상 보기</a>}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                          {r.date === today && <span className="sc-today-tag">오늘</span>}
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )
      )}

      {/* 표 (운영진 편집용) */}
      {canEdit && (items.length > 0 ? (
        <div className="card table-card">
          <div className="table-scroll">
            <table className="mtable sched-table">
              <thead><tr><th className="th-name">날짜</th><th>회차</th><th>모임형식</th><th>구분</th><th>강사(진행자)</th><th>제목(주제)</th><th>성경본문</th><th>찬양</th><th>사회자</th><th>비고</th></tr></thead>
              <tbody>
                {items.map((it) => {
                  const m = monthOf(it.date);
                  const header = m !== lastMonth ? ((lastMonth = m), m) : null;
                  const headerRow = header && <tr className="month-row"><td colSpan={10}>{header}</td></tr>;
                  if (it.k === "e") {
                    const e = it.ev;
                    return (
                      <Fragment key={"e" + e.id}>{headerRow}
                        <tr className="event-row">
                          <td className="td-name"><span className="ev-tag">★ 행사</span></td>
                          <td className="nowrap">{wd(e.date)}{e.end_date ? `~${wd(e.end_date)}` : ""}</td>
                          <td colSpan={6}><b className="ev-title">{e.title}</b>{e.type && <span className="ev-type">{e.type}</span>}{e.location && <span className="ev-loc"><MapPin size={12} /> {e.location}</span>}{e.link && <a className="ev-link" href={e.link} target="_blank" rel="noreferrer">링크</a>}</td>
                          <td colSpan={2}>{canEdit && <button className="row-del" onClick={() => removeEvent(e.id, e.title)}><Trash2 size={13} /> 삭제</button>}</td>
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
                        <td><div className="inline-sel"><select className="prog-sel" value={r.program} onChange={(e) => setField(r.date, "program", e.target.value)}>{PROGRAMS.map((p) => <option key={p} value={p}>{p || "—"}</option>)}</select><ChevronDown size={14} /></div></td>
                        <td><div className="inline-sel"><select className="prog-sel mode-sel" value={r.mode} onChange={(e) => setMode(r.date, e.target.value as Mode)}>{MODES.map((mm) => <option key={mm.v} value={mm.v}>{mm.label}</option>)}</select><ChevronDown size={14} /></div></td>
                        <td><input className="cell-inp w-spk" value={r.speaker} onChange={(e) => setField(r.date, "speaker", e.target.value)} placeholder="강사" /></td>
                        <td><input className="cell-inp w-topic" value={r.title} onChange={(e) => setField(r.date, "title", e.target.value)} placeholder={past ? "—" : "주제"} /></td>
                        <td><input className="cell-inp w-verse" value={r.verse} onChange={(e) => setField(r.date, "verse", e.target.value)} placeholder="행 9:10-22" /></td>
                        <td><input className="cell-inp w-praise" value={r.praise} onChange={(e) => setField(r.date, "praise", e.target.value)} placeholder="찬양곡" /></td>
                        <td><input className="cell-inp w-spk" value={r.host} onChange={(e) => setField(r.date, "host", e.target.value)} placeholder="사회자" /></td>
                        <td className="nowrap sc-note">
                          <div className="sc-note-cell">
                            <span>{r.note}</span>
                            <button className="sc-media-btn" onClick={() => openMedia(r.date)} title="포스터·영상 자료">
                              <Paperclip size={12} /> 자료
                              {(media[r.date]?.poster || media[r.date]?.recording) && <span className="sc-media-dot" />}
                            </button>
                          </div>
                        </td>
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
      ))}

      {/* 회차 자료 편집 모달 */}
      {canEdit && mediaDate && (
        <div className="sc-modal-root" onClick={mBusy ? undefined : () => setMediaDate(null)}>
          <div className="sc-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sc-modal-head">
              <div className="sc-modal-t">{wd(mediaDate)} 자료</div>
              <button className="sc-modal-x" onClick={() => setMediaDate(null)} disabled={mBusy}><X size={19} /></button>
            </div>
            <div className="sc-modal-body">
              <label className="sc-f-l">포스터</label>
              {mPoster ? (
                // eslint-disable-next-line @next/next/no-img-element
                <div className="sc-poster-prev"><img src={mPoster} alt="포스터" /><button className="link-act" onClick={() => setMPoster("")}>제거</button></div>
              ) : media[mediaDate]?.poster ? (
                <p className="sc-f-hint">공지 포스터가 자동으로 표시됩니다. 직접 지정하려면 아래에서 업로드하세요.</p>
              ) : (
                <p className="sc-f-hint">해당 주차 공지에 포스터가 있으면 자동 표시됩니다. 없으면 직접 업로드하세요.</p>
              )}
              <label className="ui-btn ui-ghost ui-sm" style={{ cursor: "pointer", marginTop: 6 }}><ImageIcon size={15} /> 포스터 업로드(직접 지정)<input type="file" accept="image/*" hidden onChange={uploadPoster} /></label>

              <label className="sc-f-l" style={{ marginTop: 16 }}>영상 링크 (유튜브 미등록 등)</label>
              <input className="inp" value={mRec} onChange={(e) => setMRec(e.target.value)} placeholder="https://youtu.be/..." />
              <p className="sc-f-hint">녹화 영상은 유튜브에 ‘미등록’으로 올린 뒤 링크만 붙여넣으세요(용량 0).</p>
            </div>
            <div className="sc-modal-foot">
              <button className="ui-btn ui-ghost ui-sm" onClick={() => setMediaDate(null)} disabled={mBusy}>취소</button>
              <button className="ui-btn ui-primary ui-sm" onClick={saveMedia} disabled={mBusy}>{mBusy ? "저장 중…" : "저장"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const SCHED_CSS = `
.moim-sched{
  --brand:#003ecc; --brand-strong:#0032a8; --brand-soft:#e8f1fc; --brand-softer:#f3f8fe;
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
.moim-sched .lg-brand{ background:var(--brand); } .moim-sched .lg-blue{ background:#003ecc; } .moim-sched .lg-gray{ background:#b8bdc6; }
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
.moim-sched .sched-table{ min-width:1080px; }
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

/* 회원용 읽기뷰 — 월별 카드 */
.moim-sched .sc-ro{ display:flex; flex-direction:column; gap:22px; }
.moim-sched .sc-mo-h{ display:flex; align-items:baseline; gap:10px; margin-bottom:11px; padding-bottom:8px; border-bottom:2px solid var(--brand-soft); position:sticky; top:0; background:var(--bg-warm,#fafafb); z-index:1; }
.moim-sched .sc-mo-name{ font-size:18px; font-weight:800; letter-spacing:-0.03em; color:var(--ink); }
.moim-sched .sc-mo-cnt{ font-size:12.5px; font-weight:700; color:var(--brand); }
.moim-sched .sc-mo-list{ display:flex; flex-direction:column; gap:9px; }
.moim-sched .sc-card{ display:flex; gap:14px; align-items:flex-start; background:var(--bg); border:1px solid var(--line); border-radius:14px; padding:13px 15px; box-shadow:var(--shadow-sm); position:relative; }
.moim-sched .sc-card.is-past{ opacity:.62; }
.moim-sched .sc-card.is-today{ border-color:var(--brand); box-shadow:0 0 0 3px var(--brand-soft); opacity:1; }
.moim-sched .sc-card-date{ flex:none; width:74px; display:flex; flex-direction:column; gap:3px; }
.moim-sched .sc-d-md{ font-size:14px; font-weight:800; color:var(--ink); white-space:nowrap; }
.moim-sched .sc-d-no{ font-size:11.5px; font-weight:700; color:var(--ink-3); }
.moim-sched .sc-card-body{ flex:1; min-width:0; }
.moim-sched .sc-tags{ display:flex; flex-wrap:wrap; gap:5px; margin-bottom:5px; }
.moim-sched .sc-tag{ font-size:11px; font-weight:800; padding:2px 8px; border-radius:999px; }
.moim-sched .sc-tag.t-brand{ background:var(--brand-soft); color:var(--brand-strong); }
.moim-sched .sc-tag.t-blue{ background:#e9f0ff; color:#1e40af; }
.moim-sched .sc-tag.t-gray{ background:#eff0f2; color:#6b717c; }
.moim-sched .sc-tag.t-prog{ background:#f0eefb; color:#5b3da8; }
.moim-sched .sc-card-title{ font-size:15px; font-weight:700; color:var(--ink); letter-spacing:-0.02em; line-height:1.4; }
.moim-sched .sc-card-title.sc-muted{ color:var(--ink-3); font-weight:600; }
.moim-sched .sc-card-sub{ font-size:12.5px; color:var(--ink-3); margin-top:3px; font-weight:500; }
.moim-sched .sc-card-link{ color:var(--brand); font-weight:700; text-decoration:none; }
.moim-sched .sc-ev{ background:#fffaf2; border-color:#f3e2c4; }
.moim-sched .sc-ev-star{ color:#d99a17; font-size:15px; font-weight:800; }
.moim-sched .sc-today-tag{ position:absolute; top:11px; right:13px; font-size:10.5px; font-weight:800; color:#fff; background:var(--brand); padding:2px 8px; border-radius:999px; }
.moim-sched .sc-media{ display:flex; gap:7px; margin-top:9px; flex-wrap:wrap; }
.moim-sched .sc-mbtn{ display:inline-flex; align-items:center; gap:5px; font-size:12px; font-weight:700; padding:5px 11px; border-radius:999px; text-decoration:none; background:var(--brand-soft); color:var(--brand-strong); }
.moim-sched .sc-mbtn-vid{ background:#fdeeee; color:#c0392b; }

/* 관리자 자료 버튼 */
.moim-sched .sc-note-cell{ display:flex; align-items:center; gap:8px; justify-content:space-between; }
.moim-sched .sc-media-btn{ display:inline-flex; align-items:center; gap:4px; font-size:11.5px; font-weight:700; color:var(--ink-3); background:#f5f6f8; border:1px solid var(--line); border-radius:8px; padding:4px 8px; cursor:pointer; white-space:nowrap; position:relative; }
.moim-sched .sc-media-btn:hover{ color:var(--brand); border-color:#cdddf7; background:#f5f9ff; }
.moim-sched .sc-media-dot{ width:6px; height:6px; border-radius:50%; background:var(--green); }

/* 자료 모달 */
.moim-sched .sc-modal-root{ position:fixed; inset:0; z-index:70; background:rgba(20,24,34,.4); backdrop-filter:blur(2px); display:flex; align-items:center; justify-content:center; padding:16px; }
.moim-sched .sc-modal{ width:100%; max-width:420px; max-height:90vh; display:flex; flex-direction:column; background:#fff; border-radius:18px; overflow:hidden; box-shadow:0 20px 60px rgba(20,30,60,.3); }
.moim-sched .sc-modal-head{ display:flex; align-items:center; justify-content:space-between; padding:15px 18px; border-bottom:1px solid var(--line); }
.moim-sched .sc-modal-t{ font-size:16px; font-weight:800; letter-spacing:-0.02em; }
.moim-sched .sc-modal-x{ width:32px; height:32px; border:0; background:none; color:var(--ink-3); border-radius:9px; cursor:pointer; display:grid; place-items:center; }
.moim-sched .sc-modal-x:hover{ background:#f1f2f4; }
.moim-sched .sc-modal-body{ padding:18px; overflow-y:auto; }
.moim-sched .sc-f-l{ display:block; font-size:12.5px; font-weight:700; color:var(--ink-2); margin-bottom:6px; }
.moim-sched .sc-f-hint{ font-size:12px; color:var(--ink-3); margin-top:7px; line-height:1.5; }
.moim-sched .sc-poster-prev{ display:flex; align-items:flex-start; gap:10px; }
.moim-sched .sc-poster-prev img{ width:90px; border-radius:10px; border:1px solid var(--line); }
.moim-sched .sc-modal-foot{ display:flex; justify-content:flex-end; gap:8px; padding:14px 18px; border-top:1px solid var(--line); }
.moim-sched .inline-sel{ position:relative; display:inline-flex; align-items:center; }
.moim-sched .prog-sel{ appearance:none; -webkit-appearance:none; font-family:inherit; font-size:13px; font-weight:700; color:var(--ink-2); background:var(--bg-warm); border:1px solid var(--line); border-radius:9px; padding:6px 26px 6px 11px; cursor:pointer; }
.moim-sched .prog-sel:hover{ border-color:#cdd3db; }
.moim-sched .inline-sel svg{ position:absolute; right:8px; color:var(--ink-3); pointer-events:none; }
.moim-sched .cell-inp{ font-family:inherit; font-size:13px; color:var(--ink); background:#fff; border:1px solid var(--line); border-radius:9px; padding:7px 9px; outline:0; }
.moim-sched .cell-inp:focus{ border-color:var(--brand); box-shadow:0 0 0 3px var(--brand-soft); }
.moim-sched .w-topic{ width:170px; }
.moim-sched .w-spk{ width:104px; }
.moim-sched .w-verse{ width:108px; }
.moim-sched .w-praise{ width:120px; }
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
