"use client";

// 포스터 편집기 — 글자·로고 블록을 드래그로 옮기고, 크기·행간·자간·폰트·색·정렬을 조절.
// 레이아웃(틀) 선택 + CBMC 로고(항상 포함) + 배경(테마/AI). 글자는 항상 정확히 렌더(한글 안 깨짐).
import { useEffect, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { createClient } from "@/lib/supabase/client";

export type Seed = {
  headline: string; category: string; title: string;
  verse: string; speaker: string; dateLine: string; modeLabel: string;
};

type Kind = "text" | "logo";
type Role = "headline" | "category" | "title" | "verse" | "speaker" | "dateLine" | "modeLabel";
type El = {
  id: string; kind: Kind; text: string; invert?: boolean; role?: Role;
  x: number; y: number; width: number;
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

const LAYOUTS = [
  { key: "center", label: "가운데형" },
  { key: "left", label: "좌측형" },
];

let _id = 0;
const nid = () => `el_${_id++}`;

function logoEl(o: Partial<El>): El {
  return { id: nid(), kind: "logo", text: "", invert: true, x: 39, y: 90, width: 22, fontSize: 16, font: "pretendard", weight: 700, color: "#fff", align: "center", lineHeight: 1, letterSpacing: 0, ...o };
}

const ROLE_ORDER: Role[] = ["headline", "category", "title", "verse", "speaker", "dateLine", "modeLabel"];

// 레이아웃(틀)별 각 역할의 기본 위치·스타일
const SPECS: Record<string, Record<Role, Partial<El>>> = {
  center: {
    headline: { y: 4, x: 5, width: 90, align: "center", fontSize: 17, weight: 700 },
    category: { y: 21, x: 5, width: 90, align: "center", fontSize: 18, weight: 700, color: "#eef3ff" },
    title: { y: 31, x: 5, width: 90, align: "center", fontSize: 30, weight: 800, lineHeight: 1.15, font: "dohyeon" },
    verse: { y: 55, x: 5, width: 90, align: "center", fontSize: 17, weight: 700 },
    speaker: { y: 65, x: 5, width: 90, align: "center", fontSize: 19, weight: 800 },
    dateLine: { y: 74, x: 5, width: 90, align: "center", fontSize: 20, weight: 800 },
    modeLabel: { y: 82, x: 5, width: 90, align: "center", fontSize: 18, weight: 700 },
  },
  left: {
    headline: { x: 8, y: 8, width: 84, align: "left", fontSize: 17, weight: 700 },
    category: { x: 8, y: 14, width: 84, align: "left", fontSize: 12, weight: 700, color: "#9db8e8", letterSpacing: 1 },
    title: { x: 8, y: 54, width: 84, align: "left", fontSize: 26, weight: 800, lineHeight: 1.2 },
    verse: { x: 8, y: 72, width: 84, align: "left", fontSize: 14, font: "myeongjo", color: "#dbe3f2" },
    speaker: { x: 8, y: 79, width: 84, align: "left", fontSize: 15, weight: 700, color: "#9db8e8" },
    dateLine: { x: 8, y: 86, width: 84, align: "left", fontSize: 15, weight: 700 },
    modeLabel: { x: 8, y: 92, width: 84, align: "left", fontSize: 14, weight: 500, color: "#c9d4ea" },
  },
};

function makeEl(role: Role, layout: string, text: string): El {
  const spec = (SPECS[layout] || SPECS.center)[role];
  return { id: nid(), kind: "text", role, text, x: 5, y: 8, width: 90, fontSize: 16, font: "pretendard", weight: 700, color: "#ffffff", align: "center", lineHeight: 1.25, letterSpacing: 0, ...spec };
}

function seedEls(s: Seed, layout: string): El[] {
  const out: El[] = [];
  for (const role of ROLE_ORDER) {
    const v = s[role];
    if (v && v.trim()) out.push(makeEl(role, layout, v));
  }
  out.push(layout === "left" ? logoEl({ x: 73, y: 7, width: 20 }) : logoEl({ x: 42, y: 90, width: 16 }));
  return out;
}

const SWATCHES = ["#ffffff", "#1a2238", "#9db8e8", "#2e7d52", "#ffd9a8", "#ecd29a", "#ffe3b3", "#c0392b", "#000000"];
// 단색 배경용 팔레트
const SOLIDS = ["#1a2238", "#243763", "#0f2a22", "#21684a", "#2a1a3e", "#7b3b6e", "#c98a5e", "#ecd29a", "#f5f0e6", "#ffffff", "#2e3440", "#b03a2e"];

export default function PosterEditor({ seed }: { seed: Seed }) {
  const [layout, setLayout] = useState("center");
  const [els, setEls] = useState<El[]>(() => seedEls(seed, "center"));
  const [sel, setSel] = useState<string | null>(null);
  const [theme, setTheme] = useState(0);
  const [bgImage, setBgImage] = useState("");
  const [scrim, setScrim] = useState(true);
  const [bgTab, setBgTab] = useState<"lib" | "stock" | "ai" | "theme">("lib");
  const [bgColor, setBgColor] = useState(""); // 직접 고른 단색 (있으면 테마 그라데이션 대신 사용)
  const [hasEyeDropper, setHasEyeDropper] = useState(false);
  useEffect(() => { setHasEyeDropper(typeof window !== "undefined" && "EyeDropper" in window); }, []);
  async function pickEyedropper() {
    const ED = (window as unknown as { EyeDropper?: new () => { open: () => Promise<{ sRGBHex: string }> } }).EyeDropper;
    if (!ED) return;
    try { const r = await new ED().open(); setBgColor(r.sRGBHex); setBgImage(""); } catch {}
  }

  const posterRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: string; sx: number; sy: number; ox: number; oy: number } | null>(null);

  const cur = els.find((e) => e.id === sel) ?? null;
  const upd = (id: string, patch: Partial<El>) => setEls((p) => p.map((e) => (e.id === id ? { ...e, ...patch } : e)));

  // 양식(콘텐츠 생성 폼)이 바뀌면 해당 역할 글자만 자동 반영. 드래그·폰트 등 수동 편집은 유지.
  const prevSeed = useRef(seed);
  useEffect(() => {
    const ps = prevSeed.current;
    prevSeed.current = seed;
    setEls((list) => {
      let next = list;
      for (const role of ROLE_ORDER) {
        const nv = (seed[role] ?? "").trim();
        const ov = (ps[role] ?? "").trim();
        if (nv === ov) continue;
        const exists = next.some((e) => e.role === role);
        if (nv) next = exists ? next.map((e) => (e.role === role ? { ...e, text: seed[role] } : e)) : [...next, makeEl(role, layout, seed[role])];
        else if (exists) next = next.filter((e) => e.role !== role);
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed.headline, seed.category, seed.title, seed.verse, seed.speaker, seed.dateLine, seed.modeLabel, layout]);

  function onDown(e: React.PointerEvent, el: El) {
    e.stopPropagation(); setSel(el.id);
    const rect = posterRef.current?.getBoundingClientRect(); if (!rect) return;
    dragRef.current = { id: el.id, sx: e.clientX, sy: e.clientY, ox: el.x, oy: el.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }
  function onMove(e: React.PointerEvent) {
    const d = dragRef.current; const rect = posterRef.current?.getBoundingClientRect();
    if (!d || !rect) return;
    const dx = ((e.clientX - d.sx) / rect.width) * 100;
    const dy = ((e.clientY - d.sy) / rect.height) * 100;
    upd(d.id, { x: Math.max(-5, Math.min(95, d.ox + dx)), y: Math.max(-3, Math.min(99, d.oy + dy)) });
  }
  function onUp() { dragRef.current = null; }

  function addText() {
    const el: El = { id: nid(), kind: "text", text: "새 글자", x: 20, y: 45, width: 60, fontSize: 18, font: "pretendard", weight: 700, color: "#ffffff", align: "center", lineHeight: 1.25, letterSpacing: 0 };
    setEls((p) => [...p, el]); setSel(el.id);
  }
  function addLogo() { const el = logoEl({ x: 40, y: 45 }); setEls((p) => [...p, el]); setSel(el.id); }
  function removeSel() { if (sel) { setEls((p) => p.filter((e) => e.id !== sel)); setSel(null); } }
  function applyLayout(k: string) { setLayout(k); setEls(seedEls(seed, k)); setSel(null); }

  const [bgPrompt, setBgPrompt] = useState("");
  const [genning, setGenning] = useState(false);
  const [genErr, setGenErr] = useState("");
  const [aiProvider, setAiProvider] = useState<"cloudflare" | "recraft">("cloudflare");
  const [rcStyle, setRcStyle] = useState("realistic_image");
  const rcSize = "1024x1365";
  const [tone, setTone] = useState("");
  const [count, setCount] = useState(2);
  const [candidates, setCandidates] = useState<string[]>([]);
  async function genBg() {
    setGenning(true); setGenErr(""); setCandidates([]);
    try {
      const res = await fetch("/api/poster-bg", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: bgPrompt.trim(), provider: aiProvider, style: rcStyle, size: rcSize, tone, count, title: seed.title, verse: seed.verse }) });
      const data = await res.json();
      if (!res.ok || !data.images || !data.images.length) setGenErr(data.error || "생성에 실패했어요. 잠시 후 다시 시도해 주세요.");
      else if (data.images.length === 1) setBgImage(data.images[0]);
      else setCandidates(data.images);
    } catch { setGenErr("네트워크 오류가 났어요."); } finally { setGenning(false); }
  }

  // 무료 사진·일러스트 (Pixabay)
  const [stockQ, setStockQ] = useState("");
  const [stockType, setStockType] = useState<"all" | "photo" | "illustration">("all");
  const [stock, setStock] = useState<{ thumb: string; full: string }[]>([]);
  const [stockBusy, setStockBusy] = useState(false);
  const [stockErr, setStockErr] = useState("");
  async function searchStock() {
    if (!stockQ.trim()) return;
    setStockBusy(true); setStockErr("");
    try {
      const r = await fetch(`/api/stock?q=${encodeURIComponent(stockQ.trim())}&type=${stockType}`);
      const d = await r.json();
      if (!r.ok) { setStockErr(d.error || "검색 실패"); setStock([]); }
      else { setStock(d.images || []); if (!(d.images || []).length) setStockErr("결과가 없어요. 다른 단어(영어도)로 검색해 보세요."); }
    } catch { setStockErr("네트워크 오류"); } finally { setStockBusy(false); }
  }
  async function pickStock(full: string) {
    setStockBusy(true); setStockErr("");
    try {
      const r = await fetch("/api/stock", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: full }) });
      const d = await r.json();
      if (r.ok && d.image) setBgImage(d.image); else setStockErr(d.error || "이미지 적용 실패");
    } catch { setStockErr("네트워크 오류"); } finally { setStockBusy(false); }
  }

  // 배경 보관함 — Supabase Storage('backgrounds' 버킷). 대시보드에서 여러 장 미리 올려둘 수 있음.
  const [supabase] = useState(() => createClient());
  const [lib, setLib] = useState<{ name: string; url: string }[]>([]);
  const [libBusy, setLibBusy] = useState(false);
  async function loadLib() {
    setLibBusy(true);
    const { data } = await supabase.storage.from("backgrounds").list("", { limit: 200, sortBy: { column: "created_at", order: "desc" } });
    const items = (data ?? [])
      .filter((f) => f.name && !f.name.startsWith(".") && f.id)
      .map((f) => ({ name: f.name, url: supabase.storage.from("backgrounds").getPublicUrl(f.name).data.publicUrl }));
    setLib(items); setLibBusy(false);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadLib(); }, []);
  // 공개 URL → dataURL(내보내기 안전)로 적용
  async function applyLib(url: string) {
    setLibBusy(true);
    try {
      const blob = await (await fetch(url)).blob();
      const dataUrl: string = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result as string); r.onerror = rej; r.readAsDataURL(blob); });
      setBgImage(dataUrl);
    } catch { setBgImage(url); } finally { setLibBusy(false); }
  }
  async function uploadBg(file: File) {
    setLibBusy(true);
    try {
      const name = `${crypto.randomUUID()}_${file.name.replace(/[^\w.]+/g, "_")}`.slice(0, 90);
      const { error } = await supabase.storage.from("backgrounds").upload(name, file, { contentType: file.type || "image/jpeg" });
      if (error) { alert("업로드 실패: " + error.message); return; }
      const url = supabase.storage.from("backgrounds").getPublicUrl(name).data.publicUrl;
      await applyLib(url);
      await loadLib();
    } finally { setLibBusy(false); }
  }
  async function saveToLib() {
    if (!bgImage) return;
    setLibBusy(true);
    try {
      const blob = await (await fetch(bgImage)).blob();
      const name = `${crypto.randomUUID()}.jpg`;
      const { error } = await supabase.storage.from("backgrounds").upload(name, blob, { contentType: blob.type || "image/jpeg" });
      if (error) { alert("저장 실패: " + error.message); return; }
      await loadLib();
    } finally { setLibBusy(false); }
  }
  async function delLib(name: string) {
    await supabase.storage.from("backgrounds").remove([name]);
    setLib((l) => l.filter((x) => x.name !== name));
  }

  const [saving, setSaving] = useState(false);
  async function savePoster() {
    if (!posterRef.current) return;
    setSel(null); setSaving(true);
    await new Promise((r) => setTimeout(r, 60));
    try {
      const url = await toPng(posterRef.current, { pixelRatio: 3, cacheBust: true, skipFonts: true });
      const a = document.createElement("a"); a.href = url; a.download = `포스터_새서울CBMC.png`; a.click();
    } catch { alert("이미지 저장 실패"); } finally { setSaving(false); }
  }

  const rng = "w-full accent-primary";
  const miniLab = "mb-1 block text-[12px] font-bold text-ink-soft";

  return (
    <div className="rounded-lg border border-line bg-card p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[21px] font-bold text-ink">포스터 편집기</h2>
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-bold text-ink-soft">틀</span>
          {LAYOUTS.map((l) => (
            <button key={l.key} onClick={() => applyLayout(l.key)} className={`rounded-full px-3 py-1 text-[12px] font-semibold ${layout === l.key ? "bg-primary text-white" : "border border-line text-ink-soft hover:border-primary"}`}>{l.label}</button>
          ))}
          <button onClick={() => applyLayout(layout)} className="ml-1 text-[12px] font-semibold text-primary hover:underline">↻ 내용 채우기</button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        {/* 포스터 미리보기 */}
        <div>
          <div
            ref={posterRef}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerDown={() => setSel(null)}
            className="relative mx-auto aspect-[3/4] w-full max-w-[320px] select-none overflow-hidden rounded-[14px]"
            style={{ background: bgColor || THEMES[theme].bg, touchAction: "none" }}
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
                style={{ left: `${el.x}%`, top: `${el.y}%`, width: `${el.width}%` }}
              >
                {el.kind === "logo" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src="/cbmc-logo.png" alt="CBMC" className="pointer-events-none w-full" style={{ filter: el.invert ? "brightness(0) invert(1)" : "none" }} />
                ) : (
                  <div style={{ fontFamily: fontCss(el.font), fontSize: el.fontSize, fontWeight: el.weight, color: el.color, textAlign: el.align, lineHeight: el.lineHeight, letterSpacing: el.letterSpacing, whiteSpace: "pre-wrap", wordBreak: "keep-all" }}>
                    {el.text}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <button onClick={addText} className="flex-1 rounded-full border border-line px-3 py-2 text-[13px] font-semibold text-ink-soft hover:border-primary hover:text-primary">＋ 글자</button>
            <button onClick={addLogo} className="flex-1 rounded-full border border-line px-3 py-2 text-[13px] font-semibold text-ink-soft hover:border-primary hover:text-primary">＋ 로고</button>
            <button onClick={savePoster} disabled={saving} className="flex-1 rounded-full bg-primary px-3 py-2 text-[13px] font-semibold text-white hover:bg-primary-pressed disabled:opacity-50">{saving ? "저장 중…" : "🖼 PNG"}</button>
          </div>
          <p className="mt-1.5 text-center text-[12px] text-muted">요소를 눌러 선택 → 드래그로 이동 · 오른쪽에서 편집</p>
        </div>

        {/* 편집 패널 */}
        <div className="flex flex-col gap-4">
          {/* 배경 — 방법을 탭으로 (한 번에 하나만 보임) */}
          <div className="rounded-lg border border-line bg-surface-soft p-3">
            <div className="mb-2 flex flex-wrap items-center gap-1.5">
              <span className="text-[12px] font-bold text-ink-soft">🖼 배경</span>
              {(([["lib", "🗂 보관함"], ["stock", "📷 사진 찾기"], ["ai", "✨ AI 만들기"], ["theme", "🎨 단색"]]) as const).map(([v, l]) => (
                <button key={v} onClick={() => { setBgTab(v); if (v === "lib") loadLib(); }} className={`rounded-full px-2.5 py-1 text-[12px] font-semibold ${bgTab === v ? "bg-primary text-white" : "border border-line text-ink-soft hover:border-primary"}`}>{l}</button>
              ))}
              {bgImage && (
                <span className="ml-auto flex gap-1.5">
                  <button onClick={saveToLib} disabled={libBusy} className="rounded-full bg-success px-2.5 py-1 text-[11px] font-semibold text-white hover:opacity-90 disabled:opacity-50">💾 저장</button>
                  <button onClick={() => setBgImage("")} className="rounded-full border border-line px-2.5 py-1 text-[11px] font-semibold text-ink-soft hover:border-primary">지우기</button>
                </span>
              )}
            </div>

            {/* 🗂 보관함 */}
            {bgTab === "lib" && (
              <div>
                <div className="mb-2 flex flex-wrap gap-2">
                  <label className="cursor-pointer rounded-full border border-line px-3 py-1 text-[12px] font-semibold text-ink-soft hover:border-primary hover:text-primary">
                    📤 내 이미지 업로드
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadBg(f); e.currentTarget.value = ""; }} />
                  </label>
                  <button onClick={loadLib} className="rounded-full border border-line px-3 py-1 text-[12px] font-semibold text-ink-soft hover:border-primary">↻ 새로고침</button>
                </div>
                {libBusy && <p className="py-2 text-center text-[12px] text-ink-soft">불러오는 중…</p>}
                {!libBusy && lib.length === 0 && <p className="py-4 text-center text-[12px] text-ink-soft">저장된 배경이 없어요.<br /><b>📤 업로드</b> 하거나, ‘사진 찾기·AI 만들기’로 만든 뒤 <b>💾 저장</b>하세요.</p>}
                {lib.length > 0 && (
                  <div className="grid max-h-[240px] grid-cols-4 gap-1.5 overflow-y-auto">
                    {lib.map((b) => (
                      <div key={b.name} className="relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={b.url} alt="" onClick={() => applyLib(b.url)} className="aspect-[3/4] w-full cursor-pointer rounded object-cover transition hover:opacity-80 hover:ring-2 hover:ring-primary" />
                        <button onClick={() => delLib(b.name)} className="absolute right-0.5 top-0.5 rounded-full bg-black/55 px-1.5 text-[11px] leading-tight text-white hover:bg-unpaid">✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 📷 사진 찾기 (Pixabay) */}
            {bgTab === "stock" && (
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <input value={stockQ} onChange={(e) => setStockQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && searchStock()} placeholder="검색 (예: 새벽, 들판, 기도)" className="min-h-[36px] flex-1 rounded-md border border-line bg-card px-2.5 text-[14px] text-ink outline-none placeholder:text-muted focus:border-primary-focus" />
                  <button onClick={searchStock} disabled={stockBusy} className="rounded-full bg-primary px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-primary-pressed disabled:opacity-50">{stockBusy ? "…" : "검색"}</button>
                </div>
                <div className="mt-1.5 flex gap-1">
                  {(([["all", "전체"], ["photo", "사진"], ["illustration", "일러스트"]]) as const).map(([v, l]) => (
                    <button key={v} onClick={() => setStockType(v)} className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${stockType === v ? "bg-primary text-white" : "border border-line text-ink-soft"}`}>{l}</button>
                  ))}
                </div>
                {stockErr && <p className="mt-1 text-[12px] text-unpaid">{stockErr}</p>}
                {stock.length > 0 && (
                  <div className="mt-2 grid max-h-[220px] grid-cols-4 gap-1.5 overflow-y-auto">
                    {stock.map((im, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={i} src={im.thumb} alt="" onClick={() => pickStock(im.full)} className="aspect-square w-full cursor-pointer rounded object-cover transition hover:opacity-75 hover:ring-2 hover:ring-primary" />
                    ))}
                  </div>
                )}
                <p className="mt-1 text-[11px] text-muted">출처: Pixabay (무료·상업적 사용 가능) · 적용 후 위 💾 저장하면 보관함에</p>
              </div>
            )}

            {/* ✨ AI 만들기 */}
            {bgTab === "ai" && (
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <input value={bgPrompt} onChange={(e) => setBgPrompt(e.target.value)} placeholder="장면·키워드 (비우면 제목·말씀에 맞게 자동)" className="min-h-[36px] flex-1 rounded-md border border-line bg-card px-2.5 text-[14px] text-ink outline-none placeholder:text-muted focus:border-primary-focus" />
                  <button onClick={genBg} disabled={genning} className="rounded-full bg-primary px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-primary-pressed disabled:opacity-50">{genning ? "그리는 중…" : "만들기"}</button>
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {["자연", "들판", "하늘", "바다", "산", "도시", "새벽", "노을", "빛", "길", "꽃", "숲", "강", "구름"].map((w) => (
                    <button key={w} onClick={() => setBgPrompt((p) => (p.trim() ? p.trim() + " " + w : w))} className="rounded-full border border-line px-2 py-0.5 text-[11px] text-ink-soft hover:border-primary hover:text-primary">{w}</button>
                  ))}
                  {bgPrompt && <button onClick={() => setBgPrompt("")} className="rounded-full px-2 py-0.5 text-[11px] text-muted hover:text-unpaid">✕</button>}
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-bold text-ink-soft">엔진</span>
                  {([["cloudflare", "무료"], ["recraft", "Recraft(유료)"]] as const).map(([v, l]) => (
                    <button key={v} onClick={() => setAiProvider(v)} className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${aiProvider === v ? "bg-primary text-white" : "border border-line text-ink-soft"}`}>{l}</button>
                  ))}
                  {aiProvider === "recraft" && (
                    <select value={rcStyle} onChange={(e) => setRcStyle(e.target.value)} className="min-h-[28px] rounded-md border border-line bg-card px-1.5 text-[12px] text-ink outline-none">
                      <option value="realistic_image">실사</option>
                      <option value="digital_illustration">일러스트</option>
                      <option value="vector_illustration">벡터/플랫</option>
                    </select>
                  )}
                  <span className="ml-1 text-[11px] font-bold text-ink-soft">톤</span>
                  <select value={tone} onChange={(e) => setTone(e.target.value)} className="min-h-[28px] rounded-md border border-line bg-card px-1.5 text-[12px] text-ink outline-none">
                    <option value="">자동</option>
                    <option value="warm">따뜻한</option>
                    <option value="calm">차분한</option>
                    <option value="bright">밝은</option>
                    <option value="majestic">장엄한</option>
                    <option value="minimal">미니멀</option>
                    <option value="vintage">빈티지</option>
                  </select>
                  <select value={count} onChange={(e) => setCount(+e.target.value)} className="min-h-[28px] rounded-md border border-line bg-card px-1.5 text-[12px] text-ink outline-none">
                    <option value={1}>1장</option>
                    <option value={2}>2장</option>
                  </select>
                </div>
                {candidates.length > 0 && (
                  <div className="mt-2 rounded-lg border border-primary/40 bg-primary/5 p-2">
                    <div className="mb-1.5 text-[12px] font-bold text-primary">마음에 드는 배경을 클릭하세요</div>
                    <div className="grid grid-cols-2 gap-2">
                      {candidates.map((im, i) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={i} src={im} alt="" onClick={() => { setBgImage(im); setCandidates([]); }} className="aspect-[3/4] w-full cursor-pointer rounded-md object-cover transition hover:opacity-80 hover:ring-2 hover:ring-primary" />
                      ))}
                    </div>
                  </div>
                )}
                {genErr && <p className="mt-1 text-[12px] text-unpaid">{genErr}</p>}
                <p className="mt-1 text-[11px] text-muted">글자 없는 배경만 생성 · 적용 후 위 💾 저장(보관함) · 무료=Flux, 유료=Recraft</p>
              </div>
            )}

            {/* 🎨 단색/그라데이션 */}
            {bgTab === "theme" && (
              <div>
                {bgImage && <p className="mb-1.5 text-[11px] text-muted">색을 고르면 지금 배경 이미지는 사라지고 색이 적용돼요.</p>}

                <div className="text-[11px] font-bold text-ink-soft">그라데이션</div>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {THEMES.map((t, i) => (
                    <button key={t.key} onClick={() => { setTheme(i); setBgColor(""); setBgImage(""); }} className={`rounded-full px-3 py-1 text-[12px] font-semibold ${theme === i && !bgImage && !bgColor ? "bg-primary text-white" : "border border-line text-ink-soft hover:border-primary hover:text-primary"}`}>
                      <span className="mr-1 inline-block h-2.5 w-2.5 rounded-full align-middle" style={{ background: t.bg }} />{t.label}
                    </button>
                  ))}
                </div>

                <div className="mt-2.5 text-[11px] font-bold text-ink-soft">단색 (직접 선택)</div>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <label className="flex cursor-pointer items-center gap-1 rounded-md border border-line bg-card px-1.5 py-1 text-[11px] font-semibold text-ink-soft">
                    🎨 색선택
                    <input type="color" value={bgColor || "#1a2238"} onChange={(e) => { setBgColor(e.target.value); setBgImage(""); }} className="h-6 w-7 cursor-pointer border-0 bg-transparent p-0" />
                  </label>
                  {hasEyeDropper && <button onClick={pickEyedropper} className="rounded-md border border-line px-2 py-1 text-[11px] font-semibold text-ink-soft hover:border-primary hover:text-primary">🎯 스포이드</button>}
                  {SOLIDS.map((c) => (
                    <button key={c} onClick={() => { setBgColor(c); setBgImage(""); }} className={`h-7 w-7 rounded-full border ${bgColor.toLowerCase() === c.toLowerCase() ? "border-primary ring-2 ring-primary" : "border-line"}`} style={{ background: c }} />
                  ))}
                </div>
                {bgColor && <p className="mt-1 text-[11px] text-muted">선택한 색: <b className="text-ink">{bgColor}</b></p>}
              </div>
            )}

            {/* 공통: 어둠막 */}
            {bgImage && <label className="mt-2 flex items-center gap-1.5 text-[12px] text-ink-soft"><input type="checkbox" checked={scrim} onChange={(e) => setScrim(e.target.checked)} className="accent-primary" /> 글자 잘 보이게 어둠막</label>}
          </div>

          {/* 선택 요소 편집 */}
          {cur ? (
            cur.kind === "logo" ? (
              <div className="rounded-lg border border-line bg-card p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[13px] font-bold text-ink">🔷 CBMC 로고</span>
                  <button onClick={removeSel} className="text-[12px] font-semibold text-unpaid hover:underline">삭제</button>
                </div>
                <label className={miniLab}>크기 {cur.width}%</label>
                <input type="range" min={8} max={70} value={cur.width} onChange={(e) => upd(cur.id, { width: +e.target.value })} className={rng} />
                <label className="mt-2 flex items-center gap-1.5 text-[13px] text-ink-soft"><input type="checkbox" checked={!!cur.invert} onChange={(e) => upd(cur.id, { invert: e.target.checked })} className="accent-primary" /> 흰색으로 (어두운 배경용)</label>
              </div>
            ) : (
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
                <div className="mt-3"><label className={miniLab}>크기 {cur.fontSize}px</label><input type="range" min={8} max={64} value={cur.fontSize} onChange={(e) => upd(cur.id, { fontSize: +e.target.value })} className={rng} /></div>
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
            )
          ) : (
            <div className="rounded-lg border border-dashed border-line bg-surface-soft p-6 text-center text-[14px] text-ink-soft">
              포스터에서 <b className="text-ink">글자·로고를 클릭</b>하면 여기서<br />크기·위치·행간·자간·폰트·색을 바꿀 수 있어요.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
