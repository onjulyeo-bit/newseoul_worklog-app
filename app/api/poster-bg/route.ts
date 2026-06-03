// AI 포스터 배경 생성 — Google Gemini 이미지 모델 호출.
// 키(GEMINI_API_KEY)는 서버에서만 읽어 사용(브라우저로 절대 안 나감).
// 로그인(관리자)만 호출 가능 — 비용·남용 방지.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// 무료 한도로 쓰는 이미지 모델. 작동 모델로 바꿀 수 있게 분리.
const MODEL = "gemini-2.5-flash-image";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const key = process.env.GEMINI_API_KEY;
  if (!key) return NextResponse.json({ error: "AI 키가 아직 설정되지 않았습니다. (GEMINI_API_KEY)" }, { status: 500 });

  let prompt = "";
  try { ({ prompt } = await req.json()); } catch {}
  if (!prompt || !prompt.trim()) return NextResponse.json({ error: "배경 설명을 입력해 주세요." }, { status: 400 });

  // 포스터 배경: 글자 없이, 세로 3:4, 아래쪽은 어둡게(텍스트 얹을 공간)
  const full =
    `Vertical 3:4 poster background. Absolutely no text, no letters, no words, no typography. ` +
    `${prompt.trim()}. Soft and elegant, gentle lighting, keep the lower third darker and uncluttered so text can be placed over it. ` +
    `Warm, hopeful, peaceful Christian mood. High quality, no watermark.`;

  let res: Response;
  try {
    res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: full }] }],
          generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
        }),
      },
    );
  } catch {
    return NextResponse.json({ error: "AI 서버에 연결하지 못했습니다." }, { status: 502 });
  }

  if (!res.ok) {
    const detail = (await res.text()).slice(0, 300);
    return NextResponse.json({ error: "이미지 생성에 실패했어요. 잠시 후 다시 시도해 주세요.", detail }, { status: 502 });
  }

  const data = await res.json();
  const parts = data?.candidates?.[0]?.content?.parts ?? [];
  const img = parts.find((p: { inlineData?: { data?: string; mimeType?: string } }) => p.inlineData?.data);
  if (!img?.inlineData?.data) {
    return NextResponse.json({ error: "이미지를 받지 못했어요. 설명을 조금 바꿔 다시 시도해 주세요." }, { status: 502 });
  }
  const mime = img.inlineData.mimeType || "image/png";
  return NextResponse.json({ image: `data:${mime};base64,${img.inlineData.data}` });
}
