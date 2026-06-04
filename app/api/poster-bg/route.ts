// AI 포스터 배경 — 무료(Cloudflare Flux) / Recraft(유료, 스타일·사이즈).
// 핵심: 이미지에 글자가 안 들어가게(강한 no-text) + 한글 제목·말씀은 Gemini(무료)로 영어 '장면'으로 변환해서 사용.
// 톤 선택, 한 번에 1~2장. 키는 서버에서만. 로그인(관리자)만.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const CF_MODEL = "@cf/black-forest-labs/flux-1-schnell";
// 텍스트형 모델이 프롬프트 단어를 글자로 그려넣지 않도록 — 'poster/background/text' 같은 메타 단어는 절대 넣지 않는다.
// 오직 '장면 묘사'만. 변형(2장)도 서로 다른 구도로.
const TONES: Record<string, string> = {
  warm: "warm cozy atmosphere, soft golden light",
  calm: "calm serene peaceful muted colors",
  bright: "bright airy and hopeful",
  majestic: "majestic grand, gentle dramatic light",
  minimal: "minimal simple, soft gradient sky",
  vintage: "nostalgic vintage film color",
};
const VARI = [
  "expansive wide cinematic landscape, distant horizon",
  "soft intimate foreground details, dreamy shallow depth of field",
];

async function deriveScene(title?: string, verse?: string): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  const fallback = "peaceful natural landscape with soft gentle light, calm sky";
  const t = (title || "").trim();
  if (!key || (!t && !verse)) return fallback;
  try {
    const prompt =
      `You write short English image-scene descriptions for a Christian business-forum poster BACKGROUND. ` +
      `Given the Korean sermon title and scripture, output ONE short English phrase (max 16 words) describing a calm symbolic SCENERY (nature/landscape/abstract light) fitting the theme. ` +
      `No people reading, no signs, no words in the scene. Output ONLY the phrase.\nTitle: ${t}\nScripture: ${verse || ""}`;
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.8, maxOutputTokens: 60 } }),
    });
    if (!res.ok) return fallback;
    const d = await res.json();
    const out = (d?.candidates?.[0]?.content?.parts?.[0]?.text || "").trim().replace(/^["']|["']$/g, "");
    return out || fallback;
  } catch { return fallback; }
}

async function toDataUrl(url: string): Promise<string | null> {
  try {
    const img = await fetch(url);
    const ct = img.headers.get("content-type") || "image/png";
    const buf = Buffer.from(await img.arrayBuffer());
    return `data:${ct};base64,${buf.toString("base64")}`;
  } catch { return null; }
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  let body: { prompt?: string; provider?: string; style?: string; size?: string; tone?: string; count?: number; title?: string; verse?: string } = {};
  try { body = await req.json(); } catch {}
  const provider = body.provider || "cloudflare";
  const tone = TONES[body.tone || ""] || "";
  const count = Math.min(2, Math.max(1, Number(body.count) || 1));

  let scene = (body.prompt || "").trim();
  if (!scene) scene = await deriveScene(body.title, body.verse);

  const style = body.style || "realistic_image";
  const size = body.size || "1024x1365";

  // 이미지별 '순수 장면' 프롬프트 — 메타 단어(poster/background/text) 없음. 2장이면 서로 다른 구도.
  const prompts: string[] = [];
  for (let i = 0; i < count; i++) {
    const compo = count === 2 ? VARI[i] : "balanced natural composition";
    prompts.push([tone, scene, compo, "soft natural light, highly detailed, serene mood"].filter(Boolean).join(", "));
  }

  const images = (await Promise.all(prompts.map((p) => genOne(provider, p, style, size)))).filter(Boolean) as string[];
  if (!images.length) {
    return NextResponse.json({ error: provider === "recraft" ? "Recraft 생성에 실패했어요. (키·크레딧을 확인해 주세요)" : "이미지 생성에 실패했어요. 잠시 후 다시 시도해 주세요." }, { status: 502 });
  }
  return NextResponse.json({ images, scene });
}

// 한 장 생성 (실패 시 null)
async function genOne(provider: string, prompt: string, style: string, size: string): Promise<string | null> {
  if (provider === "recraft") {
    const token = process.env.RECRAFT_API_TOKEN;
    if (!token) return null;
    try {
      const res = await fetch("https://external.api.recraft.ai/v1/images/generations", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, style, size, n: 1 }),
      });
      if (!res.ok) return null;
      const d = await res.json();
      const url = d?.data?.[0]?.url;
      return url ? await toDataUrl(url) : null;
    } catch { return null; }
  }
  const acct = process.env.CLOUDFLARE_ACCOUNT_ID;
  const cfToken = process.env.CLOUDFLARE_API_TOKEN;
  if (!acct || !cfToken) return null;
  try {
    const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${acct}/ai/run/${CF_MODEL}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${cfToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, steps: 8 }),
    });
    if (!res.ok) return null;
    const d = await res.json();
    return d?.result?.image ? `data:image/jpeg;base64,${d.result.image}` : null;
  } catch { return null; }
}
