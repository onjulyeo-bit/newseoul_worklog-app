// /instructor-form 전용 링크 미리보기 — 회원용·앱 링크와 구분.
import type { Metadata } from "next";

const TITLE = "강사·간사 정보 입력 · CBMC 새서울지회";
// 카드 이미지 문구와 겹치지 않게, 제출 후 무엇이 되는지를 설명.
const DESC = "제출하신 정보는 강사·간사 명단에 자동으로 등록됩니다.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  openGraph: { title: TITLE, description: DESC },
};

export default function InstructorFormLayout({ children }: { children: React.ReactNode }) {
  return children;
}
