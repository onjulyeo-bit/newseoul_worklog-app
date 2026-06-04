// AI 포스터 배경 생성 — 무료(Cloudflare Flux) 또는 Recraft(유료, 스타일·사이즈 선택).
// 키는 서버에서만. 로그인(관리자)만.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const CF_MODEL = "@cf/black-forest-labs/flux-1-schnell";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  let body: { prompt?: string; provider?: string; style?: string; size?: string } = {};
  try { body = await req.json(); } catch {}
  const prompt = (body.prompt || "").trim();
  if (!prompt) return NextResponse.json({ error: "배경 설명을 입력해 주세요." }, { status: 400 });

  const base =
    `Vertical poster background. Absolutely no text, no letters, no words. ` +
    `${prompt}. Keep the lower area calmer/darker so text can be placed over it. Warm, hopeful, peaceful mood.`;

  // ── Recraft (유료) ──
  if (body.provider === "recraft") {
    const token = process.env.RECRAFT_API_TOKEN;
    if (!token) return NextResponse.json({ error: "Recraft 키가 아직 설정되지 않았습니다." }, { status: 500 });
    const style = body.style || "realistic_image";
    const size = body.size || "1024x1365";
    let res: Response;
    try {
      res = await fetch("https://external.api.recraft.ai/v1/images/generations", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: base, style, size, n: 1 }),
      });
    } catch { return NextResponse.json({ error: "Recraft 서버에 연결하지 못했습니다." }, { status: 502 }); }
    if (!res.ok) {
      const detail = (await res.text()).slice(0, 300);
      return NextResponse.json({ error: "Recraft 생성에 실패했어요.", detail }, { status: 502 });
    }
    const data = await res.json();
    const url = data?.data?.[0]?.url || data?.image?.url;
    if (!url) return NextResponse.json({ error: "이미지를 받지 못했어요." }, { status: 502 });
    // toPng 안전을 위해 서버에서 받아 dataURL로 변환
    try {
      const img = await fetch(url);
      const ct = img.headers.get("content-type") || "image/png";
      const buf = Buffer.from(await img.arrayBuffer());
      return NextResponse.json({ image: `data:${ct};base64,${buf.toString("base64")}` });
    } catch { return NextResponse.json({ image: url }); }
  }

  // ── Cloudflare Flux (무료, 기본) ──
  const acct = process.env.CLOUDFLARE_ACCOUNT_ID;
  const cfToken = process.env.CLOUDFLARE_API_TOKEN;
  if (!acct || !cfToken) return NextResponse.json({ error: "AI 키가 아직 설정되지 않았습니다." }, { status: 500 });
  let res: Response;
  try {
    res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${acct}/ai/run/${CF_MODEL}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${cfToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: `${base} High quality, no watermark.`, steps: 8 }),
    });
  } catch { return NextResponse.json({ error: "AI 서버에 연결하지 못했습니다." }, { status: 502 }); }
  if (!res.ok) {
    const detail = (await res.text()).slice(0, 300);
    return NextResponse.json({ error: "이미지 생성에 실패했어요. 잠시 후 다시 시도해 주세요.", detail }, { status: 502 });
  }
  const data = await res.json();
  const b64 = data?.result?.image;
  if (!b64) return NextResponse.json({ error: "이미지를 받지 못했어요." }, { status: 502 });
  return NextResponse.json({ image: `data:image/jpeg;base64,${b64}` });
}
