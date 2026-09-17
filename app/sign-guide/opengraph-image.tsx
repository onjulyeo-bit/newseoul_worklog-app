// 서명 안내 페이지 미리보기 카드 — 공용 브랜드 마크(lib/ogBrandCard).
//   page.tsx 가 metadata.openGraph 를 직접 지정해 루트 카드를 물려받지 못하므로 여기서 붙인다.
import { OG_SIZE, renderBrandCard } from "@/lib/ogBrandCard";

export const alt = "새서울지회 서명 방법";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  return renderBrandCard();
}
