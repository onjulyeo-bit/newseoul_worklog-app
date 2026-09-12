// 링크 미리보기(OG) 카드 공용 자산 — 앱과 같은 Pretendard + 흰색 CBMC 로고.
//   next.config outputFileTracingIncludes 로 public 로고를 서버리스 함수 번들에 포함.
import { readFile } from "fs/promises";
import path from "path";

const FONT = (w: string) => `https://cdn.jsdelivr.net/gh/orioncactus/pretendard/packages/pretendard/dist/public/static/Pretendard-${w}.otf`;

export type OgFonts = { name: string; data: ArrayBuffer; weight: 500 | 900; style: "normal" }[] | undefined;

// 실패해도 시스템 글꼴로 그려지도록 undefined 폴백.
export async function loadPretendard(): Promise<OgFonts> {
  try {
    const [medium, black] = await Promise.all([
      fetch(FONT("Medium")).then((r) => (r.ok ? r.arrayBuffer() : Promise.reject())),
      fetch(FONT("Black")).then((r) => (r.ok ? r.arrayBuffer() : Promise.reject())),
    ]);
    return [
      { name: "Pretendard", data: medium, weight: 500, style: "normal" },
      { name: "Pretendard", data: black, weight: 900, style: "normal" },
    ];
  } catch { return undefined; }
}

export async function loadLogoWhite(): Promise<string> {
  try {
    const buf = await readFile(path.join(process.cwd(), "public/cbmc-logo-white.png"));
    return `data:image/png;base64,${buf.toString("base64")}`;
  } catch { return ""; }
}
