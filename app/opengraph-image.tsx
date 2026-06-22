// 앱 링크(/) 미리보기 카드 — 밝은 회색 바탕 + 흰색 타일에 CBMC 로고. 제목·문구는 카드 아래(메타데이터).
import { ImageResponse } from "next/og";
import { readFile } from "fs/promises";
import path from "path";

export const alt = "새서울지회 · 아름다운 만남";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  let logo = "";
  try {
    const buf = await readFile(path.join(process.cwd(), "public/cbmc-symbol.png"));
    logo = `data:image/png;base64,${buf.toString("base64")}`;
  } catch { logo = ""; }

  return new ImageResponse(
    (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", background: "#f1f3f5" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "#ffffff", borderRadius: 44, padding: "76px 120px", border: "1px solid #e6e7ea", boxShadow: "0 10px 50px rgba(20,30,60,.10)" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {logo && <img src={logo} alt="CBMC" width={440} style={{ objectFit: "contain" }} />}
        </div>
      </div>
    ),
    size,
  );
}
