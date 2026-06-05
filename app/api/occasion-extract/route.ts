// 모바일 청첩장·부고장 이미지 → Gemini 비전으로 핵심 정보 추출(JSON).
// 키(GEMINI_API_KEY)는 서버에서만. 로그인(관리자)만.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  const key = process.env.GEMINI_API_KEY;
  if (!key) return NextResponse.json({ error: "AI 키가 설정되지 않았습니다." }, { status: 500 });

  let image = "";
  try { ({ image } = await req.json()); } catch {}
  if (!image) return NextResponse.json({ error: "이미지가 없어요." }, { status: 400 });
  const b64 = image.includes(",") ? image.split(",")[1] : image;
  const mime = image.startsWith("data:") ? image.slice(5, image.indexOf(";")) : "image/jpeg";

  const prompt =
    `이 이미지는 한국의 모바일 청첩장(결혼) 또는 부고장(부고) 또는 개업/행사 안내야. 핵심 정보를 추출해 JSON으로만 답해.\n` +
    `필드:\n- type: "부고"|"결혼"|"개업"|"심방"|"기타" 중 하나\n` +
    `- who: 누구의 경조사인지 (예: "허승필 대표님 부친", "조강민 대표님 장녀")\n` +
    `- when: 일시 (부고=발인 일시, 결혼=예식 일시)\n` +
    `- where: 장소 (부고=빈소, 결혼=예식장, 주소 포함)\n` +
    `- link: 이미지 안에 보이는 모바일 링크 URL이 있으면, 없으면 ""\n` +
    `- extra: 그 외 참고 (상주, 연락처 등)\n` +
    `모르는 값은 빈 문자열 "". 설명 없이 JSON만 출력.`;

  let res: Response;
  try {
    res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: mime, data: b64 } }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.2, maxOutputTokens: 500 },
      }),
    });
  } catch { return NextResponse.json({ error: "AI 서버에 연결하지 못했습니다." }, { status: 502 }); }

  if (!res.ok) {
    const detail = (await res.text()).slice(0, 200);
    return NextResponse.json({ error: "정보 추출에 실패했어요. 다시 시도해 주세요.", detail }, { status: 502 });
  }
  const data = await res.json();
  const txt = data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
  let fields: Record<string, string> = {};
  try { fields = JSON.parse(txt); } catch { return NextResponse.json({ error: "추출 결과를 해석하지 못했어요." }, { status: 502 }); }
  return NextResponse.json({ fields });
}
