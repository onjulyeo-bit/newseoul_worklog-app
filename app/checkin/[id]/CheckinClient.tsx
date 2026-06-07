"use client";

// 회원이 QR로 들어와 본인 이름을 눌러 출석하는 화면 (로그인 불필요).
// 클로드디자인 '모임온 앱' 체크인 시안 이식 — 실제 보안 RPC(checkin_roster/info, check_in/out) 보존.
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Row = { member_id: string; name: string; present: boolean };
type Meal = { mode: string; fee: number | null; account: string | null; pay_link: string | null };

const AV_COLORS = ["#0066cc", "#16a34a", "#7c5cff", "#e8643c", "#0d9488", "#d4a017"];
function Avatar({ name, size = 38 }: { name: string; size?: number }) {
  const ch = name.trim().charAt(0) || "?";
  const color = AV_COLORS[(name.charCodeAt(0) || 0) % AV_COLORS.length];
  return <span className="ck-av" style={{ width: size, height: size, background: color, fontSize: size * 0.42 }}>{ch}</span>;
}

export default function CheckinClient({ meetingId, token }: { meetingId: string; token: string }) {
  const supabase = createClient();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [err, setErr] = useState(false);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [meal, setMeal] = useState<Meal | null>(null);
  const [modal, setModal] = useState<Row | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data, error } = await supabase.rpc("checkin_roster", { p_meeting: meetingId, p_token: token });
      if (!alive) return;
      if (error || !data) { setErr(true); return; }
      setRows(data as Row[]);
      const info = await supabase.rpc("checkin_info", { p_meeting: meetingId, p_token: token });
      if (alive && info.data) setMeal((info.data[0] as Meal) ?? null);
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const offline = meal?.mode === "offline";
  const hasFee = offline && meal?.fee != null;

  async function copyAcct() {
    if (!meal?.account) return;
    try { await navigator.clipboard.writeText(meal.account); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch {}
  }

  async function undo(r: Row) {
    if (busy) return;
    if (!confirm(`${r.name}님 출석을 취소할까요?`)) return;
    setBusy(r.member_id);
    const { error } = await supabase.rpc("check_out", { p_meeting: meetingId, p_member: r.member_id, p_token: token });
    setBusy(null);
    if (error) { alert("취소 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요."); return; }
    setRows((prev) => prev?.map((x) => (x.member_id === r.member_id ? { ...x, present: false } : x)) ?? null);
  }

  async function checkIn(r: Row) {
    if (r.present || busy) return;
    setBusy(r.member_id);
    const { error } = await supabase.rpc("check_in", { p_meeting: meetingId, p_member: r.member_id, p_token: token });
    setBusy(null);
    if (error) { alert("출석 처리 중 문제가 생겼어요. 잠시 후 다시 눌러 주세요."); return; }
    setRows((prev) => prev?.map((x) => (x.member_id === r.member_id ? { ...x, present: true } : x)) ?? null);
    setModal({ ...r, present: true });
  }

  const filtered = useMemo(() => {
    if (!rows) return [];
    const k = q.trim();
    return k ? rows.filter((r) => r.name.includes(k)) : rows;
  }, [rows, q]);

  const doneCount = rows?.filter((r) => r.present).length ?? 0;

  return (
    <div className="moim-ck">
      <style>{CK_CSS}</style>
      <div className="ck-phone">
        <div className="ck-head">
          <div className="ck-brand"><span className="brand-badge">ON</span><span className="brand-name">새서울 <span className="brand-on">CBMC</span></span></div>
          {meal && (
            <div className="ck-meet">
              <span className={`badge ${offline ? "b-brand" : "b-blue"}`}><span className="badge-dot" />{offline ? "오프라인" : meal.mode === "online" ? "온라인" : "모임"}</span>
            </div>
          )}
          <h1 className="ck-title">본인을 찾아<br />체크인하세요</h1>
          <p className="ck-sub">
            {hasFee ? <>이번 회차 식대는 <strong>{meal!.fee!.toLocaleString("ko-KR")}원</strong> 입니다.</>
              : meal?.mode === "online" ? "이번 회차는 온라인이라 식대가 없습니다."
              : "아래에서 본인 이름을 한 번 눌러 주세요."}
          </p>
        </div>

        {err ? (
          <div className="ck-err">링크가 올바르지 않거나 만료되었어요.<br />안내받은 QR·링크로 다시 들어와 주세요. 🙏</div>
        ) : rows === null ? (
          <div className="ck-loading">명단을 불러오는 중…</div>
        ) : (
          <>
            <div className="ck-search">
              <SearchIcon />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="이름 검색" />
              {q && <button onClick={() => setQ("")} aria-label="지우기"><XIcon /></button>}
            </div>

            {doneCount > 0 && <div className="ck-progress"><CheckIcon /> {doneCount}명 체크인 완료</div>}

            <div className="ck-grid">
              {filtered.map((r) => {
                const on = r.present;
                return (
                  <div key={r.member_id} className={`ck-item ${on ? "done" : ""}`}>
                    <button className="ck-name-btn" onClick={() => on ? (hasFee && setModal(r)) : checkIn(r)} disabled={busy === r.member_id}>
                      <Avatar name={r.name} size={38} />
                      <span className="ck-name">{r.name}</span>
                      {busy === r.member_id ? <span className="ck-chev-t">처리 중…</span>
                        : on ? <span className="ck-tag"><CheckIcon /> 참석</span>
                        : <span className="ck-chev"><ChevIcon /></span>}
                    </button>
                    {on && <button className="ck-cancel" onClick={() => undo(r)} disabled={busy === r.member_id}>취소</button>}
                  </div>
                );
              })}
              {filtered.length === 0 && <div className="ck-empty">‘{q}’ 와 일치하는 이름이 없어요.</div>}
            </div>
            <div className="ck-foot">출석 체크는 한 번이면 됩니다 · 새서울 CBMC</div>
          </>
        )}
      </div>

      {/* 체크인 직후 안내 모달 */}
      {modal && (
        <div className="ck-modal-root" onClick={() => setModal(null)}>
          <div className="ck-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ck-modal-ic"><CheckIcon size={34} /></div>
            <h2 className="ck-modal-t">체크인 완료!</h2>
            <p className="ck-modal-name">{modal.name} 님, 반갑습니다</p>
            {hasFee ? (
              <div className="ck-fee">
                <div className="ck-fee-row"><span>식대</span><strong>{meal!.fee!.toLocaleString("ko-KR")}원</strong></div>
                {meal?.account && (
                  <div className="ck-fee-acct">
                    <div><div className="ck-fee-lbl">입금 계좌</div><div className="ck-fee-num">{meal.account}</div></div>
                    <button className="ck-copy" onClick={copyAcct}><CopyIcon /> {copied ? "복사됨" : "복사"}</button>
                  </div>
                )}
                {meal?.pay_link && <a className="ck-paylink" href={meal.pay_link} target="_blank" rel="noreferrer">💸 간편 송금</a>}
              </div>
            ) : (
              <div className="ck-nofee">🎉 이번 회차는 식대가 없습니다</div>
            )}
            <button className="ck-modal-ok" onClick={() => setModal(null)}>확인</button>
          </div>
        </div>
      )}
    </div>
  );
}

// 인라인 아이콘 (lucide와 동일 형태, 의존성 없이)
const SearchIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>;
const XIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>;
const ChevIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>;
const CheckIcon = ({ size = 15 }: { size?: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>;
const CopyIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>;

const CK_CSS = `
.moim-ck{
  --brand:#0066cc; --brand-strong:#0052a8; --brand-soft:#e8f1fc; --brand-softer:#f3f8fe;
  --ink:#16181d; --ink-2:#3d424d; --ink-3:#767d8a; --line:#ecedf0; --bg:#ffffff; --bg-warm:#fafafb;
  --green:#0a7d3f; --green-soft:#e4f6ec;
  width:100vw; position:relative; left:50%; right:50%; margin-left:-50vw; margin-right:-50vw; margin-top:-24px; margin-bottom:-80px;
  min-height:100vh; background:var(--bg-warm); color:var(--ink); line-height:1.5; letter-spacing:-0.01em;
  display:flex; flex-direction:column; align-items:center; font-family:inherit;
}
.moim-ck *{ box-sizing:border-box; }
.moim-ck .ck-av{ display:inline-grid; place-items:center; border-radius:50%; color:#fff; font-weight:700; flex-shrink:0; }
.moim-ck .badge{ display:inline-flex; align-items:center; gap:5px; font-size:12px; font-weight:700; padding:4px 10px; border-radius:999px; }
.moim-ck .badge-dot{ width:6px; height:6px; border-radius:50%; background:currentColor; }
.moim-ck .b-brand{ background:var(--brand-soft); color:var(--brand-strong); }
.moim-ck .b-blue{ background:#eaf2fd; color:#0b62c4; }

.moim-ck .ck-phone{ width:100%; max-width:460px; background:#fff; display:flex; flex-direction:column; min-height:100vh; }
.moim-ck .ck-head{ padding:18px 22px 18px; }
.moim-ck .ck-brand{ display:inline-flex; align-items:center; gap:8px; font-weight:800; font-size:17px; letter-spacing:-0.03em; margin-bottom:18px; }
.moim-ck .brand-badge{ width:26px; height:26px; border-radius:9px; display:grid; place-items:center; background:var(--brand); color:#fff; font-size:12px; font-weight:800; box-shadow:0 3px 9px rgba(0,102,204,.32); }
.moim-ck .brand-on{ color:var(--brand); }
.moim-ck .ck-meet{ display:flex; align-items:center; gap:9px; flex-wrap:wrap; margin-bottom:14px; }
.moim-ck .ck-title{ font-size:28px; font-weight:800; letter-spacing:-0.04em; line-height:1.25; margin:0; }
.moim-ck .ck-sub{ font-size:14.5px; color:var(--ink-3); font-weight:500; margin:11px 0 0; line-height:1.5; }
.moim-ck .ck-sub strong{ color:var(--brand-strong); font-weight:800; }

.moim-ck .ck-search{ margin:0 22px 14px; display:flex; align-items:center; gap:9px; background:var(--bg-warm); border:1px solid var(--line); border-radius:14px; padding:13px 15px; color:var(--ink-3); }
.moim-ck .ck-search input{ border:0; outline:0; background:none; font-family:inherit; font-size:16px; color:var(--ink); flex:1; min-width:0; }
.moim-ck .ck-search input::placeholder{ color:var(--ink-3); }
.moim-ck .ck-search button{ color:var(--ink-3); display:grid; place-items:center; background:none; border:0; cursor:pointer; }
.moim-ck .ck-progress{ margin:0 22px 14px; width:fit-content; display:flex; align-items:center; gap:6px; background:var(--green-soft); color:var(--green); font-size:13px; font-weight:700; padding:8px 14px; border-radius:999px; }

.moim-ck .ck-grid{ display:flex; flex-direction:column; gap:10px; padding:0 22px 8px; }
.moim-ck .ck-item{ display:flex; align-items:stretch; gap:8px; }
.moim-ck .ck-name-btn{ flex:1; display:flex; align-items:center; gap:12px; background:#fff; border:1.5px solid var(--line); border-radius:16px; padding:12px 16px; min-height:64px; text-align:left; cursor:pointer; transition:background .14s, border-color .14s, transform .1s; }
.moim-ck .ck-name-btn:not(:disabled):hover{ border-color:#bcd6f5; background:var(--brand-softer); }
.moim-ck .ck-name-btn:not(:disabled):active{ transform:scale(.99); }
.moim-ck .ck-name{ flex:1; font-size:17px; font-weight:700; letter-spacing:-0.02em; }
.moim-ck .ck-chev{ color:#c2c7cf; display:flex; }
.moim-ck .ck-chev-t{ font-size:13px; font-weight:600; color:var(--ink-3); }
.moim-ck .ck-tag{ display:inline-flex; align-items:center; gap:4px; font-size:14.5px; font-weight:800; color:var(--green); }
.moim-ck .ck-item.done .ck-name-btn{ background:var(--green-soft); border-color:#bfe6cd; }
.moim-ck .ck-cancel{ background:#fff; border:1.5px solid var(--line); border-radius:14px; padding:0 17px; font-size:13.5px; font-weight:700; color:var(--ink-3); flex-shrink:0; cursor:pointer; transition:color .14s, border-color .14s; }
.moim-ck .ck-cancel:hover{ color:#c8392c; border-color:#f0c5c0; }
.moim-ck .ck-empty{ padding:32px; text-align:center; color:var(--ink-3); font-size:15px; font-weight:500; }
.moim-ck .ck-err{ margin:22px; padding:36px 20px; text-align:center; color:var(--ink-3); font-size:15px; font-weight:500; line-height:1.6; background:var(--bg-warm); border:1px solid var(--line); border-radius:16px; }
.moim-ck .ck-loading{ padding:48px; text-align:center; color:var(--ink-3); font-size:15px; }
.moim-ck .ck-foot{ text-align:center; font-size:12px; color:var(--ink-3); padding:20px 22px 40px; font-weight:500; }

.moim-ck .ck-modal-root{ position:fixed; inset:0; z-index:70; background:rgba(20,24,34,.5); backdrop-filter:blur(3px); display:flex; align-items:center; justify-content:center; padding:24px; }
.moim-ck .ck-modal{ background:#fff; border-radius:26px; padding:32px 26px 26px; max-width:360px; width:100%; text-align:center; box-shadow:0 30px 70px rgba(0,0,0,.3); animation:ck-pop .26s cubic-bezier(.2,.8,.2,1); }
@keyframes ck-pop{ from{transform:scale(.9);opacity:.5} to{transform:none;opacity:1} }
.moim-ck .ck-modal-ic{ width:72px; height:72px; border-radius:50%; background:var(--green); color:#fff; display:grid; place-items:center; margin:0 auto 16px; box-shadow:0 8px 22px rgba(10,125,63,.35); }
.moim-ck .ck-modal-t{ font-size:23px; font-weight:800; letter-spacing:-0.03em; margin:0; }
.moim-ck .ck-modal-name{ font-size:15px; color:var(--ink-3); font-weight:600; margin:6px 0 0; }
.moim-ck .ck-fee{ margin-top:18px; background:var(--bg-warm); border:1px solid var(--line); border-radius:16px; padding:16px; text-align:left; }
.moim-ck .ck-fee-row{ display:flex; align-items:center; justify-content:space-between; padding-bottom:13px; margin-bottom:13px; border-bottom:1px solid var(--line); }
.moim-ck .ck-fee-row span{ font-size:14px; color:var(--ink-2); font-weight:600; }
.moim-ck .ck-fee-row strong{ font-size:20px; font-weight:800; color:var(--brand-strong); letter-spacing:-0.03em; }
.moim-ck .ck-fee-acct{ display:flex; align-items:center; justify-content:space-between; gap:10px; }
.moim-ck .ck-fee-lbl{ font-size:12px; color:var(--ink-3); font-weight:600; }
.moim-ck .ck-fee-num{ font-size:13.5px; font-weight:700; margin-top:3px; word-break:break-all; }
.moim-ck .ck-copy{ display:inline-flex; align-items:center; gap:5px; background:var(--brand); color:#fff; font-size:13px; font-weight:700; padding:10px 14px; border-radius:11px; flex-shrink:0; border:0; cursor:pointer; }
.moim-ck .ck-copy:hover{ background:var(--brand-strong); }
.moim-ck .ck-paylink{ display:flex; align-items:center; justify-content:center; margin-top:10px; background:#0064FF; color:#fff; font-size:15px; font-weight:700; padding:13px; border-radius:12px; text-decoration:none; }
.moim-ck .ck-nofee{ margin-top:18px; display:flex; align-items:center; justify-content:center; gap:8px; background:#eaf2fd; color:#0b62c4; font-size:14.5px; font-weight:700; padding:15px; border-radius:14px; }
.moim-ck .ck-modal-ok{ width:100%; margin-top:18px; padding:15px; background:var(--brand); color:#fff; font-size:16px; font-weight:700; border:0; border-radius:14px; cursor:pointer; }
.moim-ck .ck-modal-ok:hover{ background:var(--brand-strong); }

@media (min-width:760px){
  .moim-ck .ck-phone{ border:1px solid var(--line); border-radius:28px; box-shadow:var(--shadow-md,0 14px 38px rgba(20,40,80,.08)); margin:18px auto 34px; overflow:hidden; min-height:auto; }
}
`;
