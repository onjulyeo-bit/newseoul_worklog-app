// 앱 링크(/) 미리보기 카드 — 밝은 회색 바탕 + 흰 원 안에 CBMC 심볼. 제목·문구는 카드 아래(메타데이터).
import { ImageResponse } from "next/og";
import { readFile } from "fs/promises";
import path from "path";

export const alt = "새서울지회 · 아름다운 만남";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  let mark = "";
  try {
    const buf = await readFile(path.join(process.cwd(), "public/cbmc-mark.png"));
    mark = `data:image/png;base64,${buf.toString("base64")}`;
  } catch { mark = ""; }

  return new ImageResponse(
    (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", background: "#f1f3f5" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 360, height: 360, borderRadius: 360, background: "#ffffff", border: "1px solid #e6e7ea", boxShadow: "0 10px 50px rgba(20,30,60,.10)" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {mark && <img src={mark} alt="CBMC" width={200} style={{ objectFit: "contain" }} />}
        </div>
      </div>
    ),
    size,
  );
}
