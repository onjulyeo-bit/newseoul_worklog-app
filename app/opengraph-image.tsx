// 앱 링크(/) 미리보기 카드 — 남색 바탕에 제목 · 지회 구호 · 흰 CBMC 심볼을 중앙 정렬.
//   카톡 대화창(흰 배경)에서 카드 경계가 또렷하게 보이도록 남색 배경을 씀. 디자인 원칙대로 그라데이션·금색 없음.
//   여백은 /디자인 캔버스에서 맞춘 값 그대로(2026-09-12): 위아래 위치 38 · 제목→구호 70 · 구호→구분선 34 · 구분선→로고 26.
//   ⚠️ 세로 위치 38px 는 marginTop 76 으로 준다 — justifyContent:center 안에서는 바깥 여백이 절반만 밀어내기 때문.
import { ImageResponse } from "next/og";
import { loadNanumSquare, loadLogoWhite } from "@/lib/ogAssets";

export const alt = "새서울 CBMC 아름다운 만남";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const SLOGAN = ["예수님께 속한, 새서울!", "사랑으로 하나되는, 새서울!", "성령님과 동행하는, 새서울!"];

export default async function Image() {
  const [fonts, logo] = await Promise.all([loadNanumSquare(), loadLogoWhite()]);
  const ff = fonts ? "NanumSquare" : "sans-serif";

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", background: "#1e2353", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "52px 70px", fontFamily: ff }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 76 }}>
          <div style={{ display: "flex", fontSize: 74, fontWeight: 800, color: "#ffffff", letterSpacing: -3.5, lineHeight: 1.1 }}>새서울 CBMC 아름다운 만남</div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 70 }}>
            {SLOGAN.map((line, i) => (
              <div key={line} style={{ display: "flex", fontSize: 30, fontWeight: 400, color: "#9fb2ff", letterSpacing: -0.8, marginTop: i === 0 ? 0 : 8 }}>{line}</div>
            ))}
          </div>

          <div style={{ display: "flex", width: 70, height: 1, background: "rgba(255,255,255,0.2)", marginTop: 34 }} />

          {logo && <img src={logo} alt="CBMC" width={83} height={52} style={{ marginTop: 26 }} />}
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
