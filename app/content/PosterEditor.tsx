"use client";

// 포스터 편집기 — 글자 블록을 드래그로 옮기고, 크기·행간·자간·폰트·색·정렬을 조절.
// 배경: 디자인 테마 또는 AI 배경(Cloudflare). 글자는 항상 우리가 정확히 렌더(한글 안 깨짐).
import { useRef, useState } from "react";
import { toPng } from "html-to-image";

export type Seed = { org: string; meta: string; title: string; speaker: string; verse: string };

type TextEl = {
  id: string; text: string;
  x: number; y: number; width: number;            // % (포스터 기준)
  fontSize: number; font: string; weight: number;
  color: string; align: "left" | "center" | "right";
  lineHeight: number; letterSpacing: number;
};

const FONTS = [
  { key: "pretendard", label: "기본", css: "'Pretendard', sans-serif" },
  { key: "myeongjo", label: "명조", css: "'Nanum Myeongjo', serif" },
  { key: "dohyeon", label: "고딕", css: "'Do Hyeon', sans-serif" },
  { key: "blackhan", label: "굵은제목", css: "'Black Han Sans', sans-serif" },
  { key: "gaegu", label: "손글씨", css: "'Gaegu', cursive" },
  { key: "pen", label: "펜글씨", css: "'Nanum Pen Script', cursive" },
];
const fontCss = (k: string) => FONTS.find((f) => f.key === k)?.css ?? FONTS[0].css;

const THEMES = [
  { key: "navy", label: "남색", bg: "linear-gradient(135deg,#1a2238,#243763,#243763)" },
  { key: "dawn", label: "새벽", bg: "linear-gradient(135deg,#16203c,#46406b,#c98a5e)" },
  { key: "forest", label: "숲", bg: "linear-gradient(135deg,#0f2a22,#163d2f,#21684a)" },
  { key: "sunset", label: "노을", bg: "linear-gradient(135deg,#2a1a3e,#7b3b6e,#e2895a)" },
  { key: "light", label: "화이트", bg: "linear-gradient(135deg,#ffffff,#e9eef7)" },
  { key: "ink", label: "먹빛", bg: "linear-gradient(135deg,#0f1115,#23262e,#3a3f4b)" },
];

let _id = 0;
const nid = () => `el_${_id++}`;

function seedEls(s: Seed): TextEl[] {
  const out: TextEl[] = [];
  const push = (text: string, o: Partial<TextEl>) => {
    if (!text || !text.trim()) return;
    out.push({
      id: nid(), text, x: 8, y: 8, width: 84, fontSize: 16, font: "pretendard",
      weight: 700, color: "#ffffff", align: "left", lineHeight: 1.25, letterSpacing: 0, ...o,
    });
  };
  push("NEW SEOUL CBMC", { y: 7, fontSize: 11, color: "#9db8e8", letterSpacing: 3 });
  push(s.org, { y: 12, fontSize: 18 });
  push(s.meta, { y: 60, fontSize: 13, weight: 500, color: "#c9d4ea" });
  push(s.title, { y: 66, fontSize: 22, weight: 800, lineHeight: 1.2 });
  push(s.speaker, { y: 84, fontSize: 14, color: "#9db8e8" });
  push(s.verse, { y: 90, fontSize: 13, weight: 400, font: "myeongjo", color: "#dbe3f2", lineHeight: 1.4 });
  return out;
}

const SWATCHES = ["#ffffff", "#1a2238", "#9db8e8", "#ffd9a8", "#ecd29a", "#ffe3b3", "#2e7d52", "#c0392b", "#000000"];

export default function PosterEditor({ seed }: { seed: Seed }) {
  const [els, setEls] = useState<TextEl[]>(() => seedEls(seed));
  const [sel, setSel] = useState<string | null>(null);
  const [theme, setTheme] = useState(0);
  const [bgImage, setBgImage] = useState("");
  const [scrim, setScrim] = useState(true); // AI배경일 때 글자 가독성 어둠막

  const posterRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: string; sx: number; sy: number; ox: number; oy: number } | null>(null);

  const cur = els.find((e) => e.id === sel) ?? null;
  const upd = (id: string, patch: Partial<TextEl>) => setEls((p) => p.map((e) => (e.id === id ? { ...e, ...patch } : e)));

  // 드래그 이동
  function onDown(e: React.PointerEvent, el: TextEl) {
    e.stopPropagation();
    setSel(el.id);
    const rect = posterRef.current?.getBoundingClientRect();
    if (!rect) return;
    dragRef.current = { id: el.id, sx: e.clientX, sy: e.clientY, ox: el.x, oy: el.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }
  function onMove(e: React.PointerEvent) {
    const d = dragRef.current; const rect = posterRef.current?.getBoundingClientRect();
    if (!d || !rect) return;
    const dx = ((e.clientX - d.sx) / rect.width) * 100;
    const dy = ((e.clientY - d.sy) / rect.height) * 100;
    upd(d.id, { x: Math.max(-5, Math.min(95, d.ox + dx)), y: Math.max(-2, Math.min(98, d.oy + dy)) });
  }
  function onUp() { dragRef.current = null; }

  function addText() {
    const el: TextEl = { id: nid(), text: "새 글자", x: 20, y: 45, width: 60, fontSize: 18, font: "pretendard", weight: 700, color: bgImage || theme !== 4 ? "#ffffff" : "#1a2238", align: "left", lineHeight: 1.25, letterSpacing: 0 };
    setEls((p) => [...p, el]); setSel(el.id);
  }
  function removeSel() { if (sel) { setEls((p) => p.filter((e) => e.id !== sel)); setSel(null); } }
  function reseed() { setEls(seedEls(seed)); setSel(null); }

  // AI 배경 (Cloudflare 무료)
  const [bgPrompt, setBgPrompt] = useState("");
  const [genning, setGenning] = useState(false);
  const [genErr, setGenErr] = useState("");
  async function genBg() {
    const p = bgPrompt.trim() || (seed.title ? `${seed.title} 분위기` : "잔잔한 새벽 하늘과 따뜻한 햇살");
    setGenning(true); setGenErr("");
    try {
      const res = await fetch("/api/poster-bg", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: p }) });
      const data = await res.json();
      if (!res.ok || !data.image) setGenErr(data.error || "생성에 실패했어요. 잠시 후 다시 시도해 주세요.");
      else setBgImage(data.image);
    } catch { setGenErr("네트워크 오류가 났어요."); } finally { setGenning(false); }
  }

  const [saving, setSaving] = useState(false);
  async function savePoster() {
    if (!posterRef.current) return;
    setSel(null); setSaving(true);
    await new Promise((r) => setTimeout(r, 60)); // 선택 테두리 사라진 뒤 캡처
    try {
      const url = await toPng(posterRef.current, { pixelRatio: 3, cacheBust: true, skipFonts: true });
      const a = document.createElement("a"); a.href = url; a.download = `포스터_새서울CBMC.png`; a.click();
    } catch { alert("이미지 저장 실패"); } finally { setSaving(false); }
  }

  const rng = "w-full accent-primary";
  const miniLab = "mb-1 block text-[12px] font-bold text-ink-soft";

  return (
    <div className="rounded-lg border border-line bg-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[21px] font-bold text-ink">포스터 편집기</h2>
        <button onClick={reseed} className="text-[12px] font-semibold text-primary hover:underline">↻ 양식 내용으로 채우기</button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        {/* 포스터 미리보기 (드래그 편집) */}
        <div>
          <div
            ref={posterRef}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerDown={() => setSel(null)}
            className="relative mx-auto aspect-[3/4] w-full max-w-[320px] select-none overflow-hidden rounded-[14px]"
            style={{ background: THEMES[theme].bg, touchAction: "none" }}
          >
            {bgImage && (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={bgImage} alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover" />
                {scrim && <div className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(to top, rgba(26,34,56,.85), rgba(26,34,56,.35) 55%, rgba(0,0,0,.2))" }} />}
              </>
            )}
            {els.map((el) => (
              <div
                key={el.id}
                onPointerDown={(e) => onDown(e, el)}
                className={`absolute cursor-move ${sel === el.id ? "outline outline-2 outline-primary" : ""}`}
                style={{
                  left: `${el.x}%`, top: `${el.y}%`, width: `${el.width}%`,
                  fontFamily: fontCss(el.font), fontSize: el.fontSize, fontWeight: el.weight,
                  color: el.color, textAlign: el.align, lineHeight: el.lineHeight,
                  letterSpacing: el.letterSpacing, whiteSpace: "pre-wrap", wordBreak: "keep-all",
                }}
              >
                {el.text}
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <button onClick={addText} className="flex-1 rounded-full border border-line px-3 py-2 text-[13px] font-semibold text-ink-soft hover:border-primary hover:text-primary">＋ 글자 추가</button>
            <button onClick={savePoster} disabled={saving} className="flex-1 rounded-full bg-primary px-3 py-2 text-[13px] font-semibold text-white hover:bg-primary-pressed disabled:opacity-50">{saving ? "저장 중…" : "🖼 PNG 저장"}</button>
          </div>
          <p className="mt-1.5 text-center text-[12px] text-muted">글자를 눌러 선택 → 드래그로 이동 · 오른쪽에서 편집</p>
        </div>

        {/* 편집 패널 */}
        <div className="flex flex-col gap-4">
          {/* 배경 */}
          <div className="rounded-lg border border-line bg-surface-soft p-3">
            <div className="mb-1.5 text-[12px] font-bold text-ink-soft">🎨 배경 디자인</div>
            <div className="flex flex-wrap gap-1.5">
              {THEMES.map((t, i) => (
                <button key={t.key} onClick={() => { setTheme(i); }} className={`rounded-full px-3 py-1 text-[12px] font-semibold ${theme === i && !bgImage ? "bg-primary text-white" : "border border-line text-ink-soft hover:border-primary"}`}>{t.label}</button>
              ))}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <input value={bgPrompt} onChange={(e) => setBgPrompt(e.target.value)} placeholder="✨ AI 배경 설명 (비우면 주제로)" className="min-h-[36px] flex-1 rounded-md border border-line bg-card px-2.5 text-[14px] text-ink outline-none placeholder:text-muted focus:border-primary-focus" />
              <button onClick={genBg} disabled={genning} className="rounded-full bg-primary px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-primary-pressed disabled:opacity-50">{genning ? "그리는 중…" : "AI 배경"}</button>
              {bgImage && <button onClick={() => setBgImage("")} className="rounded-full border border-line px-3 py-1.5 text-[12px] font-semibold text-ink-soft hover:border-primary">배경 지우기</button>}
            </div>
            {bgImage && <label className="mt-2 flex items-center gap-1.5 text-[12px] text-ink-soft"><input type="checkbox" checked={scrim} onChange={(e) => setScrim(e.target.checked)} className="accent-primary" /> 글자 잘 보이게 어둠막</label>}
            {genErr && <p className="mt-1 text-[12px] text-unpaid">{genErr}</p>}
          </div>

          {/* 선택된 글자 편집 */}
          {cur ? (
            <div className="rounded-lg border border-line bg-card p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[13px] font-bold text-ink">✏️ 선택한 글자</span>
                <button onClick={removeSel} className="text-[12px] font-semibold text-unpaid hover:underline">삭제</button>
              </div>
              <textarea value={cur.text} onChange={(e) => upd(cur.id, { text: e.target.value })} className="mb-2 min-h-[48px] w-full rounded-md border border-line bg-card px-2.5 py-1.5 text-[15px] text-ink outline-none focus:border-primary-focus" />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={miniLab}>폰트</label>
                  <select value={cur.font} onChange={(e) => upd(cur.id, { font: e.target.value })} className="min-h-[34px] w-full rounded-md border border-line bg-card px-2 text-[14px] text-ink outline-none focus:border-primary-focus">
                    {FONTS.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={miniLab}>정렬</label>
                  <div className="flex gap-1">
                    {(["left", "center", "right"] as const).map((a) => (
                      <button key={a} onClick={() => upd(cur.id, { align: a })} className={`flex-1 rounded-md border py-1.5 text-[13px] ${cur.align === a ? "border-primary bg-primary/10 text-primary" : "border-line text-ink-soft"}`}>{a === "left" ? "좌" : a === "center" ? "중" : "우"}</button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-3"><label className={miniLab}>크기 {cur.fontSize}px</label><input type="range" min={8} max={56} value={cur.fontSize} onChange={(e) => upd(cur.id, { fontSize: +e.target.value })} className={rng} /></div>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <div><label className={miniLab}>행간 {cur.lineHeight.toFixed(2)}</label><input type="range" min={0.9} max={2.2} step={0.05} value={cur.lineHeight} onChange={(e) => upd(cur.id, { lineHeight: +e.target.value })} className={rng} /></div>
                <div><label className={miniLab}>자간 {cur.letterSpacing}px</label><input type="range" min={-2} max={12} step={0.5} value={cur.letterSpacing} onChange={(e) => upd(cur.id, { letterSpacing: +e.target.value })} className={rng} /></div>
              </div>
              <div className="mt-2"><label className={miniLab}>글상자 너비 {cur.width}%</label><input type="range" min={20} max={96} value={cur.width} onChange={(e) => upd(cur.id, { width: +e.target.value })} className={rng} /></div>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <label className={miniLab}>굵기</label>
                  <div className="flex gap-1">
                    {[400, 700, 900].map((w) => (
                      <button key={w} onClick={() => upd(cur.id, { weight: w })} className={`flex-1 rounded-md border py-1.5 text-[12px] ${cur.weight === w ? "border-primary bg-primary/10 text-primary" : "border-line text-ink-soft"}`}>{w === 400 ? "보통" : w === 700 ? "굵게" : "매우"}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={miniLab}>색</label>
                  <div className="flex items-center gap-1.5">
                    <input type="color" value={cur.color} onChange={(e) => upd(cur.id, { color: e.target.value })} className="h-[34px] w-10 cursor-pointer rounded border border-line bg-card" />
                    <div className="flex flex-wrap gap-1">
                      {SWATCHES.map((c) => <button key={c} onClick={() => upd(cur.id, { color: c })} className="h-5 w-5 rounded-full border border-line" style={{ background: c }} />)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-line bg-surface-soft p-6 text-center text-[14px] text-ink-soft">
              포스터에서 <b className="text-ink">글자를 클릭</b>하면 여기서<br />크기·위치·행간·자간·폰트·색을 바꿀 수 있어요.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
