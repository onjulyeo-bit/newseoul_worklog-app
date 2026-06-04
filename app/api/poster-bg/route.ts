// AI 포스터 배경 — 무료(Cloudflare Flux) / Recraft(유료, 스타일·사이즈).
// 핵심: 이미지에 글자가 안 들어가게(강한 no-text) + 한글 제목·말씀은 Gemini(무료)로 영어 '장면'으로 변환해서 사용.
// 톤 선택, 한 번에 1~2장. 키는 서버에서만. 로그인(관리자)만.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const CF_MODEL = "@cf/black-forest-labs/flux-1-schnell";
const NO_TEXT =
  "CRITICAL: absolutely NO text, NO letters, NO words, NO hangul, NO typography, NO captions, NO signage, NO numbers, NO watermark, NO logo anywhere. A purely scenic visual background only.";
const TONES: Record<string, string> = {
  warm: "warm cozy tone, soft golden light",
  calm: "calm serene peaceful muted tones",
  bright: "bright hopeful, clear and airy",
  majestic: "majestic grand, gentle dramatic light",
  minimal: "minimal clean, simple soft gradient",
  vintage: "vintage warm film tone",
};

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

  const full = `Vertical poster background, scenic illustration. ${tone ? tone + ". " : ""}${scene}. Calm composition, uncluttered slightly darker lower area for text overlay. ${NO_TEXT}`;

  // ── Recraft (유료) ──
  if (provider === "recraft") {
    const token = process.env.RECRAFT_API_TOKEN;
    if (!token) return NextResponse.json({ error: "Recraft 키가 아직 설정되지 않았습니다." }, { status: 500 });
    const style = body.style || "realistic_image";
    const size = body.size || "1024x1365";
    let res: Response;
    try {
      res = await fetch("https://external.api.recraft.ai/v1/images/generations", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: full, style, size, n: count }),
      });
    } catch { return NextResponse.json({ error: "Recraft 서버에 연결하지 못했습니다." }, { status: 502 }); }
    if (!res.ok) {
      const detail = (await res.text()).slice(0, 300);
      return NextResponse.json({ error: "Recraft 생성에 실패했어요.", detail }, { status: 502 });
    }
    const data = await res.json();
    const urls: string[] = (data?.data || []).map((x: { url?: string }) => x.url).filter(Boolean);
    if (!urls.length) return NextResponse.json({ error: "이미지를 받지 못했어요." }, { status: 502 });
    const images = (await Promise.all(urls.map((u) => toDataUrl(u)))).filter(Boolean);
    return NextResponse.json({ images, scene });
  }

  // ── Cloudflare Flux (무료) — count회 ──
  const acct = process.env.CLOUDFLARE_ACCOUNT_ID;
  const cfToken = process.env.CLOUDFLARE_API_TOKEN;
  if (!acct || !cfToken) return NextResponse.json({ error: "AI 키가 아직 설정되지 않았습니다." }, { status: 500 });
  const images: string[] = [];
  for (let i = 0; i < count; i++) {
    let res: Response;
    try {
      res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${acct}/ai/run/${CF_MODEL}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${cfToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: `${full}${i ? " (alternative composition)" : ""}`, steps: 8 }),
      });
    } catch { continue; }
    if (!res.ok) continue;
    const d = await res.json();
    if (d?.result?.image) images.push(`data:image/jpeg;base64,${d.result.image}`);
  }
  if (!images.length) return NextResponse.json({ error: "이미지 생성에 실패했어요. 잠시 후 다시 시도해 주세요." }, { status: 502 });
  return NextResponse.json({ images, scene });
}
