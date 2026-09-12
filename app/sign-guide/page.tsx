// 서명 방법 안내 — 단톡방에 링크로 올리고, 서명 화면에서도 [서명 방법 보기]로 들어온다.
//   로그인 불필요·SiteNav 숨김(/sign-guide 는 SiteNav 제외 목록에 포함).
//   영상/그림은 public/sign-guide.mp4 · sign-guide.png (촬영·합성 절차는 정본 02 변경이력 2026-09-12).
export const metadata = {
  title: "새서울지회 서명 방법",
  description: "링크를 누르고 1분이면 끝납니다. 순서대로 보여드립니다.",
  openGraph: { title: "새서울지회 서명 방법", description: "링크를 누르고 1분이면 끝납니다. 순서대로 보여드립니다." },
  robots: { index: false },
};

export default function SignGuidePage() {
  return (
    <main style={{ minHeight: "100dvh", background: "#f4f5f8" }}>
      <div style={{ background: "#1e2353", color: "#fff", padding: "28px 20px 26px" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <div style={{ fontSize: 15, letterSpacing: 1, color: "#9fb2ff", fontWeight: 700 }}>새서울 CBMC</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: "8px 0 6px", letterSpacing: -0.8 }}>전자서명 하는 방법</h1>
          <p style={{ margin: 0, fontSize: 16, color: "rgba(255,255,255,0.72)" }}>링크를 누르고 1분이면 끝납니다.</p>
        </div>
      </div>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "20px 16px 56px" }}>
        <video
          controls
          playsInline
          preload="metadata"
          poster="/sign-guide-poster.png"
          style={{ width: "100%", borderRadius: 14, background: "#1e2353", display: "block" }}
        >
          <source src="/sign-guide.mp4" type="video/mp4" />
          영상을 재생할 수 없습니다. 아래 그림 설명을 봐 주세요.
        </video>

        {/* 단계별 그림(/sign-guide.png)은 화면이 복잡해 보여 뺐다(2026-09-12 사용자 판단). 파일은 남겨 둠. */}
        <p style={{ fontSize: 15, color: "#5b6072", lineHeight: 1.7, margin: "26px 2px 0", textAlign: "center" }}>
          잘 안 되시면 언제든 사무국으로 연락 주세요.
          <br />
          감사합니다 · 새서울 CBMC
        </p>
      </div>
    </main>
  );
}
