// 앱 링크(/) 미리보기 카드 — 정보링크(/my-info, 파랑 "내 정보 입력")와 구분되게 남색 "회원 앱".
import { ImageResponse } from "next/og";

export const alt = "새서울 CBMC · 아름다운 만남 (회원 앱)";
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
      <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", background: "linear-gradient(135deg,#1e2353 0%,#0a0d3a 100%)", color: "#fff", padding: 88, justifyContent: "center", fontFamily: fonts ? "Pretendard" : "sans-serif" }}>
        <div style={{ fontSize: 34, opacity: 0.85, letterSpacing: -1 }}>새서울 CBMC</div>
        <div style={{ fontSize: 96, fontWeight: 700, marginTop: 6, letterSpacing: -3 }}>아름다운 만남</div>
        <div style={{ fontSize: 38, marginTop: 26, opacity: 0.92, letterSpacing: -1 }}>공지 · 연간일정 · 회원명단 · 아카이브</div>
        <div style={{ display: "flex", marginTop: 40 }}>
          <div style={{ fontSize: 30, background: "#fee500", color: "#191600", borderRadius: 999, padding: "12px 30px", fontWeight: 700 }}>카카오로 로그인</div>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
