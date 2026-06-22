// 앱 링크(/) 미리보기 카드 — 로고만 위, 아래 새서울지회·아름다운 만남, 그 밑 환영 문구.
import { ImageResponse } from "next/og";
import { readFile } from "fs/promises";
import path from "path";

export const alt = "새서울지회 · 아름다운 만남";
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
    const buf = await readFile(path.join(process.cwd(), "public/cbmc-mark.png"));
    logo = `data:image/png;base64,${buf.toString("base64")}`;
  } catch { logo = ""; }

  return new ImageResponse(
    (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", background: "#ffffff", fontFamily: fonts ? "Pretendard" : "sans-serif" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {logo && <img src={logo} alt="CBMC" width={170} style={{ objectFit: "contain", marginBottom: 40 }} />}
        <div style={{ fontSize: 60, fontWeight: 700, color: "#16181d", letterSpacing: -2 }}>새서울지회 · 아름다운 만남</div>
        <div style={{ fontSize: 34, color: "#5b616b", marginTop: 22, letterSpacing: -1 }}>환영합니다. 축복합니다. 카카오 로그인하세요</div>
      </div>
    ),
    { ...size, fonts },
  );
}
