// 서명 제출 — POST /api/sign/[token]  body: { signature: base64(PNG, data URL 접두어 제외) }
//   서버에서 IP·UA 를 붙여 토큰 게이트 RPC(sign_submit) 호출. anon 키만 사용(service_role 없음).
//   크기 한도 PNG 200KB(base64 ≈ 273KB) — RPC 에서도 재검사.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const MAX_B64 = 280_000;

export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!token || token.length < 16) return NextResponse.json({ error: "링크가 올바르지 않아요." }, { status: 400 });

  let signature = "";
  try { ({ signature } = await req.json()); } catch {}
  signature = String(signature ?? "").replace(/^data:image\/png;base64,/, "").trim();
  if (!signature) return NextResponse.json({ error: "서명이 비어 있어요." }, { status: 400 });
  if (signature.length > MAX_B64) return NextResponse.json({ error: "서명 이미지가 너무 커요. 다시 서명해 주세요." }, { status: 413 });
  if (!/^[A-Za-z0-9+/=]+$/.test(signature)) return NextResponse.json({ error: "서명 형식이 올바르지 않아요." }, { status: 400 });

  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || req.headers.get("x-real-ip") || "";
  const ua = (req.headers.get("user-agent") ?? "").slice(0, 300);

  const supabase = await createClient();
  const { error } = await supabase.rpc("sign_submit", { p_token: token, p_signature: signature, p_ip: ip, p_ua: ua });
  if (error) {
    const m = error.message || "";
    if (m.includes("invalid_token"))       return NextResponse.json({ error: "링크가 올바르지 않거나 만료되었어요." }, { status: 404 });
    if (m.includes("already_signed"))      return NextResponse.json({ error: "이미 서명이 완료된 문서예요." }, { status: 409 });
    if (m.includes("signature_too_large")) return NextResponse.json({ error: "서명 이미지가 너무 커요." }, { status: 413 });
    if (m.includes("empty_signature"))     return NextResponse.json({ error: "서명이 비어 있어요." }, { status: 400 });
    return NextResponse.json({ error: "저장 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
