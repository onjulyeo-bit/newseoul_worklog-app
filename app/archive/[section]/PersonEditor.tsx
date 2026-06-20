"use client";

// 인물 카드 편집 — 이름·재임기간·사진(배경 통일/AI 옵션) 수정. 사진은 archive 버킷 업로드 후 updateArchive.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { X, ImagePlus } from "lucide-react";
import { updateArchive } from "../actions";
import { processPhoto, aiStudioPhoto } from "@/lib/photoProcess";

export type PersonItem = { id: string; title: string; content: string | null; image_url: string | null };
const BGS = [
  { key: "#23304a", label: "어두운 남색", ai: "navy" },
  { key: "#c4a373", label: "브라운", ai: "brown" },
  { key: "#eef0f3", label: "밝은 회색", ai: "gray" },
];

export default function PersonEditor({ item, onClose }: { item: PersonItem; onClose: () => void }) {
  const router = useRouter();
  const [title, setTitle] = useState(item.title);
  const [content, setContent] = useState(item.content ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(item.image_url);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [bg, setBg] = useState(BGS[0].key);
  const [removeBg, setRemoveBg] = useState(true);
  const [useAi, setUseAi] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    setFile(f); setPreview(URL.createObjectURL(f)); setRemovePhoto(false);
  }
  function clearPhoto() { setFile(null); setPreview(null); setRemovePhoto(true); }

  async function save() {
    setBusy(true); setErr("");
    try {
      let image_url: string | undefined;
      if (file) {
        const aiColor = BGS.find((b) => b.key === bg)?.ai ?? "navy";
        const blob = useAi ? await aiStudioPhoto(file, aiColor) : await processPhoto(file, { bg, removeBg });
        const sb = createClient();
        const path = `people-${Date.now()}.jpg`;
        const up = await sb.storage.from("archive").upload(path, blob, { contentType: "image/jpeg" });
        if (up.error) throw new Error(up.error.message);
        image_url = sb.storage.from("archive").getPublicUrl(path).data.publicUrl;
      }
      const imagePatch = image_url ? { image_url } : removePhoto ? { image_url: null } : {};
      const res = await updateArchive(item.id, { title, content, ...imagePatch });
      if (res.error) throw new Error(res.error);
      onClose(); router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "오류");
    } finally { setBusy(false); }
  }

  return (
    <div className="pe-root" onClick={busy ? undefined : onClose}>
      <style>{CSS}</style>
      <div className="pe" onClick={(e) => e.stopPropagation()}>
        <div className="pe-head"><div className="pe-title">인물 편집</div><button className="pe-x" onClick={onClose} disabled={busy}><X size={20} /></button></div>
        <div className="pe-body">
          <div className="pe-photo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {preview ? <img src={preview} alt="" /> : <div className="pe-ph">{title.charAt(0) || "?"}</div>}
            <div className="pe-photo-acts">
              <label className="pe-pick"><ImagePlus size={15} /> {preview ? "사진 변경" : "사진 추가"}<input type="file" accept="image/*" hidden onChange={pick} /></label>
              {preview && <button type="button" className="pe-pick pe-pick-del" onClick={clearPhoto}>사진 삭제</button>}
            </div>
          </div>

          {file && (<>
            <div className="pe-opts">
              <label className="pe-tg"><input type="checkbox" checked={removeBg} onChange={(e) => setRemoveBg(e.target.checked)} disabled={useAi} /> 배경 통일</label>
              <div className="pe-bgs">{BGS.map((b) => <button key={b.key} className={`pe-sw ${bg === b.key ? "on" : ""}`} style={{ background: b.key }} onClick={() => setBg(b.key)} title={b.label} />)}</div>
            </div>
            <label className="pe-tg pe-ai"><input type="checkbox" checked={useAi} onChange={(e) => setUseAi(e.target.checked)} /> ✨ AI 고급 배경 (나노바나나)</label>
          </>)}

          <label className="pe-l">이름</label>
          <input className="pe-inp" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="이름" />
          <label className="pe-l">재임 기간 · 비고</label>
          <input className="pe-inp" value={content} onChange={(e) => setContent(e.target.value)} placeholder="예: 1대 · 1996~1997" />
          {err && <p className="pe-err">{err}</p>}
        </div>
        <div className="pe-foot">
          <button className="pe-btn pe-ghost" onClick={onClose} disabled={busy}>취소</button>
          <button className="pe-btn pe-primary" onClick={save} disabled={busy}>{busy ? "저장 중…" : "저장"}</button>
        </div>
      </div>
    </div>
  );
}

const CSS = `
.pe-root{ position:fixed; inset:0; z-index:80; background:rgba(20,24,34,.45); backdrop-filter:blur(2px); display:flex; align-items:center; justify-content:center; padding:16px; }
.pe{ width:100%; max-width:380px; max-height:90vh; display:flex; flex-direction:column; background:#fff; border-radius:18px; overflow:hidden; box-shadow:0 20px 60px rgba(20,30,60,.3); font-family:inherit; }
.pe-head{ display:flex; align-items:center; justify-content:space-between; padding:15px 18px; border-bottom:1px solid #ecedf0; }
.pe-title{ font-size:16px; font-weight:800; letter-spacing:-0.02em; color:#16181d; }
.pe-x{ width:32px; height:32px; border:0; background:none; color:#767d8a; border-radius:9px; cursor:pointer; display:grid; place-items:center; }
.pe-x:hover{ background:#f1f2f4; }
.pe-body{ padding:18px; overflow-y:auto; }
.pe-photo{ display:flex; flex-direction:column; align-items:center; gap:10px; margin-bottom:16px; }
.pe-photo img{ width:120px; height:144px; object-fit:cover; border-radius:14px; border:1px solid #ecedf0; }
.pe-ph{ width:120px; height:144px; border-radius:14px; background:linear-gradient(135deg,#e8f1fc,#dbe6f5); color:#003ecc; font-size:34px; font-weight:800; display:grid; place-items:center; }
.pe-photo-acts{ display:flex; gap:8px; }
.pe-pick{ display:inline-flex; align-items:center; gap:6px; font-size:13px; font-weight:700; color:#003ecc; background:#f5f9ff; border:1px solid #cdddf7; border-radius:10px; padding:8px 14px; cursor:pointer; }
.pe-pick-del{ color:#c0392b; background:#fdecea; border-color:#f3c6c0; }
.pe-opts{ display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:8px; }
.pe-tg{ font-size:13px; font-weight:600; color:#3d424d; display:inline-flex; align-items:center; gap:7px; cursor:pointer; }
.pe-ai{ margin-bottom:14px; }
.pe-bgs{ display:flex; gap:6px; }
.pe-sw{ width:24px; height:24px; border-radius:7px; border:1px solid #d6d9df; cursor:pointer; }
.pe-sw.on{ outline:2px solid #003ecc; outline-offset:1px; }
.pe-l{ display:block; font-size:12.5px; font-weight:700; color:#3d424d; margin:10px 0 6px; }
.pe-inp{ width:100%; font-family:inherit; font-size:14px; color:#16181d; border:1px solid #e0e0e0; border-radius:10px; padding:9px 11px; outline:none; }
.pe-inp:focus{ border-color:#003ecc; box-shadow:0 0 0 3px #e8f1fc; }
.pe-err{ color:#c0392b; font-size:12.5px; font-weight:600; margin-top:8px; }
.pe-foot{ display:flex; justify-content:flex-end; gap:8px; padding:14px 18px; border-top:1px solid #ecedf0; }
.pe-btn{ font-family:inherit; font-weight:700; font-size:14px; padding:9px 16px; border-radius:11px; border:0; cursor:pointer; }
.pe-ghost{ background:#fff; color:#3d424d; border:1px solid #e0e0e0; }
.pe-primary{ background:#003ecc; color:#fff; }
.pe-btn:disabled{ opacity:.55; cursor:default; }
`;
