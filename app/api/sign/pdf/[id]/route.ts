// 서명본 PDF — GET /api/sign/pdf/[id]  (?dl=1 이면 다운로드, 없으면 브라우저에서 열기)
//   운영진 세션으로 원본+서명 데이터를 읽어(RLS) 즉시 합성. 저장하지 않음 → service_role·추가 마이그레이션 불필요.
//   미서명 슬롯은 비워두므로 진행중 문서도 '현재까지 서명본'으로 열린다.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { composeSignedPdf, type ComposeSlot } from "@/lib/signCompose";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: r } = await supabase.from("sign_requests").select("id, title, source_pdf_data").eq("id", id).single();
  if (!r || !r.source_pdf_data) return NextResponse.json({ error: "문서를 찾을 수 없거나 권한이 없어요." }, { status: 404 });

  const [{ data: slots }, { data: signers }] = await Promise.all([
    supabase.from("sign_slots").select("id, label, page, x, y, w, h, order_no").eq("request_id", id).order("order_no"),
    supabase.from("sign_signers").select("slot_id, name, signature_data, signed_at, ip, auth_kakao_id").eq("request_id", id),
  ]);

  const composeSlots: ComposeSlot[] = (slots ?? []).map((s) => {
    const g = (signers ?? []).find((x) => x.slot_id === s.id);
    return {
      page: s.page, x: Number(s.x), y: Number(s.y), w: Number(s.w), h: Number(s.h), label: s.label,
      signerName: g?.name ?? s.label,
      signatureB64: g?.signature_data ?? null, signedAt: g?.signed_at ?? null,
      ip: g?.ip ?? null, authKakao: !!g?.auth_kakao_id,
    };
  });

  let bytes: Uint8Array;
  try { bytes = await composeSignedPdf({ title: r.title, sourceB64: r.source_pdf_data, slots: composeSlots }); }
  catch (e) { return NextResponse.json({ error: "PDF 합성 중 문제가 생겼어요: " + (e as Error).message }, { status: 500 }); }

  const url = new URL(req.url);
  const dl = url.searchParams.get("dl") === "1";
  const fname = encodeURIComponent(`${r.title.replace(/[\\/:*?"<>|]/g, "_")}_서명본.pdf`);
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${dl ? "attachment" : "inline"}; filename*=UTF-8''${fname}`,
      "Cache-Control": "private, no-store",
    },
  });
}
