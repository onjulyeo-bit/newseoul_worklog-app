"use client";

// 서명자 화면 — 토큰 링크로 들어와 문서를 보고 본인 서명란에 서명 (로그인 불필요).
//   흐름(사양서 §2): 문서 미리보기(내 서명란 하이라이트) → [서명하기] 전체화면 패드 → 동의 체크 → 완료.
//   데이터: sign_fetch(메타+슬롯) · sign_mark_viewed · sign_fetch_pdf(base64) 토큰 RPC.
//   제출: POST /api/sign/[token] (서버가 IP·UA 첨부 → sign_submit RPC). service_role 없음.
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import SignaturePad from "signature_pad";

type Meta = {
  signer_id: string; signer_name: string; signer_status: string; signed_at: string | null;
  request_id: string; req_title: string; req_description: string | null; req_status: string; expires_at: string | null;
  source_pdf_path: string | null;
  slot_page: number; slot_x: number; slot_y: number; slot_w: number; slot_h: number; slot_label: string;
};
type PageView = { idx: number; width: number; height: number; scale: number; ptH: number };

const MAX_B64 = 280_000;

function fmtDT(s: string | null) {
  if (!s) return "";
  const d = new Date(s);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

// 서명 캔버스에서 실제 잉크 영역만 잘라내기(여백 제거) → 서명란에 꽉 차게 합성됨.
function trimCanvas(src: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = src.getContext("2d")!;
  const { width, height } = src;
  const img = ctx.getImageData(0, 0, width, height).data;
  let minX = width, minY = height, maxX = -1, maxY = -1;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    if (img[(y * width + x) * 4 + 3] > 10) { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
  }
  if (maxX < 0) return src;
  const pad = 8;
  minX = Math.max(0, minX - pad); minY = Math.max(0, minY - pad);
  maxX = Math.min(width - 1, maxX + pad); maxY = Math.min(height - 1, maxY + pad);
  const out = document.createElement("canvas");
  out.width = maxX - minX + 1; out.height = maxY - minY + 1;
  out.getContext("2d")!.drawImage(src, minX, minY, out.width, out.height, 0, 0, out.width, out.height);
  return out;
}

export default function SignClient({ token }: { token: string }) {
  const [supabase] = useState(() => createClient());
  const [meta, setMeta] = useState<Meta | null>(null);
  const [err, setErr] = useState<"invalid" | "pdf" | null>(null);
  const [pages, setPages] = useState<PageView[]>([]);
  const [pdfReady, setPdfReady] = useState(false);
  const [done, setDone] = useState(false);
  const [padOpen, setPadOpen] = useState(false);
  const [padEmpty, setPadEmpty] = useState(true);
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [signedAt, setSignedAt] = useState<string | null>(null);

  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRefs = useRef<Record<number, HTMLCanvasElement | null>>({});
  const padCanvasRef = useRef<HTMLCanvasElement>(null);
  const padRef = useRef<SignaturePad | null>(null);
  const slotRef = useRef<HTMLDivElement>(null);

  // 1) 메타 조회 → 열람 기록 → PDF 내려받아 렌더
  useEffect(() => {
    let alive = true;
    (async () => {
      const { data, error } = await supabase.rpc("sign_fetch", { p_token: token });
      if (!alive) return;
      const m = (data as Meta[] | null)?.[0];
      if (error || !m) { setErr("invalid"); return; }
      setMeta(m);
      if (m.signer_status === "signed") { setDone(true); setSignedAt(m.signed_at); }
      else supabase.rpc("sign_mark_viewed", { p_token: token }).then(() => {});

      const pdf = await supabase.rpc("sign_fetch_pdf", { p_token: token });
      if (!alive) return;
      const b64 = pdf.data as string | null;
      if (pdf.error || !b64) { setErr("pdf"); return; }
      try { await renderPdf(b64, m); } catch { if (alive) setErr("pdf"); }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function renderPdf(b64: string, m: Meta) {
    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const doc = await pdfjs.getDocument({ data: bytes }).promise;

    const cw = Math.min(wrapRef.current?.clientWidth ?? 420, 760) - 2;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const views: PageView[] = [];
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const base = page.getViewport({ scale: 1 });
      const scale = cw / base.width;
      views.push({ idx: i, width: Math.round(base.width * scale), height: Math.round(base.height * scale), scale, ptH: base.height });
    }
    setPages(views);
    // 캔버스가 마운트된 뒤 그리기
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    for (const v of views) {
      const canvas = canvasRefs.current[v.idx];
      if (!canvas) continue;
      const page = await doc.getPage(v.idx);
      const vp = page.getViewport({ scale: v.scale * dpr });
      canvas.width = vp.width; canvas.height = vp.height;
      canvas.style.width = `${v.width}px`; canvas.style.height = `${v.height}px`;
      await page.render({ canvas, viewport: vp }).promise;
    }
    setPdfReady(true);
    void m;
  }

  // 내 서명란 위치(PDF pt, 좌하단 원점) → 화면 픽셀(좌상단 원점)
  function slotStyle(v: PageView) {
    if (!meta) return {};
    return {
      left: meta.slot_x * v.scale,
      top: (v.ptH - meta.slot_y - meta.slot_h) * v.scale,
      width: meta.slot_w * v.scale,
      height: meta.slot_h * v.scale,
    };
  }

  // 2) 서명 패드 열기/리사이즈
  function openPad() {
    setPadOpen(true); setAgreed(false); setPadEmpty(true);
    requestAnimationFrame(() => {
      const c = padCanvasRef.current; if (!c) return;
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      c.width = c.offsetWidth * ratio; c.height = c.offsetHeight * ratio;
      c.getContext("2d")!.scale(ratio, ratio);
      padRef.current?.off();
      const pad = new SignaturePad(c, { penColor: "#111318", minWidth: 1.2, maxWidth: 3.2, throttle: 8 });
      pad.addEventListener("endStroke", () => setPadEmpty(pad.isEmpty()));
      padRef.current = pad;
    });
  }
  function clearPad() { padRef.current?.clear(); setPadEmpty(true); }
  function closePad() { padRef.current?.off(); padRef.current = null; setPadOpen(false); }

  // 3) 제출
  async function submit() {
    const pad = padRef.current; const c = padCanvasRef.current;
    if (!pad || !c || pad.isEmpty() || !agreed || busy) return;
    setBusy(true);
    try {
      const trimmed = trimCanvas(c);
      let b64 = trimmed.toDataURL("image/png").replace(/^data:image\/png;base64,/, "");
      // 너무 크면 축소 재인코딩 (한도 200KB)
      if (b64.length > MAX_B64) {
        const small = document.createElement("canvas");
        const f = Math.sqrt(MAX_B64 / b64.length) * 0.9;
        small.width = Math.max(200, Math.round(trimmed.width * f)); small.height = Math.max(80, Math.round(trimmed.height * f));
        small.getContext("2d")!.drawImage(trimmed, 0, 0, small.width, small.height);
        b64 = small.toDataURL("image/png").replace(/^data:image\/png;base64,/, "");
      }
      const res = await fetch(`/api/sign/${encodeURIComponent(token)}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ signature: b64 }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) { alert(j.error || "저장 중 문제가 생겼어요."); setBusy(false); return; }
      setSignedAt(new Date().toISOString());
      setDone(true); closePad();
    } catch { alert("저장 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요."); }
    setBusy(false);
  }

  const mySlotPage = meta?.slot_page ?? -1;

  return (
    <div className="moim-sg">
      <style>{SG_CSS}</style>
      <div className="sg-phone">
        <div className="sg-head">
          <div className="sg-brand"><span className="brand-badge">ON</span><span className="brand-name">새서울 <span className="brand-on">CBMC</span></span></div>
          {meta && (
            <>
              <h1 className="sg-title">{meta.req_title}</h1>
              {meta.req_description && <p className="sg-desc">{meta.req_description}</p>}
              <div className="sg-who"><span className="sg-who-l">서명자</span><strong>{meta.signer_name}</strong>{meta.slot_label && meta.slot_label !== meta.signer_name && <span className="sg-slot-lbl">{meta.slot_label}</span>}</div>
            </>
          )}
        </div>

        {err === "invalid" ? (
          <div className="sg-err">링크가 올바르지 않거나 만료되었어요.<br />안내받은 링크로 다시 들어와 주세요. 🙏</div>
        ) : !meta ? (
          <div className="sg-loading">문서를 불러오는 중…</div>
        ) : (
          <>
            {done && (
              <div className="sg-done">
                <div className="sg-done-ic"><CheckIcon size={30} /></div>
                <div><div className="sg-done-t">서명이 저장되었습니다</div><div className="sg-done-s">{meta.signer_name} 님 · {fmtDT(signedAt)}</div></div>
              </div>
            )}

            <div className="sg-doc" ref={wrapRef}>
              {err === "pdf" ? (
                <div className="sg-err">문서를 표시하지 못했어요. 잠시 후 다시 열어 주세요.</div>
              ) : !pdfReady && pages.length === 0 ? (
                <div className="sg-loading">문서를 준비하는 중…</div>
              ) : null}
              {pages.map((v) => (
                <div key={v.idx} className="sg-page" style={{ width: v.width, height: v.height }}>
                  <canvas ref={(el) => { canvasRefs.current[v.idx] = el; }} />
                  {v.idx === mySlotPage && (
                    <div ref={slotRef} className={`sg-slot ${done ? "signed" : ""}`} style={slotStyle(v)}>
                      <span className="sg-slot-tag">{done ? "서명 완료" : "여기에 서명"}</span>
                    </div>
                  )}
                  <span className="sg-pageno">{v.idx} / {pages.length}</span>
                </div>
              ))}
            </div>

            {!done && (
              <div className="sg-bar">
                <button className="sg-cta" onClick={openPad} disabled={!pdfReady && err !== "pdf"}>서명하기</button>
                <div className="sg-bar-hint">{pdfReady ? `${mySlotPage}쪽 서명란에 들어갑니다` : "문서 준비 중…"}</div>
              </div>
            )}
            {done && <div className="sg-foot">감사합니다 · 새서울 CBMC</div>}
          </>
        )}
      </div>

      {padOpen && (
        <div className="sg-pad-root">
          <div className="sg-pad-top">
            <button className="sg-pad-x" onClick={closePad} aria-label="닫기"><XIcon /></button>
            <div className="sg-pad-t">{meta?.signer_name} 님 서명</div>
            <button className="sg-pad-clear" onClick={clearPad}>지우기</button>
          </div>
          <div className="sg-pad-area">
            <canvas ref={padCanvasRef} className="sg-pad-canvas" />
            {padEmpty && <div className="sg-pad-ph">여기에 손가락으로 서명해 주세요<br /><small>폰을 가로로 돌리면 더 편해요</small></div>}
            <div className="sg-pad-line" />
          </div>
          <div className="sg-pad-bottom">
            <label className="sg-agree"><input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} /><span>본인은 위 문서 내용에 동의하며 서명합니다.</span></label>
            <button className="sg-cta" onClick={submit} disabled={padEmpty || !agreed || busy}>{busy ? "저장 중…" : "서명 완료"}</button>
          </div>
        </div>
      )}
    </div>
  );
}

const XIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>;
const CheckIcon = ({ size = 15 }: { size?: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>;

const SG_CSS = `
.moim-sg{
  --brand:#003ecc; --brand-strong:#0032a8; --brand-soft:#e8f1fc; --brand-softer:#f3f8fe;
  --ink:#16181d; --ink-2:#3d424d; --ink-3:#767d8a; --line:#ecedf0; --bg:#ffffff; --bg-warm:#fafafb;
  --green:#0a7d3f; --green-soft:#e4f6ec; --amber:#b45309; --amber-soft:#fff4e0;
  width:100vw; position:relative; left:50%; right:50%; margin-left:-50vw; margin-right:-50vw; margin-top:-24px; margin-bottom:-80px;
  min-height:100vh; background:var(--bg-warm); color:var(--ink); line-height:1.5; letter-spacing:-0.01em;
  display:flex; flex-direction:column; align-items:center; font-family:inherit;
}
.moim-sg *{ box-sizing:border-box; }
.moim-sg .sg-phone{ width:100%; max-width:780px; background:#fff; display:flex; flex-direction:column; min-height:100vh; padding-bottom:96px; }
.moim-sg .sg-head{ padding:18px 20px 14px; border-bottom:1px solid var(--line); }
.moim-sg .sg-brand{ display:inline-flex; align-items:center; gap:8px; font-weight:800; font-size:16px; letter-spacing:-0.03em; margin-bottom:14px; }
.moim-sg .brand-badge{ width:26px; height:26px; border-radius:9px; display:grid; place-items:center; background:var(--brand); color:#fff; font-size:12px; font-weight:800; box-shadow:0 3px 9px rgba(0,102,204,.32); }
.moim-sg .brand-on{ color:var(--brand); }
.moim-sg .sg-title{ font-size:22px; font-weight:800; letter-spacing:-0.04em; line-height:1.3; margin:0; }
.moim-sg .sg-desc{ font-size:14px; color:var(--ink-3); font-weight:500; margin:8px 0 0; line-height:1.55; white-space:pre-wrap; }
.moim-sg .sg-who{ display:flex; align-items:center; gap:8px; margin-top:12px; font-size:14px; }
.moim-sg .sg-who-l{ color:var(--ink-3); font-weight:600; }
.moim-sg .sg-who strong{ font-weight:800; font-size:15px; }
.moim-sg .sg-slot-lbl{ font-size:11.5px; font-weight:700; color:var(--brand-strong); background:var(--brand-soft); padding:3px 9px; border-radius:999px; }

.moim-sg .sg-loading,.moim-sg .sg-err{ padding:44px 20px; text-align:center; color:var(--ink-3); font-size:15px; font-weight:500; line-height:1.6; }
.moim-sg .sg-err{ margin:20px; background:var(--bg-warm); border:1px solid var(--line); border-radius:16px; }

.moim-sg .sg-done{ display:flex; align-items:center; gap:14px; margin:16px 20px 0; padding:16px 18px; background:var(--green-soft); border:1px solid #bfe6cd; border-radius:16px; }
.moim-sg .sg-done-ic{ width:48px; height:48px; border-radius:50%; background:var(--green); color:#fff; display:grid; place-items:center; flex-shrink:0; }
.moim-sg .sg-done-t{ font-weight:800; font-size:16px; letter-spacing:-0.03em; color:var(--green); }
.moim-sg .sg-done-s{ font-size:13px; color:var(--ink-2); font-weight:600; margin-top:2px; }

.moim-sg .sg-doc{ padding:16px 0 8px; display:flex; flex-direction:column; align-items:center; gap:14px; background:#eef0f3; margin-top:14px; }
.moim-sg .sg-page{ position:relative; background:#fff; box-shadow:0 2px 10px rgba(20,24,34,.12); }
.moim-sg .sg-page canvas{ display:block; }
.moim-sg .sg-pageno{ position:absolute; right:8px; bottom:6px; font-size:11px; color:var(--ink-3); font-weight:600; background:rgba(255,255,255,.8); padding:2px 6px; border-radius:6px; }
.moim-sg .sg-slot{ position:absolute; border:2.5px dashed var(--brand); background:rgba(0,62,204,.08); border-radius:6px; animation:sg-pulse 1.6s ease-in-out infinite; }
.moim-sg .sg-slot.signed{ border-style:solid; border-color:var(--green); background:rgba(10,125,63,.08); animation:none; }
.moim-sg .sg-slot-tag{ position:absolute; left:-2px; top:-24px; font-size:11.5px; font-weight:800; color:#fff; background:var(--brand); padding:3px 9px; border-radius:7px; white-space:nowrap; }
.moim-sg .sg-slot.signed .sg-slot-tag{ background:var(--green); }
@keyframes sg-pulse{ 0%,100%{ box-shadow:0 0 0 0 rgba(0,62,204,.35);} 50%{ box-shadow:0 0 0 7px rgba(0,62,204,0);} }

.moim-sg .sg-bar{ position:fixed; left:0; right:0; bottom:0; z-index:60; background:#fff; border-top:1px solid var(--line); padding:12px 20px calc(12px + env(safe-area-inset-bottom)); display:flex; flex-direction:column; align-items:center; gap:6px; }
.moim-sg .sg-cta{ width:100%; max-width:740px; padding:16px; background:var(--brand); color:#fff; font-size:17px; font-weight:800; border:0; border-radius:14px; cursor:pointer; letter-spacing:-0.02em; box-shadow:0 6px 18px rgba(0,62,204,.25); }
.moim-sg .sg-cta:disabled{ background:#c5cad3; box-shadow:none; cursor:default; }
.moim-sg .sg-bar-hint{ font-size:12px; color:var(--ink-3); font-weight:600; }
.moim-sg .sg-foot{ text-align:center; font-size:12px; color:var(--ink-3); padding:24px 20px 40px; font-weight:500; }

.moim-sg .sg-pad-root{ position:fixed; inset:0; z-index:80; background:#fff; display:flex; flex-direction:column; }
.moim-sg .sg-pad-top{ display:flex; align-items:center; gap:10px; padding:12px 14px; border-bottom:1px solid var(--line); }
.moim-sg .sg-pad-x{ width:36px; height:36px; border-radius:10px; border:1px solid var(--line); background:#fff; display:grid; place-items:center; color:var(--ink-2); cursor:pointer; }
.moim-sg .sg-pad-t{ flex:1; font-weight:800; font-size:15px; letter-spacing:-0.02em; }
.moim-sg .sg-pad-clear{ font-size:13.5px; font-weight:700; color:var(--ink-2); background:#fff; border:1px solid var(--line); border-radius:10px; padding:8px 13px; cursor:pointer; }
.moim-sg .sg-pad-area{ flex:1; position:relative; background:#fbfbfc; touch-action:none; overscroll-behavior:contain; }
.moim-sg .sg-pad-canvas{ position:absolute; inset:0; width:100%; height:100%; touch-action:none; }
.moim-sg .sg-pad-ph{ position:absolute; inset:0; display:grid; place-items:center; text-align:center; color:#b8bec8; font-size:17px; font-weight:700; pointer-events:none; line-height:1.6; }
.moim-sg .sg-pad-ph small{ font-size:13px; font-weight:600; color:#c5cad3; }
.moim-sg .sg-pad-line{ position:absolute; left:8%; right:8%; bottom:26%; height:1.5px; background:#dfe3ea; pointer-events:none; }
.moim-sg .sg-pad-bottom{ padding:12px 16px calc(12px + env(safe-area-inset-bottom)); border-top:1px solid var(--line); display:flex; flex-direction:column; gap:10px; background:#fff; }
.moim-sg .sg-agree{ display:flex; align-items:flex-start; gap:10px; font-size:14px; font-weight:600; color:var(--ink-2); line-height:1.45; cursor:pointer; }
.moim-sg .sg-agree input{ width:20px; height:20px; margin-top:1px; accent-color:var(--brand); flex-shrink:0; }

@media (min-width:820px){
  .moim-sg .sg-phone{ border:1px solid var(--line); border-radius:24px; box-shadow:0 14px 38px rgba(20,40,80,.08); margin:18px auto 34px; overflow:hidden; min-height:auto; }
  .moim-sg .sg-bar{ position:sticky; }
}
`;
