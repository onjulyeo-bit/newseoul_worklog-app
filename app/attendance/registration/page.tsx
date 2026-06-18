// 회원등록현황 (서버 로더) — 업로드한 연도별 회비(구분)+회원(가입일)+연회비 거래(교차확인).
// 보기·검색·그래프는 통계 화면(RegistrationView, 클라이언트)에서. 데이터 입력은 회계 '연도별 회비' 탭.
import { createClient } from "@/lib/supabase/server";
import RegistrationView, { type DueRow, type MemRow, type TxRow } from "./RegistrationView";

export default async function RegistrationPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let role: string | null = null;
  if (user) { const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single(); role = data?.role ?? null; }
  if (role !== "admin" && role !== "viewer") return <p className="rounded-lg border border-line bg-card px-4 py-10 text-center text-[15px] text-ink-soft">관리자 전용 화면이에요.</p>;

  const [duesR, memR, txR] = await Promise.all([
    supabase.from("annual_dues").select("name, year, amount, grade").eq("chapter_id", "새서울"),
    supabase.from("members").select("name, grade, status, joined_on").eq("chapter_id", "새서울"),
    supabase.from("transactions").select("txn_date, amount, counterparty").eq("chapter_id", "새서울").eq("category", "연회비").eq("direction", "입금"),
  ]);

  return (
    <RegistrationView
      dues={(duesR.data ?? []) as DueRow[]}
      members={(memR.data ?? []) as MemRow[]}
      txns={(txR.data ?? []) as TxRow[]}
    />
  );
}
