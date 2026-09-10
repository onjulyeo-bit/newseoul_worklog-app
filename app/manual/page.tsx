// 운영 매뉴얼 허브는 지회 운영 허브(/ops)로 통합됨 (2026-09-10). 섹션 상세 /manual/[key] 는 그대로 사용.
import { redirect } from "next/navigation";

export default function ManualPage() {
  redirect("/ops");
}
