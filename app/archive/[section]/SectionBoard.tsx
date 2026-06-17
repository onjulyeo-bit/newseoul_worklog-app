"use client";

// 아카이브 섹션 화면 — 레이아웃별 표시 + (운영진) 추가·삭제. 기존 archive 테이블·버킷 재활용.
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ChevronLeft, Plus, Download, ExternalLink, PlayCircle, Trash2 } from "lucide-react";
import { createArchive, deleteArchive } from "../actions";
import type { Section } from "../sections";

export type ArchiveItem = {
  id: string; category: string | null; title: string; event_date: string | null;
  content: string | null; image_url: string | null; link: string | null;
};

const fileExt = (url: string) => (url.split("?")[0].split(".").pop() || "").toUpperCase();

export default function SectionBoard({ section, items, isAdmin }: { section: Section; items: ArchiveItem[]; isAdmin: boolean }) {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState({ title: "", event_date: "", content: "", link: "" });
  const [file, setFile] = useState<File | null>(null);
  const set = (k: keyof typeof form, v: string) => setForm((s) => ({ ...s, [k]: v }));

  const L = section.layout;
  const titleLabel = L === "people" ? "이름" : L === "docs" ? "문서명" : "제목";
  const contentLabel = L === "people" ? "재임 기간·비고" : L === "docs" ? "설명 (선택)" : "내용";
  const linkLabel = L === "intro" ? "영상/자료 링크 (유튜브 등)" : "링크 (선택)";

  async function onAdd() {
    if (!form.title.trim()) { setMsg("제목을 입력해 주세요."); return; }
    setBusy(true); setMsg("");
    try {
      let imageUrl: string | null = null;
      let link: string | null = form.link.trim() || null;
      if (file) {
        const sb = createClient();
        const ext = (file.name.split(".").pop() || "dat").toLowerCase();
        const path = `${Date.now()}.${ext}`;
        const up = await sb.storage.from("archive").upload(path, file);
        if (up.error) throw new Error("업로드 실패: " + up.error.message);
        const url = sb.storage.from("archive").getPublicUrl(path).data.publicUrl;
        if (section.uploadDocs) link = url; else imageUrl = url; // 자료실은 문서 → link, 그 외 → image
      }
      const res = await createArchive({ category: section.category, title: form.title.trim(), event_date: form.event_date || null, content: form.content.trim() || null, image_url: imageUrl, link });
      if (res.error) throw new Error(res.error);
      setForm({ title: "", event_date: "", content: "", link: "" }); setFile(null); setShow(false);
      router.refresh();
    } catch (e) { setMsg("❌ " + (e instanceof Error ? e.message : "오류")); } finally { setBusy(false); }
  }
  const onDelete = (id: string, title: string) => { if (!confirm(`'${title}'을(를) 삭제할까요?`)) return; deleteArchive(id).then(() => router.refresh()); };

  const inp = "min-h-[42px] w-full rounded-md border border-line bg-card px-3 text-[16px] outline-none focus:border-primary";

  return (
    <div className="text-ink">
      <Link href="/archive" className="mb-3 inline-flex items-center gap-1 text-[14px] font-semibold text-primary hover:underline"><ChevronLeft size={16} /> 아카이브</Link>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-[clamp(20px,5vw,25px)] font-extrabold tracking-tight">{section.label}</h1>
          <p className="mt-1 text-[14px] font-medium text-ink-soft">{section.desc}</p>
        </div>
        {isAdmin && <button onClick={() => setShow((v) => !v)} className="inline-flex min-h-[42px] items-center gap-1.5 rounded-full bg-primary px-5 text-[15px] font-semibold text-white hover:bg-primary-pressed"><Plus size={17} /> 추가</button>}
      </div>

      {isAdmin && show && (
        <div className="mb-5 rounded-xl border border-primary/40 bg-[rgba(0,102,204,.04)] p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2"><label className="mb-1 block text-[13px] font-bold text-ink-soft">{titleLabel} *</label><input value={form.title} onChange={(e) => set("title", e.target.value)} className={inp} /></div>
            {L !== "people" && L !== "text" && L !== "intro" && <div><label className="mb-1 block text-[13px] font-bold text-ink-soft">날짜 (선택)</label><input type="date" value={form.event_date} onChange={(e) => set("event_date", e.target.value)} className={inp} /></div>}
            <div className="sm:col-span-2"><label className="mb-1 block text-[13px] font-bold text-ink-soft">{contentLabel}</label><textarea value={form.content} onChange={(e) => set("content", e.target.value)} className={`${inp} min-h-[80px] py-2`} /></div>
            {section.uploadDocs ? (
              <div className="sm:col-span-2"><label className="mb-1 block text-[13px] font-bold text-ink-soft">문서 파일 (PDF·한글 등)</label><input type="file" accept=".pdf,.hwp,.hwpx,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="block w-full text-[14px] text-ink-soft file:mr-3 file:rounded-full file:border-0 file:bg-primary file:px-4 file:py-2 file:text-[14px] file:font-semibold file:text-white" /></div>
            ) : (
              <div><label className="mb-1 block text-[13px] font-bold text-ink-soft">사진 (선택)</label><input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="block w-full text-[14px] text-ink-soft file:mr-3 file:rounded-full file:border-0 file:bg-primary file:px-4 file:py-2 file:text-[14px] file:font-semibold file:text-white" /></div>
            )}
            {!section.uploadDocs && <div><label className="mb-1 block text-[13px] font-bold text-ink-soft">{linkLabel}</label><input value={form.link} onChange={(e) => set("link", e.target.value)} placeholder="https://" className={inp} /></div>}
          </div>
          <div className="mt-3 flex items-center gap-3">
            <button onClick={onAdd} disabled={busy} className="min-h-[42px] rounded-full bg-primary px-6 text-[15px] font-semibold text-white hover:bg-primary-pressed disabled:opacity-50">{busy ? "저장 중…" : "저장"}</button>
            {msg && <span className="text-[14px] font-semibold text-unpaid">{msg}</span>}
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <p className="rounded-xl border border-line bg-card px-4 py-12 text-center text-[15px] text-ink-soft">아직 기록이 없어요.{isAdmin && " 위 ‘추가’로 시작하세요."}</p>
      ) : L === "timeline" ? (
        <div className="relative ml-2 border-l-2 border-line pl-5">
          {items.map((it) => (
            <div key={it.id} className="relative mb-6">
              <span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full border-2 border-white bg-primary" />
              {it.event_date && <div className="text-[13px] font-bold text-primary">{it.event_date}</div>}
              <h3 className="text-[16px] font-bold">{it.title}</h3>
              {it.content && <p className="mt-1 whitespace-pre-wrap text-[14px] text-ink-soft">{it.content}</p>}
              {it.image_url && <img src={it.image_url} alt={it.title} className="mt-2 max-h-60 rounded-lg border border-line object-cover" />}
              {isAdmin && <button onClick={() => onDelete(it.id, it.title)} className="mt-1 text-[12px] font-bold text-unpaid hover:underline">삭제</button>}
            </div>
          ))}
        </div>
      ) : L === "people" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => (
            <div key={it.id} className="flex flex-col items-center rounded-xl border border-line bg-card p-5 text-center">
              {it.image_url ? <img src={it.image_url} alt={it.title} className="mb-3 h-24 w-24 rounded-full object-cover" /> : <span className="mb-3 grid h-24 w-24 place-items-center rounded-full bg-surface-soft text-[28px] font-bold text-ink-soft">{it.title.charAt(0)}</span>}
              <h3 className="text-[16px] font-bold">{it.title}</h3>
              {it.content && <p className="mt-1 text-[13px] text-ink-soft">{it.content}</p>}
              {isAdmin && <button onClick={() => onDelete(it.id, it.title)} className="mt-2 text-[12px] font-bold text-unpaid hover:underline">삭제</button>}
            </div>
          ))}
        </div>
      ) : L === "gallery" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => (
            <div key={it.id} className="flex flex-col overflow-hidden rounded-xl border border-line bg-card">
              {it.image_url
                ? <img src={it.image_url} alt={it.title} className="h-48 w-full object-cover" />
                : <div className="grid h-48 w-full place-items-center bg-surface-soft text-ink-soft">사진 없음</div>}
              <div className="flex flex-1 flex-col p-3">
                <h3 className="text-[15px] font-bold">{it.title}</h3>
                {it.event_date && <span className="text-[12px] text-muted">{it.event_date}</span>}
                {it.content && <p className="mt-1 text-[13px] text-ink-soft">{it.content}</p>}
                {isAdmin && <button onClick={() => onDelete(it.id, it.title)} className="mt-auto pt-2 text-left text-[12px] font-bold text-unpaid hover:underline">삭제</button>}
              </div>
            </div>
          ))}
        </div>
      ) : L === "docs" ? (
        <div className="overflow-hidden rounded-xl border border-line bg-card">
          {items.map((it) => (
            <div key={it.id} className="flex items-center gap-3 border-b border-line px-4 py-3 last:border-b-0">
              <span className="grid h-9 w-12 flex-shrink-0 place-items-center rounded-md bg-surface-soft text-[11px] font-bold text-ink-soft">{it.link ? fileExt(it.link) : "FILE"}</span>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-[15px] font-bold">{it.title}</h3>
                {it.content && <p className="truncate text-[13px] text-ink-soft">{it.content}</p>}
              </div>
              {it.link && <a href={it.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-full bg-[rgba(0,102,204,.1)] px-3 py-1.5 text-[13px] font-bold text-primary"><Download size={15} /> 다운로드</a>}
              {isAdmin && <button onClick={() => onDelete(it.id, it.title)} className="text-[12px] font-bold text-unpaid hover:underline">삭제</button>}
            </div>
          ))}
        </div>
      ) : (
        // text(입회안내) · intro(CBMC소개)
        <div className="flex flex-col gap-4">
          {items.map((it) => (
            <div key={it.id} className="rounded-xl border border-line bg-card p-5">
              <h3 className="text-[17px] font-bold">{it.title}</h3>
              {it.image_url && <img src={it.image_url} alt={it.title} className="mt-3 max-h-72 rounded-lg border border-line object-cover" />}
              {it.content && <p className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed text-ink">{it.content}</p>}
              {it.link && <a href={it.link} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-[14px] font-semibold text-white">{L === "intro" ? <><PlayCircle size={16} /> 영상·자료 보기</> : <><ExternalLink size={15} /> 자세히 보기</>}</a>}
              {isAdmin && <button onClick={() => onDelete(it.id, it.title)} className="ml-3 mt-3 text-[12px] font-bold text-unpaid hover:underline">삭제</button>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
