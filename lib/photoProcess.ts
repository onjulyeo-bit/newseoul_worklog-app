// 사진 처리(브라우저 전용) — 배경 제거 후 단색 배경으로 통일 + 정사각 크롭.
//   @imgly/background-removal 동적 import(무료·로컬 처리, 사진 외부 전송 없음).
//   배경 제거 실패 시 원본을 그대로 정사각 크롭(폴백) — 업로드는 항상 성공.

export type ProcessOpts = { bg?: string; size?: number; removeBg?: boolean; enhance?: boolean };

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
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, size, size);
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

// 파일명에서 이름 추출 (확장자·번호 제거)
export function nameFromFile(filename: string): string {
  return filename.replace(/\.[^.]+$/, "").replace(/[_-]?\d+$/, "").replace(/[_-]+/g, " ").trim();
}
