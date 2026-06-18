"use client";

// 연도별 회비 — 매트릭스 업로드 + 이름×연도 표 + 연도별 정회원 수(80만=2명·60만=1명).
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Upload, Crown, Users, Wallet } from "lucide-react";
import { parseDuesXlsx, jungCount } from "@/lib/parseDuesXlsx";
import { importDues } from "./actions";
import FinanceTabs from "../FinanceTabs";
import { FIN_CSS } from "../finCss";

export type DuesRow = { name: string; year: number; amount: number };
const won = (n: number) => "₩" + (n || 0).toLocaleString("ko-KR");
const man = (n: number) => (n ? Math.round(n / 10000) + "만" : "—");

export default function DuesBoard({ rows, canEdit = true }: { rows: DuesRow[]; canEdit?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [, startT] = useTransition();

  const years = useMemo(() => [...new Set(rows.map((r) => r.year))].sort((a, b) => b - a), [rows]);
  const names = useMemo(() => [...new Set(rows.map((r) => r.name))].sort((a, b) => a.localeCompare(b, "ko")), [rows]);
  const amt = useMemo(() => { const m = new Map<string, number>(); rows.forEach((r) => m.set(`${r.name}|${r.year}`, r.amount)); return m; }, [rows]);

  const perYear = useMemo(() => years.map((y) => {
    const yr = rows.filter((r) => r.year === y && r.amount > 0);
    return { year: y, jung: yr.reduce((s, r) => s + jungCount(r.amount), 0), payers: yr.length, total: yr.reduce((s, r) => s + r.amount, 0) };
  }), [rows, years]);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; e.currentTarget.value = "";
    if (!file) return;
    setBusy(true); setMsg("");
    try {
      const parsed = parseDuesXlsx(await file.arrayBuffer());
      if (!confirm(`${parsed.rows.length}건(연도 ${parsed.years.join("·")}) 인식. 기존 연도별 회비를 모두 지우고 이 파일로 교체할까요?`)) { setBusy(false); return; }
      const res = await importDues(parsed.rows);
      if (res.error) throw new Error(res.error);
      setMsg(`✅ ${res.count}건 반영 (비숫자 ${parsed.skipped}개 제외)`);
      startT(() => router.refresh());
    } catch (err) { setMsg("❌ " + (err instanceof Error ? err.message : "오류")); } finally { setBusy(false); }
  }

  return (
    <div className="moim-fin"><style>{FIN_CSS}</style>
      <div className="page-head"><div><h1 className="page-title">연도별 회비</h1><p className="page-sub">연도별 연회비 납부와 정회원 수 (부부 80만원 = 2명 자동 집계)</p></div></div>
      <FinanceTabs />

      {/* 업로드 (운영진만) */}
      {canEdit && (
        <div className="card" style={{ padding: 16, marginBottom: 18, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <label className="ui-btn ui-primary ui-sm" style={{ cursor: "pointer" }}>
            <Upload size={16} /> {busy ? "처리 중…" : "엑셀 업로드 (전체 교체)"}
            <input type="file" accept=".xlsx,.xls,.csv" hidden onChange={onFile} disabled={busy} />
          </label>
          <span style={{ fontSize: 13, color: "var(--ink-3)" }}>이름 + 연도(2025 등) 열이 있는 표. "유보"·빈칸은 제외돼요.</span>
          {msg && <span style={{ fontSize: 14, fontWeight: 700, color: msg.startsWith("✅") ? "var(--green)" : "#c0392b" }}>{msg}</span>}
        </div>
      )}

      {rows.length === 0 ? (
        <div className="card empty">아직 연도별 회비 자료가 없어요. 위에서 엑셀을 올려 주세요.</div>
      ) : (
        <>
          {/* 연도별 정회원 수 요약 */}
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(perYear.length, 6)},minmax(0,1fr))`, gap: 12, marginBottom: 20 }}>
            {perYear.map((p) => (
              <div key={p.year} className="card" style={{ padding: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: "var(--ink)" }}>{p.year}년</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginTop: 6 }}>
                  <Crown size={16} color="#0066cc" /><span style={{ fontSize: 22, fontWeight: 800, color: "#0052a8" }}>{p.jung}</span><span style={{ fontSize: 13, color: "var(--ink-3)" }}>정회원</span>
                </div>
                <div style={{ fontSize: 12.5, color: "var(--ink-3)", marginTop: 4 }}>납부 {p.payers}명 · {won(p.total)}</div>
              </div>
            ))}
          </div>

          {/* 이름 × 연도 표 */}
          <div className="card scroll-card">
            <table className="mtable fin-table">
              <thead><tr><th className="th-name">이름</th>{years.map((y) => <th key={y} style={{ textAlign: "right" }}>{y}</th>)}</tr></thead>
              <tbody>
                {names.map((nm) => (
                  <tr key={nm}>
                    <td className="td-name">{nm}</td>
                    {years.map((y) => { const a = amt.get(`${nm}|${y}`) ?? 0; return (
                      <td key={y} style={{ textAlign: "right" }} className="mono">
                        {a ? <span style={a >= 800000 ? { color: "#0052a8", fontWeight: 700 } : undefined}>{man(a)}{a >= 800000 ? " (부부)" : ""}</span> : <span style={{ color: "#c9ccd2" }}>—</span>}
                      </td>
                    ); })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ fontSize: 12.5, color: "var(--ink-3)", marginTop: 12 }}>※ 정회원 수 = 80만원↑ 2명(부부)·60만원↑ 1명. 준회원(소액)은 정회원에서 제외. 금액은 만원 단위 표시.</p>
        </>
      )}
    </div>
  );
}
