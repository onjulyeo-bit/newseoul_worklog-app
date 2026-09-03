// 서명자 본인 서명본 PDF — GET /api/sign/[token]/pdf  (?dl=1 다운로드)
//   토큰 게이트 RPC 3종(sign_fetch / sign_fetch_pdf / sign_fetch_my_signature)으로 원본+본인 서명만 읽어 즉시 합성.
//   다른 서명자의 서명은 포함하지 않는다('내 서명본'). 전체 합성본은 관리자 현황판(/api/sign/pdf/[id]).
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { composeSignedPdf } from "@/lib/signCompose";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!token || token.length < 16) return NextResponse.json({ error: "링크가 올바르지 않아요." }, { status: 400 });
  const supabase = await createClient();

  const [meta, pdf, sig] = await Promise.all([
    supabase.rpc("sign_fetch", { p_token: token }),
    supabase.rpc("sign_fetch_pdf", { p_token: token }),
    supabase.rpc("sign_fetch_my_signature", { p_token: token }),
  ]);
  const m = (meta.data as Array<Record<string, unknown>> | null)?.[0];
  const source = pdf.data as string | null;
  const s = (sig.data as Array<{ signature_data: string | null; signed_at: string | null; ip: string | null; auth_kakao_id: string | null }> | null)?.[0];
  if (!m || !source) return NextResponse.json({ error: "문서를 찾을 수 없거나 만료되었어요." }, { status: 404 });
  if (!s?.signature_data) return NextResponse.json({ error: "아직 서명이 완료되지 않았어요." }, { status: 409 });

  let bytes: Uint8Array;
  try {
    bytes = await composeSignedPdf({
      title: String(m.req_title),
      sourceB64: source,
      slots: [{
        page: Number(m.slot_page), x: Number(m.slot_x), y: Number(m.slot_y), w: Number(m.slot_w), h: Number(m.slot_h),
        label: String(m.slot_label ?? ""), signerName: String(m.signer_name),
        signatureB64: s.signature_data, signedAt: s.signed_at, ip: s.ip, authKakao: !!s.auth_kakao_id,
      }],
    });
  } catch (e) { return NextResponse.json({ error: "PDF 합성 중 문제가 생겼어요: " + (e as Error).message }, { status: 500 }); }

  const dl = new URL(req.url).searchParams.get("dl") === "1";
  const fname = encodeURIComponent(`${String(m.req_title).replace(/[\\/:*?"<>|]/g, "_")}_${String(m.signer_name)}_서명본.pdf`);
  return new NextResponse(Buffer.from(bytes), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `${dl ? "attachment" : "inline"}; filename*=UTF-8''${fname}`, "Cache-Control": "private, no-store" },
  });
}
