// /my-info 전용 링크 미리보기 — 앱(관리) 링크와 구분되게 제목·설명·OG이미지 별도 지정.
import type { Metadata } from "next";

// 카드 이미지는 브랜드 마크뿐 — 무엇을 하는 링크인지는 이 제목·설명이 말한다(다른 링크들과 같은 원칙).
const TITLE = "새서울지회 내 정보 입력";
const DESC = "입력하신 정보는 회원 명부에 등록되어 교제와 소식 전달에 사용됩니다.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  openGraph: { title: TITLE, description: DESC },
};

export default function MyInfoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
