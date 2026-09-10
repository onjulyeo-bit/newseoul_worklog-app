// 서명 현황판 (서버) — 슬롯별 상태·링크 공유·서명본 PDF. 운영진(읽기 포함) 전용. Next 16: params await.
import { getStaffGate } from "@/lib/staffGate";
import SignStatus from "./SignStatus";
import type { SignRequestRow, SignSlotRow, SignSignerRow } from "@/lib/signTypes";

export default async function SignStatusPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, isStaff, canEdit } = await getStaffGate();
  if (!isStaff) return <p className="rounded-lg border border-line bg-card px-4 py-10 text-center text-[15px] text-ink-soft">운영진 전용 화면이에요.</p>;

  const [{ data: req }, { data: slots }, { data: signers }, { data: sent }, gt] = await Promise.all([
    supabase.from("sign_requests").select("id, title, description, status, expires_at, created_at, updated_at").eq("id", id).single(),
    supabase.from("sign_slots").select("id, request_id, label, page, x, y, w, h, order_no").eq("request_id", id).order("order_no"),
    supabase.from("sign_signers").select("id, request_id, slot_id, member_id, name, phone, token, status, viewed_at, signed_at, ip, auth_kakao_id").eq("request_id", id),
    supabase.from("sign_events").select("signer_id").eq("request_id", id).eq("event", "link_sent"),
    supabase.from("sign_requests").select("group_token").eq("id", id).single(), // 0061 미적용이면 error → null (별도 쿼리라 본 화면엔 영향 없음)
  ]);
  if (!req) return <p className="rounded-lg border border-line bg-card px-4 py-10 text-center text-[15px] text-ink-soft">서명 요청을 찾을 수 없어요.</p>;

  const groupToken = gt.error ? null : ((gt.data as { group_token?: string | null } | null)?.group_token ?? null);
  const sentIds = new Set((sent ?? []).map((e) => e.signer_id).filter(Boolean) as string[]);
  return (
    <SignStatus
      request={req as SignRequestRow}
      slots={(slots ?? []) as SignSlotRow[]}
      signers={(signers ?? []) as SignSignerRow[]}
      sentIds={[...sentIds]}
      canEdit={canEdit}
      groupToken={groupToken}
    />
  );
}
