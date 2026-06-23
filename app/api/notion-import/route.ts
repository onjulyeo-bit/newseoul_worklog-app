// 노션 주보 DB의 각 회차 '페이지 본문'에서 성경본문·찬양을 뽑아 연간일정(meetings)의 빈 칸을 채운다.
//   운영진(admin)만. NOTION_TOKEN 필요. DB 목록 쿼리는 표준 Notion REST(databases/query) — 무료 통합으로 동작.
//   기존에 입력된 값은 덮어쓰지 않음(빈 칸만 채움).
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const DB_ID = process.env.NOTION_DB_ID || "2aaa504e896b807d91b4c616f5524d8e";
const NV = "2022-06-28";

type RT = { plain_text?: string; text?: { content?: string } };
const txtOf = (rts: RT[] = []) => rts.map((r) => r.plain_text ?? r.text?.content ?? "").join("");
function blockText(b: Record<string, unknown>): string {
  const body = b[b.type as string] as { rich_text?: RT[] } | undefined;
  return txtOf(body?.rich_text ?? []);
}

// 한 페이지 본문(상위 블록)에서 성경본문·찬양 추출
function extract(blocks: Record<string, unknown>[]): { verse: string; praise: string } {
  let praise = "", verse = "";
  for (const b of blocks) {
    const t = blockText(b).trim();
    if (!t) continue;
    if (!praise) {
      const m = t.match(/찬양\s*[:：]\s*(.+)/);
      if (m) praise = m[1].split(/[(（]/)[0].replace(/\s+/g, " ").trim();
    }
    if (!verse && !/찬양/.test(t)) {
      const m = t.match(/[(（]\s*([가-힣]{1,4}\s?\d{1,3}\s*[:：]\s*\d{1,3}(?:\s*[-~–]\s*\d{1,3})?)\s*[)）]/);
      if (m) verse = m[1].replace(/\s+/g, " ").trim();
    }
  }
  return { verse, praise };
}

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  const { data: prof } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (prof?.role !== "admin") return NextResponse.json({ error: "운영진만 사용할 수 있어요." }, { status: 403 });
  const token = process.env.NOTION_TOKEN;
  if (!token) return NextResponse.json({ error: "노션 토큰이 설정되지 않았어요.", needToken: true }, { status: 500 });
  const headers = { Authorization: `Bearer ${token}`, "Notion-Version": NV, "Content-Type": "application/json" };

  // 1) DB의 모든 페이지(회차) 목록 — 날짜 속성 포함
  type Page = { id: string; date: string };
  const pages: Page[] = [];
  let cursor: string | undefined;
  try {
    do {
      const r = await fetch(`https://api.notion.com/v1/databases/${DB_ID}/query`, {
        method: "POST", headers, body: JSON.stringify({ page_size: 100, ...(cursor ? { start_cursor: cursor } : {}) }),
      });
      const j = await r.json();
      if (!r.ok) { const nf = r.status === 404; return NextResponse.json({ error: nf ? "노션 봇이 이 DB에 연결되지 않았어요." : "노션 DB를 읽지 못했어요.", detail: JSON.stringify(j).slice(0, 300) }, { status: 502 }); }
      for (const p of j.results ?? []) {
        const props = p.properties ?? {};
        const dateProp = Object.values(props).find((v) => (v as { type?: string }).type === "date") as { date?: { start?: string } } | undefined;
        const start = dateProp?.date?.start;
        if (start) pages.push({ id: p.id, date: start.slice(0, 10) });
      }
      cursor = j.has_more ? j.next_cursor : undefined;
    } while (cursor);
  } catch { return NextResponse.json({ error: "노션 연결 실패" }, { status: 502 }); }

  // 2) 빈 칸이 있는 meetings만 대상으로
  const { data: meetings } = await supabase
    .from("meetings").select("date, verse, praise").eq("chapter_id", "새서울");
  const needByDate = new Map<string, { verse: boolean; praise: boolean }>();
  for (const m of meetings ?? []) {
    const needV = !m.verse || m.verse.trim() === "";
    const needP = !m.praise || m.praise.trim() === "";
    if (needV || needP) needByDate.set(m.date, { verse: needV, praise: needP });
  }

  // 3) 대상 날짜에 해당하는 페이지만 본문 읽어 추출 → 빈 칸 채움
  let updated = 0, scanned = 0;
  const samples: string[] = [];
  for (const pg of pages) {
    const need = needByDate.get(pg.date);
    if (!need) continue;
    scanned++;
    try {
      const r = await fetch(`https://api.notion.com/v1/blocks/${pg.id}/children?page_size=100`, { headers });
      if (!r.ok) continue;
      const j = await r.json();
      const { verse, praise } = extract(j.results ?? []);
      const patch: Record<string, string> = {};
      if (need.verse && verse) patch.verse = verse;
      if (need.praise && praise) patch.praise = praise;
      if (Object.keys(patch).length === 0) continue;
      const { error } = await supabase.from("meetings").update(patch).eq("chapter_id", "새서울").eq("date", pg.date);
      if (!error) { updated++; if (samples.length < 5) samples.push(`${pg.date}: ${[patch.verse, patch.praise].filter(Boolean).join(" / ")}`); }
    } catch { /* skip one */ }
  }

  return NextResponse.json({ ok: true, scanned, updated, samples });
}
