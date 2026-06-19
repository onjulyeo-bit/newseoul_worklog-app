"use client";

// 회원 자기입력 폼 (로그인 불필요) — 이름+전화 뒷4자리로 본인 확인 → 개인정보만 수정 → 자동 저장.
// 보안: members 직접 접근 안 함, member_self_lookup / member_self_update RPC(SECURITY DEFINER)만 사용.
// 디자인: 잉크(차콜) 모노톤 단색. 로직 동일, 비주얼만.
import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Rec = { id: string; name: string; phone: string | null; email: string | null; company: string | null; position: string | null; industry: string | null; spouse_name: string | null; car_model: string | null; car_number: string | null; birth_date: string | null; birth_calendar: string | null; address: string | null; address_type: string | null; home_church: string | null; intro: string | null; business_card_url: string | null };

const INTRO_EXAMPLE = "예) 새로운 사람 만나는 게 늘 설렙니다. 먼저 인사 못 드려도 미워하지 마세요.";

// 편집 단계 — 섹션별 필드 그룹
const GROUPS: { title: string; fields: [keyof Rec, string][] }[] = [
  { title: "연락", fields: [["phone", "연락처"], ["email", "이메일"]] },
  { title: "기본", fields: [["birth_date", "생일 (예: 03-15 또는 1970-03-15)"], ["spouse_name", "배우자"]] },
  { title: "직업", fields: [["company", "회사 / 직장"], ["position", "직위"], ["industry", "업종"]] },
  { title: "주소 · 신앙", fields: [["address", "주소"], ["home_church", "출석교회"]] },
  { title: "차량", fields: [["car_model", "차종"], ["car_number", "차량번호"]] },
];

export default function MyInfoPage() {
  const [supabase] = useState(() => createClient());
  const [step, setStep] = useState<"verify" | "edit" | "done">("verify");
  const [name, setName] = useState("");
  const [last4, setLast4] = useState("");
  const [busy, setBusy] = useState(false);
  const [cardBusy, setCardBusy] = useState(false);
  const [recording, setRecording] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [err, setErr] = useState("");
  const [rec, setRec] = useState<Rec | null>(null);
  const set = (k: keyof Rec, v: string) => setRec((r) => (r ? { ...r, [k]: v } : r));

  async function startRec() {
    setErr("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });
        setAiBusy(true);
        const audio: string = await new Promise((res) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.readAsDataURL(blob); });
        try {
          const resp = await fetch("/api/intro-voice", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ audio, mime: mr.mimeType || "audio/webm" }) });
          const j = await resp.json();
          if (j.text) set("intro", j.text); else setErr(j.error || "정리에 실패했어요.");
        } catch { setErr("정리 중 오류가 났어요."); } finally { setAiBusy(false); }
      };
      mr.start(); recRef.current = mr; setRecording(true);
    } catch { setErr("마이크 권한을 허용해 주세요."); }
  }
  function stopRec() { recRef.current?.stop(); setRecording(false); }

  async function lookup() {
    if (!name.trim()) { setErr("이름을 입력해 주세요."); return; }
    setBusy(true); setErr("");
    const { data, error } = await supabase.rpc("member_self_lookup", { p_name: name.trim(), p_last4: last4.trim() });
    setBusy(false);
    if (error) { setErr("오류가 났어요. 잠시 후 다시 시도해 주세요."); return; }
    const row = (data as Rec[] | null)?.[0];
    if (!row) { setErr("이름 또는 전화 뒷 4자리가 명단과 달라요. 간사님께 문의해 주세요."); return; }
    setRec(row); setStep("edit"); setErr("");
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
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

  return (
    <div className="mi">
      <style>{MI_CSS}</style>
      <div className="mi-card">
        {/* 브랜드 + 단계 */}
        <div className="mi-top">
          <div className="mi-brand"><span className="mi-mark">C</span><span className="mi-bname">CBMC <span className="mi-dim">새서울지회</span></span></div>
          {step !== "done" && <span className="mi-step">{step === "verify" ? "1 / 2" : "2 / 2"}</span>}
        </div>

        {step === "verify" && (<>
          <h1 className="mi-h1">내 정보 입력</h1>
          <p className="mi-sub">본인 확인 후 연락처·회사 등 정보를 직접 입력·수정할 수 있어요.</p>
          <div className="mi-field">
            <label className="mi-label">이름</label>
            <input className="mi-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="홍길동" />
          </div>
          <div className="mi-field">
            <label className="mi-label">전화번호 뒷 4자리</label>
            <input className="mi-input" value={last4} onChange={(e) => setLast4(e.target.value.replace(/[^0-9]/g, "").slice(0, 4))} placeholder="예: 1234" inputMode="numeric" />
          </div>
          <p className="mi-hint">명단에 전화번호가 없으면 비워두고 ‘내 정보 찾기’를 눌러 주세요.</p>
          {err && <p className="mi-err">{err}</p>}
          <button className="mi-btn" onClick={lookup} disabled={busy}>{busy ? "확인 중…" : "내 정보 찾기"}</button>
        </>)}

        {step === "edit" && rec && (<>
          <h1 className="mi-h1">{rec.name} 님, 반갑습니다</h1>
          <p className="mi-sub">바뀐 정보를 채우거나 고쳐 주세요. 등급·상태는 운영진이 관리합니다.</p>

          {GROUPS.map((g) => (
            <section key={g.title} className="mi-sec">
              <div className="mi-sec-t">{g.title}</div>
              {g.fields.map(([k, lbl]) => (
                <div key={k} className="mi-field">
                  <label className="mi-label">{lbl}</label>
                  <input className="mi-input" value={(rec[k] as string) ?? ""} onChange={(e) => set(k, e.target.value)} inputMode={k === "phone" || k === "car_number" ? "text" : undefined} />
                  {k === "birth_date" && (
                    <div className="mi-seg">{["양력", "음력"].map((o) => (
                      <button key={o} type="button" className={`mi-segbtn ${rec.birth_calendar === o ? "on" : ""}`} onClick={() => set("birth_calendar", o)}>{o}</button>
                    ))}</div>
                  )}
                  {k === "address" && (
                    <div className="mi-seg">{["집", "회사"].map((o) => (
                      <button key={o} type="button" className={`mi-segbtn ${rec.address_type === o ? "on" : ""}`} onClick={() => set("address_type", o)}>{o}</button>
                    ))}</div>
                  )}
                </div>
              ))}
            </section>
          ))}

          {/* 소개 · 명함 */}
          <section className="mi-sec">
            <div className="mi-sec-t">소개</div>
            <div className="mi-field">
              <label className="mi-label">자기소개</label>
              <textarea className="mi-input mi-ta" value={rec.intro ?? ""} onChange={(e) => set("intro", e.target.value)} placeholder={INTRO_EXAMPLE} />
              <button type="button" onClick={recording ? stopRec : startRec} disabled={aiBusy} className={`mi-voice ${recording ? "rec" : ""}`}>
                {aiBusy ? "✍️ 정리 중…" : recording ? "■ 녹음 멈추고 정리하기" : "🎙 말로 자기소개 (자동 정리)"}
              </button>
              <p className="mi-hint">버튼을 누르고 한두 문장 말한 뒤 다시 누르면 자동으로 정리해 위 칸에 채워줘요. (30초 이내)</p>
            </div>
            <div className="mi-field">
              <label className="mi-label">명함 이미지</label>
              {rec.business_card_url ? (
                <div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={rec.business_card_url} alt="명함" className="mi-cardimg" />
                  <div className="mi-cardacts">
                    <label className="mi-ghost">{cardBusy ? "올리는 중…" : "명함 변경"}<input type="file" accept="image/*" hidden onChange={uploadCard} /></label>
                    <button type="button" className="mi-ghost mi-danger" onClick={() => set("business_card_url", "")}>삭제</button>
                  </div>
                </div>
              ) : (
                <label className="mi-drop">📇 {cardBusy ? "올리는 중…" : "명함 사진 올리기"}<input type="file" accept="image/*" hidden onChange={uploadCard} /></label>
              )}
            </div>
          </section>

          {err && <p className="mi-err">{err}</p>}
          <button className="mi-btn" onClick={save} disabled={busy}>{busy ? "저장 중…" : "저장하기"}</button>
        </>)}

        {step === "done" && (
          <div className="mi-done">
            <div className="mi-check"><svg width="30" height="30" viewBox="0 0 24 24" fill="none"><path d="M5 12.5l4.5 4.5L19 7.5" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg></div>
            <h1 className="mi-h1" style={{ marginTop: 16 }}>저장되었습니다</h1>
            <p className="mi-sub" style={{ textAlign: "center" }}>입력해 주셔서 감사합니다.<br />수정할 게 더 있으면 아래에서 다시 하실 수 있어요.</p>
            <button className="mi-btn mi-btn-ghost" onClick={() => { setStep("verify"); setRec(null); setName(""); setLast4(""); setErr(""); }}>다른 정보 입력</button>
          </div>
        )}
      </div>
      <p className="mi-foot">CBMC 새서울지회 · 회원 정보는 운영에만 쓰입니다</p>
    </div>
  );
}

const MI_CSS = `
.mi{ --ink:#18181b; --ink2:#3f3f46; --mut:#71717a; --faint:#a1a1aa; --line:#e6e6e9; --bg:#f4f4f5; --card:#ffffff;
  min-height:100vh; background:var(--bg); display:flex; flex-direction:column; align-items:center; gap:14px;
  padding:28px 16px 40px; font-family:Pretendard,-apple-system,sans-serif; color:var(--ink); letter-spacing:-0.01em; }
.mi *{ box-sizing:border-box; }
.mi-card{ width:100%; max-width:480px; background:var(--card); border:1px solid var(--line); border-radius:24px; padding:28px 24px; box-shadow:0 1px 2px rgba(0,0,0,.03), 0 12px 32px rgba(20,20,28,.06); }
.mi-top{ display:flex; align-items:center; justify-content:space-between; margin-bottom:22px; }
.mi-brand{ display:flex; align-items:center; gap:9px; }
.mi-mark{ width:30px; height:30px; border-radius:9px; background:var(--ink); color:#fff; display:grid; place-items:center; font-weight:800; font-size:15px; }
.mi-bname{ font-size:15px; font-weight:800; }
.mi-dim{ color:var(--faint); font-weight:700; }
.mi-step{ font-size:12px; font-weight:700; color:var(--faint); font-variant-numeric:tabular-nums; }
.mi-h1{ font-size:25px; font-weight:800; letter-spacing:-0.04em; margin:0; }
.mi-sub{ font-size:14.5px; color:var(--mut); line-height:1.6; margin:8px 0 18px; }
.mi-field{ margin-bottom:14px; }
.mi-label{ display:block; font-size:12.5px; font-weight:700; color:var(--mut); margin-bottom:7px; }
.mi-input{ width:100%; font-family:inherit; font-size:16px; color:var(--ink); padding:13px 14px; border:1px solid var(--line); border-radius:13px; outline:none; background:#fafafa; transition:border-color .15s, box-shadow .15s, background .15s; }
.mi-input::placeholder{ color:var(--faint); }
.mi-input:focus{ border-color:var(--ink); background:#fff; box-shadow:0 0 0 3px rgba(24,24,27,.08); }
.mi-ta{ min-height:96px; resize:vertical; line-height:1.55; }
.mi-hint{ font-size:12px; color:var(--faint); margin:7px 0 0; line-height:1.5; }
.mi-err{ font-size:13.5px; font-weight:600; color:#b42318; margin:12px 0 0; }
.mi-sec{ border-top:1px solid var(--line); padding-top:18px; margin-top:18px; }
.mi-sec:first-of-type{ border-top:0; padding-top:0; margin-top:6px; }
.mi-sec-t{ font-size:12px; font-weight:800; color:var(--ink); letter-spacing:0.02em; margin-bottom:12px; text-transform:none; }
.mi-seg{ display:flex; gap:8px; margin-top:8px; }
.mi-segbtn{ flex:1; font-family:inherit; font-size:14px; font-weight:700; padding:10px; border-radius:11px; border:1px solid var(--line); background:#fff; color:var(--mut); cursor:pointer; transition:all .12s; }
.mi-segbtn:hover{ border-color:var(--ink2); }
.mi-segbtn.on{ background:var(--ink); color:#fff; border-color:var(--ink); }
.mi-voice{ display:flex; align-items:center; justify-content:center; gap:8px; width:100%; margin-top:9px; padding:12px; border-radius:13px; border:1px solid var(--ink); background:#fff; color:var(--ink); font-family:inherit; font-weight:700; font-size:14.5px; cursor:pointer; transition:all .15s; }
.mi-voice:hover{ background:#fafafa; }
.mi-voice.rec{ border-color:#b42318; color:#b42318; background:#fdf3f2; }
.mi-voice:disabled{ opacity:.6; cursor:default; }
.mi-cardimg{ width:100%; border:1px solid var(--line); border-radius:13px; display:block; }
.mi-cardacts{ display:flex; gap:8px; margin-top:8px; }
.mi-ghost{ flex:1; text-align:center; font-family:inherit; font-size:14.5px; font-weight:700; color:var(--ink2); padding:11px; border:1px solid var(--line); border-radius:11px; background:#fff; cursor:pointer; }
.mi-ghost:hover{ background:#fafafa; }
.mi-danger{ flex:0 0 auto; padding-left:18px; padding-right:18px; color:#b42318; }
.mi-drop{ display:flex; align-items:center; justify-content:center; gap:8px; padding:20px; border:1.5px dashed var(--line); border-radius:13px; background:#fafafa; color:var(--ink2); font-family:inherit; font-weight:700; font-size:14.5px; cursor:pointer; transition:all .15s; }
.mi-drop:hover{ border-color:var(--ink2); background:#f4f4f5; }
.mi-btn{ width:100%; font-family:inherit; font-size:16px; font-weight:700; padding:15px; border-radius:14px; border:0; background:var(--ink); color:#fff; cursor:pointer; margin-top:22px; transition:opacity .15s, transform .1s; }
.mi-btn:hover{ opacity:.9; }
.mi-btn:active{ transform:translateY(1px); }
.mi-btn:disabled{ opacity:.55; cursor:default; }
.mi-btn-ghost{ background:#fff; color:var(--ink); border:1px solid var(--line); }
.mi-done{ display:flex; flex-direction:column; align-items:center; padding:14px 0 8px; }
.mi-check{ width:60px; height:60px; border-radius:50%; background:var(--ink); display:grid; place-items:center; }
.mi-foot{ font-size:12px; color:var(--faint); }
`;
