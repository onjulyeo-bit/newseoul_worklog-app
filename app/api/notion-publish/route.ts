// 주보를 노션 데이터베이스에 직접 생성. 운영진(로그인)만. 준비 단계용(발표엔 영향 없음).
//   NOTION_TOKEN 필요. DB 속성은 실행 시 자동 인식(이름/타입 매칭)해서 채움.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const DB_ID = process.env.NOTION_DB_ID || "2aaa504e896b807d91b4c616f5524d8e";
const NV = "2022-06-28";
const IDENTITY = "CBMC는 실업인과 전문인들에게 복음을 전하여 예수 그리스도가 구주이심을 증거하고, 주님의 지상 명령을 성취하는 국제적 사명 공동체입니다.";
const SLOGAN = ["예수님께 속한, 새서울!", "사랑으로 하나되는, 새서울!", "성령님과 동행하는, 새서울!"];

type Body = {
  title: string; date: string; mode: string; program: string;
  topic: string; verse: string; speaker: string; host: string;
  praiseTitle: string; praiseLink: string; scripture: string; discussion: string; ads: string; whoLabel: string;
};
const rt = (content: string) => [{ type: "text", text: { content } }];
const h2 = (t: string) => ({ object: "block", type: "heading_2", heading_2: { rich_text: rt(t) } });
const h3 = (t: string) => ({ object: "block", type: "heading_3", heading_3: { rich_text: rt(t) } });
const p = (t: string) => ({ object: "block", type: "paragraph", paragraph: { rich_text: rt(t) } });
const bullet = (t: string) => ({ object: "block", type: "bulleted_list_item", bulleted_list_item: { rich_text: rt(t) } });

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  const token = process.env.NOTION_TOKEN;
  if (!token) return NextResponse.json({ error: "노션 토큰이 설정되지 않았어요.", needToken: true }, { status: 500 });

  let b: Body;
  try { b = await req.json(); } catch { return NextResponse.json({ error: "잘못된 요청" }, { status: 400 }); }
  const headers = { Authorization: `Bearer ${token}`, "Notion-Version": NV, "Content-Type": "application/json" };

  // 1) DB 속성 스키마 읽기 → 속성 자동 매핑
  let db: { properties?: Record<string, { type: string }> };
  try {
    const r = await fetch(`https://api.notion.com/v1/databases/${DB_ID}`, { headers });
    if (!r.ok) { const d = (await r.text()).slice(0, 300); const nf = r.status === 404; return NextResponse.json({ error: nf ? "노션 봇이 이 데이터베이스에 연결되지 않았어요. (DB → ··· → 연결에 봇 추가)" : "노션 DB를 읽지 못했어요.", detail: d }, { status: 502 }); }
    db = await r.json();
  } catch { return NextResponse.json({ error: "노션에 연결하지 못했어요." }, { status: 502 }); }

  const modeLabel = b.mode === "online" ? "온라인" : "오프라인";
  const props = db.properties ?? {};
  const properties: Record<string, unknown> = {};
  for (const [name, def] of Object.entries(props)) {
    const type = def.type;
    if (type === "title") properties[name] = { title: rt(b.title) };
    else if (type === "date") { if (b.date) properties[name] = { date: { start: b.date } }; }
    else if (type === "select") properties[name] = { select: { name: modeLabel } };
    else if (type === "rich_text") {
      if (name.includes("강사") || name.includes("진행")) { if (b.speaker) properties[name] = { rich_text: rt(b.speaker) }; }
      else if (name.includes("사회")) { if (b.host) properties[name] = { rich_text: rt(b.host) }; }
    }
  }

  // 2) 본문 블록 구성
  const children: unknown[] = [];
  children.push(h2(`🏛 ${b.title.replace(/_.*$/, "")} 새서울 CBMC 아름다운 만남`));
  if (b.host) children.push(p(`사회 : ${b.host}`));
  children.push(h3("1. CBMC 정체성 선언"));
  children.push(p(IDENTITY));
  children.push(h3(`2. 찬양${b.praiseTitle ? ` : ${b.praiseTitle}` : ""}`));
  if (b.praiseLink) children.push({ object: "block", type: "paragraph", paragraph: { rich_text: [{ type: "text", text: { content: "▶ 찬양 영상", link: { url: b.praiseLink } } }] } });
  children.push(h3(`3. ${b.whoLabel || "설교"}${b.topic ? ` - ${b.topic}` : ""}${b.verse ? ` (${b.verse})` : ""}`));
  if (b.scripture.trim()) children.push(p(b.scripture.trim()));
  children.push(h3("4. 소그룹 모임 및 기도 나눔"));
  b.discussion.split("\n").map((s) => s.trim()).filter(Boolean).forEach((q, i) => children.push(p(`${i + 1}. ${q}`)));
  children.push(h3(`5. 합심 기도 및 마침 기도${b.speaker ? ` (${b.speaker})` : ""}`));
  children.push(h3("6. 광고"));
  b.ads.split("\n").map((s) => s.trim()).filter(Boolean).forEach((a) => children.push(bullet(a)));
  children.push({ object: "block", type: "callout", callout: { icon: { emoji: "🙌" }, rich_text: rt(`2026 새서울 구호\n${SLOGAN.join("\n")}`) } });
  children.push(p(`💖 ${b.title.replace(/_.*$/, "")} 새서울 CBMC 아름다운 만남을 폐회합니다.`));

  // 3) 페이지 생성
  try {
    const r = await fetch("https://api.notion.com/v1/pages", { method: "POST", headers, body: JSON.stringify({ parent: { database_id: DB_ID }, properties, children }) });
    const j = await r.json();
    if (!r.ok) return NextResponse.json({ error: "노션 페이지 생성 실패", detail: JSON.stringify(j).slice(0, 400) }, { status: 502 });
    return NextResponse.json({ ok: true, url: j.url });
  } catch { return NextResponse.json({ error: "노션 페이지 생성 중 오류" }, { status: 502 }); }
}
