"use client";

// 공지 게시판 — 관리자는 작성·삭제, 회원은 읽기.
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type Announcement = { id: string; category: string; title: string; body: string; created_at: string; image_url?: string | null };
const CATS = ["주간모임", "경조사", "일반"] as const;
const catColor: Record<string, string> = { 주간모임: "bg-primary/10 text-primary", 경조사: "bg-[rgba(196,125,26,.12)] text-warning", 일반: "bg-surface-soft text-ink-soft" };
const fmt = (d: string) => { const t = new Date(d); return `${t.getFullYear()}.${t.getMonth() + 1}.${t.getDate()}`; };

export default function NoticesBoard({ isAdmin, initial }: { isAdmin: boolean; initial: Announcement[] }) {
  const [supabase] = useState(() => createClient());
  const [list, setList] = useState<Announcement[]>(initial);
  const [open, setOpen] = useState(false);
  const [cat, setCat] = useState<string>("일반");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  async function publish() {
    if (!title.trim() || !body.trim()) { alert("제목과 내용을 입력해 주세요."); return; }
    setBusy(true);
    const { data, error } = await supabase.from("announcements").insert({ category: cat, title: title.trim(), body: body.trim() }).select("id, category, title, body, created_at, image_url").single();
    setBusy(false);
    if (error) { alert("게시 실패: " + error.message); return; }
    setList((l) => [data as Announcement, ...l]);
    setTitle(""); setBody(""); setOpen(false);
  }
  async function del(id: string) {
    if (!confirm("이 공지를 삭제할까요?")) return;
    setList((l) => l.filter((a) => a.id !== id));
    await supabase.from("announcements").delete().eq("id", id);
  }

  const inp = "min-h-[42px] w-full rounded-md border border-line bg-card px-3 text-[16px] text-ink outline-none focus:border-primary-focus";

  return (
    <div className="mx-auto max-w-[760px]">
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-bold text-ink">📢 공지</h1>
        {isAdmin && <button onClick={() => setOpen((v) => !v)} className="rounded-full bg-primary px-4 py-2 text-[14px] font-semibold text-white hover:bg-primary-pressed">{open ? "닫기" : "＋ 공지 작성"}</button>}
      </div>

      {isAdmin && open && (
        <div className="mt-3 rounded-lg border border-line bg-card p-4">
          <div className="flex flex-wrap gap-2">
            {CATS.map((c) => <button key={c} onClick={() => setCat(c)} className={`rounded-full px-3 py-1 text-[13px] font-semibold ${cat === c ? "bg-primary text-white" : "border border-line text-ink-soft hover:border-primary"}`}>{c}</button>)}
          </div>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="제목" className={`${inp} mt-3`} />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="내용 (콘텐츠 생성에서 만든 공지글을 붙여넣어도 돼요)" className={`${inp} mt-2 min-h-[160px] py-2`} />
          <button onClick={publish} disabled={busy} className="mt-3 rounded-full bg-primary px-5 py-2 text-[14px] font-semibold text-white hover:bg-primary-pressed disabled:opacity-50">{busy ? "게시 중…" : "회원에게 게시"}</button>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-3">
        {list.length === 0 ? (
          <p className="rounded-lg border border-line bg-card px-4 py-12 text-center text-[15px] text-ink-soft">아직 공지가 없어요.{isAdmin && " ‘＋ 공지 작성’으로 첫 공지를 올려보세요."}</p>
        ) : list.map((a) => (
          <article key={a.id} className="rounded-lg border border-line bg-card p-4">
            <div className="flex items-center gap-2">
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${catColor[a.category] ?? catColor["일반"]}`}>{a.category}</span>
              <span className="text-[12px] text-muted">{fmt(a.created_at)}</span>
              {isAdmin && <button onClick={() => del(a.id)} className="ml-auto text-[12px] font-semibold text-unpaid hover:underline">삭제</button>}
            </div>
            <h2 className="mt-1.5 text-[17px] font-bold text-ink">{a.title}</h2>
            {a.image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={a.image_url} alt="포스터" className="mt-2 w-full max-w-[280px] rounded-lg border border-line" />
            )}
            <p className="mt-1.5 whitespace-pre-wrap text-[14.5px] leading-relaxed text-ink-soft">{a.body}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
