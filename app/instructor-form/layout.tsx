// /instructor-form 전용 링크 미리보기 — 회원용·앱 링크와 구분.
import type { Metadata } from "next";

const TITLE = "내 정보 입력 · 강사 전용 · CBMC 새서울지회";
// 카드 이미지 문구와 겹치지 않게, 제출 후 무엇이 되는지를 설명.
const DESC = "강사님 정보를 직접 입력해 주세요. 새서울 CBMC 운영에 소중히 쓰입니다.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  openGraph: { title: TITLE, description: DESC },
};

export default function InstructorFormLayout({ children }: { children: React.ReactNode }) {
  return children;
}
