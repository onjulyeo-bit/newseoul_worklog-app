// 사진 처리(브라우저 전용) — 배경 제거 후 단색 배경으로 통일 + 정사각 크롭.
//   @imgly/background-removal 동적 import(무료·로컬 처리, 사진 외부 전송 없음).
//   배경 제거 실패 시 원본을 그대로 정사각 크롭(폴백) — 업로드는 항상 성공.

export type ProcessOpts = { bg?: string; size?: number; removeBg?: boolean; enhance?: boolean };

// hex 색을 밝게(pct>0)/어둡게(pct<0) — 그라데이션 색 계산용
function shade(hex: string, pct: number): string {
  const c = hex.replace("#", "");
  const n = c.length === 3 ? c.split("").map((x) => x + x).join("") : c;
  const r = parseInt(n.slice(0, 2), 16), g = parseInt(n.slice(2, 4), 16), b = parseInt(n.slice(4, 6), 16);
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(pct >= 0 ? v + (255 - v) * pct : v * (1 + pct))));
  const h = (v: number) => f(v).toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}

// 사진관 배경 — 인물 뒤(위쪽 중앙)가 밝고 가장자리로 어두워지는 방사형 그라데이션
function paintStudioBg(ctx: CanvasRenderingContext2D, size: number, bg: string) {
  const grad = ctx.createRadialGradient(size * 0.5, size * 0.40, size * 0.04, size * 0.5, size * 0.58, size * 0.82);
  grad.addColorStop(0, shade(bg, 0.13));
  grad.addColorStop(0.55, bg);
  grad.addColorStop(1, shade(bg, -0.16));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// file → 정사각(단색 배경) JPEG Blob
export async function processPhoto(file: File, opts: ProcessOpts = {}): Promise<Blob> {
  const { bg = "#eef0f3", size = 640, removeBg = true, enhance = true } = opts;

  let source: Blob = file;
  if (removeBg) {
    try {
      const mod = await import("@imgly/background-removal");
      source = await mod.removeBackground(file); // 투명 PNG
    } catch {
      source = file; // 폴백: 배경 그대로
    }
  }

  const url = URL.createObjectURL(source);
  try {
    const img = await loadImage(url);
    const canvas = document.createElement("canvas");
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    paintStudioBg(ctx, size, bg); // 사진관 느낌의 은은한 방사형 그라데이션
    // 자동 보정(밝기·대비·채도) — 인물 사진 가독성 향상. 배경은 이미 채워져 영향 없음.
    if (enhance) ctx.filter = "brightness(1.04) contrast(1.06) saturate(1.06)";
    // cover: 정사각을 꽉 채우고 가운데 정렬
    const scale = Math.max(size / img.width, size / img.height);
    const w = img.width * scale, h = img.height * scale;
    ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
    ctx.filter = "none";
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("canvas"))), "image/jpeg", 0.9),
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result as string);
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });
}

// AI(나노바나나) 배경 교체 — 서버 /api/photo-bg 호출 → 정사각 크롭. 실패 시 throw(호출부에서 처리).
export async function aiStudioPhoto(file: File, color: string, size = 640): Promise<Blob> {
  const dataUrl = await fileToDataUrl(file);
  const r = await fetch("/api/photo-bg", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ image: dataUrl, color }) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.image) { const e = new Error(j.error || "AI 처리 실패"); (e as { billing?: boolean }).billing = j.billing; throw e; }
  const img = await loadImage(j.image);
  const canvas = document.createElement("canvas");
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const scale = Math.max(size / img.width, size / img.height);
  const w = img.width * scale, h = img.height * scale;
  ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
  return await new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("canvas"))), "image/jpeg", 0.92));
}

// 파일명에서 이름 추출 (확장자·번호 제거)
export function nameFromFile(filename: string): string {
  return filename.replace(/\.[^.]+$/, "").replace(/[_-]?\d+$/, "").replace(/[_-]+/g, " ").trim();
}
