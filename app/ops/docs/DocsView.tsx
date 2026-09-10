"use client";

// 보관 서류 목록 — 분류 칩 필터 + 업로드 폼(쓰기 권한) + 항목별 열기/다운로드/수정/삭제.
//   서명 완료본(source=sign)은 서명 현황판에서 관리하므로 여기선 열기/다운로드만.
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { OPS_CSS } from "../opsCss";
import { DOC_ACCEPT_EXT, DOC_CATEGORIES, DOC_MAX_BYTES, DEFAULT_DOC_CATEGORY } from "@/lib/docCategories";
import { uploadDoc, updateDoc, deleteDoc } from "./actions";

export type DocItem = {
  id: string; source: "sign" | "upload"; title: string; category: string; note: string | null; date: string;
  file_name?: string; file_mime?: string; file_size?: number;
  openHref: string; downloadHref: string;
};

const fmt = (s: string) => { const d = new Date(s); return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`; };
const kb = (n?: number) => (n == null ? "" : n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)}MB` : `${Math.max(1, Math.round(n / 1024))}KB`);
const extLabel = (name?: string) => { const m = name && /\.([a-z0-9]+)$/i.exec(name); return m ? m[1].toUpperCase() : ""; };
const MIME_BY_EXT: Record<string, string> = {
  ".pdf": "application/pdf", ".hwp": "application/x-hwp", ".hwpx": "application/hwp+zip",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
};

function readB64(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(String(fr.result).split(",")[1] ?? "");
    fr.onerror = () => rej(new Error("파일을 읽지 못했어요."));
    fr.readAsDataURL(file);
  });
}

export default function DocsView({ items, canEdit, needsMigration }: { items: DocItem[]; canEdit: boolean; needsMigration: boolean }) {
  const router = useRouter();
  const [cat, setCat] = useState<string>("전체");
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2200); };

  const counts = useMemo(() => { const c: Record<string, number> = {}; items.forEach((i) => { c[i.category] = (c[i.category] ?? 0) + 1; }); return c; }, [items]);
  const list = cat === "전체" ? items : items.filter((i) => i.category === cat);

  return (
    <div className="moim-ops"><style>{OPS_CSS}</style>
      <Link href="/ops" className="back"><ArrowLeft size={15} /> 지회 운영</Link>
      <div className="page-head">
        <div>
          <h1 className="page-title">보관 서류</h1>
          <p className="page-sub">서명이 끝난 문서는 자동으로 들어오고, 규약·회의록·공문은 직접 올려요. 운영진만 볼 수 있어요.</p>
        </div>
        {canEdit && !needsMigration && <button className="ui-btn ui-primary" onClick={() => setShowForm((v) => !v)}>{showForm ? "닫기" : "＋ 업로드"}</button>}
      </div>

      {needsMigration && (
        <div className="note-box">
          직접 업로드 저장소가 아직 준비되지 않았어요. Supabase SQL Editor 에서 <code>supabase/migrations/0060_ops_docs.sql</code> 을 실행하면 업로드가 켜집니다. 서명 완료본은 그대로 보입니다.
        </div>
      )}

      {showForm && canEdit && <UploadForm onDone={() => { setShowForm(false); flash("서류를 올렸어요."); router.refresh(); }} />}

      <div className="chips">
        <button className={`chip ${cat === "전체" ? "on" : ""}`} onClick={() => setCat("전체")}>전체<span className="chip-n">{items.length}</span></button>
        {DOC_CATEGORIES.map((c) => (
          <button key={c} className={`chip ${cat === c ? "on" : ""}`} onClick={() => setCat(c)}>{c}<span className="chip-n">{counts[c] ?? 0}</span></button>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="empty">
          {cat === "전체" ? <>아직 보관된 서류가 없어요.<br />서명이 끝난 문서는 자동으로 들어오고, {canEdit && !needsMigration ? "[＋ 업로드]로 직접 올릴 수도 있어요." : "운영진이 직접 올릴 수도 있어요."}</> : `"${cat}" 분류에 서류가 없어요.`}
        </div>
      ) : (
        <ul className="doc-list">
          {list.map((d) => <DocRow key={`${d.source}-${d.id}`} d={d} canEdit={canEdit} onChanged={(m) => { flash(m); router.refresh(); }} />)}
        </ul>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

function DocRow({ d, canEdit, onChanged }: { d: DocItem; canEdit: boolean; onChanged: (msg: string) => void }) {
  const [edit, setEdit] = useState(false);
  const [title, setTitle] = useState(d.title);
  const [category, setCategory] = useState(d.category);
  const [note, setNote] = useState(d.note ?? "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const isSign = d.source === "sign";

  const save = async () => {
    setBusy(true); setErr(null);
    const r = await updateDoc(d.id, { title, category, note: note || null });
    setBusy(false);
    if (r.error) return setErr(r.error);
    setEdit(false); onChanged("수정했어요.");
  };
  const remove = async () => {
    if (!confirm(`"${d.title}" 을(를) 삭제할까요? 되돌릴 수 없어요.`)) return;
    setBusy(true);
    const r = await deleteDoc(d.id);
    setBusy(false);
    if (r.error) return setErr(r.error);
    onChanged("삭제했어요.");
  };

  return (
    <li className="doc-card">
      <div className={`doc-ic ${isSign ? "sign" : ""}`}>{isSign ? "✓" : "📄"}</div>
      <div className="doc-body">
        {edit ? (
          <>
            <div className="form-row">
              <label className="fld"><span className="flabel">제목</span><input className="inp" value={title} onChange={(e) => setTitle(e.target.value)} /></label>
              <label className="fld"><span className="flabel">분류</span><select className="inp" value={category} onChange={(e) => setCategory(e.target.value)}>{DOC_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</select></label>
            </div>
            <label className="fld"><span className="flabel">메모 (선택)</span><input className="inp" value={note} onChange={(e) => setNote(e.target.value)} placeholder="예) 2026 정기총회 승인본" /></label>
            {err && <div className="err-box">{err}</div>}
            <div className="form-foot">
              <button className="ui-btn ui-ghost ui-sm" onClick={() => { setEdit(false); setErr(null); }} disabled={busy}>취소</button>
              <button className="ui-btn ui-primary ui-sm" onClick={save} disabled={busy || !title.trim()}>{busy ? "저장 중…" : "저장"}</button>
            </div>
          </>
        ) : (
          <>
            <div className="doc-title">{d.title}</div>
            <div className="doc-meta">
              <span className={`badge ${isSign ? "b-green" : "b-brand"}`}>{isSign ? "서명본" : "업로드"}</span>
              <span className="badge b-gray">{d.category}</span>
              <span>{fmt(d.date)}{isSign ? " 완료" : ""}</span>
              {!isSign && <span>· {extLabel(d.file_name)} {kb(d.file_size)}</span>}
            </div>
            {d.note && <div className="doc-note">{d.note}</div>}
            {err && <div className="err-box">{err}</div>}
            <div className="doc-acts">
              <a className="ui-btn ui-ghost ui-sm" href={d.openHref} target="_blank" rel="noreferrer">열기</a>
              <a className="ui-btn ui-ghost ui-sm" href={d.downloadHref}>다운로드</a>
              {isSign && <Link className="ui-btn ui-ghost ui-sm" href={`/sign/${d.id}`}>서명 현황</Link>}
              {!isSign && canEdit && <>
                <button className="ui-btn ui-ghost ui-sm" onClick={() => setEdit(true)} disabled={busy}>수정</button>
                <button className="ui-btn ui-danger ui-sm" onClick={remove} disabled={busy}>삭제</button>
              </>}
            </div>
          </>
        )}
      </div>
    </li>
  );
}

function UploadForm({ onDone }: { onDone: () => void }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>(DEFAULT_DOC_CATEGORY);
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const pick = (f: File | null) => {
    setErr(null);
    if (!f) return setFile(null);
    const ext = (/\.[a-z0-9]+$/i.exec(f.name)?.[0] ?? "").toLowerCase();
    if (!(DOC_ACCEPT_EXT as readonly string[]).includes(ext)) { setFile(null); return setErr(`올릴 수 있는 형식: ${DOC_ACCEPT_EXT.join(", ")}`); }
    if (f.size > DOC_MAX_BYTES) { setFile(null); return setErr("파일이 5MB 를 넘어요. 용량을 줄여서 다시 올려 주세요."); }
    setFile(f);
    if (!title.trim()) setTitle(f.name.replace(/\.[a-z0-9]+$/i, ""));
  };

  const submit = async () => {
    if (!file) return setErr("파일을 선택해 주세요.");
    setBusy(true); setErr(null);
    try {
      const b64 = await readB64(file);
      const ext = (/\.[a-z0-9]+$/i.exec(file.name)?.[0] ?? "").toLowerCase();
      const r = await uploadDoc({ title, category, note: note || null, file_name: file.name, file_mime: file.type || MIME_BY_EXT[ext] || "application/octet-stream", file_size: file.size, file_b64: b64 });
      if (r.error) { setErr(r.error); return; }
      onDone();
    } catch (e) { setErr((e as Error).message); }
    finally { setBusy(false); }
  };

  return (
    <div className="form-card">
      <div className="form-row">
        <label className="fld"><span className="flabel">제목</span><input className="inp" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예) 새서울지회 규약 (2026 개정)" /></label>
        <label className="fld"><span className="flabel">분류</span><select className="inp" value={category} onChange={(e) => setCategory(e.target.value)}>{DOC_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</select></label>
      </div>
      <label className="fld"><span className="flabel">메모 (선택)</span><input className="inp" value={note} onChange={(e) => setNote(e.target.value)} placeholder="예) 2026.3 정기총회 승인본" /></label>
      <label className="fld"><span className="flabel">파일 (5MB 이하)</span>
        <input className="inp" type="file" accept={DOC_ACCEPT_EXT.join(",")} onChange={(e) => pick(e.target.files?.[0] ?? null)} />
        <span className="fhint">PDF · HWP · HWPX · DOCX · XLSX · PPTX · PNG · JPG{file ? ` — 선택됨: ${file.name} (${kb(file.size)})` : ""}</span>
      </label>
      {err && <div className="err-box">{err}</div>}
      <div className="form-foot">
        <button className="ui-btn ui-primary" onClick={submit} disabled={busy || !title.trim() || !file}>{busy ? "올리는 중…" : "올리기"}</button>
      </div>
    </div>
  );
}
