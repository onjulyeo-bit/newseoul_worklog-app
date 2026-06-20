// /my-info 전용 링크 미리보기 — 앱(관리) 링크와 구분되게 제목·설명·OG이미지 별도 지정.
import type { Metadata } from "next";

const TITLE = "내 정보 입력 · CBMC 새서울지회";
// 카드 이미지에 이미 적힌 문구("연락처·회사·생일 입력")와 겹치지 않게, 용도(왜 입력하는지)를 설명.
const DESC = "입력하신 정보는 회원 명부에 등록되어 교제와 소식 전달에 사용됩니다.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  openGraph: { title: TITLE, description: DESC },
};

export default function MyInfoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
