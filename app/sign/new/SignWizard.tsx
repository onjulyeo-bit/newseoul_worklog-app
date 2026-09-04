"use client";

// 새 서명 요청 마법사 — ① PDF 업로드 → ② 서명란 위치 지정(드래그) → ③ 서명자 매핑(회원 검색 / 비회원 직접입력).
//   좌표는 PDF pt(좌하단 원점)로 저장 → 합성(pdf-lib)과 서명자 화면 하이라이트가 같은 값을 씀.
//   '아래로 복제' 로 동의서 표처럼 같은 크기 서명란 13개를 빠르게 만든다.
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { SIGN_CSS } from "../signCss";
import { createSignRequest } from "../actions";
import { loadPdf, measurePages, renderPage, extractPageText, ptToPx, pxToPt, type PageView } from "@/lib/pdfPages";
import { detectSignatureSlots } from "@/lib/pdfDetect";
import type { NewSlot, NewSigner, MemberOpt } from "@/lib/signTypes";

const MAX_PDF = 5 * 1024 * 1024;
type Rect = { left: number; top: number; width: number; height: number };
type Drag = { kind: "draw" | "move" | "resize"; page: number; key?: string; sx: number; sy: number; orig?: Rect };

export default function SignWizard({ members }: { members: MemberOpt[] }) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  // ① 문서
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [expires, setExpires] = useState("");
  const [pdfB64, setPdfB64] = useState("");
  const [fileInfo, setFileInfo] = useState<{ name: string; size: number; pages: number } | null>(null);
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [views, setViews] = useState<PageView[]>([]);
  const [over, setOver] = useState(false);

  // ② 서명란
  const [slots, setSlots] = useState<NewSlot[]>([]);
  const [sel, setSel] = useState<string | null>(null);
  const [drawing, setDrawing] = useState<{ page: number; rect: Rect } | null>(null);
  const [addMode, setAddMode] = useState(false);          // 켜져 있을 때만 문서 위 탭/드래그로 박스 생성 (평소엔 스크롤)
  const [detectMsg, setDetectMsg] = useState("");
  const autoRan = useRef(false);
  const dragRef = useRef<Drag | null>(null);
  const canvasRefs = useRef<Record<number, HTMLCanvasElement | null>>({});
  const rendered = useRef(false);

  // ③ 서명자
  const [signers, setSigners] = useState<Record<string, NewSigner>>({});
  const [onlyTag, setOnlyTag] = useState(true);
  const [q, setQ] = useState<Record<string, string>>({});
  const [manual, setManual] = useState<Record<string, boolean>>({});

  async function onFile(f: File | undefined) {
    setErr("");
    if (!f) return;
    if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) { setErr("PDF 파일만 올릴 수 있어요."); return; }
    if (f.size > MAX_PDF) { setErr(`PDF 가 5MB 를 넘어요 (${(f.size / 1024 / 1024).toFixed(1)}MB). 용량을 줄여서 올려 주세요.`); return; }
    const b64 = await new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).replace(/^data:[^;]*;base64,/, "")); r.onerror = rej; r.readAsDataURL(f); });
    try {
      const d = await loadPdf(b64);
      // 렌더 폭: 화면 폭 기준(최소 320, 최대 720). 숨겨진 탭 등에서 innerWidth 가 0 이어도 음수가 되지 않게.
      const iw = typeof window !== "undefined" && window.innerWidth > 0 ? window.innerWidth : 720;
      const cw = Math.max(320, Math.min(720, iw - 48));
      const v = await measurePages(d, cw);
      setDoc(d); setViews(v); setPdfB64(b64); setFileInfo({ name: f.name, size: f.size, pages: d.numPages });
      setSlots([]); setSel(null); rendered.current = false; autoRan.current = false; setDetectMsg("");
      if (!title) setTitle(f.name.replace(/\.pdf$/i, ""));
    } catch { setErr("PDF 를 읽지 못했어요. 파일이 손상됐거나 암호가 걸려 있을 수 있어요."); }
  }

  // ② 진입 시 페이지 렌더
  useEffect(() => {
    if (step !== 2 || !doc || views.length === 0 || rendered.current) return;
    rendered.current = true;
    (async () => { for (const v of views) { const c = canvasRefs.current[v.idx]; if (c) await renderPage(doc, v, c); } })();
  }, [step, doc, views]);

  // ② 서명란 자동 찾기 — "(서명)" 표시·표의 빈 '서명' 칸. 기존 박스와 겹치는 건 건너뜀.
  async function runDetect(silent = false) {
    if (!doc) return;
    try {
      const found = detectSignatureSlots(await extractPageText(doc));
      const fresh = found.filter((f) => !slots.some((s) => s.page === f.page && Math.abs(s.x - f.x) < 20 && Math.abs(s.y - f.y) < 12));
      if (fresh.length === 0) { setDetectMsg(silent ? "" : (found.length ? "이미 모두 배치되어 있어요." : "자동으로 찾지 못했어요 — [＋ 서명란 추가]로 직접 놓아 주세요.")); return; }
      const base = slots.length;
      setSlots((prev) => [...prev, ...fresh.map((f, i) => ({ key: `s${Date.now().toString(36)}${i}${Math.random().toString(36).slice(2, 5)}`, label: f.label || `서명 ${base + i + 1}`, page: f.page, x: f.x, y: f.y, w: f.w, h: f.h }))]);
      setDetectMsg(`✨ 서명란 ${fresh.length}개를 자동으로 찾았어요. 위치가 맞는지 확인하고, 필요하면 끌어서 조정하세요.`);
    } catch { setDetectMsg(silent ? "" : "자동 찾기에 실패했어요. 직접 놓아 주세요."); }
  }
  useEffect(() => {
    if (step !== 2 || !doc || autoRan.current) return;
    autoRan.current = true;
    if (slots.length === 0) runDetect(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, doc]);

  // ③ 진입 시 라벨=회원이름이면 자동 배정
  useEffect(() => {
    if (step !== 3) return;
    setSigners((prev) => {
      const next = { ...prev };
      for (const s of slots) {
        if (next[s.key]?.name) continue;
        const m = members.find((x) => x.name === s.label.trim());
        if (m) next[s.key] = { slotKey: s.key, member_id: m.id, name: m.name, phone: m.phone };
      }
      return next;
    });
  }, [step, slots, members]);

  // ── 드래그(그리기/이동/크기) ──
  const viewOf = (page: number) => views.find((v) => v.idx === page)!;
  function pos(e: React.PointerEvent, el: HTMLElement) { const r = el.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
  function onPageDown(e: React.PointerEvent<HTMLDivElement>, page: number) {
    if ((e.target as HTMLElement).closest(".box")) return;
    if (!addMode) { setSel(null); return; }                 // 평소엔 스크롤만 (터치에서 박스가 마구 생기던 문제)
    const p = pos(e, e.currentTarget);
    dragRef.current = { kind: "draw", page, sx: p.x, sy: p.y };
    e.currentTarget.setPointerCapture(e.pointerId);
    setSel(null);
  }
  function onBoxDown(e: React.PointerEvent<HTMLElement>, s: NewSlot, resize: boolean) {
    e.stopPropagation();
    const pageEl = e.currentTarget.closest(".place-page") as HTMLElement;
    const p = pos(e, pageEl);
    dragRef.current = { kind: resize ? "resize" : "move", page: s.page, key: s.key, sx: p.x, sy: p.y, orig: ptToPx(viewOf(s.page), s) };
    pageEl.setPointerCapture(e.pointerId);
    setSel(s.key);
  }
  function onPageMove(e: React.PointerEvent<HTMLDivElement>, page: number) {
    const d = dragRef.current; if (!d || d.page !== page) return;
    const p = pos(e, e.currentTarget);
    const v = viewOf(page);
    if (d.kind === "draw") {
      setDrawing({ page, rect: { left: Math.min(d.sx, p.x), top: Math.min(d.sy, p.y), width: Math.abs(p.x - d.sx), height: Math.abs(p.y - d.sy) } });
    } else if (d.orig) {
      const dx = p.x - d.sx, dy = p.y - d.sy;
      const r: Rect = d.kind === "move"
        ? { ...d.orig, left: clamp(d.orig.left + dx, 0, v.width - d.orig.width), top: clamp(d.orig.top + dy, 0, v.height - d.orig.height) }
        : { ...d.orig, width: clamp(d.orig.width + dx, 24, v.width - d.orig.left), height: clamp(d.orig.height + dy, 14, v.height - d.orig.top) };
      setSlots((prev) => prev.map((s) => (s.key === d.key ? { ...s, ...pxToPt(v, r) } : s)));
    }
  }
  function onPageUp(e: React.PointerEvent<HTMLDivElement>, page: number) {
    const d = dragRef.current; dragRef.current = null;
    if (!d || d.page !== page) return;
    if (d.kind === "draw") {
      const v = viewOf(page);
      const key = `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
      const n = slots.length + 1;
      const dragged = drawing && drawing.rect.width > 10 && drawing.rect.height > 8;
      // 탭(거의 안 움직임)이면 기본 크기(150×28pt) 박스를 탭한 자리에 중앙 배치
      const rect: Rect = dragged ? drawing!.rect : (() => { const w = 150 * v.scale, h = 28 * v.scale; return { left: clamp(d.sx - w / 2, 0, v.width - w), top: clamp(d.sy - h / 2, 0, v.height - h), width: w, height: h }; })();
      setSlots((prev) => [...prev, { key, label: `서명 ${n}`, page, ...pxToPt(v, rect) }]);
      setSel(key);
    }
    setDrawing(null);
  }
  function dupBelow() {
    const s = slots.find((x) => x.key === sel); if (!s) return;
    const v = viewOf(s.page); const r = ptToPx(v, s);
    const nr = { ...r, top: Math.min(v.height - r.height, r.top + r.height * 1.12) };
    const key = `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    setSlots((prev) => [...prev, { key, label: `서명 ${prev.length + 1}`, page: s.page, ...pxToPt(v, nr) }]);
    setSel(key);
  }
  function removeSlot(key: string) { setSlots((prev) => prev.filter((s) => s.key !== key)); if (sel === key) setSel(null); setSigners((p) => { const n = { ...p }; delete n[key]; return n; }); }

  // ── ③ 매핑 ──
  const pool = useMemo(() => onlyTag ? members.filter((m) => (m.tags ?? []).includes("증경회장")) : members, [members, onlyTag]);
  function suggest(key: string) {
    const k = (q[key] ?? "").trim();
    const base = k ? members.filter((m) => m.name.includes(k)) : pool;
    return base.slice(0, 8);
  }
  function pick(key: string, m: MemberOpt) { setSigners((p) => ({ ...p, [key]: { slotKey: key, member_id: m.id, name: m.name, phone: m.phone } })); setQ((p) => ({ ...p, [key]: "" })); }
  function unpick(key: string) { setSigners((p) => { const n = { ...p }; delete n[key]; return n; }); }
  function setManualSigner(key: string, name: string, phone: string) { setSigners((p) => ({ ...p, [key]: { slotKey: key, member_id: null, name, phone: phone || null } })); }

  const mappedCount = slots.filter((s) => signers[s.key]?.name?.trim()).length;

  async function submit() {
    setErr("");
    if (mappedCount < slots.length) { setErr(`서명자가 배정되지 않은 서명란이 ${slots.length - mappedCount}개 있어요.`); return; }
    setBusy(true);
    const res = await createSignRequest({ title, description: desc || null, expires_at: expires ? new Date(expires + "T23:59:59").toISOString() : null, pdf_b64: pdfB64, slots, signers: slots.map((s) => signers[s.key]) });
    setBusy(false);
    if (res.error || !res.id) { setErr(res.error ?? "저장 실패"); return; }
    router.push(`/sign/${res.id}`);
  }

  return (
    <div className="moim-sign">
      <style>{SIGN_CSS}</style>
      <div className="page-head"><div><h1 className="page-title">새 서명 요청</h1><p className="page-sub">문서를 올리고 서명란을 지정한 뒤 서명자를 배정하세요.</p></div></div>

      <div className="steps">
        {[["1", "문서 올리기"], ["2", "서명란 지정"], ["3", "서명자 배정"]].map(([n, t], i) => {
          const idx = (i + 1) as 1 | 2 | 3;
          return <div key={n} className={`step ${step === idx ? "on" : step > idx ? "ok" : ""}`}><span className="step-n">{step > idx ? "✓" : n}</span>{t}</div>;
        })}
      </div>

      <div className="card">
        <div className="wz-body">
          {err && <div className="err-box">{err}</div>}

          {step === 1 && (
            <>
              <label className="fld"><span className="flabel">문서 제목</span><input className="inp" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예) 2027 지회장 연임 건의서·동의서" /></label>
              <label className="fld"><span className="flabel">설명 (서명자에게 보임, 선택)</span><textarea className="inp" rows={3} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="예) 2027년 지회장 연임에 동의하시면 본인 서명란에 서명해 주세요." /></label>
              <label className="fld"><span className="flabel">서명 마감일 (선택)</span><input className="inp" type="date" value={expires} onChange={(e) => setExpires(e.target.value)} style={{ maxWidth: 220 }} /><span className="fhint">지나면 링크가 막힙니다. 비워두면 마감 없음.</span></label>
              <div className="fld"><span className="flabel">PDF 문서 (5MB 이하)</span>
                {fileInfo ? (
                  <div className="file-ok">📄 {fileInfo.name} <small>· {fileInfo.pages}쪽 · {(fileInfo.size / 1024).toFixed(0)}KB</small><button className="ui-btn ui-ghost ui-sm" style={{ marginLeft: "auto" }} onClick={() => { setFileInfo(null); setPdfB64(""); setDoc(null); setViews([]); }}>바꾸기</button></div>
                ) : (
                  <label className={`drop ${over ? "over" : ""}`} onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)} onDrop={(e) => { e.preventDefault(); setOver(false); onFile(e.dataTransfer.files?.[0]); }}>
                    📎 PDF 파일을 여기에 끌어다 놓거나 클릭해서 선택<small>연임 서류처럼 글자로 된 PDF 는 보통 수백 KB 입니다</small>
                    <input type="file" accept="application/pdf,.pdf" hidden onChange={(e) => onFile(e.target.files?.[0])} />
                  </label>
                )}
              </div>
            </>
          )}

          {step === 2 && (
            <div className="place-wrap">
              <div>
                <div className="place-hint" style={{ marginBottom: 12 }}>
                  {detectMsg ? <div style={{ marginBottom: 6 }}>{detectMsg}</div> : null}
                  {addMode
                    ? <>➕ <b>추가 모드</b> — 문서에서 서명란이 들어갈 자리를 <b>한 번 탭</b>하면 박스가 생깁니다(끌어서 그려도 됨). 다 놓았으면 <b>[완료]</b>를 누르세요.</>
                    : <>📐 파란 박스가 서명란입니다. 박스는 <b>끌어서 옮기고</b> 오른쪽 아래 손잡이로 크기를 바꿉니다. 빠진 칸은 <b>[＋ 서명란 추가]</b>, 같은 칸이 여러 개면 <b>[아래로 복제]</b>.</>}
                </div>
                <div className="place-doc">
                  {views.map((v) => (
                    <div key={v.idx} className={`place-page ${addMode ? "adding" : ""}`} style={{ width: v.width, height: v.height }}
                      onPointerDown={(e) => onPageDown(e, v.idx)} onPointerMove={(e) => onPageMove(e, v.idx)} onPointerUp={(e) => onPageUp(e, v.idx)} onPointerCancel={(e) => onPageUp(e, v.idx)}>
                      <canvas ref={(el) => { canvasRefs.current[v.idx] = el; }} />
                      {slots.filter((s) => s.page === v.idx).map((s) => {
                        const r = ptToPx(v, s); const n = slots.indexOf(s) + 1;
                        return (
                          <div key={s.key} className={`box ${sel === s.key ? "sel" : ""}`} style={{ left: r.left, top: r.top, width: r.width, height: r.height }} onPointerDown={(e) => onBoxDown(e, s, false)}>
                            <span className="box-tag">{n}. {s.label}</span>
                            <span className="box-hd" onPointerDown={(e) => onBoxDown(e, s, true)} />
                          </div>
                        );
                      })}
                      {drawing && drawing.page === v.idx && <div className="box drawing" style={drawing.rect} />}
                      <span className="place-pageno">{v.idx} / {views.length}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="slot-panel">
                <div className="sec-row"><h2 className="sec-title">서명란 {slots.length}개</h2></div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                  <button className={`ui-btn ${addMode ? "ui-primary" : "ui-ghost"} ui-sm`} onClick={() => setAddMode((v) => !v)}>{addMode ? "✓ 완료" : "＋ 서명란 추가"}</button>
                  <button className="ui-btn ui-ghost ui-sm" onClick={() => runDetect(false)}>✨ 자동 찾기</button>
                  <button className="ui-btn ui-ghost ui-sm" onClick={dupBelow} disabled={!sel}>⤓ 아래로 복제</button>
                  <button className="ui-btn ui-danger ui-sm" onClick={() => sel && removeSlot(sel)} disabled={!sel}>삭제</button>
                </div>
                {slots.length === 0 && <p className="fhint">아직 서명란이 없어요. <b>[✨ 자동 찾기]</b>를 누르거나, <b>[＋ 서명란 추가]</b> 후 문서를 탭해 놓아 주세요.</p>}
                {slots.map((s, i) => (
                  <div key={s.key} className={`slot-row ${sel === s.key ? "sel" : ""}`} onClick={() => setSel(s.key)}>
                    <span className="slot-no">{i + 1}</span>
                    <input className="inp" value={s.label} onClick={(e) => e.stopPropagation()} onChange={(e) => setSlots((prev) => prev.map((x) => (x.key === s.key ? { ...x, label: e.target.value } : x)))} placeholder="라벨 (예: 김세중 / 확인자)" />
                    <span className="slot-pg">{s.page}쪽</span>
                  </div>
                ))}
                {slots.length > 0 && <p className="fhint">라벨에 서명자 이름을 쓰면 다음 단계에서 자동으로 배정돼요.</p>}
              </div>
            </div>
          )}

          {step === 3 && (
            <>
              <div className="sec-row">
                <h2 className="sec-title">서명자 배정 <span className="fhint">({mappedCount}/{slots.length})</span></h2>
                <button className={`chip ${onlyTag ? "on" : ""}`} onClick={() => setOnlyTag((v) => !v)}>증경회장만 보기</button>
              </div>
              {slots.map((s, i) => {
                const g = signers[s.key]; const isManual = manual[s.key] || (g && !g.member_id && !!g.name);
                return (
                  <div key={s.key} className="map-row">
                    <div className="map-top"><span className="slot-no">{i + 1}</span><span className="map-lbl">{s.label}</span><span className="slot-pg">{s.page}쪽</span></div>
                    {g?.name && !isManual ? (
                      <span className="picked">✓ {g.name}{g.phone ? ` · ${g.phone}` : ""}<button onClick={() => unpick(s.key)} aria-label="해제">✕</button></span>
                    ) : isManual ? (
                      <div className="map-pick">
                        <input className="inp" placeholder="이름" value={g?.name ?? ""} onChange={(e) => setManualSigner(s.key, e.target.value, g?.phone ?? "")} />
                        <input className="inp" placeholder="연락처 (선택)" value={g?.phone ?? ""} onChange={(e) => setManualSigner(s.key, g?.name ?? "", e.target.value)} />
                        <button className="chip" onClick={() => { setManual((p) => ({ ...p, [s.key]: false })); unpick(s.key); }}>회원에서 찾기</button>
                      </div>
                    ) : (
                      <>
                        <div className="map-pick">
                          <input className="inp" placeholder="회원 이름 검색" value={q[s.key] ?? ""} onChange={(e) => setQ((p) => ({ ...p, [s.key]: e.target.value }))} />
                          <button className="chip" onClick={() => setManual((p) => ({ ...p, [s.key]: true }))}>비회원 직접 입력</button>
                        </div>
                        <div className="sug">{suggest(s.key).map((m) => <button key={m.id} onClick={() => pick(s.key, m)}>{m.name}</button>)}{suggest(s.key).length === 0 && <span className="fhint">검색 결과가 없어요 — 위 '증경회장만 보기'를 끄거나 비회원으로 입력하세요.</span>}</div>
                      </>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>

        <div className="wz-foot">
          <div>{step > 1 && <button className="ui-btn ui-ghost ui-md" onClick={() => { setErr(""); setStep((s) => (s - 1) as 1 | 2 | 3); }}>← 이전</button>}</div>
          <div style={{ display: "flex", gap: 8 }}>
            {step === 1 && <button className="ui-btn ui-primary ui-md" disabled={!title.trim() || !pdfB64} onClick={() => setStep(2)}>다음: 서명란 지정 →</button>}
            {step === 2 && <button className="ui-btn ui-primary ui-md" disabled={slots.length === 0} onClick={() => setStep(3)}>다음: 서명자 배정 →</button>}
            {step === 3 && <button className="ui-btn ui-primary ui-md" disabled={busy || mappedCount < slots.length} onClick={submit}>{busy ? "만드는 중…" : `서명 요청 만들기 (${slots.length}명)`}</button>}
          </div>
        </div>
      </div>
    </div>
  );
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
