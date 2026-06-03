"use client";

// 히스토리 아카이브 — 창립일·역대회장·사진·연혁 전시 + (임원만) 사진 업로드 추가.
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createArchive, deleteArchive } from "./actions";

export type ArchiveItem = {
  id: string; category: string | null; title: string; event_date: string | null;
  content: string | null; image_url: string | null; link: string | null;
};

const CATEGORIES = ["연혁", "역대회장", "사진", "문서", "기타"];

export default function ArchiveBoard({ items, isAdmin, loggedIn }: { items: ArchiveItem[]; isAdmin: boolean; loggedIn: boolean }) {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ category: "연혁", title: "", event_date: "", content: "", link: "" });
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [, startTransition] = useTransition();
  const set = (k: keyof typeof form, v: string) => setForm((s) => ({ ...s, [k]: v }));

  async function onAdd() {
    if (!form.title.trim()) { setMsg("제목을 입력해 주세요."); return; }
    setBusy(true); setMsg("");
    try {
      let imageUrl: string | null = null;
      if (file) {
        const sb = createClient();
        const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
        const path = `${Date.now()}.${ext}`;
        const up = await sb.storage.from("archive").upload(path, file);
        if (up.error) throw new Error("사진 업로드 실패: " + up.error.message);
        imageUrl = sb.storage.from("archive").getPublicUrl(path).data.publicUrl;
      }
      const res = await createArchive({ category: form.category, title: form.title, event_date: form.event_date || null, content: form.content || null, image_url: imageUrl, link: form.link || null });
      if (res.error) throw new Error(res.error);
      setForm({ category: "연혁", title: "", event_date: "", content: "", link: "" });
      setFile(null); setShow(false);
      router.refresh();
    } catch (e) {
      setMsg("❌ " + (e instanceof Error ? e.message : "오류"));
    } finally {
      setBusy(false);
    }
  }
  const onDelete = (id: string, title: string) => {
    if (!confirm(`'${title}'을(를) 삭제할까요?`)) return;
    startTransition(async () => { await deleteArchive(id); router.refresh(); });
  };

  const inp = "min-h-[42px] w-full rounded-md border border-line bg-card px-3 text-[16px] outline-none focus:border-primary-focus";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-[22px] font-bold text-ink">새서울 CBMC 아카이브</h1>
          <p className="text-[14px] text-ink-soft">창립일·역대 회장·연혁·사진을 기록하고 함께 봅니다.</p>
        </div>
        {isAdmin && <button onClick={() => setShow((v) => !v)} className="min-h-[44px] rounded-full bg-primary px-5 text-[16px] font-semibold text-white hover:bg-primary-pressed">+ 기록 추가</button>}
      </div>

      {!loggedIn && <p className="rounded-md bg-[rgba(0,102,204,.07)] px-3 py-2 text-[15px] text-ink-soft">로그인하면 히스토리를 볼 수 있어요.</p>}

      {/* 추가 폼 (임원만) */}
      {isAdmin && show && (
        <div className="rounded-lg border border-primary/40 bg-[rgba(0,102,204,.04)] p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div><label className="mb-1 block text-[13px] font-bold text-ink-soft">분류</label>
              <select value={form.category} onChange={(e) => set("category", e.target.value)} className={inp}>{CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
            <div><label className="mb-1 block text-[13px] font-bold text-ink-soft">날짜 (선택)</label><input type="date" value={form.event_date} onChange={(e) => set("event_date", e.target.value)} className={inp} /></div>
            <div className="sm:col-span-2"><label className="mb-1 block text-[13px] font-bold text-ink-soft">제목 *</label><input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="예: 새서울지회 창립 / 제25대 지회장 홍길동" className={inp} /></div>
            <div className="sm:col-span-2"><label className="mb-1 block text-[13px] font-bold text-ink-soft">내용</label><textarea value={form.content} onChange={(e) => set("content", e.target.value)} className={`${inp} min-h-[80px] py-2`} /></div>
            <div><label className="mb-1 block text-[13px] font-bold text-ink-soft">사진 (선택)</label><input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="block w-full text-[14px] text-ink-soft file:mr-3 file:rounded-full file:border-0 file:bg-primary file:px-4 file:py-2 file:text-[14px] file:font-semibold file:text-white" /></div>
            <div><label className="mb-1 block text-[13px] font-bold text-ink-soft">링크 (선택)</label><input value={form.link} onChange={(e) => set("link", e.target.value)} placeholder="https://" className={inp} /></div>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <button onClick={onAdd} disabled={busy} className="min-h-[44px] rounded-full bg-primary px-6 text-[16px] font-semibold text-white hover:bg-primary-pressed disabled:opacity-50">{busy ? "저장 중…" : "저장"}</button>
            {msg && <span className="text-[15px] font-semibold text-unpaid">{msg}</span>}
          </div>
        </div>
      )}

      {/* 카드 목록 */}
      {items.length === 0 ? (
        <p className="rounded-lg border border-line bg-card px-4 py-10 text-center text-[15px] text-ink-soft">아직 기록이 없어요.{isAdmin && " 위 ‘+ 기록 추가’로 시작하세요."}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => (
            <div key={it.id} className="flex flex-col overflow-hidden rounded-lg border border-line bg-card">
              {it.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={it.image_url} alt={it.title} className="h-44 w-full object-cover" />
              )}
              <div className="flex flex-1 flex-col p-4">
                <div className="mb-1 flex items-center gap-2">
                  {it.category && <span className="rounded-full bg-[rgba(0,102,204,.12)] px-2 py-0.5 text-[11px] font-bold text-primary">{it.category}</span>}
                  {it.event_date && <span className="text-[12px] text-muted">{it.event_date}</span>}
                </div>
                <h3 className="text-[16px] font-bold text-ink">{it.title}</h3>
                {it.content && <p className="mt-1 whitespace-pre-wrap text-[14px] text-ink-soft">{it.content}</p>}
                <div className="mt-auto flex items-center gap-3 pt-3">
                  {it.link && <a href={it.link} target="_blank" rel="noreferrer" className="text-[13px] font-semibold text-primary hover:underline">링크 →</a>}
                  {isAdmin && <button onClick={() => onDelete(it.id, it.title)} className="text-[12px] font-bold text-unpaid hover:underline">삭제</button>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
