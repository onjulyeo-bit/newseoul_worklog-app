// 개인 서명 링크 미리보기 카드 — 앱·단체 링크와 같은 공용 브랜드 마크(lib/ogBrandCard).
//   ⚠️ page.tsx 가 metadata.openGraph 를 직접 지정하면 루트 app/opengraph-image 를 물려받지 못한다
//      (2026-09-17 확인: /login 처럼 metadata 가 없는 페이지만 상속됨). 그래서 이 파일이 필요하다.
import { OG_SIZE, renderBrandCard } from "@/lib/ogBrandCard";

export const alt = "새서울지회 서명";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  return renderBrandCard();
}
