"use client";

// 연도별 회비 납부내역 — 순수 기록(이름 × 연도 × 금액). 정/준 분류는 하지 않음(통계 '연도별 회원등록 현황'에서 결산 확정).
// 최근 3개년 표시(기록은 전부 보존). 금액 칸 클릭해 정정.
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Upload, Users, Wallet } from "lucide-react";
import { parseDuesXlsx } from "@/lib/parseDuesXlsx";
import { importDues, setDuesAmount } from "./actions";
import FinanceTabs from "../FinanceTabs";
import { FIN_CSS } from "../finCss";

export type DuesRow = { name: string; year: number; amount: number; grade?: string | null };
const won = (n: number) => "₩" + (n || 0).toLocaleString("ko-KR");
const man = (n: number) => (n ? Math.round(n / 10000) + "만" : "—");

export default function DuesBoard({ rows: initial, canEdit = true }: { rows: DuesRow[]; canEdit?: boolean }) {
  const router = useRouter();
  const [rows, setRows] = useState<DuesRow[]>(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [edit, setEdit] = useState<{ name: string; year: number } | null>(null);
  const [draft, setDraft] = useState("");
  const [, startT] = useTransition();

  const allYears = useMemo(() => [...new Set(rows.map((r) => r.year))].sort((a, b) => b - a), [rows]);
  const years = allYears.slice(0, 3); // 최근 3개년만 표시 (데이터는 전부 보존)
  const names = useMemo(() => [...new Set(rows.map((r) => r.name))].sort((a, b) => a.localeCompare(b, "ko")), [rows]);
  const amt = useMemo(() => { const m = new Map<string, number>(); rows.forEach((r) => m.set(`${r.name}|${r.year}`, r.amount)); return m; }, [rows]);

  const perYear = useMemo(() => years.map((y) => {
    const yr = rows.filter((r) => r.year === y && r.amount > 0);
    return { year: y, payers: yr.length, total: yr.reduce((s, r) => s + r.amount, 0) };
  }), [rows, years]);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; e.currentTarget.value = "";
    if (!file) return;
    setBusy(true); setMsg("");
    try {
      const parsed = parseDuesXlsx(await file.arrayBuffer());
      if (!confirm(`${parsed.rows.length}건(연도 ${parsed.years.join("·")}) 인식. 기존 납부내역을 모두 지우고 이 파일로 교체할까요?`)) { setBusy(false); return; }
      const res = await importDues(parsed.rows);
      if (res.error) throw new Error(res.error);
      setMsg(`✅ ${res.count}건 반영 (비숫자 ${parsed.skipped}개 제외)`);
      startT(() => router.refresh());
    } catch (err) { setMsg("❌ " + (err instanceof Error ? err.message : "오류")); } finally { setBusy(false); }
  }

  function saveAmount(name: string, year: number) {
    const n = parseInt(draft.replace(/[^0-9]/g, ""), 10) || 0;
    setEdit(null);
    setRows((rs) => {
      const exists = rs.some((r) => r.name === name && r.year === year);
      if (!n) return rs.filter((r) => !(r.name === name && r.year === year));
      if (exists) return rs.map((r) => (r.name === name && r.year === year ? { ...r, amount: n } : r));
      return [...rs, { name, year, amount: n }];
    });
    startT(async () => { await setDuesAmount(name, year, n); });
  }

  return (
    <div className="moim-fin"><style>{FIN_CSS}</style><style>{DUES_CSS}</style>
      <div className="page-head"><div><h1 className="page-title">연도별 회비 납부내역</h1><p className="page-sub">누가 어느 해에 얼마 냈는지 기록만 (정·준 분류는 통계 ‘연도별 회원등록 현황’에서)</p></div></div>
      <FinanceTabs />

      {canEdit && (
        <div className="card" style={{ padding: 16, marginBottom: 18, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <label className="ui-btn ui-primary ui-sm" style={{ cursor: "pointer" }}>
            <Upload size={16} /> {busy ? "처리 중…" : "엑셀 업로드 (전체 교체)"}
            <input type="file" accept=".xlsx,.xls,.csv" hidden onChange={onFile} disabled={busy} />
          </label>
          <span style={{ fontSize: 13, color: "var(--ink-3)" }}>열: <b>이름</b> · <b>연도</b>(2024 …). 금액만 기록해요.</span>
          {msg && <span style={{ fontSize: 14, fontWeight: 700, color: msg.startsWith("✅") ? "var(--green)" : "#c0392b" }}>{msg}</span>}
        </div>
      )}

      {rows.length === 0 ? (
        <div className="card empty">아직 납부내역이 없어요.{canEdit ? " 위에서 엑셀을 올려 주세요." : ""}</div>
      ) : (
        <>
          {/* 연도별 납부 요약 */}
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(perYear.length, 3)},minmax(0,1fr))`, gap: 12, marginBottom: 20 }}>
            {perYear.map((p) => (
              <div key={p.year} className="card" style={{ padding: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: "var(--ink)" }}>{p.year}년</div>
                <div className="dy-row"><Users size={15} color="#00559e" /><span className="dy-n">{p.payers}</span><span className="dy-l">명 납부</span></div>
                <div style={{ fontSize: 12.5, color: "var(--ink-3)", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}><Wallet size={13} /> {won(p.total)}</div>
              </div>
            ))}
          </div>

          {/* 이름 × 연도 납부액 */}
          <div className="card scroll-card">
            <table className="mtable fin-table">
              <thead><tr><th className="th-name">이름</th>{years.map((y) => <th key={y} style={{ textAlign: "right" }}>{y}</th>)}</tr></thead>
              <tbody>
                {names.map((nm) => (
                  <tr key={nm}>
                    <td className="td-name">{nm}</td>
                    {years.map((y) => {
                      const a = amt.get(`${nm}|${y}`) ?? 0;
                      const editing = canEdit && edit?.name === nm && edit?.year === y;
                      return (
                        <td key={y} style={{ textAlign: "right" }} className="mono">
                          {editing ? (
                            <input className="amt-inp" autoFocus value={draft} inputMode="numeric"
                              onChange={(e) => setDraft(e.target.value)} onBlur={() => saveAmount(nm, y)}
                              onKeyDown={(e) => { if (e.key === "Enter") saveAmount(nm, y); if (e.key === "Escape") setEdit(null); }} />
                          ) : canEdit ? (
                            <button className="amt-cell" onClick={() => { setEdit({ name: nm, year: y }); setDraft(a ? String(a) : ""); }} title="클릭해 수정">
                              {a ? man(a) : <span style={{ color: "#c9ccd2" }}>—</span>}
                            </button>
                          ) : (a ? <span>{man(a)}</span> : <span style={{ color: "#c9ccd2" }}>—</span>)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ fontSize: 12.5, color: "var(--ink-3)", marginTop: 12 }}>※ 금액 칸을 눌러 정정할 수 있어요(만원 단위 표시). 표는 최근 3개년만, 기록은 모두 보존됩니다. 정회원·준회원 집계는 <b>통계 → 연도별 회원등록 현황</b>에서.</p>
        </>
      )}
    </div>
  );
}

const DUES_CSS = `
.moim-fin .dy-row{ display:flex; align-items:baseline; gap:4px; margin-top:8px; }
.moim-fin .dy-n{ font-size:22px; font-weight:800; letter-spacing:-.03em; color:#003f7a; }
.moim-fin .dy-l{ font-size:13px; color:var(--ink-3); }
.moim-fin .amt-cell{ background:none; border:0; font:inherit; color:var(--ink); cursor:pointer; padding:2px 6px; border-radius:7px; font-variant-numeric:tabular-nums; }
.moim-fin .amt-cell:hover{ background:var(--brand-softer); box-shadow:inset 0 0 0 1px #cfe0f7; }
.moim-fin .amt-inp{ width:74px; text-align:right; font:inherit; font-variant-numeric:tabular-nums; border:1px solid var(--brand); border-radius:8px; padding:5px 7px; outline:none; }
`;
