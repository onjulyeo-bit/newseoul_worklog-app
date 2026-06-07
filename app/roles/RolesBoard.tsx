"use client";

// 역할 관리 — 임원이 로그인한 사람들의 권한(임원/회원/관심)을 지정. profiles RLS상 임원만 수정 가능.
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type Profile = { id: string; email: string | null; role: string; created_at: string };
const ROLES: { v: string; label: string }[] = [{ v: "admin", label: "임원" }, { v: "member", label: "회원" }, { v: "guest", label: "관심" }];
const roleTone = (r: string) => (r === "admin" ? "b-brand" : r === "member" ? "b-green" : "b-gray");
const roleLabel = (r: string) => ROLES.find((x) => x.v === r)?.label ?? r;
const AV = ["#0066cc", "#16a34a", "#7c5cff", "#e8643c", "#0d9488", "#d4a017"];

export default function RolesBoard({ initial, myId }: { initial: Profile[]; myId: string }) {
  const [supabase] = useState(() => createClient());
  const [list, setList] = useState<Profile[]>(initial);
  const [toast, setToast] = useState("");
  const showToast = (t: string) => { setToast(t); setTimeout(() => setToast(""), 2200); };

  async function setRole(p: Profile, role: string) {
    if (p.role === role) return;
    if (p.id === myId && role !== "admin" && !confirm("내 권한을 임원에서 내리면 이 화면에 더 못 들어와요. 계속할까요?")) return;
    setList((l) => l.map((x) => (x.id === p.id ? { ...x, role } : x)));
    const { error } = await supabase.from("profiles").update({ role }).eq("id", p.id);
    if (error) { setList((l) => l.map((x) => (x.id === p.id ? { ...x, role: p.role } : x))); alert("변경 실패: " + error.message); return; }
    showToast(`${p.email ?? "사용자"} → ${roleLabel(role)}`);
  }

  const counts = { admin: list.filter((p) => p.role === "admin").length, member: list.filter((p) => p.role === "member").length, guest: list.filter((p) => p.role === "guest").length };

  return (
    <div className="moim-roles">
      <style>{CSS}</style>
      <div className="page-head"><div><h1 className="page-title">역할 관리</h1><p className="page-sub">로그인한 사람의 권한을 지정해요 · 임원 {counts.admin} · 회원 {counts.member} · 관심 {counts.guest}</p></div></div>

      <div className="info-card">
        <div className="info-row"><span className="badge b-brand">임원</span> 전체 운영(회원·출석·회계·콘텐츠…) 가능</div>
        <div className="info-row"><span className="badge b-green">회원</span> 공지·콘텐츠만 보기 (개인정보·회계 차단)</div>
        <div className="info-row"><span className="badge b-gray">관심</span> 처음 로그인 기본값 · 공지만 보기</div>
        <p className="info-note">※ 권한은 로그인한 사람이 새로고침하면 바로 반영돼요. 회원이 한 번도 로그인 안 했으면 목록에 안 떠요(로그인해야 생성).</p>
      </div>

      <div className="card list-card">
        {list.length === 0 ? (
          <div className="empty">아직 로그인한 사람이 없어요. 회원이 메일로 한 번 로그인하면 여기 나타나요.</div>
        ) : list.map((p) => {
          const name = (p.email ?? "?").charAt(0).toUpperCase();
          const color = AV[(p.email?.charCodeAt(0) ?? 0) % AV.length];
          return (
            <div key={p.id} className="role-row">
              <span className="r-av" style={{ background: color }}>{name}</span>
              <div className="r-who">
                <span className="r-email">{p.email ?? "(이메일 없음)"}{p.id === myId && <span className="r-me">나</span>}</span>
                <span className="r-cur">현재: <span className={`badge ${roleTone(p.role)}`}>{roleLabel(p.role)}</span></span>
              </div>
              <div className="seg">
                {ROLES.map((r) => <button key={r.v} className={`seg-btn ${p.role === r.v ? "on" : ""}`} onClick={() => setRole(p, r.v)}>{r.label}</button>)}
              </div>
            </div>
          );
        })}
      </div>
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

const CSS = `
.moim-roles{
  --brand:#0066cc; --brand-strong:#0052a8; --brand-soft:#e8f1fc; --brand-softer:#f3f8fe;
  --ink:#16181d; --ink-2:#3d424d; --ink-3:#767d8a; --line:#ecedf0; --bg:#ffffff; --bg-warm:#fafafb; --green:#0a7d3f; --green-soft:#e4f6ec;
  --radius-card:20px; --shadow-sm:0 1px 2px rgba(20,24,34,.04), 0 3px 12px rgba(20,24,34,.045);
  color:var(--ink); line-height:1.5; letter-spacing:-0.01em;
}
.moim-roles *{ box-sizing:border-box; }
.moim-roles h1,.moim-roles p{ margin:0; }
.moim-roles .card{ background:var(--bg); border:1px solid var(--line); border-radius:var(--radius-card); box-shadow:var(--shadow-sm); }
.moim-roles .page-head{ margin-bottom:16px; }
.moim-roles .page-title{ font-size:clamp(21px,5vw,26px); font-weight:800; letter-spacing:-0.04em; }
.moim-roles .page-sub{ color:var(--ink-3); font-size:14px; margin-top:5px; font-weight:500; }
.moim-roles .badge{ display:inline-flex; align-items:center; font-size:12px; font-weight:700; padding:3px 9px; border-radius:999px; }
.moim-roles .b-brand{ background:var(--brand-soft); color:var(--brand-strong); }
.moim-roles .b-green{ background:var(--green-soft); color:var(--green); }
.moim-roles .b-gray{ background:#eff0f2; color:#6b717c; }
.moim-roles .info-card{ background:var(--brand-softer); border:1px solid #d6e6fa; border-radius:16px; padding:16px 18px; margin-bottom:16px; max-width:760px; }
.moim-roles .info-row{ display:flex; align-items:center; gap:8px; font-size:13.5px; color:var(--ink-2); font-weight:500; padding:3px 0; }
.moim-roles .info-note{ font-size:12px; color:var(--ink-3); margin-top:8px; font-weight:500; line-height:1.5; }
.moim-roles .list-card{ max-width:760px; overflow:hidden; }
.moim-roles .role-row{ display:flex; align-items:center; gap:13px; padding:14px 18px; border-bottom:1px solid var(--line); flex-wrap:wrap; }
.moim-roles .role-row:last-child{ border-bottom:0; }
.moim-roles .r-av{ width:38px; height:38px; border-radius:50%; display:grid; place-items:center; color:#fff; font-weight:700; flex-shrink:0; }
.moim-roles .r-who{ flex:1; min-width:160px; display:flex; flex-direction:column; gap:3px; }
.moim-roles .r-email{ font-weight:700; font-size:14.5px; display:flex; align-items:center; gap:7px; }
.moim-roles .r-me{ font-size:11px; font-weight:800; color:var(--brand-strong); background:var(--brand-soft); padding:1px 7px; border-radius:999px; }
.moim-roles .r-cur{ font-size:12.5px; color:var(--ink-3); font-weight:500; display:flex; align-items:center; gap:5px; }
.moim-roles .seg{ display:flex; background:var(--bg-warm); border:1px solid var(--line); border-radius:11px; padding:3px; gap:2px; }
.moim-roles .seg-btn{ font-size:13px; font-weight:700; color:var(--ink-3); padding:7px 15px; border-radius:8px; border:0; background:none; cursor:pointer; transition:all .14s; }
.moim-roles .seg-btn.on{ background:var(--brand); color:#fff; box-shadow:0 2px 6px rgba(0,102,204,.3); }
.moim-roles .empty{ padding:40px; text-align:center; color:var(--ink-3); font-size:14px; font-weight:500; }
.moim-roles .toast{ position:fixed; bottom:26px; left:50%; transform:translateX(-50%); z-index:80; background:var(--ink); color:#fff; font-size:13.5px; font-weight:600; padding:12px 20px; border-radius:999px; box-shadow:0 10px 30px rgba(0,0,0,.25); }
`;
