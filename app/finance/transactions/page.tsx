"use client";

// 거래 내역 ⑩ — 클로드디자인 시안 이식. 저장된 거래 보기·인라인 수정·확정·삭제 (실 로직 보존).
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { A_CATEGORIES, B_CATEGORIES } from "@/lib/classifyTxn";
import { ChevronDown, Trash2 } from "lucide-react";
import FinanceTabs from "../FinanceTabs";
import { FIN_CSS } from "../finCss";

const won = (n: number) => "₩" + (n || 0).toLocaleString("ko-KR");
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

  const income = shown.filter((r) => r.direction === "입금").reduce((s, r) => s + r.amount, 0);
  const expense = shown.filter((r) => r.direction === "출금").reduce((s, r) => s + r.amount, 0);

  const Seg = <T,>({ val, set, opts }: { val: T; set: (v: T) => void; opts: [T, string][] }) => (
    <div className="seg">{opts.map(([v, l]) => <button key={String(v)} className={`seg-btn ${val === v ? "on" : ""}`} onClick={() => set(v)}>{l}</button>)}</div>
  );

  return (
    <div className="moim-fin"><style>{FIN_CSS}</style>
      <div className="page-head"><div><h1 className="page-title">회계</h1><p className="page-sub">저장된 거래를 보고 항목·내용을 고쳐요. 바꾸면 바로 저장돼요.</p></div></div>
      <FinanceTabs />

      <div className="led-sum">
        <div className="ls-card ls-in"><span className="ls-l">수입</span><span className="ls-v">{won(income)}</span></div>
        <div className="ls-card ls-out"><span className="ls-l">지출</span><span className="ls-v">{won(expense)}</span></div>
        <div className="ls-card ls-net"><span className="ls-l">잔액</span><span className="ls-v">{won(income - expense)}</span></div>
      </div>

      <div className="fin-filters">
        <select className="month-sel" value={month} onChange={(e) => setMonth(e.target.value)}>
          <option value="all">전체 기간</option>
          {months.map((m) => <option key={m} value={m}>{m.replace("-", ". ")}</option>)}
        </select>
        <span className="fil-l">구분</span><Seg val={fDir} set={setFDir} opts={[["all", "전체"], ["입금", "입금"], ["출금", "출금"]]} />
        <span className="fil-l">트랙</span><Seg val={fTrack} set={setFTrack} opts={[["all", "전체"], ["A", "회계"], ["B", "식대"]]} />
        <span className="fil-count">{shown.length}건</span>
      </div>

      {loading ? (
        <div className="card empty">불러오는 중…</div>
      ) : rows.length === 0 ? (
        <div className="card empty">아직 저장된 거래가 없어요. <b>거래 가져오기</b>에서 엑셀을 올려 보세요.</div>
      ) : (
        <div className="card scroll-card">
          <table className="mtable fin-table">
            <thead><tr><th className="th-name">날짜</th><th>구분</th><th>금액</th><th>적요</th><th>이름</th><th>트랙</th><th>항목</th><th>확정</th><th></th></tr></thead>
            <tbody>
              {shown.map((r) => {
                const cats = r.track === "B" ? B_CATEGORIES : A_CATEGORIES;
                return (
                  <tr key={r.id} className={!r.is_confirmed ? "row-warn" : ""}>
                    <td className="td-name mono">{r.txn_date.slice(2, 10).replace(/-/g, ".")}</td>
                    <td><span className={`badge ${r.direction === "입금" ? "b-blue" : "b-gray"}`}>{r.direction}</span></td>
                    <td><span className={`amt ${r.direction === "입금" ? "amt-in" : "amt-out"}`}>{r.direction === "입금" ? "+" : "−"}{won(r.amount).slice(1)}</span></td>
                    <td><input className="cell-inp" value={r.memo ?? ""} onChange={(e) => setRows((rs) => rs.map((x) => x.id === r.id ? { ...x, memo: e.target.value } : x))} onBlur={(e) => patch(r.id, { memo: e.target.value })} /></td>
                    <td><input className="cell-inp" style={{ minWidth: 80 }} value={r.counterparty ?? ""} onChange={(e) => setRows((rs) => rs.map((x) => x.id === r.id ? { ...x, counterparty: e.target.value } : x))} onBlur={(e) => patch(r.id, { counterparty: e.target.value })} /></td>
                    <td><div className="inline-sel"><select className="prog-sel" value={r.track} onChange={(e) => { const t = e.target.value as "A" | "B"; patch(r.id, { track: t, category: (t === "B" ? B_CATEGORIES : A_CATEGORIES)[0] }); }}><option value="A">A 회계</option><option value="B">B 식대</option></select><ChevronDown size={14} /></div></td>
                    <td><div className="inline-sel"><select className="prog-sel" value={r.category ?? ""} onChange={(e) => patch(r.id, { category: e.target.value })}>{!cats.includes(r.category) && <option value={r.category}>{r.category}</option>}{cats.map((c) => <option key={c} value={c}>{c}</option>)}</select><ChevronDown size={14} /></div></td>
                    <td><input type="checkbox" className="chk" checked={r.is_confirmed} onChange={(e) => patch(r.id, { is_confirmed: e.target.checked })} /></td>
                    <td className="td-act"><button className="mini-btn" onClick={() => del(r.id)} title="삭제"><Trash2 size={15} /></button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
