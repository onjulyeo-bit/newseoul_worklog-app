"use client";

// 강사 자기입력 폼 (로그인 불필요) — 회원 폼과 동일한 항목. 본인이 작성하면 강사풀에 자동 저장.
//   보안: instructors 직접 접근 안 함, instructor_self_upsert RPC(SECURITY DEFINER)만 사용. 이름 기준 upsert.
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { processPhoto } from "@/lib/photoProcess";

type Form = { name: string; phone: string; email: string; company: string; position: string; field: string; intro: string; business_card_url: string; photo_url: string };
const BLANK: Form = { name: "", phone: "", email: "", company: "", position: "", field: "", intro: "", business_card_url: "", photo_url: "" };
const INTRO_EXAMPLE = "예) 일터에서 만난 분들과 깊이 나누는 시간을 좋아합니다.";

export default function InstructorFormPage() {
  const [supabase] = useState(() => createClient());
  const [f, setF] = useState<Form>(BLANK);
  const [busy, setBusy] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [cardBusy, setCardBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((s) => ({ ...s, [k]: v }));

  async function submit() {
    if (!f.name.trim()) { setErr("성함을 입력해 주세요."); return; }
    if (!f.phone.trim()) { setErr("연락처를 입력해 주세요."); return; }
    if (!f.email.trim()) { setErr("이메일을 입력해 주세요."); return; }
    setBusy(true); setErr("");
    const { data, error } = await supabase.rpc("instructor_self_upsert", {
      p_name: f.name.trim(), p_phone: f.phone, p_email: f.email, p_company: f.company,
      p_position: f.position, p_field: f.field, p_intro: f.intro, p_card: f.business_card_url, p_photo: f.photo_url,
    });
    setBusy(false);
    if (error || data === false) { setErr("저장에 실패했어요. 간사님께 문의해 주세요."); return; }
    setDone(true);
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  }

  async function uploadPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; e.target.value = "";
    if (!file) return;
    if (file.size > 12 * 1024 * 1024) { setErr("사진은 12MB 이하만 올릴 수 있어요."); return; }
    setPhotoBusy(true); setErr("");
    try {
      const blob = await processPhoto(file, { removeBg: false, enhance: true, size: 640 });
      const up = await supabase.storage.from("member-cards").upload(`lect-photo-${Date.now()}.jpg`, blob, { upsert: true, contentType: "image/jpeg" });
      if (up.error) throw new Error(up.error.message);
      set("photo_url", supabase.storage.from("member-cards").getPublicUrl(up.data.path).data.publicUrl);
    } catch (e) { setErr("사진 업로드 실패: " + (e instanceof Error ? e.message : "오류")); }
    finally { setPhotoBusy(false); }
  }
  async function uploadCard(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; e.target.value = "";
    if (!file) return;
    if (file.size > 12 * 1024 * 1024) { setErr("명함은 12MB 이하만 올릴 수 있어요."); return; }
    setCardBusy(true); setErr("");
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const up = await supabase.storage.from("member-cards").upload(`lect-card-${Date.now()}.${ext}`, file, { upsert: true, contentType: file.type });
    setCardBusy(false);
    if (up.error) { setErr("명함 업로드 실패: " + up.error.message); return; }
    set("business_card_url", supabase.storage.from("member-cards").getPublicUrl(up.data.path).data.publicUrl);
  }

  const FIELDS: [keyof Form, string, string][] = [
    ["phone", "연락처 *", "010-0000-0000"],
    ["email", "이메일 *", ""],
    ["company", "소속 / 회사", "○○대 / ○○회사"],
    ["position", "직위 / 직함", "교수 / 대표"],
    ["field", "전문분야 · 강의 주제", "리더십 / 신앙간증"],
  ];

  return (
    <div className="lf">
      <style>{CSS}</style>
      <div className="lf-card">
        <div className="lf-top">
          <span className="lf-mark">{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/cbmc-symbol.webp" alt="CBMC" /></span>
          <span className="lf-bname">CBMC <span className="lf-dim">새서울지회</span></span>
        </div>
        <h1 className="lf-h1">강사님 소개</h1>

        {done ? (
          <div className="lf-done">
            <div style={{ fontSize: 46 }}>✅</div>
            <p className="lf-done-t">등록되었습니다!</p>
            <p className="lf-done-d">작성해 주셔서 감사합니다.<br />수정할 게 있으면 같은 성함으로 다시 작성하시면 갱신돼요.</p>
            <button className="lf-ghost" onClick={() => { setF(BLANK); setDone(false); }}>다시 작성</button>
          </div>
        ) : (<>
          <p className="lf-sub">귀한 걸음으로 섬겨 주셔서 감사합니다. 아래 정보를 남겨 주시면 정성껏 모시는 데 쓰겠습니다.</p>

          <div className="lf-photo-sec">
            {f.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={f.photo_url} alt="프로필" className="lf-photo" />
            ) : <div className="lf-photo lf-photo-ph">{f.name.charAt(0) || "?"}</div>}
            <div className="lf-photo-acts">
              <label className="lf-ghost">{photoBusy ? "올리는 중…" : f.photo_url ? "사진 변경" : "프로필 사진 올리기"}<input type="file" accept="image/*" hidden onChange={uploadPhoto} /></label>
              {f.photo_url && <button type="button" className="lf-ghost lf-danger" onClick={() => set("photo_url", "")}>삭제</button>}
            </div>
          </div>

          <label className="lf-l">성함 *</label>
          <input className="lf-inp" value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="홍길동" />

          {FIELDS.map(([k, lbl, ph]) => (
            <div key={k}><label className="lf-l">{lbl}</label><input className="lf-inp" value={f[k] as string} onChange={(e) => set(k, e.target.value as never)} placeholder={ph} /></div>
          ))}

          <label className="lf-l">자기소개 <span className="lf-opt">(선택)</span></label>
          <textarea className="lf-inp lf-ta" value={f.intro} onChange={(e) => set("intro", e.target.value)} placeholder={INTRO_EXAMPLE} />

          <label className="lf-l">명함 이미지 <span className="lf-opt">(선택)</span></label>
          {f.business_card_url ? (
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={f.business_card_url} alt="명함" className="lf-cardimg" />
              <div className="lf-photo-acts" style={{ marginTop: 8 }}>
                <label className="lf-ghost">{cardBusy ? "올리는 중…" : "명함 변경"}<input type="file" accept="image/*" hidden onChange={uploadCard} /></label>
                <button type="button" className="lf-ghost lf-danger" onClick={() => set("business_card_url", "")}>삭제</button>
              </div>
            </div>
          ) : (
            <label className="lf-drop">📇 {cardBusy ? "올리는 중…" : "명함 사진 올리기"}<input type="file" accept="image/*" hidden onChange={uploadCard} /></label>
          )}

          {err && <p className="lf-err">{err}</p>}
          <button className="lf-btn" onClick={submit} disabled={busy}>{busy ? "저장 중…" : "등록하기"}</button>
        </>)}
      </div>
    </div>
  );
}

const CSS = `
.lf{ min-height:100vh; background:#fafafb; display:flex; justify-content:center; padding:24px 16px; font-family:Pretendard,-apple-system,sans-serif; color:#16181d; }
.lf *{ box-sizing:border-box; }
.lf-card{ width:100%; max-width:460px; background:#fff; border:1px solid #ecedf0; border-radius:22px; padding:24px; box-shadow:0 4px 20px rgba(20,30,60,.06); align-self:flex-start; }
.lf-top{ display:flex; align-items:center; gap:9px; margin-bottom:14px; }
.lf-mark{ width:32px; height:32px; border-radius:9px; background:#fff; border:1px solid #ecedf0; display:grid; place-items:center; overflow:hidden; }
.lf-mark img{ width:22px; height:22px; object-fit:contain; }
.lf-bname{ font-size:14.5px; font-weight:800; }
.lf-dim{ color:#86868b; font-weight:700; }
.lf-h1{ font-size:20px; font-weight:800; letter-spacing:-0.03em; margin:0; }
.lf-badge{ display:inline-flex; align-items:center; font-size:12.5px; font-weight:700; color:#003ecc; background:#eef1fb; border-radius:999px; padding:4px 11px; margin-top:8px; }
.lf-sub{ font-size:14px; color:#767d8a; line-height:1.6; margin:12px 0 4px; }
.lf-photo-sec{ display:flex; flex-direction:column; align-items:center; gap:10px; margin:18px 0 6px; }
.lf-photo{ width:116px; height:116px; border-radius:18px; object-fit:cover; border:1px solid #ecedf0; }
.lf-photo-ph{ display:grid; place-items:center; background:#f1f2f4; color:#86868b; font-size:38px; font-weight:800; }
.lf-photo-acts{ display:flex; gap:8px; justify-content:center; }
.lf-l{ display:block; font-size:14px; font-weight:700; color:#3d424d; margin:14px 0 6px; }
.lf-opt{ font-weight:500; color:#9a9fa8; font-size:13px; }
.lf-inp{ width:100%; font-size:17px; padding:13px 14px; border:1px solid #ecedf0; border-radius:12px; outline:none; background:#fafafb; font-family:inherit; }
.lf-inp:focus{ border-color:#003ecc; background:#fff; }
.lf-ta{ min-height:88px; resize:vertical; line-height:1.6; }
.lf-cardimg{ width:100%; border:1px solid #ecedf0; border-radius:13px; display:block; }
.lf-drop{ display:flex; align-items:center; justify-content:center; gap:8px; padding:20px; border:1.5px dashed #d6d9df; border-radius:13px; background:#fafafa; color:#3d424d; font-weight:700; font-size:14.5px; cursor:pointer; }
.lf-drop:hover{ border-color:#003ecc; color:#003ecc; }
.lf-ghost{ display:inline-flex; align-items:center; font-size:13.5px; font-weight:700; color:#003ecc; background:#f5f9ff; border:1px solid #cdddf7; border-radius:10px; padding:8px 14px; cursor:pointer; }
.lf-danger{ color:#c0392b; background:#fdecea; border-color:#f3c6c0; }
.lf-btn{ width:100%; font-size:17px; font-weight:700; padding:14px; border-radius:999px; border:0; background:#003ecc; color:#fff; cursor:pointer; margin-top:20px; }
.lf-btn:disabled{ opacity:.6; }
.lf-err{ color:#c0392b; font-size:14px; font-weight:600; margin-top:12px; }
.lf-done{ text-align:center; padding:20px 0; }
.lf-done-t{ font-size:18px; font-weight:800; margin-top:10px; }
.lf-done-d{ font-size:14.5px; color:#767d8a; margin-top:6px; line-height:1.6; }
`;
