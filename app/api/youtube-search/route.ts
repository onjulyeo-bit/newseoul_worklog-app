// 찬양곡 유튜브 추천 — 4분 미만(videoDuration=short) 영상 2개. 키는 서버에서만. 로그인(운영진)만.
//   YOUTUBE_API_KEY(YouTube Data API v3) 필요. 무료 쿼터로 충분.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return NextResponse.json({ error: "유튜브 API 키가 설정되지 않았어요.", needKey: true }, { status: 500 });

  let q = "";
  try { ({ q } = await req.json()); } catch {}
  q = (q || "").trim();
  if (!q) return NextResponse.json({ error: "찬양곡 제목을 입력해 주세요." }, { status: 400 });

  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoDuration=short&maxResults=5&regionCode=KR&relevanceLanguage=ko&q=${encodeURIComponent(q + " 찬양")}&key=${key}`;
  let res: Response;
  try { res = await fetch(url); } catch { return NextResponse.json({ error: "유튜브에 연결하지 못했어요." }, { status: 502 }); }
  if (!res.ok) {
    const detail = (await res.text()).slice(0, 300);
    return NextResponse.json({ error: "유튜브 검색에 실패했어요. (키·쿼터 확인)", detail }, { status: 502 });
  }
  const data = await res.json();
  const items = (data.items ?? [])
    .filter((it: { id?: { videoId?: string } }) => it.id?.videoId)
    .slice(0, 2)
    .map((it: { id: { videoId: string }; snippet: { title: string; channelTitle: string } }) => ({
      title: it.snippet.title.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'"),
      channel: it.snippet.channelTitle,
      url: `https://youtu.be/${it.id.videoId}`,
    }));
  return NextResponse.json({ items });
}
