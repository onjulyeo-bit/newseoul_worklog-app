// /my-info 전용 링크 미리보기 — 앱(관리) 링크와 구분되게 제목·설명·OG이미지 별도 지정.
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "내 정보 입력 · CBMC 새서울지회",
  description: "연락처·회사·생일 등 내 정보를 직접 입력·수정하는 회원 전용 페이지입니다.",
  openGraph: {
    title: "📋 내 정보 입력 · CBMC 새서울지회",
    description: "본인 확인 후 연락처·회사 등 정보를 직접 입력해 주세요. (회원 전용)",
  },
};

export default function MyInfoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
