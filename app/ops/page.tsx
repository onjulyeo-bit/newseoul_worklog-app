// 지회 운영 허브 (서버) — 운영진(읽기 포함) 게이트 + 매뉴얼 수정일·진행중 서명·보관 서류 카운트.
//   chapter_docs 는 0060 적용 전엔 없을 수 있음 → 쿼리 오류는 0 으로 처리(배포 순서 안전).
import { getStaffGate } from "@/lib/staffGate";
import OpsHub from "./OpsHub";

export const metadata = { title: "지회 운영 · CBMC 새서울지회" };

export default async function OpsPage() {
  const { supabase, user, isStaff } = await getStaffGate();
  if (!user) return <p className="rounded-lg border border-line bg-card px-4 py-10 text-center text-[15px] text-ink-soft">로그인 후 이용해 주세요.</p>;
  if (!isStaff) return <p className="rounded-lg border border-line bg-card px-4 py-10 text-center text-[15px] text-ink-soft">지회 운영은 운영진만 볼 수 있어요.</p>;

  const [manual, active, completed, docs] = await Promise.all([
    supabase.from("manual_sections").select("key, updated_at").eq("chapter_id", "새서울"),
    supabase.from("sign_requests").select("id", { count: "exact", head: true }).eq("chapter_id", "새서울").eq("status", "active"),
    supabase.from("sign_requests").select("id", { count: "exact", head: true }).eq("chapter_id", "새서울").eq("status", "completed"),
    supabase.from("chapter_docs").select("id", { count: "exact", head: true }).eq("chapter_id", "새서울"),
  ]);

  const manualUpdated: Record<string, string> = {};
  (manual.data ?? []).forEach((r) => { if (r.key) manualUpdated[r.key] = r.updated_at; });

  const activeSigns = active.error ? 0 : (active.count ?? 0);
  const docsCount = (completed.error ? 0 : (completed.count ?? 0)) + (docs.error ? 0 : (docs.count ?? 0));

  return <OpsHub manualUpdated={manualUpdated} activeSigns={activeSigns} docsCount={docsCount} />;
}
