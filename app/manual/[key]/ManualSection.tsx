"use client";

// 운영 매뉴얼 섹션 보기/편집 — admin은 본문(마크다운)을 textarea로 수정·저장.
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil, Save } from "lucide-react";
import { manualSectionByKey } from "../sections";
import { updateManualSection } from "../actions";
import { MN_CSS } from "../manualCss";
import MdView from "../MdView";

export default function ManualSection({ sectionKey, label, desc, body, canEdit }: {
  sectionKey: string; label: string; desc: string; body: string; canEdit: boolean;
}) {
  const router = useRouter();
  const meta = manualSectionByKey(sectionKey);
  const Icon = meta?.Icon;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(body);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [toast, setToast] = useState("");
  const [, startT] = useTransition();

  async function save() {
    setBusy(true); setErr("");
    const r = await updateManualSection(sectionKey, draft);
    setBusy(false);
    if (r.error) { setErr("저장 실패: " + r.error); return; }
    setEditing(false); setToast("저장되었습니다");
    setTimeout(() => setToast(""), 2000);
    startT(() => router.refresh());
  }

  return (
    <div className="moim-mn"><style>{MN_CSS}</style>
      <div className="mn-bar">
        <Link href="/manual" className="mn-back"><ArrowLeft size={16} /> 운영 매뉴얼</Link>
        {canEdit && !editing && <button className="ui-btn ui-ghost" onClick={() => { setDraft(body); setEditing(true); }}><Pencil size={15} /> 편집</button>}
        {canEdit && editing && (
          <div style={{ display: "flex", gap: 8 }}>
            <button className="ui-btn ui-ghost" onClick={() => { setEditing(false); setErr(""); }}>취소</button>
            <button className="ui-btn ui-primary" onClick={save} disabled={busy}><Save size={15} /> {busy ? "저장 중…" : "저장"}</button>
          </div>
        )}
      </div>

      <article className="mn-doc">
        <div className="mn-head">
          {Icon && <span className="mn-ic"><Icon size={20} /></span>}
          <div><div className="mn-head-t">{label}</div><div className="mn-head-d">{desc}</div></div>
        </div>

        {editing ? (<>
          <textarea className="mn-edit" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="마크다운으로 작성하세요" />
          <p className="mn-hint">서식: <b>## 제목</b>, <b>- 목록</b>, <b>1. 번호</b>, <b>**굵게**</b>. 빈 줄로 문단을 나눠요.</p>
          {err && <p className="mn-err">{err}</p>}
        </>) : (
          body.trim() ? <MdView md={body} /> : <div className="empty">아직 내용이 없어요.{canEdit ? " ‘편집’으로 작성하세요." : ""}</div>
        )}
      </article>
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
