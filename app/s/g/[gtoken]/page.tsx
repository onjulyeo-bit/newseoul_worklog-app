// 단체(공용) 서명 링크 (서버) — 단톡방에 올린 링크 하나로 들어와 명단에서 본인을 선택. Next 16: params await.
import GroupClient from "./GroupClient";

// 카드 이미지는 브랜드 마크뿐이라, 무엇을 하는 링크인지는 아래 제목·설명이 말한다(app/opengraph-image 와 같은 원칙).
export const metadata = {
  title: "새서울지회 전자서명",
  description: "명단에서 본인 이름을 누르고 서명해 주세요.",
  openGraph: { title: "새서울지회 전자서명", description: "명단에서 본인 이름을 누르고 서명해 주세요." },
  robots: { index: false },
};

export default async function GroupSignPage({ params }: { params: Promise<{ gtoken: string }> }) {
  const { gtoken } = await params;
  return <GroupClient groupToken={gtoken} />;
}
