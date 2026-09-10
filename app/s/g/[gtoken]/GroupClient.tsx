"use client";

// 단체 서명 명단 — sign_group_fetch(토큰 RPC)로 서명자 목록을 받아, 본인 이름 탭 → 확인 → /s/[개인토큰] 이동.
//   QR 체크인과 같은 '본인 선택' 신뢰 모델(닫힌 단톡방 전제). 서명 완료자는 비활성 표시.
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type GSigner = { name: string; label: string; status: string; signed_at: string | null; token: string };
type GData = { request_id: string; title: string; description: string | null; status: string; expires_at: string | null; signers: GSigner[] };

const AV_COLORS = ["#003ecc", "#16a34a", "#7c5cff", "#e8643c", "#0d9488", "#d4a017"];

function fmtD(s: string | null) {
  if (!s) return "";
  const d = new Date(s);
  return `${d.getMonth() + 1}.${d.getDate()}`;
}

export default function GroupClient({ groupToken }: { groupToken: string }) {
  const [data, setData] = useState<GData | null>(null);
  const [err, setErr] = useState(false);
  const [loading, setLoading] = useState(true);
  const [confirmFor, setConfirmFor] = useState<GSigner | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const supabase = createClient();
      const { data: d, error } = await supabase.rpc("sign_group_fetch", { p_group_token: groupToken });
      if (!alive) return;
      if (error || !d) { setErr(true); setLoading(false); return; }
      setData(d as GData); setLoading(false);
    })();
    return () => { alive = false; };
  }, [groupToken]);

  const doneCount = data?.signers.filter((s) => s.status === "signed").length ?? 0;
  const total = data?.signers.length ?? 0;
  const allDone = data?.status === "completed" || (total > 0 && doneCount === total);

  return (
    <div className="moim-gsign">
      <style>{CSS}</style>
      <div className="gs-phone">
        <div className="gs-head">
          <div className="gs-brand"><span className="gs-badge">✍</span><span className="gs-brandname">새서울 <b>CBMC</b> 전자서명</span></div>
          {loading ? (
            <h1 className="gs-title">명단을 불러오는 중…</h1>
          ) : err || !data ? (
            <>
              <h1 className="gs-title">링크를 확인해 주세요</h1>
              <p className="gs-sub">링크가 올바르지 않거나 만료되었어요.<br />안내받은 링크로 다시 들어와 주세요. 🙏</p>
            </>
          ) : (
            <>
              <h1 className="gs-title">본인 이름을 누르고<br />서명해 주세요</h1>
              <p className="gs-doc">📄 {data.title}</p>
              {data.description && <p className="gs-sub">{data.description}</p>}
              <div className="gs-prog"><i style={{ width: `${total ? Math.round((doneCount / total) * 100) : 0}%` }} /><span>{doneCount} / {total} 서명 완료</span></div>
            </>
          )}
        </div>

        {data && !err && (
          <>
            {allDone && <div className="gs-done">🎉 전원 서명이 완료되었습니다. 감사합니다!</div>}
            <ul className="gs-list">
              {data.signers.map((s) => {
                const signed = s.status === "signed";
                const color = AV_COLORS[(s.name.charCodeAt(0) || 0) % AV_COLORS.length];
                return (
                  <li key={s.token}>
                    <button className={`gs-item ${signed ? "done" : ""}`} disabled={signed} onClick={() => setConfirmFor(s)}>
                      <span className="gs-av" style={{ background: signed ? "#c6ccd6" : color }}>{s.name.charAt(0)}</span>
                      <span className="gs-name">{s.name}{s.label && s.label !== s.name && <em>{s.label}</em>}</span>
                      {signed ? <span className="gs-tag">✓ {fmtD(s.signed_at)} 완료</span> : <span className="gs-go">서명하기 ›</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
            <p className="gs-foot">서명은 본인 이름에만 해주세요 · 서명 시각과 접속 정보가 증빙으로 기록됩니다</p>
          </>
        )}
      </div>

      {confirmFor && (
        <div className="gs-modal-root" onClick={() => setConfirmFor(null)}>
          <div className="gs-modal" onClick={(e) => e.stopPropagation()}>
            <span className="gs-av big" style={{ background: AV_COLORS[(confirmFor.name.charCodeAt(0) || 0) % AV_COLORS.length] }}>{confirmFor.name.charAt(0)}</span>
            <h2>{confirmFor.name} 님 본인이 맞으신가요?</h2>
            <p>본인 확인 후 서명 화면으로 이동합니다.</p>
            <div className="gs-modal-acts">
              <button className="gs-btn ghost" onClick={() => setConfirmFor(null)}>아니요</button>
              <button className="gs-btn primary" onClick={() => { window.location.href = `/s/${confirmFor.token}`; }}>네, 서명할게요</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const CSS = `
.moim-gsign{ min-height:100dvh; background:#f4f5f8; display:flex; justify-content:center; font-family:inherit; color:#16181d; }
.moim-gsign *{ box-sizing:border-box; }
.moim-gsign h1,.moim-gsign h2,.moim-gsign p,.moim-gsign ul{ margin:0; }
.moim-gsign ul{ padding:0; list-style:none; }
.moim-gsign .gs-phone{ width:100%; max-width:480px; padding:22px 18px 40px; }
.moim-gsign .gs-brand{ display:flex; align-items:center; gap:8px; margin-bottom:18px; }
.moim-gsign .gs-badge{ display:grid; place-items:center; width:30px; height:30px; border-radius:9px; background:#1e2353; color:#fff; font-size:15px; }
.moim-gsign .gs-brandname{ font-size:14px; font-weight:600; color:#3d424d; } .moim-gsign .gs-brandname b{ color:#003ecc; }
.moim-gsign .gs-title{ font-size:24px; font-weight:800; letter-spacing:-0.03em; line-height:1.3; }
.moim-gsign .gs-doc{ margin-top:10px; font-size:15px; font-weight:700; color:#1e2353; }
.moim-gsign .gs-sub{ margin-top:6px; font-size:13.5px; color:#767d8a; line-height:1.6; }
.moim-gsign .gs-prog{ position:relative; height:22px; margin-top:14px; background:#e8eaef; border-radius:999px; overflow:hidden; }
.moim-gsign .gs-prog i{ position:absolute; inset:0 auto 0 0; background:#16a34a; border-radius:999px; transition:width .3s; }
.moim-gsign .gs-prog span{ position:absolute; inset:0; display:grid; place-items:center; font-size:11.5px; font-weight:800; color:#1e2353; }
.moim-gsign .gs-done{ margin-top:14px; background:#e8f7ee; border:1px solid #bfe7cf; color:#0a7d3f; font-size:14px; font-weight:700; border-radius:12px; padding:12px 14px; text-align:center; }
.moim-gsign .gs-list{ margin-top:16px; display:flex; flex-direction:column; gap:9px; }
.moim-gsign .gs-item{ width:100%; display:flex; align-items:center; gap:12px; background:#fff; border:1px solid #e6e8ee; border-radius:14px; padding:13px 14px; font-family:inherit; font-size:16px; cursor:pointer; text-align:left; box-shadow:0 1px 2px rgba(20,24,34,.04); }
.moim-gsign .gs-item:active{ background:#f2f6ff; border-color:#9db8e8; }
.moim-gsign .gs-item.done{ background:#f7f8fa; cursor:default; }
.moim-gsign .gs-av{ flex:none; display:grid; place-items:center; width:38px; height:38px; border-radius:50%; color:#fff; font-size:16px; font-weight:700; }
.moim-gsign .gs-av.big{ width:52px; height:52px; font-size:22px; margin:0 auto 12px; }
.moim-gsign .gs-name{ flex:1; font-weight:700; color:#16181d; display:flex; align-items:baseline; gap:7px; }
.moim-gsign .gs-item.done .gs-name{ color:#8a909c; }
.moim-gsign .gs-name em{ font-style:normal; font-size:12px; color:#9aa0ab; font-weight:600; }
.moim-gsign .gs-tag{ font-size:12.5px; font-weight:700; color:#0a7d3f; }
.moim-gsign .gs-go{ font-size:13.5px; font-weight:800; color:#003ecc; }
.moim-gsign .gs-foot{ margin-top:18px; text-align:center; font-size:12px; color:#9aa0ab; line-height:1.6; }
.moim-gsign .gs-modal-root{ position:fixed; inset:0; z-index:60; background:rgba(20,24,34,.45); display:flex; align-items:center; justify-content:center; padding:24px; }
.moim-gsign .gs-modal{ width:100%; max-width:340px; background:#fff; border-radius:18px; padding:24px 20px 18px; text-align:center; box-shadow:0 20px 60px rgba(20,30,60,.3); }
.moim-gsign .gs-modal h2{ font-size:18px; font-weight:800; letter-spacing:-0.02em; }
.moim-gsign .gs-modal p{ margin-top:6px; font-size:13.5px; color:#767d8a; }
.moim-gsign .gs-modal-acts{ display:flex; gap:8px; margin-top:18px; }
.moim-gsign .gs-btn{ flex:1; font-family:inherit; font-size:15px; font-weight:700; padding:13px; border-radius:12px; border:0; cursor:pointer; }
.moim-gsign .gs-btn.ghost{ background:#f1f2f5; color:#3d424d; }
.moim-gsign .gs-btn.primary{ background:#003ecc; color:#fff; }
`;
