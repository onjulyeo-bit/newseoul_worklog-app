// 서명 합성 (서버 전용) — 원본 PDF(base64) + 슬롯별 서명 PNG(base64) → 서명이 들어간 PDF bytes.
//   사양서 §4 'PDF 합성': 박스 안 비율 유지·여백 6%, 서명 아래 7pt 회색 '서명일시', 마지막에 서명 증빙 페이지 1장.
//   최종 PDF는 저장하지 않고 볼 때마다 합성한다(원본·서명이 모두 DB에 있어 언제든 동일 재생성 — service_role·추가 마이그레이션 불필요).
//   미서명 슬롯은 건너뛰므로 '현재까지 서명본'(부분 합성)도 같은 함수로 만든다.
//   한글 폰트: lib/fonts/Pretendard.ttf (OFL, TrueType — CFF OTF 는 fontkit 서브셋 불가). next.config outputFileTracingIncludes 로 서버리스 함수에 포함.
import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { readFile } from "fs/promises";
import path from "path";

export type ComposeSlot = {
  page: number; x: number; y: number; w: number; h: number; label: string;
  signerName: string;
  signatureB64: string | null;   // 순수 base64 PNG (data URL 접두어 없음)
  signedAt: string | null;       // ISO
  ip: string | null;
  authKakao: boolean;
};
export type ComposeInput = {
  title: string;
  sourceB64: string;
  slots: ComposeSlot[];
  evidencePage?: boolean;        // 기본 true
};

let fontBytes: Uint8Array | null = null;
async function loadFont(): Promise<Uint8Array> {
  if (!fontBytes) fontBytes = new Uint8Array(await readFile(path.join(process.cwd(), "lib/fonts/Pretendard.ttf")));
  return fontBytes;
}

// 서버는 UTC 일 수 있으므로 항상 한국 시각으로 표기.
export function fmtKST(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const p = new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false })
    .formatToParts(d).reduce<Record<string, string>>((a, x) => { a[x.type] = x.value; return a; }, {});
  return `${p.year}.${p.month}.${p.day} ${p.hour}:${p.minute}`;
}

// IP 앞 두 자리만 보이고 나머지 마스킹 (사양서 §4-4).
function maskIp(ip: string | null): string {
  if (!ip) return "-";
  const v4 = ip.split(".");
  if (v4.length === 4) return `${v4[0]}.${v4[1]}.***.***`;
  return ip.slice(0, 6) + "…";
}

export async function composeSignedPdf(input: ComposeInput): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(Buffer.from(input.sourceB64, "base64"), { ignoreEncryption: true });
  pdf.registerFontkit(fontkit);
  const font = await pdf.embedFont(await loadFont(), { subset: true });
  const pages = pdf.getPages();
  const gray = rgb(0.45, 0.47, 0.52);

  for (const s of input.slots) {
    if (!s.signatureB64) continue;
    const page = pages[s.page - 1];
    if (!page) continue;
    let png;
    try { png = await pdf.embedPng(Buffer.from(s.signatureB64, "base64")); } catch { continue; }
    const padX = s.w * 0.06, padY = s.h * 0.06;
    const boxW = s.w - padX * 2, boxH = s.h - padY * 2;
    const scale = Math.min(boxW / png.width, boxH / png.height);
    const dw = png.width * scale, dh = png.height * scale;
    page.drawImage(png, { x: s.x + padX + (boxW - dw) / 2, y: s.y + padY + (boxH - dh) / 2, width: dw, height: dh });
    if (s.signedAt) {
      page.drawText(`서명일시 ${fmtKST(s.signedAt)}`, { x: s.x + padX, y: Math.max(4, s.y - 9), size: 7, font, color: gray });
    }
  }

  if (input.evidencePage !== false) addEvidencePage(pdf, font, input, pages[0]);
  return pdf.save();
}

// 서명 증빙 페이지: 문서 제목, 서명자별 이름·일시·인증방식·IP(마스킹). 미서명자는 '미서명'.
function addEvidencePage(pdf: PDFDocument, font: PDFFont, input: ComposeInput, like: PDFPage | undefined) {
  const w = like?.getWidth() ?? 595.28, h = like?.getHeight() ?? 841.89;
  const page = pdf.addPage([w, h]);
  const ink = rgb(0.09, 0.09, 0.11), gray = rgb(0.45, 0.47, 0.52), line = rgb(0.85, 0.86, 0.88);
  const L = 56, R = w - 56;
  let y = h - 70;
  const text = (t: string, x: number, size: number, color = ink) => page.drawText(t, { x, y, size, font, color });

  text("서명 증빙", L, 18); y -= 24;
  text(input.title, L, 11, gray); y -= 14;
  text(`생성 ${fmtKST(new Date().toISOString())} · 새서울 CBMC 전자서명`, L, 8.5, gray); y -= 22;
  page.drawLine({ start: { x: L, y }, end: { x: R, y }, thickness: 0.8, color: line }); y -= 18;

  // 헤더
  const cols = [L, L + 34, L + 150, L + 290, L + 370];
  const hdr = ["#", "서명자", "서명일시", "인증", "IP"];
  hdr.forEach((t, i) => page.drawText(t, { x: cols[i], y, size: 8.5, font, color: gray })); y -= 14;

  const signed = input.slots.filter((s) => s.signatureB64).length;
  input.slots.forEach((s, i) => {
    if (y < 60) return;
    const done = !!s.signatureB64;
    const who = s.label && s.label !== s.signerName ? `${s.signerName} (${s.label})` : s.signerName;
    const row = [String(i + 1), who, done ? fmtKST(s.signedAt) : "미서명", done ? (s.authKakao ? "카카오" : "링크") : "-", done ? maskIp(s.ip) : "-"];
    row.forEach((t, c) => page.drawText(t, { x: cols[c], y, size: 9.5, font, color: done ? ink : gray, maxWidth: c === 1 ? 112 : undefined }));
    y -= 16;
  });
  y -= 6;
  page.drawLine({ start: { x: L, y }, end: { x: R, y }, thickness: 0.8, color: line }); y -= 16;
  text(`서명 ${signed} / ${input.slots.length}`, L, 9.5, gray);
  page.drawText("본 페이지는 전자서명 시스템이 자동 생성한 증빙입니다. 각 서명은 서명자 고유 링크로 수집되었으며 서명 시각·접속 정보가 함께 기록되었습니다.",
    { x: L, y: 44, size: 7.5, font, color: gray, maxWidth: R - L, lineHeight: 10 });
}
