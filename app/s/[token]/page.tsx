// 서명자 화면 (서버) — 토큰 링크 /s/[token]. 로그인 불필요, SiteNav 숨김.
//   Next 16: params 는 await 필요.
import SignClient from "./SignClient";

export const metadata = {
  title: "서명 · 새서울 CBMC",
  description: "문서를 확인하고 서명해 주세요.",
  openGraph: { title: "서명 · 새서울 CBMC", description: "문서를 확인하고 서명해 주세요." },
  robots: { index: false },
};

export default async function SignPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <SignClient token={token} />;
}
