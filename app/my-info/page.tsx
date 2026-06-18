"use client";

// 회원 자기입력 폼 (로그인 불필요) — 이름+전화 뒷4자리로 본인 확인 → 개인정보만 수정 → 자동 저장.
// 보안: members 직접 접근 안 함, member_self_lookup / member_self_update RPC(SECURITY DEFINER)만 사용.
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Rec = { id: string; name: string; phone: string | null; email: string | null; company: string | null; position: string | null; industry: string | null; spouse_name: string | null; car_model: string | null; car_number: string | null; birth_date: string | null; birth_calendar: string | null; address: string | null; address_type: string | null; home_church: string | null; intro: string | null; business_card_url: string | null };

const INTRO_EXAMPLE = "예) 새로운 사람 만나는 게 늘 설렙니다. 먼저 인사 못 드려도 미워하지 마세요.";

export default function MyInfoPage() {
  const [supabase] = useState(() => createClient());
  const [step, setStep] = useState<"verify" | "edit" | "done">("verify");
  const [name, setName] = useState("");
  const [last4, setLast4] = useState("");
  const [busy, setBusy] = useState(false);
  const [cardBusy, setCardBusy] = useState(false);
  const [err, setErr] = useState("");
  const [rec, setRec] = useState<Rec | null>(null);
  const set = (k: keyof Rec, v: string) => setRec((r) => (r ? { ...r, [k]: v } : r));

  async function lookup() {
    if (!name.trim()) { setErr("이름을 입력해 주세요."); return; }
    setBusy(true); setErr("");
    const { data, error } = await supabase.rpc("member_self_lookup", { p_name: name.trim(), p_last4: last4.trim() });
    setBusy(false);
    if (error) { setErr("오류가 났어요. 잠시 후 다시 시도해 주세요."); return; }
    const row = (data as Rec[] | null)?.[0];
    if (!row) { setErr("이름 또는 전화 뒷 4자리가 명단과 달라요. 간사님께 문의해 주세요."); return; }
    setRec(row); setStep("edit");
  }
  async function save() {
    if (!rec) return;
    setBusy(true); setErr("");
    const { data, error } = await supabase.rpc("member_self_update", {
      p_id: rec.id, p_name: rec.name, p_last4: last4.trim(),
      p_phone: rec.phone ?? "", p_email: rec.email ?? "", p_company: rec.company ?? "",
      p_position: rec.position ?? "", p_industry: rec.industry ?? "", p_spouse: rec.spouse_name ?? "",
      p_car_model: rec.car_model ?? "", p_car_number: rec.car_number ?? "",
      p_birth: rec.birth_date ?? "", p_birth_cal: rec.birth_calendar ?? "",
      p_address: rec.address ?? "", p_addr_type: rec.address_type ?? "", p_church: rec.home_church ?? "",
      p_intro: rec.intro ?? "", p_card: rec.business_card_url ?? "",
    });
    setBusy(false);
    if (error || data === false) { setErr("저장에 실패했어요. 간사님께 문의해 주세요."); return; }
    setStep("done");
  }
  async function uploadCard(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; e.target.value = "";
    if (!f || !rec) return;
    if (f.size > 7 * 1024 * 1024) { setErr("명함은 7MB 이하 이미지만 올릴 수 있어요."); return; }
    setCardBusy(true); setErr("");
    const ext = (f.name.split(".").pop() || "jpg").toLowerCase();
    const up = await supabase.storage.from("member-cards").upload(`${rec.id}-${Date.now()}.${ext}`, f, { upsert: true, contentType: f.type });
    setCardBusy(false);
    if (up.error) { setErr("명함 업로드 실패: " + up.error.message); return; }
    const { data } = supabase.storage.from("member-cards").getPublicUrl(up.data.path);
    set("business_card_url", data.publicUrl);
  }

  const wrap: React.CSSProperties = { minHeight: "100vh", background: "#fafafb", display: "flex", justifyContent: "center", padding: "24px 16px", fontFamily: "Pretendard, -apple-system, sans-serif", color: "#16181d" };
  const card: React.CSSProperties = { width: "100%", maxWidth: 460, background: "#fff", border: "1px solid #ecedf0", borderRadius: 20, padding: 24, boxShadow: "0 4px 20px rgba(20,30,60,.06)", alignSelf: "flex-start" };
  const label: React.CSSProperties = { display: "block", fontSize: 14, fontWeight: 700, color: "#3d424d", margin: "14px 0 6px" };
  const input: React.CSSProperties = { width: "100%", fontSize: 17, padding: "13px 14px", border: "1px solid #ecedf0", borderRadius: 12, outline: "none", background: "#fafafb", fontFamily: "inherit" };
  const btn: React.CSSProperties = { width: "100%", fontSize: 17, fontWeight: 700, padding: "14px", borderRadius: 999, border: 0, background: "#0066cc", color: "#fff", cursor: "pointer", marginTop: 20 };
  const segRow: React.CSSProperties = { display: "flex", gap: 8, marginTop: 8 };
  const segBtn: React.CSSProperties = { flex: 1, fontSize: 15, fontWeight: 700, padding: "10px", borderRadius: 10, border: "1px solid #ecedf0", background: "#fff", color: "#767d8a", cursor: "pointer" };
  const segOn: React.CSSProperties = { background: "#0066cc", color: "#fff", borderColor: "#0066cc" };

  return (
    <div style={wrap}>
      <div style={card}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 4 }}>
          <span style={{ width: 32, height: 32, borderRadius: 9, background: "#1a2238", color: "#fff", display: "grid", placeItems: "center", fontWeight: 800 }}>C</span>
          <b style={{ fontSize: 16 }}>CBMC <span style={{ color: "#0066cc" }}>새서울지회</span></b>
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: "12px 0 4px", letterSpacing: "-0.5px" }}>내 정보 입력</h1>

        {step === "verify" && (<>
          <p style={{ fontSize: 15, color: "#767d8a", lineHeight: 1.6, margin: 0 }}>본인 확인 후 연락처·회사 등 정보를 직접 입력·수정할 수 있어요.</p>
          <label style={label}>이름</label>
          <input style={input} value={name} onChange={(e) => setName(e.target.value)} placeholder="홍길동" />
          <label style={label}>전화번호 뒷 4자리</label>
          <input style={input} value={last4} onChange={(e) => setLast4(e.target.value.replace(/[^0-9]/g, "").slice(0, 4))} placeholder="예: 1234" inputMode="numeric" />
          <p style={{ fontSize: 12.5, color: "#9aa0aa", marginTop: 8 }}>※ 명단에 전화번호가 없으면 비워두고 ‘내 정보 찾기’를 눌러 주세요.</p>
          {err && <p style={{ color: "#c0392b", fontSize: 14, fontWeight: 600, marginTop: 12 }}>{err}</p>}
          <button style={{ ...btn, opacity: busy ? 0.6 : 1 }} onClick={lookup} disabled={busy}>{busy ? "확인 중…" : "내 정보 찾기"}</button>
        </>)}

        {step === "edit" && rec && (<>
          <p style={{ fontSize: 15, color: "#0a7d3f", fontWeight: 700, margin: "6px 0 0" }}>{rec.name} 님, 반갑습니다 👋</p>
          <p style={{ fontSize: 13.5, color: "#767d8a", margin: "4px 0 0" }}>바뀐 정보를 채우거나 고쳐 주세요. 등급·상태는 운영진이 관리합니다.</p>
          {([["phone", "연락처"], ["email", "이메일"], ["birth_date", "생일 (예: 03-15 또는 1970-03-15)"], ["company", "회사/직장"], ["position", "직위"], ["industry", "업종"], ["address", "주소"], ["home_church", "출석교회"], ["spouse_name", "배우자"], ["car_model", "차종"], ["car_number", "차량번호"]] as [keyof Rec, string][]).map(([k, lbl]) => (
            <div key={k}>
              <label style={label}>{lbl}</label>
              <input style={input} value={(rec[k] as string) ?? ""} onChange={(e) => set(k, e.target.value)} />
              {k === "birth_date" && (
                <div style={segRow}>{["양력", "음력"].map((o) => (
                  <button key={o} type="button" style={{ ...segBtn, ...(rec.birth_calendar === o ? segOn : {}) }} onClick={() => set("birth_calendar", o)}>{o}</button>
                ))}</div>
              )}
              {k === "address" && (
                <div style={segRow}>{["집", "회사"].map((o) => (
                  <button key={o} type="button" style={{ ...segBtn, ...(rec.address_type === o ? segOn : {}) }} onClick={() => set("address_type", o)}>{o}</button>
                ))}</div>
              )}
            </div>
          ))}

          <label style={label}>자기소개 (한 줄)</label>
          <textarea style={{ ...input, minHeight: 92, resize: "vertical", lineHeight: 1.5 }} value={rec.intro ?? ""} onChange={(e) => set("intro", e.target.value)} placeholder={INTRO_EXAMPLE} />

          <label style={label}>명함 이미지</label>
          {rec.business_card_url ? (
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={rec.business_card_url} alt="명함" style={{ width: "100%", border: "1px solid #ecedf0", borderRadius: 12, display: "block" }} />
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <label style={{ ...input, width: "auto", flex: 1, textAlign: "center", cursor: "pointer", padding: "10px 14px", fontSize: 15, fontWeight: 700, color: "#3d424d" }}>{cardBusy ? "올리는 중…" : "명함 변경"}<input type="file" accept="image/*" hidden onChange={uploadCard} /></label>
                <button type="button" style={{ ...input, width: "auto", padding: "10px 14px", fontSize: 15, fontWeight: 700, color: "#c0392b", cursor: "pointer", background: "#fff" }} onClick={() => set("business_card_url", "")}>삭제</button>
              </div>
            </div>
          ) : (
            <label style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: 18, border: "1.5px dashed #c5d6ee", borderRadius: 12, background: "#f3f8fe", color: "#0052a8", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
              📇 {cardBusy ? "올리는 중…" : "명함 사진 올리기"}<input type="file" accept="image/*" hidden onChange={uploadCard} />
            </label>
          )}

          {err && <p style={{ color: "#c0392b", fontSize: 14, fontWeight: 600, marginTop: 12 }}>{err}</p>}
          <button style={{ ...btn, opacity: busy ? 0.6 : 1 }} onClick={save} disabled={busy}>{busy ? "저장 중…" : "저장하기"}</button>
        </>)}

        {step === "done" && (<>
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: 48 }}>✅</div>
            <p style={{ fontSize: 18, fontWeight: 800, marginTop: 10 }}>저장되었습니다!</p>
            <p style={{ fontSize: 14.5, color: "#767d8a", marginTop: 6, lineHeight: 1.6 }}>입력해 주셔서 감사합니다.<br />수정할 게 더 있으면 아래에서 다시 하실 수 있어요.</p>
            <button style={{ ...btn, background: "#eef0f3", color: "#3d424d", marginTop: 18 }} onClick={() => { setStep("verify"); setRec(null); setName(""); setLast4(""); }}>다른 정보 입력</button>
          </div>
        </>)}
      </div>
    </div>
  );
}
