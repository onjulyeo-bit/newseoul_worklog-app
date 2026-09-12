// 앱 링크(/) 미리보기 카드 — 공용 브랜드 마크(lib/ogBrandCard).
//   카드 아래에 붙는 한글 제목·설명은 app/layout.tsx 의 metadata 가 담당.
import { OG_SIZE, renderBrandCard } from "@/lib/ogBrandCard";

export const alt = "새서울지회 아름다운 만남";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  return renderBrandCard();
}
