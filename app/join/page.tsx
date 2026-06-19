// 입회 안내(/join) — 공개용 단독 페이지. 콘텐츠는 JoinContent(공용) 사용.
//   공지(NoticesBoard) '입회안내' 탭에서도 같은 콘텐츠를 보여준다.
import JoinContent from "./JoinContent";

export const metadata = {
  title: "입회 안내 · 새서울 CBMC",
  description: "CBMC 새서울지회 입회 절차 안내 — 정기모임 3회 이상 참석 후 면담을 거쳐 정회원으로 등록됩니다.",
};

export default function JoinPage() {
  return <JoinContent />;
}
