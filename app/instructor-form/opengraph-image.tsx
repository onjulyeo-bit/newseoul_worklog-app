// /instructor-form 링크 미리보기 카드 — 초록 "내 정보 입력 · 강사 전용".
import { ImageResponse } from "next/og";

export const alt = "내 정보 입력 · 강사 전용 · CBMC 새서울지회";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const FONT = "https://cdn.jsdelivr.net/gh/orioncactus/pretendard/packages/pretendard/dist/public/static/Pretendard-Bold.otf";

export default async function Image() {
  let fonts: { name: string; data: ArrayBuffer; weight: 700; style: "normal" }[] | undefined;
  try {
    const data = await fetch(FONT).then((r) => (r.ok ? r.arrayBuffer() : Promise.reject()));
    fonts = [{ name: "Pretendard", data, weight: 700, style: "normal" }];
  } catch { fonts = undefined; }

  return new ImageResponse(
    (
      <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", background: "linear-gradient(135deg,#0a7d3f 0%,#0a5a3a 100%)", color: "#fff", padding: 88, justifyContent: "center", fontFamily: fonts ? "Pretendard" : "sans-serif" }}>
        <div style={{ fontSize: 36, opacity: 0.85, letterSpacing: -1 }}>CBMC 새서울지회</div>
        <div style={{ fontSize: 104, fontWeight: 700, marginTop: 8, letterSpacing: -3 }}>강사님 소개</div>
        <div style={{ fontSize: 38, marginTop: 28, opacity: 0.92, letterSpacing: -1 }}>섬겨 주셔서 감사합니다 · 정성껏 모시겠습니다</div>
      </div>
    ),
    { ...size, fonts },
  );
}
