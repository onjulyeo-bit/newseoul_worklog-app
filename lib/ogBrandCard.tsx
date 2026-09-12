// 링크 미리보기 카드 공용 본문 — 남색 바탕에 흰 CBMC 심볼 + 영문 슬로건.
//   카톡은 카드 아래에 og:title·og:description 을 같이 보여주므로, 무엇에 대한 링크인지는 그 글자가 말하고
//   카드는 어느 링크든 같은 브랜드 마크로 통일한다(카드와 글자가 같은 말을 반복하지 않게) — 2026-09-12 사용자 결정.
//   여백은 /design 캔버스에서 맞춘 값: 심볼 180 · 영문 32 · 심볼→영문 50.
import { ImageResponse } from "next/og";
import { loadNanumSquare, loadLogoWhite } from "@/lib/ogAssets";

export const OG_SIZE = { width: 1200, height: 630 };

export async function renderBrandCard() {
  const [fonts, logo] = await Promise.all([loadNanumSquare(), loadLogoWhite()]);
  const ff = fonts ? "NanumSquare" : "sans-serif";

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", background: "#1e2353", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 70px", fontFamily: ff }}>
        {/* satori 는 next/image 를 못 그린다 — ImageResponse 안에서는 <img> 가 정답. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {logo && <img src={logo} alt="CBMC" width={286} height={180} />}
        <div style={{ display: "flex", fontSize: 32, fontWeight: 400, color: "rgba(255,255,255,0.66)", letterSpacing: 0.2, marginTop: 50 }}>Connecting Business &amp; Marketplace to Christ</div>
      </div>
    ),
    { ...OG_SIZE, fonts },
  );
}
