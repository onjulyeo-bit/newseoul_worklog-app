// /my-info 링크 미리보기 카드 — 앱 링크와 한눈에 구분되는 파란 "내 정보 입력" 이미지.
import { ImageResponse } from "next/og";

export const alt = "내 정보 입력 · CBMC 새서울지회";
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
      <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", background: "linear-gradient(135deg,#00559e 0%,#0a3a86 100%)", color: "#fff", padding: 88, justifyContent: "center", fontFamily: fonts ? "Pretendard" : "sans-serif" }}>
        <div style={{ fontSize: 36, opacity: 0.85, letterSpacing: -1 }}>CBMC 새서울지회</div>
        <div style={{ fontSize: 110, fontWeight: 700, marginTop: 8, letterSpacing: -3 }}>내 정보 입력</div>
        <div style={{ fontSize: 40, marginTop: 28, opacity: 0.92, letterSpacing: -1 }}>연락처 · 회사 · 생일 등을 직접 입력해 주세요</div>
        <div style={{ display: "flex", marginTop: 40 }}>
          <div style={{ fontSize: 30, background: "rgba(255,255,255,.18)", borderRadius: 999, padding: "12px 28px" }}>회원 전용 · 본인 확인 후 작성</div>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
