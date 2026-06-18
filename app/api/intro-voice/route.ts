// 음성 자기소개 → Gemini로 전사 + 한 문장 자기소개로 정리. (자기입력 폼=비로그인 허용)
// 키는 서버에서만. 오디오는 저장하지 않고 정리된 텍스트만 반환.
import { NextResponse } from "next/server";

const PROMPT =
  "다음은 한국 CBMC(기독실업인회) 새서울지회 회원이 자기를 소개하며 말한 음성입니다. " +
  "말한 내용을 바탕으로 따뜻하고 자연스러운 한국어 자기소개를 한두 문장(80자 내외)으로 정리해 주세요. " +
  "존댓말, 과장 없이. 설명·따옴표 없이 자기소개 문장만 출력하세요.";

export async function POST(req: Request) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return NextResponse.json({ error: "AI 키가 설정되지 않았습니다." }, { status: 500 });

  let audio = "", mime = "audio/webm";
  try { ({ audio, mime } = await req.json()); } catch {}
  if (!audio) return NextResponse.json({ error: "녹음 데이터가 없어요." }, { status: 400 });
  const b64 = audio.includes(",") ? audio.split(",")[1] : audio; // dataURL → base64
  if (b64.length > 9_000_000) return NextResponse.json({ error: "녹음이 너무 길어요. 30초 이내로 해주세요." }, { status: 400 });

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: PROMPT }, { inline_data: { mime_type: mime || "audio/webm", data: b64 } }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 200 },
      }),
    });
    const j = await res.json();
    if (!res.ok) return NextResponse.json({ error: j?.error?.message || "AI 처리 실패" }, { status: 502 });
    const text = (j?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text).join("") || "").trim().replace(/^["'\s]+|["'\s]+$/g, "");
    if (!text) return NextResponse.json({ error: "내용을 알아듣지 못했어요. 다시 말씀해 주세요." }, { status: 422 });
    return NextResponse.json({ text });
  } catch {
    return NextResponse.json({ error: "AI 호출 중 오류가 났어요." }, { status: 500 });
  }
}
