"use client";

// 거래 가져오기 ⑨ — 클로드디자인 시안 이식. 카뱅 엑셀 업로드 → 자동분류 → 확인 → 저장 (실 로직 보존).
import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { createClient } from "@/lib/supabase/client";
import { classify, parseAmount, parseDate, memberJudge, A_CATEGORIES, B_CATEGORIES, type Txn } from "@/lib/classifyTxn";
import { ChevronDown, FileSpreadsheet, Check } from "lucide-react";
import FinanceTabs from "../FinanceTabs";
import { FIN_CSS } from "../finCss";

const won = (n: number) => "₩" + (n || 0).toLocaleString("ko-KR");

export default function FinanceImportPage() {
  const [supabase] = useState(() => createClient());
  const [rows, setRows] = useState<Txn[]>([]);
  const [fileName, setFileName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);
  const [fDir, setFDir] = useState<"all" | "입금" | "출금">("all");
  const [fTrack, setFTrack] = useState<"all" | "A" | "B">("all");
  const [fReview, setFReview] = useState(false);

  async function onFile(file: File) {
    setSaved(null); setFileName(file.name);
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const raw: string[][] = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: "" });
    const hi = raw.findIndex((r) => String(r[0]).trim() === "거래일시");
    if (hi < 0) { alert("'거래일시' 헤더를 찾지 못했어요. 카카오뱅크 거래내역 엑셀이 맞는지 확인해 주세요."); return; }
    const out: Txn[] = [];
    for (const r of raw.slice(hi + 1)) {
      const date = parseDate(r[0]); if (!date) continue;
      const direction = String(r[1]).trim() === "출금" ? "출금" : "입금";
      const amount = parseAmount(r[2]); const balance = parseAmount(r[3]) || null;
      const memo = String(r[4] ?? "").trim(); const counterparty = String(r[5] ?? "").trim();
      out.push({ txn_date: date, direction, amount, balance, memo, counterparty, ...classify(memo, direction) });
    }
    setRows(out);
  }

  const upd = (i: number, patch: Partial<Txn>) => setRows((p) => p.map((r, idx) => (idx === i ? { ...r, ...patch, confident: true } : r)));

  const stat = useMemo(() => {
    const aIn = rows.filter((r) => r.track === "A" && r.direction === "입금").reduce((s, r) => s + r.amount, 0);
    const aOut = rows.filter((r) => r.track === "A" && r.direction === "출금").reduce((s, r) => s + Math.abs(r.amount), 0);
    const bIn = rows.filter((r) => r.track === "B" && r.direction === "입금").reduce((s, r) => s + r.amount, 0);
    const bOut = rows.filter((r) => r.track === "B" && r.direction === "출금").reduce((s, r) => s + Math.abs(r.amount), 0);
    const review = rows.filter((r) => !r.confident || r.category === "미분류").length;
    return { aIn, aOut, bIn, bOut, review };
  }, [rows]);

  const shown = useMemo(() => rows.map((r, i) => ({ r, i })).filter(({ r }) =>
    (fDir === "all" || r.direction === fDir) && (fTrack === "all" || r.track === fTrack) && (!fReview || !r.confident || r.category === "미분류")
  ), [rows, fDir, fTrack, fReview]);

  async function save() {
    if (!rows.length) return;
    setSaving(true); setSaved(null);
    const payload = rows.map((r) => ({
      chapter_id: "새서울", txn_date: r.txn_date, direction: r.direction, amount: r.amount, balance: r.balance,
      category: r.category, track: r.track, counterparty: r.counterparty, memo: r.memo, is_confirmed: r.confident && r.category !== "미분류",
    }));
    const { error, count } = await supabase.from("transactions").upsert(payload, { onConflict: "chapter_id,txn_date,amount,memo,counterparty", ignoreDuplicates: true, count: "exact" });
    setSaving(false);
    if (error) { alert("저장 실패: " + error.message); return; }
    setSaved(`${count ?? rows.length}건 저장(중복 제외)되었어요.`);
  }

  const Seg = <T,>({ val, set, opts }: { val: T; set: (v: T) => void; opts: [T, string][] }) => (
    <div className="seg">{opts.map(([v, l]) => <button key={String(v)} className={`seg-btn ${val === v ? "on" : ""}`} onClick={() => set(v)}>{l}</button>)}</div>
  );

  return (
    <div className="moim-fin"><style>{FIN_CSS}</style>
      <div className="page-head"><div><h1 className="page-title">회계</h1><p className="page-sub">카카오뱅크 거래내역 엑셀을 올리면 자동 분류해요.</p></div></div>
      <FinanceTabs />

      {rows.length === 0 ? (
        <div className="imp">
          <label className="dropzone dz-file">
            <div className="dz-ic"><FileSpreadsheet size={30} /></div>
            <h3 className="dz-t">은행 엑셀 파일을 올려주세요</h3>
            <p className="dz-s">아래를 눌러 카카오뱅크 거래내역 엑셀을 선택하세요<br />계좌번호는 저장하지 않고 이름·금액·내용만 사용해요</p>
            <span className="ui-btn ui-primary ui-sm" style={{ marginTop: 16 }}>📥 엑셀 선택</span>
            <input type="file" accept=".xlsx,.xls,.csv" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.currentTarget.value = ""; }} />
          </label>
          <p className="imp-hint">ⓘ <b className="text-warning">노란 줄</b>(확인 필요)만 점검 후 저장하면 돼요.</p>
        </div>
      ) : (
        <div className="imp">
          <div className="imp-head">
            <div><h3 className="imp-title">분석 결과 · {rows.length}건</h3><p className="imp-sub">{fileName} · 자동분류를 확인하고 ‘확인 필요’ 항목을 먼저 점검 후 저장하세요.</p></div>
            <div className="imp-acts">
              <button className="ui-btn ui-primary ui-sm" onClick={save} disabled={saving}><Check size={16} /> {saving ? "저장 중…" : `${rows.length}건 저장`}</button>
            </div>
          </div>

          <div className="imp-stats">
            <div className="ist"><div className="ist-v in">{won(stat.aIn)}</div><div className="ist-l">A 수입</div></div>
            <div className="ist"><div className="ist-v out">{won(stat.aOut)}</div><div className="ist-l">A 지출</div></div>
            <div className="ist"><div className="ist-v pre">{won(stat.bIn)}</div><div className="ist-l">식대 입금</div></div>
            <div className="ist"><div className="ist-v wr">{won(stat.bOut)}</div><div className="ist-l">식대 결재</div></div>
            <div className="ist"><div className={`ist-v ${stat.review ? "out" : "in"}`}>{stat.review}</div><div className="ist-l">확인 필요</div></div>
          </div>

          {saved && <p className="saved-msg">✓ {saved}</p>}

          <div className="fin-filters" style={{ marginTop: 6 }}>
            <span className="fil-l">구분</span><Seg val={fDir} set={setFDir} opts={[["all", "전체"], ["입금", "입금"], ["출금", "출금"]]} />
            <span className="fil-l">트랙</span><Seg val={fTrack} set={setFTrack} opts={[["all", "전체"], ["A", "회계"], ["B", "식대"]]} />
            <button className={`seg-btn ${fReview ? "on" : ""}`} style={{ border: "1px solid var(--line)", borderRadius: 10 }} onClick={() => setFReview((v) => !v)}>⚠ 확인 필요만</button>
            <span className="fil-count">표시 {shown.length}건</span>
          </div>

          <div className="card scroll-card">
            <table className="mtable fin-table">
              <thead><tr><th className="th-name">날짜</th><th>구분</th><th>금액</th><th>적요</th><th>이름</th><th>트랙</th><th>항목</th></tr></thead>
              <tbody>
                {shown.map(({ r, i }) => {
                  const warn = !r.confident || r.category === "미분류";
                  const cats = r.track === "B" ? B_CATEGORIES : A_CATEGORIES;
                  const judge = r.category === "연회비" ? memberJudge(r.amount, r.counterparty) : null;
                  return (
                    <tr key={i} className={warn ? "row-warn" : ""}>
                      <td className="td-name mono">{r.txn_date.slice(2, 10).replace(/-/g, ".")}</td>
                      <td><span className={`badge ${r.direction === "입금" ? "b-blue" : "b-gray"}`}>{r.direction}</span></td>
                      <td><span className={`amt ${r.direction === "입금" ? "amt-in" : "amt-out"}`}>{r.direction === "입금" ? "+" : "−"}{won(r.amount).slice(1)}</span></td>
                      <td><input className="cell-inp" value={r.memo} placeholder="(빈칸)" onChange={(e) => setRows((p) => p.map((x, idx) => idx === i ? { ...x, memo: e.target.value } : x))} /></td>
                      <td><input className="cell-inp" style={{ minWidth: 80 }} value={r.counterparty} onChange={(e) => setRows((p) => p.map((x, idx) => idx === i ? { ...x, counterparty: e.target.value } : x))} />{judge && <span className="muted" style={{ fontSize: 11 }}> {judge}</span>}</td>
                      <td><div className="inline-sel"><select className="prog-sel" value={r.track} onChange={(e) => { const t = e.target.value as "A" | "B"; upd(i, { track: t, category: (t === "B" ? B_CATEGORIES : A_CATEGORIES)[0] }); }}><option value="A">A 회계</option><option value="B">B 식대</option></select><ChevronDown size={14} /></div></td>
                      <td><div className="inline-sel"><select className={`prog-sel ${warn ? "warn" : ""}`} value={r.category} onChange={(e) => upd(i, { category: e.target.value })}>{!cats.includes(r.category) && <option value={r.category}>{r.category}</option>}{cats.map((c) => <option key={c} value={c}>{c}</option>)}</select><ChevronDown size={14} /></div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="imp-summary">
            {Object.entries(rows.reduce((acc, r) => { acc[r.category] = (acc[r.category] || 0) + 1; return acc; }, {} as Record<string, number>)).map(([c, n]) => (
              <span key={c} className="imp-chip"><span className="badge b-gray">{c}</span> {n}건</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
