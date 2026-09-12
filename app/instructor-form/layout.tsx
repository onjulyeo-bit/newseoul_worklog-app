// /instructor-form 전용 링크 미리보기 — 회원용·앱 링크와 구분.
import type { Metadata } from "next";

// 카드 이미지는 브랜드 마크뿐 — 무엇을 하는 링크인지는 이 제목·설명이 말한다(다른 링크들과 같은 원칙).
const TITLE = "새서울지회 강사님 소개";
const DESC = "귀한 걸음으로 섬겨 주셔서 감사합니다. 정보를 남겨 주시면 정성껏 모시겠습니다.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  openGraph: { title: TITLE, description: DESC },
};

export default function InstructorFormLayout({ children }: { children: React.ReactNode }) {
  return children;
}
