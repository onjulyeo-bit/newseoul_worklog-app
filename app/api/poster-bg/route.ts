// AI 포스터 배경 생성 — Cloudflare Workers AI (Flux 모델, 무료 한도).
// 키(CLOUDFLARE_*)는 서버에서만 읽어 사용(브라우저로 절대 안 나감).
// 로그인(관리자)만 호출 가능 — 남용 방지.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const MODEL = "@cf/black-forest-labs/flux-1-schnell";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const acct = process.env.CLOUDFLARE_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!acct || !token) return NextResponse.json({ error: "AI 키가 아직 설정되지 않았습니다. (CLOUDFLARE_*)" }, { status: 500 });

  let prompt = "";
  try { ({ prompt } = await req.json()); } catch {}
  if (!prompt || !prompt.trim()) return NextResponse.json({ error: "배경 설명을 입력해 주세요." }, { status: 400 });

  // 포스터 배경: 글자 없이, 세로 분위기, 아래쪽은 어둡게(텍스트 얹을 공간)
  const full =
    `Vertical poster background, 3:4 aspect. Absolutely no text, no letters, no words, no typography. ` +
    `${prompt.trim()}. Soft and elegant, gentle lighting, keep the lower area darker and uncluttered so text can be placed over it. ` +
    `Warm, hopeful, peaceful Christian mood. High quality, no watermark.`;

  let res: Response;
  try {
    res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${acct}/ai/run/${MODEL}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: full, steps: 8 }),
    });
  } catch {
    return NextResponse.json({ error: "AI 서버에 연결하지 못했습니다." }, { status: 502 });
  }

  if (!res.ok) {
    const detail = (await res.text()).slice(0, 300);
    return NextResponse.json({ error: "이미지 생성에 실패했어요. 잠시 후 다시 시도해 주세요.", detail }, { status: 502 });
  }

  const data = await res.json();
  const b64 = data?.result?.image;
  if (!b64) return NextResponse.json({ error: "이미지를 받지 못했어요. 다시 시도해 주세요." }, { status: 502 });
  return NextResponse.json({ image: `data:image/jpeg;base64,${b64}` });
}
