// 음성 자기소개 → Gemini로 전사 + 한 문장 자기소개로 정리. (자기입력 폼=비로그인 허용)
// 키는 서버에서만. 오디오는 저장하지 않고 정리된 텍스트만 반환.
import { NextResponse } from "next/server";

const PROMPT =
  "다음은 한국 CBMC(기독실업인회) 새서울지회 조찬모임 회원이 본인을 소개하며 말한 한국어 음성입니다.\n" +
  "1) 먼저 음성을 정확히 받아쓰고, 2) 한국어 맞춤법과 띄어쓰기를 바르게 교정하세요.\n" +
  "회사명·직업·이름 등 고유명사는 발음을 신중히 듣고 가장 자연스러운 한국어 표기로 적으세요(불확실하면 일반적인 표기 사용).\n" +
  "그런 다음 따뜻하고 자연스러운 자기소개 한두 문장(80자 내외, 존댓말)으로 다듬어 주세요.\n" +
  "말한 내용에 충실하되, 들리지 않은 사실은 절대 지어내지 마세요. 설명·따옴표 없이 완성된 자기소개 문장만 출력하세요.";

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
        generationConfig: { temperature: 0.2, maxOutputTokens: 220 },
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
