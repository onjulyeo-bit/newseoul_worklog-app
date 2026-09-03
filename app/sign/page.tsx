// 서명 요청 목록 (서버) — 진행중 / 완료(서류함) / 만료·취소. 운영진(읽기 포함) 전용.
import { getStaffGate } from "@/lib/staffGate";
import SignList, { type ReqItem } from "./SignList";

export default async function SignPage() {
  const { supabase, isStaff, canEdit } = await getStaffGate();
  if (!isStaff) return <p className="rounded-lg border border-line bg-card px-4 py-10 text-center text-[15px] text-ink-soft">운영진 전용 화면이에요.</p>;

  const [{ data: reqs }, { data: signers }] = await Promise.all([
    supabase.from("sign_requests").select("id, title, description, status, expires_at, created_at, updated_at").eq("chapter_id", "새서울").order("created_at", { ascending: false }),
    supabase.from("sign_signers").select("request_id, status"),
  ]);

  const items: ReqItem[] = (reqs ?? []).map((r) => {
    const mine = (signers ?? []).filter((s) => s.request_id === r.id);
    return { ...r, total: mine.length, signed: mine.filter((s) => s.status === "signed").length };
  });

  return <SignList items={items} canEdit={canEdit} />;
}
