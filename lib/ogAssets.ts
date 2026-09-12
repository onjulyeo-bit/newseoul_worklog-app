// 링크 미리보기(OG) 카드 공용 자산 — 나눔스퀘어(로컬 서브셋) + 흰색 CBMC 로고.
//   next.config outputFileTracingIncludes 로 폰트와 public 로고를 서버리스 함수 번들에 포함.
import { readFile } from "fs/promises";
import path from "path";

const FONT = (w: string) => `https://cdn.jsdelivr.net/gh/orioncactus/pretendard/packages/pretendard/dist/public/static/Pretendard-${w}.otf`;

export type OgFonts = { name: string; data: ArrayBuffer; weight: 400 | 500 | 800 | 900; style: "normal" }[] | undefined;

// 링크 카드 본문 글꼴. 카드에 쓰는 글자만 담은 서브셋이라 20KB 미만 — 네트워크 없이 즉시 그려진다.
//   ⚠️ 서브셋 범위: 카드 문구 + ASCII. 문구를 바꾸면 lib/fonts/README.md 의 절차로 다시 서브셋할 것.
export async function loadNanumSquare(): Promise<OgFonts> {
  try {
    const [regular, extraBold] = await Promise.all([
      readFile(path.join(process.cwd(), "lib/fonts/NanumSquareR-Sub.ttf")),
      readFile(path.join(process.cwd(), "lib/fonts/NanumSquareEB-Sub.ttf")),
    ]);
    return [
      { name: "NanumSquare", data: new Uint8Array(regular).buffer, weight: 400, style: "normal" },
      { name: "NanumSquare", data: new Uint8Array(extraBold).buffer, weight: 800, style: "normal" },
    ];
  } catch { return undefined; }
}

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
