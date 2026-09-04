"use client";
// pdf.js 로 base64 PDF 를 페이지별 캔버스에 렌더 (클라이언트 전용). 서명 마법사·미리보기 공용.
//   워커: public/pdf.worker.min.mjs (pdfjs-dist 와 같은 버전으로 복사해 둠).
import type { PDFDocumentProxy } from "pdfjs-dist";

export type PageView = { idx: number; width: number; height: number; scale: number; ptW: number; ptH: number };

export function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export async function loadPdf(b64: string): Promise<PDFDocumentProxy> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  return pdfjs.getDocument({ data: b64ToBytes(b64) }).promise;
}

// 컨테이너 폭에 맞춘 페이지 크기 계산
export async function measurePages(doc: PDFDocumentProxy, containerWidth: number): Promise<PageView[]> {
  const views: PageView[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const base = page.getViewport({ scale: 1 });
    const scale = containerWidth / base.width;
    views.push({ idx: i, width: Math.round(base.width * scale), height: Math.round(base.height * scale), scale, ptW: base.width, ptH: base.height });
  }
  return views;
}

export async function renderPage(doc: PDFDocumentProxy, v: PageView, canvas: HTMLCanvasElement) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const page = await doc.getPage(v.idx);
  const vp = page.getViewport({ scale: v.scale * dpr });
  canvas.width = vp.width; canvas.height = vp.height;
  canvas.style.width = `${v.width}px`; canvas.style.height = `${v.height}px`;
  await page.render({ canvas, viewport: vp }).promise;
}

// PDF 좌표(pt, 좌하단 원점) ↔ 화면 픽셀(좌상단 원점)
export function ptToPx(v: PageView, s: { x: number; y: number; w: number; h: number }) {
  return { left: s.x * v.scale, top: (v.ptH - s.y - s.h) * v.scale, width: s.w * v.scale, height: s.h * v.scale };
}
export function pxToPt(v: PageView, r: { left: number; top: number; width: number; height: number }) {
  const w = r.width / v.scale, h = r.height / v.scale;
  return { x: r.left / v.scale, y: v.ptH - r.top / v.scale - h, w, h };
}

// 서명란 자동 찾기용: 페이지별 텍스트 조각(pt 좌표) 추출
export async function extractPageText(doc: PDFDocumentProxy): Promise<import("./pdfDetect").PageText[]> {
  const out: import("./pdfDetect").PageText[] = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p); const vp = page.getViewport({ scale: 1 });
    const tc = await page.getTextContent();
    const items = (tc.items as Array<{ str?: string; transform?: number[]; width?: number; height?: number }>)
      .filter((i) => typeof i.str === "string" && i.transform)
      .map((i) => ({ str: i.str!, x: i.transform![4], y: i.transform![5], w: i.width ?? 0, h: i.height ?? 0 }));
    out.push({ page: p, ptW: vp.width, ptH: vp.height, items });
  }
  return out;
}
