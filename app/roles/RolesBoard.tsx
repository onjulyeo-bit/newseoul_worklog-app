"use client";

// 권한 설정 — 메인 관리자(owner)가 로그인 계정을 명단 회원과 '연결'하고 권한 지정.
// 미연결 로그인: 카카오 등으로 막 로그인했지만 명단과 연결 안 된 사람 → 회원 선택해 연결.
// 연결됨: 이미 명단 회원과 연결된 계정 → 권한 변경/연결 해제. 메인 본인은 잠금.
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type Profile = { id: string; email: string | null; role: string; is_owner?: boolean; member_id?: string | null; created_at: string };
export type MemberOpt = { id: string; name: string; email: string | null; intended_role?: string | null };

const ROLES: { v: string; label: string }[] = [{ v: "admin", label: "운영진" }, { v: "member", label: "회원" }, { v: "guest", label: "관심" }];
const roleTone = (r: string) => (r === "admin" ? "b-brand" : r === "member" ? "b-green" : "b-gray");
const roleLabel = (r: string) => ROLES.find((x) => x.v === r)?.label ?? r;
const AV = ["#0066cc", "#16a34a", "#7c5cff", "#e8643c", "#0d9488", "#d4a017"];
const initial = (s: string | null) => (s ?? "?").charAt(0).toUpperCase();
const avColor = (s: string | null) => AV[(s?.charCodeAt(0) ?? 0) % AV.length];

export default function RolesBoard({ initial: init, members, myId }: { initial: Profile[]; members: MemberOpt[]; myId: string }) {
  const [supabase] = useState(() => createClient());
  const [list, setList] = useState<Profile[]>(init);
  const [toast, setToast] = useState("");
  const showToast = (t: string) => { setToast(t); setTimeout(() => setToast(""), 2200); };
  const memberName = (id: string | null | undefined) => members.find((m) => m.id === id)?.name ?? "(이름 없음)";
  const suggestFor = (p: Profile) => (p.email ? members.find((m) => m.email && m.email.toLowerCase() === p.email!.toLowerCase()) ?? null : null);

  async function setRole(p: Profile, role: string) {
    if (p.role === role) return;
    if (p.is_owner) { alert("메인 관리자의 권한은 바꿀 수 없어요."); return; }
    setList((l) => l.map((x) => (x.id === p.id ? { ...x, role } : x)));
    const { error } = await supabase.from("profiles").update({ role }).eq("id", p.id);
    if (error) { setList((l) => l.map((x) => (x.id === p.id ? { ...x, role: p.role } : x))); alert("변경 실패: " + error.message); return; }
    showToast(`${p.email ?? "사용자"} → ${roleLabel(role)}`);
  }

  async function linkMember(p: Profile, memberId: string) {
    if (!memberId) return;
    const m = members.find((x) => x.id === memberId);
    // 연결되면 최소 '회원'. 명단에 '운영진 예정'이면 운영진으로.
    const newRole = m?.intended_role === "admin" ? "admin" : (p.role === "guest" ? "member" : p.role);
    setList((l) => l.map((x) => (x.id === p.id ? { ...x, member_id: memberId, role: newRole } : x)));
    const { error } = await supabase.from("profiles").update({ member_id: memberId, role: newRole }).eq("id", p.id);
    if (error) { setList((l) => l.map((x) => (x.id === p.id ? { ...x, member_id: p.member_id ?? null, role: p.role } : x))); alert("연결 실패: " + error.message); return; }
    showToast(`${memberName(memberId)} 님과 연결됨`);
  }

  async function unlink(p: Profile) {
    if (!confirm(`${memberName(p.member_id)} 연결을 해제할까요? (권한은 그대로 둠)`)) return;
    setList((l) => l.map((x) => (x.id === p.id ? { ...x, member_id: null } : x)));
    const { error } = await supabase.from("profiles").update({ member_id: null }).eq("id", p.id);
    if (error) { setList((l) => l.map((x) => (x.id === p.id ? { ...x, member_id: p.member_id } : x))); alert("해제 실패: " + error.message); return; }
    showToast("연결 해제됨");
  }

  const owner = list.filter((p) => p.is_owner);
  const connected = list.filter((p) => !p.is_owner && p.member_id);
  const unconnected = list.filter((p) => !p.is_owner && !p.member_id);

  return (
    <div className="moim-roles">
      <style>{CSS}</style>
      <div className="page-head"><div><h1 className="page-title">권한 설정</h1><p className="page-sub">로그인한 사람을 명단 회원과 연결하고 권한을 지정해요 · 미연결 {unconnected.length} · 연결됨 {connected.length}</p></div></div>

      <div className="info-card">
        <div className="info-row"><span className="badge b-owner">메인</span> 최고 관리자 · 영구 보호(여기서만 서브 관리자 지정 가능)</div>
        <div className="info-row"><span className="badge b-brand">운영진</span> 전체 앱 기능 사용 · 역할변경 불가</div>
        <div className="info-row"><span className="badge b-green">회원</span> 공지·아카이브 + <b>회원명단</b>(개인정보) 보기</div>
        <div className="info-row"><span className="badge b-gray">관심</span> 처음 로그인 기본값 · 공지·아카이브 보기(명단 제외)</div>
        <p className="info-note">※ 카카오로 로그인하면 ‘미연결’로 떠요. 명단의 회원과 연결하면 자동으로 ‘회원’ 권한이 돼요. 명단에 이메일이 입력돼 있고 같은 이메일로 로그인하면 자동 연결됩니다.</p>
      </div>

      {/* 미연결 로그인 */}
      <h2 className="sec-h">미연결 로그인 {unconnected.length > 0 && <span className="sec-n">{unconnected.length}</span>}</h2>
      <div className="card list-card">
        {unconnected.length === 0 ? (
          <div className="empty">연결할 새 로그인이 없어요.</div>
        ) : unconnected.map((p) => (
          <UnconnectedRow key={p.id} p={p} members={members} suggest={suggestFor(p)} onLink={linkMember} />
        ))}
      </div>

      {/* 연결됨 */}
      <h2 className="sec-h">연결됨 {connected.length + owner.length > 0 && <span className="sec-n">{connected.length + owner.length}</span>}</h2>
      <div className="card list-card">
        {[...owner, ...connected].length === 0 ? (
          <div className="empty">아직 연결된 사람이 없어요.</div>
        ) : [...owner, ...connected].map((p) => (
          <div key={p.id} className="role-row">
            <span className="r-av" style={{ background: avColor(p.is_owner ? p.email : memberName(p.member_id)) }}>{initial(p.is_owner ? p.email : memberName(p.member_id))}</span>
            <div className="r-who">
              <span className="r-email">{p.is_owner ? (p.email ?? "메인") : memberName(p.member_id)}{p.id === myId && <span className="r-me">나</span>}</span>
              <span className="r-cur">{p.email ?? "(이메일 없음)"} · <span className={`badge ${p.is_owner ? "b-owner" : roleTone(p.role)}`}>{p.is_owner ? "메인" : roleLabel(p.role)}</span></span>
            </div>
            {p.is_owner ? (
              <span className="r-lock">🔒 메인 관리자</span>
            ) : (
              <div className="row-acts">
                <div className="seg">
                  {ROLES.map((r) => <button key={r.v} className={`seg-btn ${p.role === r.v ? "on" : ""}`} onClick={() => setRole(p, r.v)}>{r.label}</button>)}
                </div>
                <button className="unlink" onClick={() => unlink(p)}>연결 해제</button>
              </div>
            )}
          </div>
        ))}
      </div>
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

function UnconnectedRow({ p, members, suggest, onLink }: { p: Profile; members: MemberOpt[]; suggest: MemberOpt | null; onLink: (p: Profile, memberId: string) => void }) {
  const [sel, setSel] = useState(suggest?.id ?? "");
  return (
    <div className="role-row">
      <span className="r-av" style={{ background: avColor(p.email) }}>{initial(p.email)}</span>
      <div className="r-who">
        <span className="r-email">{p.email ?? "(이메일 없음)"}</span>
        {suggest
          ? <span className="r-cur suggest">추천: <b>{suggest.name}</b> (이메일 일치)</span>
          : <span className="r-cur">명단 회원과 연결해 주세요</span>}
      </div>
      <div className="row-acts">
        {suggest && <button className="link-btn primary" onClick={() => onLink(p, suggest.id)}>{suggest.name} 연결</button>}
        <select className="sel" value={sel} onChange={(e) => setSel(e.target.value)}>
          <option value="">회원 선택…</option>
          {members.map((m) => <option key={m.id} value={m.id}>{m.name}{m.email ? ` · ${m.email}` : ""}</option>)}
        </select>
        <button className="link-btn" disabled={!sel} onClick={() => onLink(p, sel)}>연결</button>
      </div>
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
.moim-roles h1,.moim-roles h2,.moim-roles p{ margin:0; }
.moim-roles .card{ background:var(--bg); border:1px solid var(--line); border-radius:var(--radius-card); box-shadow:var(--shadow-sm); }
.moim-roles .page-head{ margin-bottom:16px; }
.moim-roles .page-title{ font-size:clamp(21px,5vw,26px); font-weight:800; letter-spacing:-0.04em; }
.moim-roles .page-sub{ color:var(--ink-3); font-size:14px; margin-top:5px; font-weight:500; }
.moim-roles .badge{ display:inline-flex; align-items:center; font-size:12px; font-weight:700; padding:3px 9px; border-radius:999px; }
.moim-roles .b-brand{ background:var(--brand-soft); color:var(--brand-strong); }
.moim-roles .b-green{ background:var(--green-soft); color:var(--green); }
.moim-roles .b-gray{ background:#eff0f2; color:#6b717c; }
.moim-roles .b-owner{ background:#fbf0d8; color:#9a6212; }
.moim-roles .info-card{ background:var(--brand-softer); border:1px solid #d6e6fa; border-radius:16px; padding:16px 18px; margin-bottom:18px; max-width:780px; }
.moim-roles .info-row{ display:flex; align-items:center; gap:8px; font-size:13.5px; color:var(--ink-2); font-weight:500; padding:3px 0; }
.moim-roles .info-note{ font-size:12px; color:var(--ink-3); margin-top:8px; font-weight:500; line-height:1.5; }
.moim-roles .sec-h{ font-size:15px; font-weight:800; letter-spacing:-0.02em; margin:18px 0 9px; display:flex; align-items:center; gap:8px; }
.moim-roles .sec-n{ font-size:12px; font-weight:800; color:var(--brand-strong); background:var(--brand-soft); padding:1px 9px; border-radius:999px; }
.moim-roles .list-card{ max-width:780px; overflow:hidden; }
.moim-roles .role-row{ display:flex; align-items:center; gap:13px; padding:14px 18px; border-bottom:1px solid var(--line); flex-wrap:wrap; }
.moim-roles .role-row:last-child{ border-bottom:0; }
.moim-roles .r-av{ width:38px; height:38px; border-radius:50%; display:grid; place-items:center; color:#fff; font-weight:700; flex-shrink:0; }
.moim-roles .r-who{ flex:1; min-width:170px; display:flex; flex-direction:column; gap:3px; }
.moim-roles .r-email{ font-weight:700; font-size:14.5px; display:flex; align-items:center; gap:7px; }
.moim-roles .r-me{ font-size:11px; font-weight:800; color:var(--brand-strong); background:var(--brand-soft); padding:1px 7px; border-radius:999px; }
.moim-roles .r-cur{ font-size:12.5px; color:var(--ink-3); font-weight:500; display:flex; align-items:center; gap:5px; }
.moim-roles .r-cur.suggest{ color:var(--green); }
.moim-roles .row-acts{ display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
.moim-roles .seg{ display:flex; background:var(--bg-warm); border:1px solid var(--line); border-radius:11px; padding:3px; gap:2px; }
.moim-roles .seg-btn{ font-size:13px; font-weight:700; color:var(--ink-3); padding:7px 14px; border-radius:8px; border:0; background:none; cursor:pointer; transition:all .14s; }
.moim-roles .seg-btn.on{ background:var(--brand); color:#fff; box-shadow:0 2px 6px rgba(0,102,204,.3); }
.moim-roles .sel{ font-family:inherit; font-size:13px; color:var(--ink); background:#fff; border:1px solid var(--line); border-radius:10px; padding:8px 10px; max-width:200px; outline:0; }
.moim-roles .link-btn{ font-size:13px; font-weight:700; color:var(--ink-2); background:#fff; border:1px solid var(--line); border-radius:10px; padding:8px 13px; cursor:pointer; }
.moim-roles .link-btn:hover{ background:#f7f8f9; }
.moim-roles .link-btn:disabled{ opacity:.5; cursor:default; }
.moim-roles .link-btn.primary{ background:var(--brand); color:#fff; border-color:var(--brand); }
.moim-roles .unlink{ font-size:12.5px; font-weight:700; color:#b23b30; background:none; border:0; cursor:pointer; padding:6px 4px; }
.moim-roles .unlink:hover{ text-decoration:underline; }
.moim-roles .r-lock{ font-size:13px; font-weight:700; color:#9a6212; background:#fbf0d8; padding:7px 14px; border-radius:11px; white-space:nowrap; }
.moim-roles .empty{ padding:34px; text-align:center; color:var(--ink-3); font-size:14px; font-weight:500; }
.moim-roles .toast{ position:fixed; bottom:26px; left:50%; transform:translateX(-50%); z-index:80; background:var(--ink); color:#fff; font-size:13.5px; font-weight:600; padding:12px 20px; border-radius:999px; box-shadow:0 10px 30px rgba(0,0,0,.25); }
`;
