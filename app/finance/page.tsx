// 회계 진입 → 탭 기본 화면(거래 내역)으로.
import { redirect } from "next/navigation";

export default function FinancePage() {
  redirect("/finance/transactions");
}
