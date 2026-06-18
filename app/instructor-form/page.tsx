"use client";

// 강사·간사 자기입력 폼 (로그인 불필요) — 본인이 작성하면 강사·간사 목록에 자동 저장.
// 보안: instructors 직접 접근 안 함, instructor_self_upsert RPC(SECURITY DEFINER)만 사용. 이름 기준 upsert.
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Form = { name: string; kind: "강사" | "간사"; is_external: boolean; org: string; phone: string; field: string; fee_note: string; note: string };
const BLANK: Form = { name: "", kind: "강사", is_external: true, org: "", phone: "", field: "", fee_note: "", note: "" };

export default function InstructorFormPage() {
  const [supabase] = useState(() => createClient());
  const [f, setF] = useState<Form>(BLANK);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((s) => ({ ...s, [k]: v }));

  async function submit() {
    if (!f.name.trim()) { setErr("성함을 입력해 주세요."); return; }
    setBusy(true); setErr("");
    const { data, error } = await supabase.rpc("instructor_self_upsert", {
      p_name: f.name.trim(), p_kind: f.kind, p_external: f.is_external,
      p_org: f.org, p_phone: f.phone, p_field: f.field, p_fee: f.fee_note, p_note: f.note,
    });
    setBusy(false);
    if (error || data === false) { setErr("저장에 실패했어요. 간사님께 문의해 주세요."); return; }
    setDone(true);
  }

  const wrap: React.CSSProperties = { minHeight: "100vh", background: "#fafafb", display: "flex", justifyContent: "center", padding: "24px 16px", fontFamily: "Pretendard, -apple-system, sans-serif", color: "#16181d" };
  const card: React.CSSProperties = { width: "100%", maxWidth: 460, background: "#fff", border: "1px solid #ecedf0", borderRadius: 20, padding: 24, boxShadow: "0 4px 20px rgba(20,30,60,.06)", alignSelf: "flex-start" };
  const label: React.CSSProperties = { display: "block", fontSize: 14, fontWeight: 700, color: "#3d424d", margin: "14px 0 6px" };
  const input: React.CSSProperties = { width: "100%", fontSize: 17, padding: "13px 14px", border: "1px solid #ecedf0", borderRadius: 12, outline: "none", background: "#fafafb", fontFamily: "inherit" };
  const btn: React.CSSProperties = { width: "100%", fontSize: 17, fontWeight: 700, padding: "14px", borderRadius: 999, border: 0, background: "#0a7d3f", color: "#fff", cursor: "pointer", marginTop: 20 };
  const seg = (on: boolean): React.CSSProperties => ({ flex: 1, fontSize: 15, fontWeight: 700, padding: "11px", borderRadius: 10, border: on ? "1px solid #0a7d3f" : "1px solid #ecedf0", background: on ? "#e4f6ec" : "#fff", color: on ? "#0a7d3f" : "#767d8a", cursor: "pointer" });

  return (
    <div style={wrap}>
      <div style={card}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 4 }}>
          <span style={{ width: 32, height: 32, borderRadius: 9, background: "#1a2238", color: "#fff", display: "grid", placeItems: "center", fontWeight: 800 }}>C</span>
          <b style={{ fontSize: 16 }}>CBMC <span style={{ color: "#0066cc" }}>새서울지회</span></b>
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: "12px 0 4px", letterSpacing: "-0.5px" }}>강사·간사 정보 입력</h1>

        {done ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: 48 }}>✅</div>
            <p style={{ fontSize: 18, fontWeight: 800, marginTop: 10 }}>등록되었습니다!</p>
            <p style={{ fontSize: 14.5, color: "#767d8a", marginTop: 6, lineHeight: 1.6 }}>작성해 주셔서 감사합니다.<br />수정할 게 있으면 같은 성함으로 다시 작성하시면 갱신돼요.</p>
            <button style={{ ...btn, background: "#eef0f3", color: "#3d424d" }} onClick={() => { setF(BLANK); setDone(false); }}>다시 작성</button>
          </div>
        ) : (<>
          <p style={{ fontSize: 15, color: "#767d8a", lineHeight: 1.6, margin: 0 }}>강사·간사님 정보를 직접 입력해 주세요. 새서울 CBMC 운영에 소중히 쓰입니다.</p>

          <label style={label}>성함 *</label>
          <input style={input} value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="홍길동" />

          <label style={label}>구분</label>
          <div style={{ display: "flex", gap: 8 }}>
            {(["강사", "간사"] as const).map((k) => <button key={k} type="button" style={seg(f.kind === k)} onClick={() => set("kind", k)}>{k}</button>)}
          </div>

          <label style={label}>소속</label>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" style={seg(!f.is_external)} onClick={() => set("is_external", false)}>내부</button>
            <button type="button" style={seg(f.is_external)} onClick={() => set("is_external", true)}>외부</button>
          </div>

          {([["org", "소속·직함 (예: ○○대 교수 / ○○회사 대표)"], ["phone", "연락처"], ["field", "전문분야·강의 주제"], ["fee_note", "강사비·급여 메모 (예: 30만원/회)"], ["note", "비고 (선택)"]] as [keyof Form, string][]).map(([k, lbl]) => (
            <div key={k}><label style={label}>{lbl}</label><input style={input} value={f[k] as string} onChange={(e) => set(k, e.target.value as never)} /></div>
          ))}

          {err && <p style={{ color: "#c0392b", fontSize: 14, fontWeight: 600, marginTop: 12 }}>{err}</p>}
          <button style={{ ...btn, opacity: busy ? 0.6 : 1 }} onClick={submit} disabled={busy}>{busy ? "저장 중…" : "등록하기"}</button>
        </>)}
      </div>
    </div>
  );
}
