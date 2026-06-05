// 모바일 청첩장·부고장 → Gemini로 핵심 정보 추출(JSON).
//   image(이미지 dataURL) 또는 url(링크) 둘 중 하나. 키는 서버에서만. 로그인(관리자)만.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const FIELDS_PROMPT =
  `핵심 정보를 추출해 JSON으로만 답해.\n` +
  `필드:\n- type: "부고"|"결혼"|"개업"|"심방"|"기타" 중 하나\n` +
  `- who: 누구의 경조사인지 (예: "허승필 대표님 부친", "조강민 대표님 장녀")\n` +
  `- when: 일시 (부고=발인 일시, 결혼=예식 일시)\n` +
  `- where: 장소 (부고=빈소, 결혼=예식장, 주소 포함)\n` +
  `- link: 모바일 링크 URL이 있으면, 없으면 ""\n` +
  `- extra: 그 외 참고 (상주, 연락처 등)\n` +
  `모르는 값은 빈 문자열 "". 설명 없이 JSON만 출력.`;

function metaContent(html: string, key: string): string {
  const re1 = new RegExp(`<meta[^>]+(?:property|name)=["']${key}["'][^>]+content=["']([^"']*)["']`, "i");
  const re2 = new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${key}["']`, "i");
  return (html.match(re1)?.[1] || html.match(re2)?.[1] || "").trim();
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  const key = process.env.GEMINI_API_KEY;
  if (!key) return NextResponse.json({ error: "AI 키가 설정되지 않았습니다." }, { status: 500 });

  let image = "", url = "";
  try { ({ image, url } = await req.json()); } catch {}

  // parts 구성 (이미지 또는 링크 텍스트)
  let parts: unknown[];
  let pageUrl = "";

  if (url) {
    let u: URL;
    try { u = new URL(url); } catch { return NextResponse.json({ error: "올바른 링크가 아니에요." }, { status: 400 }); }
    if (!/^https?:$/.test(u.protocol) || /^(localhost$|127\.|0\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/.test(u.hostname)) {
      return NextResponse.json({ error: "허용되지 않은 링크예요." }, { status: 400 });
    }
    pageUrl = url;
    let html = "";
    try {
      const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15", "Accept-Language": "ko-KR,ko" }, redirect: "follow" });
      html = await r.text();
    } catch { return NextResponse.json({ error: "링크 페이지를 불러오지 못했어요. 캡처 업로드로 해보세요." }, { status: 502 }); }
    const title = (html.match(/<title>([^<]*)<\/title>/i)?.[1] || "").trim();
    const body = html.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/gi, " ").replace(/\s+/g, " ").trim().slice(0, 4000);
    const content = `제목: ${title}\nog:title: ${metaContent(html, "og:title")}\nog:description: ${metaContent(html, "og:description")}\n본문: ${body}`;
    parts = [{ text: `다음은 모바일 청첩장/부고장 페이지의 텍스트야. ${FIELDS_PROMPT}\n\n${content}` }];
  } else if (image) {
    const b64 = image.includes(",") ? image.split(",")[1] : image;
    const mime = image.startsWith("data:") ? image.slice(5, image.indexOf(";")) : "image/jpeg";
    parts = [{ text: `이 이미지는 한국의 모바일 청첩장 또는 부고장이야. ${FIELDS_PROMPT}` }, { inline_data: { mime_type: mime, data: b64 } }];
  } else {
    return NextResponse.json({ error: "이미지나 링크를 주세요." }, { status: 400 });
  }

  let res: Response;
  try {
    res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts }], generationConfig: { responseMimeType: "application/json", temperature: 0.2, maxOutputTokens: 500 } }),
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
  if (pageUrl && !fields.link) fields.link = pageUrl; // 링크 추출이면 그 링크를 기본값으로
  return NextResponse.json({ fields });
}
