// 앱 링크(/) 미리보기 카드 — 남색 풀블리드 + 흰 CBMC 로고 + "아름다운 만남".
//   카톡 대화창(흰 배경)에서 카드 경계가 또렷하게 보이도록 남색 배경을 씀. 디자인 원칙대로 그라데이션·금색 없음.
import { ImageResponse } from "next/og";
import { loadPretendard, loadLogoWhite } from "@/lib/ogAssets";

export const alt = "새서울 CBMC 아름다운 만남";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const [fonts, logo] = await Promise.all([loadPretendard(), loadLogoWhite()]);
  const ff = fonts ? "Pretendard" : "sans-serif";

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", background: "#1e2353", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "74px 80px", fontFamily: ff }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {logo && <img src={logo} alt="CBMC" height={96} style={{ objectFit: "contain" }} />}
          <div style={{ display: "flex", width: 1, height: 62, background: "rgba(255,255,255,0.22)", marginLeft: 26, marginRight: 26 }} />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 26, fontWeight: 500, color: "rgba(255,255,255,0.6)", letterSpacing: 4 }}>CHRISTIAN BUSINESS MEN&apos;S CONNECTION</div>
            <div style={{ fontSize: 30, fontWeight: 500, color: "rgba(255,255,255,0.9)", letterSpacing: -0.5, marginTop: 6 }}>한국 CBMC 새서울지회</div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 62, fontWeight: 500, color: "rgba(255,255,255,0.78)", letterSpacing: -2 }}>새서울 CBMC</div>
          <div style={{ fontSize: 132, fontWeight: 900, color: "#ffffff", letterSpacing: -6, marginTop: 10 }}>아름다운 만남</div>
        </div>

        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ display: "flex", width: 78, height: 7, background: "#4d7cff", borderRadius: 4, marginRight: 18 }} />
          <div style={{ fontSize: 31, fontWeight: 500, color: "rgba(255,255,255,0.66)", letterSpacing: -0.5 }}>매주 금요일 조찬모임 · 회원 · 일정 · 자료</div>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
