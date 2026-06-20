"use client";

// 사진 일괄 등록 — 사람별 사진 여러 장 선택 → 파일명=이름 자동(수정 가능) → 배경 통일 → 일괄 등록.
//   배경 처리는 브라우저 안(@imgly)에서, 업로드는 archive 버킷 + createArchive.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { X, UploadCloud, Check, Loader2, Trash2 } from "lucide-react";
import { createArchive } from "../actions";
import { processPhoto, nameFromFile } from "@/lib/photoProcess";

type Row = { file: File; name: string; preview: string; status: "idle" | "busy" | "done" | "error"; err?: string };
const BGS = [
  { key: "#eef0f3", label: "연회색" },
  { key: "#ffffff", label: "흰색" },
  { key: "#e8f1fc", label: "연파랑" },
];

export default function BulkPhotoUpload({ category, onClose }: { category: string; onClose: () => void }) {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [bg, setBg] = useState(BGS[0].key);
  const [removeBg, setRemoveBg] = useState(true);
  const [running, setRunning] = useState(false);
  const [doneCount, setDoneCount] = useState(0);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    setRows((prev) => [
      ...prev,
      ...files.map((f) => ({ file: f, name: nameFromFile(f.name), preview: URL.createObjectURL(f), status: "idle" as const })),
    ]);
    e.target.value = "";
  }
  const setName = (i: number, v: string) => setRows((r) => r.map((row, j) => (j === i ? { ...row, name: v } : row)));
  const removeRow = (i: number) => setRows((r) => r.filter((_, j) => j !== i));

  async function runAll() {
    const valid = rows.filter((r) => r.name.trim());
    if (!valid.length) { alert("이름이 있는 사진이 없어요."); return; }
    setRunning(true); setDoneCount(0);
    const sb = createClient();
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row.name.trim() || row.status === "done") continue;
      setRows((r) => r.map((x, j) => (j === i ? { ...x, status: "busy", err: undefined } : x)));
      try {
        const blob = await processPhoto(row.file, { bg, removeBg });
        const path = `people-${Date.now()}-${i}.jpg`; // ASCII만(한글 키는 Storage 거부)
        const up = await sb.storage.from("archive").upload(path, blob, { contentType: "image/jpeg" });
        if (up.error) throw new Error(up.error.message);
        const url = sb.storage.from("archive").getPublicUrl(path).data.publicUrl;
        const res = await createArchive({ category, title: row.name.trim(), event_date: null, content: null, image_url: url, link: null });
        if (res.error) throw new Error(res.error);
        setRows((r) => r.map((x, j) => (j === i ? { ...x, status: "done" } : x)));
        setDoneCount((c) => c + 1);
      } catch (e) {
        setRows((r) => r.map((x, j) => (j === i ? { ...x, status: "error", err: e instanceof Error ? e.message : "오류" } : x)));
      }
    }
    setRunning(false);
    router.refresh();
  }

  const allDone = rows.length > 0 && rows.every((r) => r.status === "done");

  return (
    <div className="bpu-root" onClick={running ? undefined : onClose}>
      <style>{CSS}</style>
      <div className="bpu" onClick={(e) => e.stopPropagation()}>
        <div className="bpu-head">
          <div className="bpu-title">사진 일괄 등록</div>
          <button className="bpu-x" onClick={onClose} disabled={running} aria-label="닫기"><X size={20} /></button>
        </div>

        <div className="bpu-body">
          <p className="bpu-help">사람별 사진을 한 번에 선택하세요. 파일명이 이름으로 자동 입력됩니다(수정 가능). 등록 시 배경을 한 가지 색으로 통일합니다.</p>

          <div className="bpu-opts">
            <label className="bpu-toggle"><input type="checkbox" checked={removeBg} onChange={(e) => setRemoveBg(e.target.checked)} /> 배경 자동 제거·통일</label>
            <div className="bpu-bgs">
              {BGS.map((b) => (
                <button key={b.key} className={`bpu-sw ${bg === b.key ? "on" : ""}`} style={{ background: b.key }} onClick={() => setBg(b.key)} title={b.label} aria-label={b.label} />
              ))}
            </div>
          </div>

          <label className="bpu-drop">
            <UploadCloud size={22} /> 사진 선택 (여러 장)
            <input type="file" accept="image/*" multiple hidden onChange={onPick} />
          </label>

          {rows.length > 0 && (
            <div className="bpu-list">
              {rows.map((row, i) => (
                <div key={i} className="bpu-row">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="bpu-thumb" src={row.preview} alt="" />
                  <input className="bpu-name" value={row.name} onChange={(e) => setName(i, e.target.value)} placeholder="이름" disabled={running} />
                  <span className="bpu-st">
                    {row.status === "busy" && <Loader2 size={17} className="bpu-spin" />}
                    {row.status === "done" && <Check size={17} color="#0a7d3f" />}
                    {row.status === "error" && <span className="bpu-errt" title={row.err}>실패</span>}
                  </span>
                  {!running && row.status !== "done" && <button className="bpu-del" onClick={() => removeRow(i)} aria-label="제거"><Trash2 size={15} /></button>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bpu-foot">
          <span className="bpu-count">{rows.length > 0 ? `${rows.length}장 · 등록 ${doneCount}` : "사진을 선택하세요"}</span>
          {allDone ? (
            <button className="bpu-btn bpu-primary" onClick={onClose}>완료</button>
          ) : (
            <button className="bpu-btn bpu-primary" onClick={runAll} disabled={running || rows.length === 0}>
              {running ? "등록 중…" : "모두 등록"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const CSS = `
.bpu-root{ position:fixed; inset:0; z-index:70; background:rgba(20,24,34,.4); backdrop-filter:blur(2px); display:flex; align-items:center; justify-content:center; padding:16px; }
.bpu{ width:100%; max-width:460px; max-height:90vh; display:flex; flex-direction:column; background:#fff; border-radius:20px; overflow:hidden; box-shadow:0 20px 60px rgba(20,30,60,.3); font-family:inherit; }
.bpu-head{ display:flex; align-items:center; justify-content:space-between; padding:16px 18px; border-bottom:1px solid #ecedf0; }
.bpu-title{ font-size:17px; font-weight:800; letter-spacing:-0.03em; color:#16181d; }
.bpu-x{ width:34px; height:34px; border:0; background:none; color:#767d8a; border-radius:9px; cursor:pointer; display:grid; place-items:center; }
.bpu-x:hover{ background:#f1f2f4; }
.bpu-body{ padding:18px; overflow-y:auto; }
.bpu-help{ font-size:13px; color:#767d8a; line-height:1.6; margin:0 0 14px; }
.bpu-opts{ display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:12px; flex-wrap:wrap; }
.bpu-toggle{ font-size:13.5px; font-weight:600; color:#3d424d; display:inline-flex; align-items:center; gap:7px; cursor:pointer; }
.bpu-bgs{ display:flex; gap:7px; }
.bpu-sw{ width:26px; height:26px; border-radius:8px; border:1px solid #d6d9df; cursor:pointer; }
.bpu-sw.on{ outline:2px solid #003ecc; outline-offset:1px; }
.bpu-drop{ display:flex; align-items:center; justify-content:center; gap:8px; padding:16px; border:1.5px dashed #c9ccd2; border-radius:13px; color:#3d424d; font-weight:700; font-size:14px; cursor:pointer; }
.bpu-drop:hover{ border-color:#003ecc; color:#003ecc; background:#f7faff; }
.bpu-list{ display:flex; flex-direction:column; gap:8px; margin-top:14px; }
.bpu-row{ display:flex; align-items:center; gap:10px; }
.bpu-thumb{ width:44px; height:44px; border-radius:10px; object-fit:cover; flex:none; border:1px solid #ecedf0; }
.bpu-name{ flex:1; min-width:0; font-family:inherit; font-size:14px; color:#16181d; border:1px solid #e0e0e0; border-radius:10px; padding:8px 11px; outline:none; }
.bpu-name:focus{ border-color:#003ecc; box-shadow:0 0 0 3px #e8f1fc; }
.bpu-st{ width:24px; display:grid; place-items:center; flex:none; }
.bpu-errt{ font-size:11px; font-weight:700; color:#c0392b; }
.bpu-spin{ animation:bpu-rot 1s linear infinite; color:#003ecc; }
@keyframes bpu-rot{ to{ transform:rotate(360deg); } }
.bpu-del{ width:30px; height:30px; flex:none; border:1px solid #ecedf0; background:#fff; color:#767d8a; border-radius:8px; cursor:pointer; display:grid; place-items:center; }
.bpu-del:hover{ color:#c0392b; border-color:#f3c6c0; background:#fdecea; }
.bpu-foot{ display:flex; align-items:center; justify-content:space-between; gap:10px; padding:14px 18px; border-top:1px solid #ecedf0; }
.bpu-count{ font-size:12.5px; color:#767d8a; font-weight:600; }
.bpu-btn{ font-family:inherit; font-weight:700; font-size:14px; padding:10px 18px; border-radius:12px; border:0; cursor:pointer; }
.bpu-primary{ background:#003ecc; color:#fff; box-shadow:0 5px 14px rgba(0,62,204,.22); }
.bpu-primary:disabled{ opacity:.5; cursor:default; }
`;
