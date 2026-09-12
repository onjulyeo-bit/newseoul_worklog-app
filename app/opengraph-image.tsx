// 앱 링크(/) 미리보기 카드 — 남색 바탕에 흰 CBMC 심볼 + 영문 슬로건만.
//   카톡은 카드 아래에 og:title·og:description 을 같이 보여주므로 한글(지회명·구호)은 그쪽(app/layout.tsx)에 두고,
//   카드에는 같은 말을 반복하지 않는다. 카드=브랜드 마크, 글자=내용 — 2026-09-12 사용자 결정.
//   여백은 /design 캔버스에서 맞춘 값: 심볼 180 · 영문 32 · 심볼→영문 50.
import { ImageResponse } from "next/og";
import { loadNanumSquare, loadLogoWhite } from "@/lib/ogAssets";

export const alt = "새서울지회 아름다운 만남";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const [fonts, logo] = await Promise.all([loadNanumSquare(), loadLogoWhite()]);
  const ff = fonts ? "NanumSquare" : "sans-serif";

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", background: "#1e2353", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 70px", fontFamily: ff }}>
        {logo && <img src={logo} alt="CBMC" width={286} height={180} />}
        <div style={{ display: "flex", fontSize: 32, fontWeight: 400, color: "rgba(255,255,255,0.66)", letterSpacing: 0.2, marginTop: 50 }}>Connecting Business &amp; Marketplace to Christ</div>
      </div>
    ),
    { ...size, fonts },
  );
}
