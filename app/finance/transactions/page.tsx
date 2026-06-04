"use client";

// 저장된 거래 내역 보기·수정 — 항목/트랙/적요/이름 수정, 확정 토글, 삭제.
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { A_CATEGORIES, B_CATEGORIES } from "@/lib/classifyTxn";

const won = (n: number) => n.toLocaleString("ko-KR");
type Row = {
  id: string; txn_date: string; direction: "입금" | "출금"; amount: number; balance: number | null;
  category: string; track: "A" | "B"; counterparty: string; memo: string; is_confirmed: boolean;
};

export default function TransactionsPage() {
  const [supabase] = useState(() => createClient());
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState("all");
  const [fDir, setFDir] = useState<"all" | "입금" | "출금">("all");
  const [fTrack, setFTrack] = useState<"all" | "A" | "B">("all");

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("transactions").select("id, txn_date, direction, amount, balance, category, track, counterparty, memo, is_confirmed").eq("chapter_id", "새서울").order("txn_date", { ascending: false });
    setRows((data as Row[]) ?? []); setLoading(false);
  }
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  async function patch(id: string, p: Partial<Row>) {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...p } : r)));
    await supabase.from("transactions").update(p).eq("id", id);
  }
  async function del(id: string) {
    if (!confirm("이 거래를 삭제할까요?")) return;
    setRows((rs) => rs.filter((r) => r.id !== id));
    await supabase.from("transactions").delete().eq("id", id);
  }

  const months = useMemo(() => Array.from(new Set(rows.map((r) => r.txn_date.slice(0, 7)))).sort().reverse(), [rows]);
  const shown = useMemo(() => rows.filter((r) =>
    (month === "all" || r.txn_date.slice(0, 7) === month) &&
    (fDir === "all" || r.direction === fDir) &&
    (fTrack === "all" || r.track === fTrack)
  ), [rows, month, fDir, fTrack]);

  return (
    <div className="mx-auto max-w-[1100px]">
      <div className="flex items-center gap-3">
        <Link href="/finance" className="text-[13px] font-semibold text-primary hover:underline">← 회계</Link>
        <Link href="/finance/import" className="text-[13px] font-semibold text-primary hover:underline">＋ 새 거래 업로드</Link>
      </div>
      <h1 className="mt-1 text-[22px] font-bold text-ink">거래 내역 · 수정</h1>
      <p className="mt-1 text-[14px] text-ink-soft">저장된 거래를 보고 항목·내용을 고칠 수 있어요. 바꾸면 바로 저장돼요.</p>

      <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg border border-line bg-card px-3 py-2">
        <select value={month} onChange={(e) => setMonth(e.target.value)} className="min-h-[34px] rounded-md border border-line bg-card px-2 text-[13px]">
          <option value="all">전체 기간</option>
          {months.map((m) => <option key={m} value={m}>{m.replace("-", ". ")}</option>)}
        </select>
        <span className="ml-1 text-[12px] font-bold text-ink-soft">구분</span>
        {(([["all", "전체"], ["입금", "입금"], ["출금", "출금"]]) as const).map(([v, l]) => (
          <button key={v} onClick={() => setFDir(v)} className={`rounded-full px-3 py-1 text-[12px] font-semibold ${fDir === v ? "bg-primary text-white" : "border border-line text-ink-soft hover:border-primary"}`}>{l}</button>
        ))}
        <span className="ml-1 text-[12px] font-bold text-ink-soft">트랙</span>
        {(([["all", "전체"], ["A", "회계"], ["B", "식대"]]) as const).map(([v, l]) => (
          <button key={v} onClick={() => setFTrack(v)} className={`rounded-full px-3 py-1 text-[12px] font-semibold ${fTrack === v ? "bg-primary text-white" : "border border-line text-ink-soft hover:border-primary"}`}>{l}</button>
        ))}
        <span className="ml-auto text-[12px] text-ink-soft">{shown.length}건</span>
      </div>

      {loading ? (
        <p className="mt-6 text-center text-[15px] text-ink-soft">불러오는 중…</p>
      ) : rows.length === 0 ? (
        <p className="mt-6 rounded-lg border border-line bg-card px-4 py-10 text-center text-[15px] text-ink-soft">아직 저장된 거래가 없어요. <Link href="/finance/import" className="font-semibold text-primary hover:underline">거래 업로드</Link>에서 엑셀을 올려 보세요.</p>
      ) : (
        <section className="mt-3 overflow-x-auto rounded-lg border border-line bg-card">
          <table className="w-full min-w-[900px] border-collapse text-[13.5px]">
            <thead>
              <tr className="border-b-[1.5px] border-line text-left text-[12px] text-ink-soft">
                <th className="px-2.5 py-2">날짜</th><th className="px-2.5 py-2">구분</th><th className="px-2.5 py-2 text-right">금액</th>
                <th className="px-2.5 py-2">적요</th><th className="px-2.5 py-2">이름</th>
                <th className="px-2.5 py-2">트랙</th><th className="px-2.5 py-2">항목</th><th className="px-2.5 py-2">확정</th><th className="px-2.5 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => {
                const cats = r.track === "B" ? B_CATEGORIES : A_CATEGORIES;
                return (
                  <tr key={r.id} className={`border-b border-line last:border-0 ${!r.is_confirmed ? "bg-[rgba(196,125,26,.06)]" : ""}`}>
                    <td className="whitespace-nowrap px-2.5 py-1.5 text-ink-soft">{r.txn_date.slice(2, 10).replace(/-/g, ".")}</td>
                    <td className="px-2.5 py-1.5">{r.direction}</td>
                    <td className={`px-2.5 py-1.5 text-right font-semibold ${r.direction === "출금" ? "text-unpaid" : "text-ink"}`}>{won(r.amount)}</td>
                    <td className="px-2.5 py-1.5"><input value={r.memo ?? ""} onChange={(e) => setRows((rs) => rs.map((x) => x.id === r.id ? { ...x, memo: e.target.value } : x))} onBlur={(e) => patch(r.id, { memo: e.target.value })} className="w-full min-w-[120px] rounded border border-transparent bg-transparent px-1 py-0.5 hover:border-line focus:border-primary-focus" /></td>
                    <td className="px-2.5 py-1.5"><input value={r.counterparty ?? ""} onChange={(e) => setRows((rs) => rs.map((x) => x.id === r.id ? { ...x, counterparty: e.target.value } : x))} onBlur={(e) => patch(r.id, { counterparty: e.target.value })} className="w-full min-w-[90px] rounded border border-transparent bg-transparent px-1 py-0.5 hover:border-line focus:border-primary-focus" /></td>
                    <td className="px-2.5 py-1.5">
                      <select value={r.track} onChange={(e) => { const t = e.target.value as "A" | "B"; patch(r.id, { track: t, category: (t === "B" ? B_CATEGORIES : A_CATEGORIES)[0] }); }} className="rounded border border-line bg-card px-1 py-0.5 text-[12px]"><option value="A">A 회계</option><option value="B">B 식대</option></select>
                    </td>
                    <td className="px-2.5 py-1.5">
                      <select value={r.category ?? ""} onChange={(e) => patch(r.id, { category: e.target.value })} className="rounded border border-line bg-card px-1 py-0.5 text-[12px]">
                        {!cats.includes(r.category) && <option value={r.category}>{r.category}</option>}
                        {cats.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </td>
                    <td className="px-2.5 py-1.5"><input type="checkbox" checked={r.is_confirmed} onChange={(e) => patch(r.id, { is_confirmed: e.target.checked })} className="h-4 w-4 accent-success" /></td>
                    <td className="px-2.5 py-1.5"><button onClick={() => del(r.id)} className="text-[12px] font-semibold text-unpaid hover:underline">삭제</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
