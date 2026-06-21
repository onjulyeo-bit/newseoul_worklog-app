"use client";

// 로그인 후 '본인 확인' 카드 — 미연결(관심) 사용자가 이름+전화 뒷4자리로 명단과 직접 연결.
//   성공 시 회원 권한이 되어 명단·일정이 열림. member_self_claim RPC(SECURITY DEFINER) 사용.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { UserCheck } from "lucide-react";

export default function MemberClaim() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [last4, setLast4] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function claim() {
    if (!name.trim()) { setErr("이름을 입력해 주세요."); return; }
    setBusy(true); setErr("");
    const supabase = createClient();
    const { data, error } = await supabase.rpc("member_self_claim", { p_name: name.trim(), p_last4: last4.trim() });
    setBusy(false);
    const res = data as { ok?: boolean } | null;
    if (error) { setErr("확인 중 오류가 났어요. 잠시 후 다시 시도해 주세요."); return; }
    if (!res?.ok) { setErr("이름 또는 전화 뒷 4자리가 명단과 달라요. 간사님께 문의하시거나, 둘러보기로 이용하세요."); return; }
    router.refresh();
  }

  return (
    <div className="moim-claim">
      <style>{CSS}</style>
      <div className="cl-card">
        <span className="cl-ic"><UserCheck size={22} /></span>
        <h2 className="cl-h">회원이신가요?</h2>
        <p className="cl-sub">이름과 전화 뒷 4자리로 본인 확인하면, 회원 명단·연간일정을 볼 수 있어요.</p>
        <label className="cl-l">이름</label>
        <input className="cl-inp" value={name} onChange={(e) => setName(e.target.value)} placeholder="홍길동" />
        <label className="cl-l">전화번호 뒷 4자리</label>
        <input className="cl-inp" value={last4} onChange={(e) => setLast4(e.target.value.replace(/[^0-9]/g, "").slice(0, 4))} placeholder="예: 1234" inputMode="numeric" />
        <p className="cl-hint">명단에 전화번호가 없으면 비워두고 눌러도 돼요.</p>
        {err && <p className="cl-err">{err}</p>}
        <button className="cl-btn" onClick={claim} disabled={busy}>{busy ? "확인 중…" : "본인 확인하고 연결"}</button>
      </div>
    </div>
  );
}

const CSS = `
.moim-claim{ margin-bottom:18px; }
.moim-claim .cl-card{ background:#fff; border:1px solid #dbe6f5; border-radius:18px; padding:22px; box-shadow:0 1px 2px rgba(20,24,34,.04), 0 8px 24px rgba(0,62,204,.06); max-width:520px; }
.moim-claim .cl-ic{ display:inline-grid; place-items:center; width:44px; height:44px; border-radius:12px; background:#e8f1fc; color:#003ecc; margin-bottom:12px; }
.moim-claim .cl-h{ font-size:19px; font-weight:800; letter-spacing:-0.03em; margin:0; color:#16181d; }
.moim-claim .cl-sub{ font-size:14px; color:#767d8a; margin:6px 0 14px; line-height:1.6; }
.moim-claim .cl-l{ display:block; font-size:13px; font-weight:700; color:#3d424d; margin:10px 0 6px; }
.moim-claim .cl-inp{ width:100%; font-size:16px; padding:12px 13px; border:1px solid #e0e0e0; border-radius:11px; outline:none; background:#fafafb; font-family:inherit; }
.moim-claim .cl-inp:focus{ border-color:#003ecc; background:#fff; box-shadow:0 0 0 3px #e8f1fc; }
.moim-claim .cl-hint{ font-size:12.5px; color:#9a9fa8; margin:7px 0 0; }
.moim-claim .cl-err{ font-size:13px; color:#c0392b; font-weight:600; margin:10px 0 0; }
.moim-claim .cl-btn{ width:100%; font-size:16px; font-weight:700; padding:13px; border-radius:12px; border:0; background:#003ecc; color:#fff; cursor:pointer; margin-top:16px; }
.moim-claim .cl-btn:disabled{ opacity:.6; }
`;
