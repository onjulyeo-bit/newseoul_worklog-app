// /my-info 링크 미리보기 카드 — 앱·서명 링크와 같은 공용 브랜드 마크(lib/ogBrandCard).
//   무엇을 하는 링크인지는 카드 아래 글자(layout.tsx 의 metadata)가 말한다.
import { OG_SIZE, renderBrandCard } from "@/lib/ogBrandCard";

export const alt = "새서울지회 내 정보 입력";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  return renderBrandCard();
}
