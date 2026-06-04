"use client";

// 카뱅 거래 엑셀 업로드 → 자동분류 미리보기 → 확인·확정 → 저장.
import { useMemo, useState } from "react";
import Link from "next/link";
import * as XLSX from "xlsx";
import { createClient } from "@/lib/supabase/client";
import { classify, parseAmount, parseDate, memberJudge, A_CATEGORIES, B_CATEGORIES, type Txn } from "@/lib/classifyTxn";

const won = (n: number) => n.toLocaleString("ko-KR");

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
      const date = parseDate(r[0]);
      if (!date) continue;
      const direction = String(r[1]).trim() === "출금" ? "출금" : "입금";
      const amount = parseAmount(r[2]);
      const balance = parseAmount(r[3]) || null;
      const memo = String(r[4] ?? "").trim();
      const counterparty = String(r[5] ?? "").trim();
      const c = classify(memo, direction);
      out.push({ txn_date: date, direction, amount, balance, memo, counterparty, ...c });
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
    (fDir === "all" || r.direction === fDir) &&
    (fTrack === "all" || r.track === fTrack) &&
    (!fReview || !r.confident || r.category === "미분류")
  ), [rows, fDir, fTrack, fReview]);

  async function save() {
    if (!rows.length) return;
    setSaving(true); setSaved(null);
    const payload = rows.map((r) => ({
      chapter_id: "새서울", txn_date: r.txn_date, direction: r.direction, amount: r.amount,
      balance: r.balance, category: r.category, track: r.track, counterparty: r.counterparty,
      memo: r.memo, is_confirmed: r.confident && r.category !== "미분류",
    }));
    const { error, count } = await supabase.from("transactions").upsert(payload, { onConflict: "chapter_id,txn_date,amount,memo,counterparty", ignoreDuplicates: true, count: "exact" });
    setSaving(false);
    if (error) { alert("저장 실패: " + error.message); return; }
    setSaved(`${count ?? rows.length}건 저장(중복 제외)되었어요.`);
  }

  return (
    <div className="mx-auto max-w-[1100px]">
      <div className="flex items-center gap-2">
        <Link href="/finance" className="text-[13px] font-semibold text-primary hover:underline">← 회계</Link>
      </div>
      <h1 className="mt-1 text-[22px] font-bold text-ink">거래 업로드 · 자동분류</h1>
      <p className="mt-1 text-[14px] text-ink-soft">카카오뱅크 거래내역 엑셀을 올리면 자동으로 분류해요. <b className="text-warning">노란 줄</b>만 확인·수정 후 저장하세요.</p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label className="cursor-pointer rounded-full bg-primary px-5 py-2.5 text-[15px] font-semibold text-white hover:bg-primary-pressed">
          📥 엑셀 파일 선택
          <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.currentTarget.value = ""; }} />
        </label>
        {fileName && <span className="text-[13px] text-ink-soft">{fileName} · {rows.length}건</span>}
      </div>

      {rows.length > 0 && (
        <>
          <section className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {[
              ["A 수입", won(stat.aIn), "text-success"],
              ["A 지출", won(stat.aOut), "text-unpaid"],
              ["식대 입금", won(stat.bIn), "text-present"],
              ["식대 결재", won(stat.bOut), "text-warning"],
              ["확인 필요", String(stat.review), stat.review ? "text-unpaid" : "text-success"],
            ].map(([l, v, c]) => (
              <div key={l} className="rounded-lg border border-line bg-card px-3 py-2.5">
                <div className={`text-[18px] font-black ${c}`}>{v}</div>
                <div className="mt-0.5 text-[11.5px] font-bold text-ink-soft">{l}</div>
              </div>
            ))}
          </section>

          <div className="mt-4 flex items-center gap-3">
            <button onClick={save} disabled={saving} className="rounded-full bg-primary px-5 py-2.5 text-[15px] font-semibold text-white hover:bg-primary-pressed disabled:opacity-50">{saving ? "저장 중…" : "💾 저장하기"}</button>
            {saved && <span className="text-[14px] font-semibold text-success">✓ {saved}</span>}
            {stat.review > 0 && <span className="text-[13px] text-warning">노란 줄 {stat.review}건은 항목을 확인하세요</span>}
          </div>

          {/* 필터 */}
          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-line bg-card px-3 py-2">
            <span className="text-[12px] font-bold text-ink-soft">구분</span>
            {(([["all", "전체"], ["입금", "입금"], ["출금", "출금"]]) as const).map(([v, l]) => (
              <button key={v} onClick={() => setFDir(v)} className={`rounded-full px-3 py-1 text-[12px] font-semibold ${fDir === v ? "bg-primary text-white" : "border border-line text-ink-soft hover:border-primary"}`}>{l}</button>
            ))}
            <span className="ml-2 text-[12px] font-bold text-ink-soft">트랙</span>
            {(([["all", "전체"], ["A", "회계"], ["B", "식대"]]) as const).map(([v, l]) => (
              <button key={v} onClick={() => setFTrack(v)} className={`rounded-full px-3 py-1 text-[12px] font-semibold ${fTrack === v ? "bg-primary text-white" : "border border-line text-ink-soft hover:border-primary"}`}>{l}</button>
            ))}
            <button onClick={() => setFReview((v) => !v)} className={`ml-2 rounded-full px-3 py-1 text-[12px] font-semibold ${fReview ? "bg-warning text-white" : "border border-line text-ink-soft hover:border-primary"}`}>⚠ 확인 필요만</button>
            <span className="ml-auto text-[12px] text-ink-soft">표시 {shown.length}건</span>
          </div>

          <section className="mt-2 overflow-x-auto rounded-lg border border-line bg-card">
            <table className="w-full min-w-[860px] border-collapse text-[13.5px]">
              <thead>
                <tr className="border-b-[1.5px] border-line text-left text-[12px] text-ink-soft">
                  <th className="px-2.5 py-2">날짜</th><th className="px-2.5 py-2">구분</th><th className="px-2.5 py-2 text-right">금액</th>
                  <th className="px-2.5 py-2">적요(내용)</th><th className="px-2.5 py-2">이름</th>
                  <th className="px-2.5 py-2">트랙</th><th className="px-2.5 py-2">항목</th>
                </tr>
              </thead>
              <tbody>
                {shown.map(({ r, i }) => {
                  const warn = !r.confident || r.category === "미분류";
                  const cats = r.track === "B" ? B_CATEGORIES : A_CATEGORIES;
                  const judge = r.category === "연회비" ? memberJudge(r.amount, r.counterparty) : null;
                  return (
                    <tr key={i} className={`border-b border-line last:border-0 ${warn ? "bg-[rgba(196,125,26,.08)]" : ""}`}>
                      <td className="whitespace-nowrap px-2.5 py-1.5 text-ink-soft">{r.txn_date.slice(2, 10).replace(/-/g, ".")}</td>
                      <td className="px-2.5 py-1.5">{r.direction}</td>
                      <td className={`px-2.5 py-1.5 text-right font-semibold ${r.direction === "출금" ? "text-unpaid" : "text-ink"}`}>{won(r.amount)}</td>
                      <td className="px-2.5 py-1.5"><input value={r.memo} placeholder="(빈칸)" onChange={(e) => setRows((p) => p.map((x, idx) => idx === i ? { ...x, memo: e.target.value } : x))} className="w-full min-w-[110px] rounded border border-transparent bg-transparent px-1 py-0.5 text-ink-soft hover:border-line focus:border-primary-focus" /></td>
                      <td className="px-2.5 py-1.5">
                        <input value={r.counterparty} onChange={(e) => setRows((p) => p.map((x, idx) => idx === i ? { ...x, counterparty: e.target.value } : x))} className="w-full min-w-[90px] rounded border border-transparent bg-transparent px-1 py-0.5 hover:border-line focus:border-primary-focus" />
                        {judge && <span className="rounded bg-surface-soft px-1 text-[11px] text-ink-soft">{judge}</span>}
                      </td>
                      <td className="px-2.5 py-1.5">
                        <select value={r.track} onChange={(e) => { const t = e.target.value as "A" | "B"; upd(i, { track: t, category: (t === "B" ? B_CATEGORIES : A_CATEGORIES)[0] }); }} className="rounded border border-line bg-card px-1 py-0.5 text-[12px]">
                          <option value="A">A 회계</option><option value="B">B 식대</option>
                        </select>
                      </td>
                      <td className="px-2.5 py-1.5">
                        <select value={r.category} onChange={(e) => upd(i, { category: e.target.value })} className={`rounded border px-1 py-0.5 text-[12px] ${warn ? "border-warning text-warning" : "border-line"}`}>
                          {!cats.includes(r.category) && <option value={r.category}>{r.category}</option>}
                          {cats.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        </>
      )}
    </div>
  );
}
