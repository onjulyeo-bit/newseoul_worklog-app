// 연도별 회원등록 현황 (서버 로더) — 결산 확정값(annual_summary) 기반.
// 참고용 추정치는 납부내역(annual_dues)+가입일(members)로 계산해 입력을 돕는다(확정값은 수기).
import { createClient } from "@/lib/supabase/server";
import RegistrationView, { type SummaryRow, type SuggestRow } from "./RegistrationView";
import { jungOf, junOf } from "@/lib/parseDuesXlsx";

export default async function RegistrationPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let role: string | null = null;
  if (user) { const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single(); role = data?.role ?? null; }
  if (role !== "admin" && role !== "viewer") return <p className="rounded-lg border border-line bg-card px-4 py-10 text-center text-[15px] text-ink-soft">관리자 전용 화면이에요.</p>;

  const [sumR, duesR, memR] = await Promise.all([
    supabase.from("annual_summary").select("year, jung_count, jun_count, new_count, fee_income, donation, note").eq("chapter_id", "새서울"),
    supabase.from("annual_dues").select("year, amount, grade").eq("chapter_id", "새서울"),
    supabase.from("members").select("joined_on").eq("chapter_id", "새서울"),
  ]);
  const summaries = (sumR.data ?? []) as SummaryRow[];
  const dues = duesR.data ?? [];
  const members = memR.data ?? [];

  // 참고 추정(납부내역 기준): 연도별 정/준 후보 + 가입일 기준 신입 수
  const yearsSet = new Set<number>();
  dues.forEach((d) => yearsSet.add(d.year));
  members.forEach((m) => { const y = parseInt((m.joined_on ?? "").slice(0, 4), 10); if (y) yearsSet.add(y); });
  const suggest: SuggestRow[] = [...yearsSet].map((year) => {
    const paid = dues.filter((d) => d.year === year && (d.amount ?? 0) > 0);
    return {
      year,
      jung: paid.reduce((s, d) => s + jungOf(d.grade ?? null, d.amount), 0),
      jun: paid.reduce((s, d) => s + junOf(d.grade ?? null, d.amount), 0),
      newC: members.filter((m) => (m.joined_on ?? "").slice(0, 4) === String(year)).length,
      income: paid.reduce((s, d) => s + (d.amount ?? 0), 0),
    };
  });

  return <RegistrationView summaries={summaries} suggest={suggest} canEdit={role === "admin"} />;
}
