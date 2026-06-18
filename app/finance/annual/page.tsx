// 연간결산은 통계로 이동했어요 → /attendance/annual 로 리다이렉트.
import { redirect } from "next/navigation";

export default function FinanceAnnualRedirect() {
  redirect("/attendance/annual");
}
