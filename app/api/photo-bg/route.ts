// 인물 사진 배경 교체(나노바나나=gemini-2.5-flash-image). 엣지 깔끔한 사진관 배경 재생성.
//   주의: 이미지 생성 모델은 무료 등급 불가 → Gemini API 키에 결제(billing) 활성화 필요.
//   키는 서버에서만. 로그인(운영진)만.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const COLORS: Record<string, string> = {
  navy: "a deep navy blue",
  brown: "a warm tan/brown",
  gray: "a light neutral gray",
};

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  const key = process.env.GEMINI_API_KEY;
  if (!key) return NextResponse.json({ error: "AI 키가 설정되지 않았습니다." }, { status: 500 });

  let image = "", color = "navy";
  try { ({ image, color } = await req.json()); } catch {}
  const m = (image || "").match(/^data:(image\/[\w.+-]+);base64,(.+)$/);
  if (!m) return NextResponse.json({ error: "이미지 형식이 올바르지 않아요." }, { status: 400 });
  const [, mime, b64] = m;
  const desc = COLORS[color] || COLORS.navy;

  const prompt =
    `Replace ONLY the background of this portrait with a clean, professional photo-studio backdrop in ${desc}, ` +
    `with a subtle radial gradient (slightly brighter behind the head, gently darker toward the edges). ` +
    `Keep the person exactly the same — face, expression, hair, skin tone, and clothing unchanged and sharp, with clean natural edges (especially hair). ` +
    `Apply soft, flattering studio lighting on the subject. Compose as a square head-and-shoulders headshot, centered. Photorealistic, high quality.`;

  let res: Response;
  try {
    res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: mime, data: b64 } }] }], generationConfig: { responseModalities: ["IMAGE"] } }),
    });
  } catch { return NextResponse.json({ error: "AI 서버에 연결하지 못했습니다." }, { status: 502 }); }

  if (!res.ok) {
    const detail = (await res.text()).slice(0, 300);
    const billing = /quota|billing|limit:\s*0|free_tier/i.test(detail);
    return NextResponse.json({
      error: billing ? "AI 이미지(나노바나나)는 Gemini 키 결제 활성화가 필요해요." : "AI 처리에 실패했어요.",
      billing, detail,
    }, { status: 502 });
  }
  const data = await res.json();
  const parts = data?.candidates?.[0]?.content?.parts ?? [];
  const img = parts.find((p: { inline_data?: unknown; inlineData?: unknown }) => p.inline_data || p.inlineData);
  if (!img) return NextResponse.json({ error: "AI가 이미지를 반환하지 않았어요." }, { status: 502 });
  const d = img.inline_data || img.inlineData;
  return NextResponse.json({ image: `data:${d.mime_type || d.mimeType || "image/png"};base64,${d.data}` });
}
