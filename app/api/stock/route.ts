// 무료 사진·일러스트 검색/적용 — Pixabay API.
// GET: 검색(썸네일 목록).  POST: 고른 이미지를 서버가 받아 data URL로 반환(포스터 배경·PNG저장 안전).
// 키(PIXABAY_API_KEY)는 서버에서만. 로그인(관리자)만.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function requireUser() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  return user;
}

export async function GET(req: Request) {
  if (!(await requireUser())) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  const key = process.env.PIXABAY_API_KEY;
  if (!key) return NextResponse.json({ error: "이미지 키가 아직 설정되지 않았습니다. (PIXABAY_API_KEY)" }, { status: 500 });

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const type = searchParams.get("type") || "all"; // all | photo | illustration | vector
  if (!q) return NextResponse.json({ images: [] });

  const hasKo = /[가-힣]/.test(q);
  const url = `https://pixabay.com/api/?key=${key}&q=${encodeURIComponent(q)}&image_type=${type}&orientation=vertical&safesearch=true&per_page=30${hasKo ? "&lang=ko" : ""}`;

  let res: Response;
  try { res = await fetch(url); } catch { return NextResponse.json({ error: "검색 서버에 연결하지 못했습니다." }, { status: 502 }); }
  if (!res.ok) return NextResponse.json({ error: "검색에 실패했어요. 잠시 후 다시 시도해 주세요." }, { status: 502 });

  const data = await res.json();
  const images = (data.hits || []).map((h: { webformatURL: string; largeImageURL?: string }) => ({
    thumb: h.webformatURL,
    full: h.largeImageURL || h.webformatURL,
  }));
  return NextResponse.json({ images });
}

export async function POST(req: Request) {
  if (!(await requireUser())) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  let url = "";
  try { ({ url } = await req.json()); } catch {}
  // SSRF 방지: Pixabay 도메인만 허용
  if (!url || !/^https:\/\/(cdn\.)?pixabay\.com\//.test(url)) return NextResponse.json({ error: "허용되지 않은 이미지예요." }, { status: 400 });

  let res: Response;
  try { res = await fetch(url); } catch { return NextResponse.json({ error: "이미지를 불러오지 못했습니다." }, { status: 502 }); }
  if (!res.ok) return NextResponse.json({ error: "이미지를 불러오지 못했습니다." }, { status: 502 });

  const ct = res.headers.get("content-type") || "image/jpeg";
  const buf = Buffer.from(await res.arrayBuffer());
  return NextResponse.json({ image: `data:${ct};base64,${buf.toString("base64")}` });
}
