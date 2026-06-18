// /instructor-form 전용 링크 미리보기 — 회원용·앱 링크와 구분.
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "강사·간사 정보 입력 · CBMC 새서울지회",
  description: "강사·간사님 정보를 직접 입력해 주세요. 제출하면 자동 저장됩니다.",
  openGraph: {
    title: "🎓 강사·간사 정보 입력 · CBMC 새서울지회",
    description: "성함·소속·연락처·전문분야를 입력하면 자동 등록됩니다.",
  },
};

export default function InstructorFormLayout({ children }: { children: React.ReactNode }) {
  return children;
}
