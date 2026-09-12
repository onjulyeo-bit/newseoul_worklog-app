// 단체(공용) 서명 링크 (서버) — 단톡방에 올린 링크 하나로 들어와 명단에서 본인을 선택. Next 16: params await.
import GroupClient from "./GroupClient";

export const metadata = {
  title: "전자서명 · 새서울 CBMC",
  description: "명단에서 본인 이름을 누르고 서명해 주세요.",
  openGraph: { title: "전자서명 · 새서울 CBMC", description: "명단에서 본인 이름을 누르고 서명해 주세요." },
  robots: { index: false },
};

export default async function GroupSignPage({ params }: { params: Promise<{ gtoken: string }> }) {
  const { gtoken } = await params;
  return <GroupClient groupToken={gtoken} />;
}
