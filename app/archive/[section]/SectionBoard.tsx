"use client";

// 아카이브 섹션 화면 — 클로드디자인(아카이브.dc.html) 비주얼 + 실제 CRUD·업로드(기존 archive 테이블·버킷).
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ChevronLeft, Plus, Download, ExternalLink, PlayCircle, Trash2, Image as ImageIcon, Images, Pencil } from "lucide-react";
import { createArchive, deleteArchive } from "../actions";
import { ARC_CSS } from "../arcCss";
import type { Section } from "../sections";
import BulkPhotoUpload from "./BulkPhotoUpload";
import PersonEditor from "./PersonEditor";

export type ArchiveItem = {
  id: string; category: string | null; title: string; event_date: string | null;
  content: string | null; image_url: string | null; link: string | null;
};

const fileExt = (url: string) => (url.split("?")[0].split(".").pop() || "FILE").toUpperCase();
const badgeTone = (ext: string) =>
  ext === "PDF" ? { color: "#c0392b", background: "#fdecea" }
    : ext.startsWith("HWP") ? { color: "#0032a8", background: "#e8f1fc" }
      : { color: "#5a6573", background: "#eef0f3" };

export default function SectionBoard({ section, items, isAdmin }: { section: Section; items: ArchiveItem[]; isAdmin: boolean }) {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState({ title: "", event_date: "", content: "", link: "" });
  const [file, setFile] = useState<File | null>(null);
  const [bulk, setBulk] = useState(false);
  const [viewer, setViewer] = useState<ArchiveItem | null>(null);
  const [editPerson, setEditPerson] = useState<ArchiveItem | null>(null);
  const set = (k: keyof typeof form, v: string) => setForm((s) => ({ ...s, [k]: v }));

  const L = section.layout;
  const titleLabel = L === "people" ? "이름" : L === "docs" ? "문서명" : "제목";
  const contentLabel = L === "people" ? "재임 기간·비고" : L === "docs" ? "설명 (선택)" : "내용";
  const hasDate = L === "timeline" || L === "gallery";
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
        if (section.uploadDocs) link = url; else imageUrl = url;
      }
      const res = await createArchive({ category: section.category, title: form.title.trim(), event_date: form.event_date || null, content: form.content.trim() || null, image_url: imageUrl, link });
      if (res.error) throw new Error(res.error);
      setForm({ title: "", event_date: "", content: "", link: "" }); setFile(null); setShow(false);
      router.refresh();
    } catch (e) { setMsg("❌ " + (e instanceof Error ? e.message : "오류")); } finally { setBusy(false); }
  }
  const onDelete = (id: string, title: string) => { if (!confirm(`'${title}'을(를) 삭제할까요?`)) return; deleteArchive(id).then(() => router.refresh()); };

  const Del = ({ it, cls }: { it: ArchiveItem; cls: string }) => (
    <button className={cls} onClick={() => onDelete(it.id, it.title)} aria-label="삭제"><Trash2 size={cls === "arc-del-img" ? 16 : 18} strokeWidth={2} /></button>
  );

  return (
    <div className="moim-arc">
      <style>{ARC_CSS}</style>
      <div className="arc-wrap">
        <Link href="/archive" className="arc-back"><ChevronLeft size={20} strokeWidth={2.2} /> 아카이브</Link>

        <div className="arc-shead">
          <div>
            <h1 className="arc-stitle">{section.label}</h1>
            <p className="arc-sdesc">{section.desc}</p>
          </div>
          {isAdmin && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {L === "people" && <button className="arc-add" style={{ background: "#fff", color: "#003ecc", border: "1px solid #cdddf7", boxShadow: "none" }} onClick={() => setBulk(true)}><Images size={18} strokeWidth={2.2} /> 사진 일괄 등록</button>}
              <button className="arc-add" onClick={() => setShow((v) => !v)}><Plus size={19} strokeWidth={2.4} /> 추가</button>
            </div>
          )}
        </div>

        {isAdmin && bulk && <BulkPhotoUpload category={section.category} targets={items.map((it) => ({ id: it.id, title: it.title }))} onClose={() => { setBulk(false); router.refresh(); }} />}
        {isAdmin && editPerson && <PersonEditor item={{ id: editPerson.id, title: editPerson.title, content: editPerson.content, image_url: editPerson.image_url }} onClose={() => setEditPerson(null)} />}

        {viewer && (
          <div className="arc-viewer" onClick={() => setViewer(null)}>
            <div className="arc-viewer-card" onClick={(e) => e.stopPropagation()}>
              <button className="arc-viewer-x" onClick={() => setViewer(null)} aria-label="닫기">✕</button>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {viewer.image_url && <img className="arc-viewer-img" src={viewer.image_url} alt={viewer.title} />}
              <div className="arc-viewer-name">{viewer.title}</div>
              {viewer.content && <div className="arc-viewer-term">{viewer.content}</div>}
            </div>
          </div>
        )}

        {isAdmin && show && (
          <div className="arc-form">
            <div className="arc-form-t">새 항목 추가</div>
            <div><label className="arc-label">{titleLabel} *</label><input className="arc-inp" value={form.title} onChange={(e) => set("title", e.target.value)} placeholder={`${titleLabel}을 입력하세요`} /></div>
            {hasDate && <div><label className="arc-label">날짜</label><input type="date" className="arc-inp" value={form.event_date} onChange={(e) => set("event_date", e.target.value)} /></div>}
            <div><label className="arc-label">{contentLabel}</label><textarea className="arc-inp" rows={3} value={form.content} onChange={(e) => set("content", e.target.value)} placeholder="내용을 입력하세요" /></div>
            <div><label className="arc-label">{section.uploadDocs ? "문서 파일 (PDF·한글 등)" : "사진 (선택)"}</label>
              <input type="file" className="arc-file" accept={section.uploadDocs ? ".pdf,.hwp,.hwpx,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,image/*" : "image/*"} onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></div>
            {!section.uploadDocs && <div><label className="arc-label">{linkLabel}</label><input className="arc-inp" value={form.link} onChange={(e) => set("link", e.target.value)} placeholder="https://" /></div>}
            <div className="arc-form-acts">
              {msg && <span className="arc-err">{msg}</span>}
              <button className="arc-btn-cancel" onClick={() => { setShow(false); setMsg(""); }}>취소</button>
              <button className="arc-btn-save" onClick={onAdd} disabled={busy}>{busy ? "저장 중…" : "저장"}</button>
            </div>
          </div>
        )}

        {items.length === 0 ? (
          <div className="arc-empty">아직 기록이 없어요.{isAdmin && " 위 ‘추가’로 시작하세요."}</div>
        ) : L === "timeline" ? (
          <div className="arc-tl">
            {items.map((it) => (
              <div key={it.id} className="arc-tl-item">
                <span className="arc-tl-dot" />
                <div className="arc-tl-row">
                  <div style={{ flex: 1 }}>
                    {it.event_date && <div className="arc-tl-date">{it.event_date}</div>}
                    <div className="arc-tl-title">{it.title}</div>
                    {it.content && <div className="arc-tl-body">{it.content}</div>}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {it.image_url && <img className="arc-photo" src={it.image_url} alt={it.title} />}
                  </div>
                  {isAdmin && <Del it={it} cls="arc-del" />}
                </div>
              </div>
            ))}
          </div>
        ) : L === "people" ? (
          <div className="arc-people">
            {items.map((it) => (
              <div key={it.id} className="arc-person">
                {isAdmin && <button className="arc-edit arc-edit-abs" onClick={() => setEditPerson(it)} aria-label="편집"><Pencil size={14} /></button>}
                {isAdmin && <Del it={it} cls="arc-del arc-del-abs" />}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {it.image_url ? <img className="arc-avatar arc-avatar-clk" src={it.image_url} alt={it.title} onClick={() => setViewer(it)} /> : <div className="arc-avatar arc-avatar-clk" onClick={() => isAdmin ? setEditPerson(it) : undefined}>{it.title.charAt(0)}</div>}
                <div className="arc-name">{it.title}</div>
                {it.content && <div className="arc-term">{it.content}</div>}
              </div>
            ))}
          </div>
        ) : L === "gallery" ? (
          <div className="arc-gallery">
            {items.map((it) => (
              <div key={it.id} className="arc-event">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {it.image_url ? <img className="arc-event-img" src={it.image_url} alt={it.title} /> : <div className="arc-event-ph"><ImageIcon size={38} strokeWidth={1.7} /></div>}
                {isAdmin && <Del it={it} cls="arc-del-img" />}
                <div className="arc-event-body">
                  <div className="arc-event-name">{it.title}</div>
                  {it.event_date && <div className="arc-event-date">{it.event_date}</div>}
                  {it.content && <div className="arc-event-date" style={{ marginTop: 4 }}>{it.content}</div>}
                </div>
              </div>
            ))}
          </div>
        ) : L === "docs" ? (
          <div className="arc-res">
            {items.map((it) => {
              const ext = it.link ? fileExt(it.link) : "FILE";
              return (
                <div key={it.id} className="arc-res-row">
                  <span className="arc-res-badge" style={badgeTone(ext)}>{ext}</span>
                  <div className="arc-res-mid">
                    <div className="arc-res-name">{it.title}</div>
                    {it.content && <div className="arc-res-desc">{it.content}</div>}
                  </div>
                  {it.link && <a className="arc-dl" href={it.link} target="_blank" rel="noreferrer"><Download size={16} strokeWidth={2.2} /> 다운로드</a>}
                  {isAdmin && <Del it={it} cls="arc-del" />}
                </div>
              );
            })}
          </div>
        ) : (
          // text(입회안내) · intro(CBMC소개)
          <div className={L === "intro" ? "arc-cards" : "arc-stack"}>
            {items.map((it) => (
              <div key={it.id} className="arc-doc">
                {isAdmin && <Del it={it} cls="arc-del arc-del-abs" />}
                <div className="arc-doc-title">{it.title}</div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {it.image_url && <img className="arc-photo" src={it.image_url} alt={it.title} style={{ marginBottom: 12 }} />}
                {it.content && <div className="arc-doc-body">{it.content}</div>}
                {it.link && <a className={`arc-link ${L === "intro" ? "solid" : ""}`} href={it.link} target="_blank" rel="noreferrer">
                  {L === "intro" ? <><PlayCircle size={16} /> 영상·자료 보기</> : <>자세히 보기 <ExternalLink size={15} strokeWidth={2.2} /></>}
                </a>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
