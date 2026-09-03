"use server";

// 서명 요청 관리 — 생성(문서+슬롯+서명자)·취소·삭제·링크 발송 기록. (RLS 상 운영진만)
//   원본 PDF 는 sign_requests.source_pdf_data(base64) 에 보관(0058, service_role 미사용 설계).
//   서명자 토큰은 nanoid(32) — 링크 = /s/{token}.
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";
import type { NewSlot, NewSigner } from "@/lib/signTypes";

const MAX_PDF_B64 = 7_000_000; // 원본 PDF 5MB (base64 ≈ 6.7MB)

export async function createSignRequest(input: {
  title: string; description: string | null; expires_at: string | null;
  pdf_b64: string; slots: NewSlot[]; signers: NewSigner[];
}) {
  const title = input.title.trim();
  if (!title) return { error: "제목을 입력해 주세요." };
  if (!input.pdf_b64) return { error: "PDF 파일을 올려 주세요." };
  if (input.pdf_b64.length > MAX_PDF_B64) return { error: "PDF 가 5MB 를 넘어요. 용량을 줄여서 다시 올려 주세요." };
  if (input.slots.length === 0) return { error: "서명란을 하나 이상 지정해 주세요." };
  const missing = input.slots.filter((s) => !input.signers.some((g) => g.slotKey === s.key && g.name.trim()));
  if (missing.length) return { error: `서명자가 배정되지 않은 서명란이 ${missing.length}개 있어요: ${missing.map((s) => s.label).join(", ")}` };

  const supabase = await createClient();
  const { data: req, error: e1 } = await supabase
    .from("sign_requests")
    .insert({ chapter_id: "새서울", title, description: input.description?.trim() || null, expires_at: input.expires_at || null, status: "active", source_pdf_data: input.pdf_b64 })
    .select("id").single();
  if (e1 || !req) return { error: e1?.message ?? "요청 생성 실패" };

  const slotRows = input.slots.map((s, i) => ({ request_id: req.id, label: s.label.trim() || `서명 ${i + 1}`, page: s.page, x: s.x, y: s.y, w: s.w, h: s.h, order_no: i + 1 }));
  const { data: slots, error: e2 } = await supabase.from("sign_slots").insert(slotRows).select("id, order_no");
  if (e2 || !slots) { await supabase.from("sign_requests").delete().eq("id", req.id); return { error: e2?.message ?? "서명란 저장 실패" }; }

  const slotIdByKey = new Map<string, string>();
  input.slots.forEach((s, i) => { const row = slots.find((r) => r.order_no === i + 1); if (row) slotIdByKey.set(s.key, row.id); });

  const signerRows = input.signers
    .filter((g) => slotIdByKey.has(g.slotKey) && g.name.trim())
    .map((g) => ({ request_id: req.id, slot_id: slotIdByKey.get(g.slotKey)!, member_id: g.member_id, name: g.name.trim(), phone: g.phone?.trim() || null, token: nanoid(32) }));
  const { error: e3 } = await supabase.from("sign_signers").insert(signerRows);
  if (e3) { await supabase.from("sign_requests").delete().eq("id", req.id); return { error: e3.message }; }

  await supabase.from("sign_events").insert({ request_id: req.id, event: "created", meta: { slots: slotRows.length, signers: signerRows.length } });
  revalidatePath("/sign");
  return { ok: true, id: req.id as string };
}

export async function cancelSignRequest(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("sign_requests").update({ status: "cancelled", updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return { error: error.message };
  await supabase.from("sign_events").insert({ request_id: id, event: "cancelled" });
  revalidatePath("/sign"); revalidatePath(`/sign/${id}`);
  return { ok: true };
}

export async function deleteSignRequest(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("sign_requests").delete().eq("id", id); // cascade: slots·signers·events
  if (error) return { error: error.message };
  revalidatePath("/sign");
  return { ok: true };
}

// 링크 복사/공유 시 기록 (현황판 '보냄' 표시용)
export async function markLinkSent(requestId: string, signerId: string) {
  const supabase = await createClient();
  await supabase.from("sign_events").insert({ request_id: requestId, signer_id: signerId, event: "link_sent" });
  return { ok: true };
}
