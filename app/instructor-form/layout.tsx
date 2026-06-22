// /instructor-form 전용 링크 미리보기 — 회원용·앱 링크와 구분.
import type { Metadata } from "next";

const TITLE = "강사님 소개 · CBMC 새서울지회";
const DESC = "귀한 걸음으로 섬겨 주셔서 감사합니다. 정보를 남겨 주시면 정성껏 모시겠습니다.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  openGraph: { title: TITLE, description: DESC },
};

export default function InstructorFormLayout({ children }: { children: React.ReactNode }) {
  return children;
}
