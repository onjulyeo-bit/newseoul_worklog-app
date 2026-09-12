// 단체 서명 링크 미리보기 카드 — 단톡방에 링크만 올려도 무엇인지 한눈에 보이게.
import { ImageResponse } from "next/og";
import { loadPretendard, loadLogoWhite } from "@/lib/ogAssets";

export const alt = "전자서명 · 새서울 CBMC";
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
          {logo && <img src={logo} alt="CBMC" height={84} style={{ objectFit: "contain" }} />}
          <div style={{ display: "flex", width: 1, height: 54, background: "rgba(255,255,255,0.22)", marginLeft: 24, marginRight: 24 }} />
          <div style={{ display: "flex", fontSize: 30, fontWeight: 500, color: "rgba(255,255,255,0.9)", letterSpacing: -0.5 }}>한국 CBMC 새서울지회</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 58, fontWeight: 500, color: "rgba(255,255,255,0.78)", letterSpacing: -2 }}>새서울 CBMC</div>
          <div style={{ fontSize: 128, fontWeight: 900, color: "#ffffff", letterSpacing: -6, marginTop: 8 }}>전자서명</div>
        </div>

        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ display: "flex", width: 78, height: 7, background: "#4d7cff", borderRadius: 4, marginRight: 18 }} />
          <div style={{ fontSize: 33, fontWeight: 500, color: "rgba(255,255,255,0.72)", letterSpacing: -0.5 }}>본인 이름을 눌러 서명해 주세요</div>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
