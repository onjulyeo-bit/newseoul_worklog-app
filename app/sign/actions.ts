"use server";

// 서명 요청 관리 — 생성(문서+슬롯+서명자)·취소·삭제·링크 발송 기록. (RLS 상 운영진만)
//   원본 PDF 는 sign_requests.source_pdf_data(base64) 에 보관(0058, service_role 미사용 설계).
//   서명자 토큰은 nanoid(32) — 링크 = /s/{token}.
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";
import type { NewSlot, NewSigner } from "@/lib/signTypes";
import { DEFAULT_DOC_CATEGORY, isDocCategory } from "@/lib/docCategories";

const MAX_PDF_B64 = 7_000_000; // 원본 PDF 5MB (base64 ≈ 6.7MB)

export async function createSignRequest(input: {
  title: string; description: string | null; expires_at: string | null; doc_category?: string;
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
  const base: Record<string, unknown> = { chapter_id: "새서울", title, description: input.description?.trim() || null, expires_at: input.expires_at || null, status: "active", source_pdf_data: input.pdf_b64 };
  const doc_category = isDocCategory(input.doc_category) ? input.doc_category : DEFAULT_DOC_CATEGORY;
  const group_token = "g" + nanoid(28); // 단체(공용) 링크 /s/g/{token} (0061)
  // 0060(doc_category)·0061(group_token) 미적용 환경 폴백 — 있는 컬럼 조합으로 순차 시도
  const variants: Record<string, unknown>[] = [
    { ...base, doc_category, group_token },
    { ...base, doc_category },
    { ...base, group_token },
    base,
  ];
  let req: { id: string } | null = null; let e1: { message: string } | null = null;
  for (const v of variants) {
    ({ data: req, error: e1 } = await supabase.from("sign_requests").insert(v).select("id").single());
    if (!e1 || !/doc_category|group_token/.test(e1.message)) break; // 성공 또는 컬럼 문제가 아닌 오류면 중단
  }
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

// ── 유선(전화) 동의 ─────────────────────────────────────────────
//   전화로 동의를 확인한 서명자를 기록한다. 자필 서명이 아니므로:
//   - 기존 서명 이미지(signature_data)는 지운다. 대리 서명이 남아 있으면 증빙이 왜곡된다.
//   - 접속 기록(ip·user_agent)도 지운다 — 본인이 아니라 운영진 접속 기록이기 때문.
//   - status 는 'signed' 로 둔다(동의 완료 = 진행 완료). 합성 PDF·증빙 페이지는
//     'signature_data 가 없는 signed' 를 유선 동의로 표기한다(추가 컬럼·마이그레이션 불필요).
export async function setPhoneConsent(requestId: string, signerId: string, note?: string) {
  const supabase = await createClient();
  const { data: cur } = await supabase.from("sign_signers").select("id, name, status, signed_at").eq("id", signerId).eq("request_id", requestId).single();
  if (!cur) return { error: "서명자를 찾을 수 없어요." };

  const at = cur.signed_at ?? new Date().toISOString();
  const { error } = await supabase.from("sign_signers")
    .update({ status: "signed", signed_at: at, signature_data: null, ip: null, user_agent: null })
    .eq("id", signerId);
  if (error) return { error: error.message };

  await supabase.from("sign_events").insert({
    request_id: requestId, signer_id: signerId, event: "phone_consent",
    meta: { name: cur.name, at, note: note?.trim() || null, prev_status: cur.status },
  });

  // 전원 완료면 요청도 완료로 (마지막 한 명을 유선 동의로 바꾼 경우)
  const { count } = await supabase.from("sign_signers").select("id", { count: "exact", head: true }).eq("request_id", requestId).neq("status", "signed");
  if (!count) await supabase.from("sign_requests").update({ status: "completed", updated_at: new Date().toISOString() }).eq("id", requestId).neq("status", "cancelled");

  revalidatePath("/sign"); revalidatePath(`/sign/${requestId}`);
  return { ok: true };
}

// 유선 동의·서명을 되돌려 다시 링크로 서명받을 수 있게 한다.
export async function revertSigner(requestId: string, signerId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("sign_signers")
    .update({ status: "pending", signed_at: null, viewed_at: null, signature_data: null, ip: null, user_agent: null })
    .eq("id", signerId).eq("request_id", requestId);
  if (error) return { error: error.message };
  await supabase.from("sign_events").insert({ request_id: requestId, signer_id: signerId, event: "reverted" });
  await supabase.from("sign_requests").update({ status: "active", updated_at: new Date().toISOString() }).eq("id", requestId).eq("status", "completed");
  revalidatePath("/sign"); revalidatePath(`/sign/${requestId}`);
  return { ok: true };
}
