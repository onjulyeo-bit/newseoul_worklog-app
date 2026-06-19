"use client";

// 계좌관리 — 마스킹 표시 + 복사(클립보드) + 추가/삭제. 운영진 전용(서버 게이트).
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Copy, Trash2, Eye, EyeOff, Check } from "lucide-react";
import { addAccount, deleteAccount } from "./actions";
import FinanceTabs from "../FinanceTabs";
import { FIN_CSS } from "../finCss";

export type Account = { id: string; purpose: string | null; payee: string | null; bank: string | null; account_no: string | null; holder: string | null; note: string | null };

const maskNo = (no: string | null) => {
  const s = (no || "").replace(/\s/g, "");
  if (s.length <= 4) return s || "—";
  return "•".repeat(Math.max(4, s.length - 4)) + s.slice(-4);
};
const PURPOSES = ["중앙회비", "남부연합회비", "강사비", "간사급여", "지회운영", "식대", "후원", "기타"];
// 국내 은행 — 송금 시 선택. 목록에 없으면 '기타(직접 입력)'.
const BANKS = [
  "국민은행", "신한은행", "우리은행", "하나은행", "농협은행", "기업은행",
  "SC제일은행", "씨티은행", "수협은행", "대구은행", "부산은행", "광주은행",
  "전북은행", "경남은행", "제주은행", "산업은행", "새마을금고", "신협",
  "우체국", "카카오뱅크", "케이뱅크", "토스뱅크",
];

export default function AccountsBoard({ rows, canEdit = true }: { rows: Account[]; canEdit?: boolean }) {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [toast, setToast] = useState("");
  const [reveal, setReveal] = useState<string | null>(null); // 잠깐 전체 보기 (id)
  const [form, setForm] = useState({ purpose: "", payee: "", bank: "", account_no: "", holder: "", note: "" });
  const [, startT] = useTransition();
  const set = (k: keyof typeof form, v: string) => setForm((s) => ({ ...s, [k]: v }));

  async function onAdd() {
    if (!form.payee.trim() && !form.account_no.trim()) { setMsg("받는 곳 또는 계좌번호를 입력해 주세요."); return; }
    setBusy(true); setMsg("");
    const r = await addAccount({ ...form, bank: form.bank.trim() });
    setBusy(false);
    if (r.error) { setMsg("❌ " + r.error); return; }
    setForm({ purpose: "", payee: "", bank: "", account_no: "", holder: "", note: "" }); setShow(false);
    startT(() => router.refresh());
  }
  const onDelete = (a: Account) => { if (!confirm(`'${a.payee || a.purpose || "계좌"}' 계좌를 삭제할까요?`)) return; deleteAccount(a.id).then(() => router.refresh()); };
  async function copy(no: string | null) { try { await navigator.clipboard.writeText((no || "").trim()); setToast("계좌번호 복사됨"); setTimeout(() => setToast(""), 1800); } catch { setToast("복사 실패"); setTimeout(() => setToast(""), 1800); } }

  const inp = { fontFamily: "inherit", fontSize: 14.5, color: "var(--ink)", background: "#fff", border: "1px solid var(--line)", borderRadius: 11, padding: "10px 12px", outline: "none", width: "100%" } as const;

  return (
    <div className="moim-fin"><style>{FIN_CSS}</style>
      <div className="page-head"><div><h1 className="page-title">계좌관리</h1><p className="page-sub">중앙회·남부연합회·강사·간사·지회 등 송금 계좌. 번호는 가려서 보이고 복사만 돼요(운영진만).</p></div>
        {canEdit && <button className="ui-btn ui-primary ui-sm" onClick={() => setShow((v) => !v)}><Plus size={16} /> 계좌 추가</button>}
      </div>
      <FinanceTabs />

      {canEdit && show && (
        <div className="card" style={{ padding: 18, marginBottom: 18, display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
          <label style={{ gridColumn: "1/2" }}><div className="fld-l">용도</div>
            <input style={inp} list="purposes" value={form.purpose} onChange={(e) => set("purpose", e.target.value)} placeholder="중앙회비·강사비 등" />
            <datalist id="purposes">{PURPOSES.map((p) => <option key={p} value={p} />)}</datalist></label>
          <label><div className="fld-l">받는 곳 / 이름</div><input style={inp} value={form.payee} onChange={(e) => set("payee", e.target.value)} placeholder="중앙회 / 홍길동 강사" /></label>
          <label><div className="fld-l">은행</div>
            <select style={inp} value={BANKS.includes(form.bank) ? form.bank : (form.bank ? "__custom" : "")}
              onChange={(e) => set("bank", e.target.value === "__custom" ? " " : e.target.value === "" ? "" : e.target.value)}>
              <option value="">은행 선택</option>
              {BANKS.map((b) => <option key={b} value={b}>{b}</option>)}
              <option value="__custom">기타 (직접 입력)</option>
            </select>
            {form.bank !== "" && !BANKS.includes(form.bank) && (
              <input style={{ ...inp, marginTop: 8 }} value={form.bank.trim() === "" ? "" : form.bank} autoFocus
                onChange={(e) => set("bank", e.target.value)} placeholder="은행명 직접 입력" />
            )}
          </label>
          <label><div className="fld-l">계좌번호</div><input style={inp} value={form.account_no} onChange={(e) => set("account_no", e.target.value)} placeholder="숫자만 또는 하이픈" /></label>
          <label><div className="fld-l">예금주</div><input style={inp} value={form.holder} onChange={(e) => set("holder", e.target.value)} /></label>
          <label style={{ gridColumn: "1/3" }}><div className="fld-l">메모 (선택)</div><input style={inp} value={form.note} onChange={(e) => set("note", e.target.value)} /></label>
          <div style={{ gridColumn: "1/3", display: "flex", gap: 10, alignItems: "center", justifyContent: "flex-end" }}>
            {msg && <span style={{ color: "#c0392b", fontSize: 13, fontWeight: 600 }}>{msg}</span>}
            <button className="ui-btn ui-ghost ui-sm" onClick={() => { setShow(false); setMsg(""); }}>취소</button>
            <button className="ui-btn ui-primary ui-sm" onClick={onAdd} disabled={busy}>{busy ? "저장 중…" : "저장"}</button>
          </div>
        </div>
      )}

      {rows.length === 0 ? (
        <div className="card empty">아직 등록된 계좌가 없어요. 위 ‘계좌 추가’로 등록하세요.</div>
      ) : (
        <div className="card" style={{ overflow: "hidden" }}>
          {rows.map((a) => (
            <div key={a.id} className="acc-row" style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderBottom: "1px solid #f2f3f5", flexWrap: "wrap" }}>
              {a.purpose && <span className="badge b-blue" style={{ flexShrink: 0 }}>{a.purpose}</span>}
              <div style={{ minWidth: 130, flex: "0 0 auto" }}>
                <div style={{ fontWeight: 700, color: "var(--ink)", fontSize: 15 }}>{a.payee || "—"}</div>
                {a.holder && <div style={{ fontSize: 12.5, color: "var(--ink-3)" }}>예금주 {a.holder}</div>}
              </div>
              <div style={{ flex: 1, minWidth: 180, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 13.5, color: "var(--ink-2)", fontWeight: 600 }}>{a.bank || ""}</span>
                <span className="mono" style={{ fontSize: 14, color: "var(--ink)", letterSpacing: ".5px" }}>{reveal === a.id ? a.account_no : maskNo(a.account_no)}</span>
                {a.account_no && <button className="acc-mini" onClick={() => setReveal(reveal === a.id ? null : a.id)} title={reveal === a.id ? "가리기" : "잠깐 보기"}>{reveal === a.id ? <EyeOff size={15} /> : <Eye size={15} />}</button>}
              </div>
              {a.note && <span style={{ fontSize: 12.5, color: "var(--ink-3)", flex: "0 1 auto" }}>{a.note}</span>}
              {a.account_no && <button className="ui-btn ui-soft ui-sm" onClick={() => copy(a.account_no)}><Copy size={15} /> 복사</button>}
              {canEdit && <button className="acc-mini del" onClick={() => onDelete(a)} title="삭제"><Trash2 size={16} /></button>}
            </div>
          ))}
        </div>
      )}

      <p style={{ fontSize: 12.5, color: "var(--ink-3)", marginTop: 12 }}>※ 계좌번호는 화면에 가려 표시되고(끝 4자리만), <b>복사</b> 버튼으로만 송금 앱에 붙여넣을 수 있어요. 운영진만 볼 수 있습니다.</p>

      <style>{`
        .moim-fin .fld-l{ font-size:12.5px; font-weight:700; color:var(--ink-3); margin-bottom:5px; }
        .moim-fin .acc-mini{ display:inline-grid; place-items:center; width:30px; height:30px; border-radius:8px; border:1px solid var(--line); background:#fff; color:var(--ink-3); cursor:pointer; }
        .moim-fin .acc-mini:hover{ background:#f7f8f9; color:var(--ink); }
        .moim-fin .acc-mini.del:hover{ color:#c0392b; border-color:#f3c6c0; background:#fdecea; }
        .moim-fin .acc-row:last-child{ border-bottom:0 !important; }
        @media (max-width:640px){ .moim-fin .page-head + * { } }
      `}</style>
      {toast && <div style={{ position: "fixed", bottom: 26, left: "50%", transform: "translateX(-50%)", zIndex: 80, background: "#16181d", color: "#fff", fontSize: 13.5, fontWeight: 600, padding: "12px 20px", borderRadius: 999 }}><Check size={15} style={{ verticalAlign: "-2px", marginRight: 6 }} />{toast}</div>}
    </div>
  );
}
