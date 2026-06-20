// 앱 링크(/) 미리보기 카드 — 노션/줌처럼 심플하게: CBMC 심볼 + "새서울 CBMC" 중앙 배치.
//   설명("사랑하고 축복합니다…")은 og:description(layout.tsx)에서 카드 아래에 표시됨.
import { ImageResponse } from "next/og";
import { readFile } from "fs/promises";
import path from "path";

export const alt = "새서울 CBMC";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const FONT = "https://cdn.jsdelivr.net/gh/orioncactus/pretendard/packages/pretendard/dist/public/static/Pretendard-Bold.otf";

export default async function Image() {
  let fonts: { name: string; data: ArrayBuffer; weight: 700; style: "normal" }[] | undefined;
  try {
    const data = await fetch(FONT).then((r) => (r.ok ? r.arrayBuffer() : Promise.reject()));
    fonts = [{ name: "Pretendard", data, weight: 700, style: "normal" }];
  } catch { fonts = undefined; }

  let logo = "";
  try {
    const buf = await readFile(path.join(process.cwd(), "public/cbmc-symbol.png"));
    logo = `data:image/png;base64,${buf.toString("base64")}`;
  } catch { logo = ""; }

  return new ImageResponse(
    (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", background: "#ffffff", fontFamily: fonts ? "Pretendard" : "sans-serif", gap: 36 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {logo && <img src={logo} alt="CBMC" width={300} style={{ objectFit: "contain" }} />}
        <div style={{ fontSize: 70, fontWeight: 700, color: "#16181d", letterSpacing: -2 }}>새서울 CBMC</div>
      </div>
    ),
    { ...size, fonts },
  );
}
