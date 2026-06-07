"use client";

// 출석·식대 보드 ⑥ — 클로드디자인 시안 + 기존 실기능(식대 납부 체크·미납 독촉 문구) 유지.
// 추가: 미납자별 [문자] 버튼(폰 문자앱에 안내문 프리필). 실제 RPC/액션 보존.
import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/client";
import { saveAttendance } from "./actions";

export type Meeting = {
  id: string; date: string; session_no: number | null; mode: string;
  title: string | null; program: string | null; fee: number | null; account_info: string | null;
  checkin_token: string | null;
};
export type Member = { id: string; name: string; grade: string | null; status: string | null; phone: string | null };
export type Att = { member_id: string; present: boolean; paid: boolean };

const DAYS = ["일", "월", "화", "수", "목", "금", "토"];
const fmtDate = (d: string) => { if (!d) return ""; const t = new Date(d + "T00:00"); return `${t.getMonth() + 1}월 ${t.getDate()}일(${DAYS[t.getDay()]})`; };
const tabDate = (d: string) => { const t = new Date(d + "T00:00"); return { md: `${t.getMonth() + 1}.${t.getDate()}`, day: DAYS[t.getDay()] }; };
const AV_COLORS = ["#0066cc", "#16a34a", "#7c5cff", "#e8643c", "#0d9488", "#d4a017"];
function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const ch = name.trim().charAt(0) || "?";
  const color = AV_COLORS[(name.charCodeAt(0) || 0) % AV_COLORS.length];
  return <span className="att-av" style={{ width: size, height: size, background: color, fontSize: size * 0.42 }}>{ch}</span>;
}

export default function AttendanceBoard({ meetings, members, selectedId, attendance }: {
  meetings: Meeting[]; members: Member[]; selectedId: string | null; attendance: Att[];
}) {
  const router = useRouter();
  const meeting = meetings.find((m) => m.id === selectedId) ?? null;
  const isOnline = meeting?.mode === "online";
  const fee = isOnline ? 0 : (meeting?.fee ?? 0);

  const init: Record<string, { present: boolean; paid: boolean }> = {};
  attendance.forEach((a) => { init[a.member_id] = { present: a.present, paid: a.paid }; });
  const [att, setAtt] = useState(init);
  const [, startTransition] = useTransition();
  const get = (id: string) => att[id] ?? { present: false, paid: false };
  const [q, setQ] = useState("");
  const [toast, setToast] = useState("");
  const showToast = (t: string) => { setToast(t); setTimeout(() => setToast(""), 2000); };

  const [supabase] = useState(() => createClient());

  // 회차 탭 자동 스크롤
  const tabsRef = useRef<HTMLDivElement>(null);
  useEffect(() => { tabsRef.current?.querySelector(".active")?.scrollIntoView({ inline: "center", block: "nearest" }); }, [selectedId]);

  // QR 자가 체크인
  const [qr, setQr] = useState("");
  const checkinLink = meeting?.checkin_token && typeof window !== "undefined" ? `${window.location.origin}/checkin/${meeting.id}?t=${meeting.checkin_token}` : "";
  useEffect(() => { if (checkinLink) QRCode.toDataURL(checkinLink, { width: 240, margin: 1 }).then(setQr).catch(() => setQr("")); else setQr(""); }, [checkinLink]);

  // 식대 입금 설정 (지회 단위 → QR 체크인 안내 팝업에 사용)
  const [mealFee, setMealFee] = useState("");
  const [mealAccount, setMealAccount] = useState("");
  const [mealLink, setMealLink] = useState("");
  useEffect(() => {
    supabase.rpc("get_meal_settings").then(({ data }: { data: { meal_fee: number | null; meal_account: string | null; pay_link: string | null }[] | null }) => {
      const s = data?.[0]; if (!s) return;
      setMealFee(s.meal_fee != null ? String(s.meal_fee) : ""); setMealAccount(s.meal_account ?? ""); setMealLink(s.pay_link ?? "");
    });
  }, [supabase]);
  async function saveMeal() {
    const { error } = await supabase.rpc("set_meal_settings", { p_fee: mealFee ? Number(mealFee) : null, p_account: mealAccount || null, p_link: mealLink || null });
    if (error) { showToast("저장 실패: " + error.message); return; }
    showToast("식대 설정을 저장했어요");
  }

  function setPresent(id: string, val: boolean) {
    if (!selectedId) return;
    setAtt((prev) => {
      const cur = prev[id] ?? { present: false, paid: false };
      if (cur.present === val) return prev;
      const next = { present: val, paid: val ? cur.paid : false };
      startTransition(() => { saveAttendance(selectedId, id, next.present, next.paid); });
      return { ...prev, [id]: next };
    });
  }
  function setPaid(id: string, val: boolean) {
    if (!selectedId) return;
    setAtt((prev) => {
      const cur = prev[id] ?? { present: false, paid: false };
      const next = { present: cur.present, paid: val };
      startTransition(() => { saveAttendance(selectedId, id, next.present, next.paid); });
      return { ...prev, [id]: next };
    });
  }
  function allPresent() {
    if (!selectedId) return;
    members.forEach((m) => { if (!get(m.id).present) setPresent(m.id, true); });
  }

  const present = members.filter((m) => get(m.id).present);
  const paid = present.filter((m) => get(m.id).paid);
  const unpaid = present.filter((m) => !get(m.id).paid);
  const totalAmount = paid.length * fee;
  const shown = members.filter((m) => !q || m.name.includes(q));

  const account = meeting?.account_info || mealAccount || "";
  function smsHref(m: Member) {
    const num = (m.phone || "").replace(/[^0-9]/g, "");
    if (!num) return "";
    const feeStr = fee ? fee.toLocaleString("ko-KR") + "원" : "";
    let body = `[새서울 CBMC] ${m.name}님, ${meeting?.session_no != null ? meeting.session_no + "회 " : ""}${meeting ? fmtDate(meeting.date) : ""} 모임 식대${feeStr ? " " + feeStr : ""} 입금 부탁드립니다.`;
    if (account) body += `\n💳 ${account}`;
    return `sms:${num}?&body=${encodeURIComponent(body)}`;
  }

  const reminderText = (() => {
    if (!meeting) return "";
    if (unpaid.length === 0) return present.length === 0 ? "출석을 체크하면 미납자 문구가 자동으로 만들어집니다." : "🎉 출석하신 모든 분이 식대를 납부하셨습니다!";
    const feeStr = fee ? fee.toLocaleString("ko-KR") + "원" : "";
    let t = "🙏 [새서울 CBMC] 식대 납부 안내\n\n";
    t += `${meeting.session_no != null ? meeting.session_no + "회 " : ""}${fmtDate(meeting.date)} 모임에 함께해 주셔서 감사합니다.\n`;
    t += `아직 식대${feeStr ? " " + feeStr : ""} 입금이 확인되지 않은 분들께 안내드립니다.\n\n`;
    t += `▫️ ${unpaid.map((m) => m.name).join(", ")}\n\n`;
    if (account) t += `💳 입금: ${account}\n`;
    t += "확인 후 다시 안내드리겠습니다. 감사합니다 🤍";
    return t;
  })();
  const copyReminder = async () => { try { await navigator.clipboard.writeText(reminderText); showToast("독촉 문구를 복사했어요"); } catch {} };
  const copyText = async (t: string, msg: string) => { try { await navigator.clipboard.writeText(t); showToast(msg); } catch {} };

  return (
    <div className="moim-att">
      <style>{ATT_CSS}</style>

      <div className="page-head">
        <div><h1 className="page-title">출석·식대</h1><p className="page-sub">회차를 골라 출석을 체크하고 식대를 안내하세요.</p></div>
        <Link href="/attendance/stats" className="ui-btn ui-ghost ui-sm">📊 출석 통계</Link>
      </div>

      {meetings.length === 0 ? (
        <div className="card empty-card">아직 모임(회차)이 없어요. <Link href="/schedule" className="lnk">연간 일정</Link>에서 일정을 만들어 저장해 주세요.</div>
      ) : (
        <>
          {/* 회차 선택 탭 */}
          <div className="sess-tabs" ref={tabsRef}>
            {meetings.map((m) => {
              const t = tabDate(m.date);
              return (
                <button key={m.id} className={`sess-tab ${m.id === selectedId ? "active" : ""}`} onClick={() => router.push(`/attendance?meeting=${m.id}`)}>
                  <span className="sess-date">{t.md} <span className="sess-day">({t.day})</span></span>
                  <span className="sess-meta">{m.session_no != null ? `${m.session_no}회` : "—"}{m.program ? ` · ${m.program}` : m.title ? ` · ${m.title}` : ""}</span>
                  <span className={`badge ${m.mode === "offline" ? "b-brand" : "b-blue"}`}>{m.mode === "offline" ? "오프라인" : "온라인"}</span>
                </button>
              );
            })}
          </div>

          {meeting && (
            <div className="att-grid">
              {/* 좌측: QR + 식대 설정 */}
              <div className="att-side">
                <div className="card qr-card">
                  <div className="sec-row"><h2 className="sec-title">QR 자가 체크인</h2></div>
                  <div className="qr-wrap">{qr ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={qr} alt="체크인 QR" width={196} height={196} />
                  ) : <div className="qr-skel">QR 준비 중…</div>}</div>
                  <p className="qr-cap">회원이 폰으로 스캔하면<br />명단에서 본인을 찾아 출석합니다.</p>
                  {checkinLink && (
                    <div className="qr-link"><span className="qr-url">{checkinLink}</span>
                      <button className="copy-btn" onClick={() => copyText(checkinLink, "링크를 복사했어요")} aria-label="링크 복사">⧉</button>
                    </div>
                  )}
                </div>

                {isOnline ? (
                  <div className="card online-note"><div className="online-ic">💻</div><div><div className="online-t">온라인 회차</div><div className="online-s">이 회차는 식대가 없습니다.</div></div></div>
                ) : (
                  <div className="card fee-card">
                    <div className="sec-row"><h2 className="sec-title">식대 입금 설정</h2></div>
                    <label className="att-fld"><span className="att-flabel">식대 금액</span>
                      <div className="fee-input"><span className="won-mark">₩</span><input className="inp" inputMode="numeric" value={mealFee} onChange={(e) => setMealFee(e.target.value.replace(/[^0-9]/g, ""))} placeholder="13000" /><span className="per">/ 1인</span></div>
                    </label>
                    <label className="att-fld"><span className="att-flabel">입금 계좌 (모임 통장)</span>
                      <input className="inp" value={mealAccount} onChange={(e) => setMealAccount(e.target.value)} placeholder="카카오뱅크 3333-00-000000 새서울CBMC" />
                    </label>
                    <label className="att-fld"><span className="att-flabel">송금 링크 (선택)</span>
                      <input className="inp" value={mealLink} onChange={(e) => setMealLink(e.target.value)} placeholder="토스/카카오 송금링크" />
                    </label>
                    <div className="fee-actions"><button className="ui-btn ui-primary ui-sm" onClick={saveMeal}>저장</button><span className="fee-hint">QR 출석 시 이 정보로 안내가 떠요</span></div>
                  </div>
                )}
              </div>

              {/* 우측: 출석 명단 */}
              <div className="att-main">
                <div className="card roster-card">
                  <div className="roster-head">
                    <div className="roster-stats">
                      <span className="rs rs-on"><b>{present.length}</b> 참석</span>
                      <span className="rs rs-off"><b>{members.length - present.length}</b> 결석</span>
                      {!isOnline && <span className="rs rs-paid"><b>{paid.length}</b> 납부</span>}
                      <span className="rs rs-total">총 {members.length}명</span>
                    </div>
                    <button className="ui-btn ui-ghost ui-sm" onClick={allPresent}>전체 참석</button>
                  </div>
                  <div className="roster-search">🔍<input value={q} onChange={(e) => setQ(e.target.value)} placeholder="이름 검색" /></div>
                  <ul className="roster-list">
                    {shown.map((m) => {
                      const s = get(m.id);
                      return (
                        <li key={m.id} className="att-row">
                          <Avatar name={m.name} size={36} />
                          <div className="att-who"><span className="att-name">{m.name}</span><span className="att-grade">{m.grade || ""}</span></div>
                          {!isOnline && s.present && (
                            <button className={`paid-chip ${s.paid ? "on" : ""}`} onClick={() => setPaid(m.id, !s.paid)}>{s.paid ? "납부✓" : "미납"}</button>
                          )}
                          <div className="seg">
                            <button className={`seg-btn ${s.present ? "on" : ""}`} onClick={() => setPresent(m.id, true)}>참석</button>
                            <button className={`seg-btn ${!s.present ? "off" : ""}`} onClick={() => setPresent(m.id, false)}>결석</button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* 식대 정산 — 미납자 문자 + 독촉 문구 (오프라인) */}
          {meeting && !isOnline && (
            <div className="settle">
              <div className="card settle-card">
                <div className="sec-row"><h2 className="sec-title">미납자 안내</h2><span className="settle-sum">수금 {totalAmount.toLocaleString("ko-KR")}원 · 미납 {unpaid.length}명</span></div>
                {unpaid.length === 0 ? (
                  <p className="settle-empty">{present.length === 0 ? "출석을 체크하면 미납자가 표시돼요." : "🎉 참석자 전원 납부 완료!"}</p>
                ) : (
                  <ul className="unpaid-list">
                    {unpaid.map((m) => {
                      const href = smsHref(m);
                      return (
                        <li key={m.id} className="unpaid-row">
                          <Avatar name={m.name} size={30} /><span className="unpaid-name">{m.name}</span>
                          {href ? <a className="sms-btn" href={href}>📩 문자</a> : <span className="sms-none">번호 없음</span>}
                          <button className="paid-chip" onClick={() => setPaid(m.id, true)}>납부 처리</button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <div className="card remind-card">
                <div className="sec-row"><h2 className="sec-title">미납 독촉 문구</h2><button className="ui-btn ui-primary ui-sm" onClick={copyReminder}>📋 전체 복사</button></div>
                <pre className="remind-box">{reminderText}</pre>
                <p className="remind-hint">단톡방에 붙여넣거나, 위 [📩 문자]로 개별 발송하세요.</p>
              </div>
            </div>
          )}
        </>
      )}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

const ATT_CSS = `
.moim-att{
  --brand:#0066cc; --brand-strong:#0052a8; --brand-soft:#e8f1fc; --brand-softer:#f3f8fe;
  --ink:#16181d; --ink-2:#3d424d; --ink-3:#767d8a; --line:#ecedf0; --bg:#ffffff; --bg-warm:#fafafb;
  --green:#0a7d3f; --green-soft:#e4f6ec; --navy:#1a2238;
  --radius-btn:14px; --radius-card:20px;
  --shadow-sm:0 1px 2px rgba(20,24,34,.04), 0 3px 12px rgba(20,24,34,.045);
  --shadow-md:0 2px 6px rgba(20,24,34,.05), 0 14px 38px rgba(20,40,80,.08);
  color:var(--ink); line-height:1.5; letter-spacing:-0.01em;
}
.moim-att *{ box-sizing:border-box; }
.moim-att h1,.moim-att h2,.moim-att p,.moim-att ul,.moim-att pre{ margin:0; padding:0; }
.moim-att ul{ list-style:none; }
.moim-att .att-av{ display:inline-grid; place-items:center; border-radius:50%; color:#fff; font-weight:700; flex-shrink:0; }
.moim-att .card{ background:var(--bg); border:1px solid var(--line); border-radius:var(--radius-card); box-shadow:var(--shadow-sm); }
.moim-att .lnk{ color:var(--brand); font-weight:700; text-decoration:none; }
.moim-att .badge{ display:inline-flex; align-items:center; gap:5px; font-size:11.5px; font-weight:700; padding:4px 9px; border-radius:999px; white-space:nowrap; }
.moim-att .b-brand{ background:var(--brand-soft); color:var(--brand-strong); }
.moim-att .b-blue{ background:#eaf2fd; color:#0b62c4; }
.moim-att .ui-btn{ display:inline-flex; align-items:center; justify-content:center; gap:6px; font-weight:600; letter-spacing:-0.02em; border-radius:var(--radius-btn); border:0; cursor:pointer; text-decoration:none; transition:background .15s, box-shadow .15s, transform .12s; white-space:nowrap; }
.moim-att .ui-btn:active{ transform:translateY(1px) scale(.99); }
.moim-att .ui-sm{ font-size:13px; padding:8px 13px; }
.moim-att .ui-primary{ background:var(--brand); color:#fff; box-shadow:0 5px 14px rgba(0,102,204,.22); }
.moim-att .ui-ghost{ background:#fff; color:var(--ink-2); border:1px solid var(--line); }
.moim-att .ui-ghost:hover{ background:#f7f8f9; }
.moim-att .sec-row{ display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:12px; }
.moim-att .sec-title{ font-size:16px; font-weight:800; letter-spacing:-0.03em; }
.moim-att .inp{ font-family:inherit; font-size:14.5px; color:var(--ink); background:#fff; border:1px solid var(--line); border-radius:11px; padding:10px 12px; outline:0; width:100%; transition:border-color .15s, box-shadow .15s; }
.moim-att .inp:focus{ border-color:var(--brand); box-shadow:0 0 0 3px var(--brand-soft); }

.moim-att .page-head{ display:flex; align-items:flex-end; justify-content:space-between; gap:14px; margin-bottom:18px; flex-wrap:wrap; }
.moim-att .page-title{ font-size:clamp(21px,5vw,26px); font-weight:800; letter-spacing:-0.04em; }
.moim-att .page-sub{ color:var(--ink-3); font-size:14px; margin-top:5px; font-weight:500; }
.moim-att .empty-card{ padding:40px 20px; text-align:center; color:var(--ink-3); font-size:15px; }

.moim-att .sess-tabs{ display:flex; gap:10px; overflow-x:auto; padding-bottom:6px; margin-bottom:18px; scrollbar-width:none; }
.moim-att .sess-tabs::-webkit-scrollbar{ display:none; }
.moim-att .sess-tab{ flex-shrink:0; display:flex; flex-direction:column; align-items:flex-start; gap:5px; background:#fff; border:1px solid var(--line); border-radius:16px; padding:12px 15px; min-width:128px; box-shadow:var(--shadow-sm); cursor:pointer; transition:border-color .15s; text-align:left; }
.moim-att .sess-tab:hover{ border-color:#cdd9e8; }
.moim-att .sess-tab.active{ border-color:var(--brand); box-shadow:0 0 0 2px var(--brand-soft), var(--shadow-sm); }
.moim-att .sess-date{ font-size:15px; font-weight:800; letter-spacing:-0.03em; }
.moim-att .sess-day{ color:var(--ink-3); font-weight:600; font-size:13px; }
.moim-att .sess-meta{ font-size:12px; color:var(--ink-3); font-weight:600; }

.moim-att .att-grid{ display:flex; flex-direction:column; gap:16px; }
.moim-att .att-side{ display:flex; flex-direction:column; gap:16px; }
.moim-att .qr-card{ padding:18px; }
.moim-att .qr-wrap{ display:grid; place-items:center; padding:4px 0 12px; }
.moim-att .qr-wrap img{ border:1px solid var(--line); border-radius:14px; padding:10px; background:#fff; }
.moim-att .qr-skel{ width:196px; height:196px; display:grid; place-items:center; color:var(--ink-3); font-size:13px; border:1px solid var(--line); border-radius:14px; }
.moim-att .qr-cap{ text-align:center; font-size:13px; color:var(--ink-3); font-weight:500; line-height:1.5; margin-bottom:12px; }
.moim-att .qr-link{ display:flex; align-items:center; gap:8px; background:var(--bg-warm); border:1px solid var(--line); border-radius:11px; padding:8px 8px 8px 12px; }
.moim-att .qr-url{ flex:1; font-size:12px; color:var(--ink-2); font-weight:600; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.moim-att .copy-btn{ width:30px; height:30px; border-radius:8px; display:grid; place-items:center; color:var(--ink-3); background:#fff; border:1px solid var(--line); flex-shrink:0; cursor:pointer; font-size:14px; }
.moim-att .copy-btn:hover{ color:var(--brand); border-color:#bcd6f5; }
.moim-att .fee-card{ padding:18px; }
.moim-att .att-fld{ display:flex; flex-direction:column; gap:6px; margin-bottom:12px; }
.moim-att .att-flabel{ font-size:12.5px; color:var(--ink-3); font-weight:700; }
.moim-att .fee-input{ display:flex; align-items:center; gap:8px; }
.moim-att .fee-input .inp{ flex:1; }
.moim-att .won-mark{ font-weight:800; color:var(--ink-2); }
.moim-att .per{ font-size:13px; color:var(--ink-3); font-weight:600; white-space:nowrap; }
.moim-att .fee-actions{ display:flex; align-items:center; gap:10px; }
.moim-att .fee-hint{ font-size:11.5px; color:var(--ink-3); font-weight:500; }
.moim-att .online-note{ display:flex; align-items:center; gap:14px; padding:18px; }
.moim-att .online-ic{ width:46px; height:46px; border-radius:13px; background:#eaf2fd; display:grid; place-items:center; flex-shrink:0; font-size:22px; }
.moim-att .online-t{ font-weight:800; font-size:15px; letter-spacing:-0.03em; }
.moim-att .online-s{ font-size:13px; color:var(--ink-3); font-weight:500; margin-top:2px; }

.moim-att .roster-card{ display:flex; flex-direction:column; }
.moim-att .roster-head{ display:flex; align-items:center; justify-content:space-between; gap:10px; padding:16px 16px 13px; border-bottom:1px solid var(--line); }
.moim-att .roster-stats{ display:flex; align-items:center; gap:13px; flex-wrap:wrap; }
.moim-att .rs{ font-size:13px; font-weight:600; color:var(--ink-3); }
.moim-att .rs b{ font-size:17px; font-weight:800; letter-spacing:-0.03em; margin-right:2px; }
.moim-att .rs-on b{ color:var(--green); }
.moim-att .rs-off b{ color:var(--ink-2); }
.moim-att .rs-paid b{ color:var(--brand); }
.moim-att .roster-search{ display:flex; align-items:center; gap:7px; padding:11px 16px; border-bottom:1px solid var(--line); color:var(--ink-3); }
.moim-att .roster-search input{ border:0; outline:0; font-family:inherit; font-size:14px; color:var(--ink); background:none; flex:1; min-width:0; }
.moim-att .roster-list{ display:flex; flex-direction:column; max-height:600px; overflow-y:auto; }
.moim-att .att-row{ display:flex; align-items:center; gap:11px; padding:11px 16px; border-bottom:1px solid var(--line); }
.moim-att .att-row:last-child{ border-bottom:0; }
.moim-att .att-who{ flex:1; min-width:0; display:flex; flex-direction:column; }
.moim-att .att-name{ font-weight:700; font-size:14.5px; }
.moim-att .att-grade{ font-size:12px; color:var(--ink-3); font-weight:500; }
.moim-att .paid-chip{ font-size:12px; font-weight:700; padding:6px 11px; border-radius:999px; border:1px solid var(--line); background:#fff; color:var(--ink-3); cursor:pointer; flex-shrink:0; }
.moim-att .paid-chip.on{ background:var(--green-soft); color:var(--green); border-color:#bfe6cd; }
.moim-att .seg{ display:flex; background:var(--bg-warm); border:1px solid var(--line); border-radius:10px; padding:2px; gap:2px; flex-shrink:0; }
.moim-att .seg-btn{ font-size:12.5px; font-weight:700; color:var(--ink-3); padding:6px 13px; border-radius:8px; border:0; background:none; cursor:pointer; transition:background .14s, color .14s; }
.moim-att .seg-btn.on{ background:var(--green); color:#fff; box-shadow:0 1px 3px rgba(10,125,63,.3); }
.moim-att .seg-btn.off{ background:#fff; color:var(--ink); box-shadow:var(--shadow-sm); }

.moim-att .settle{ display:flex; flex-direction:column; gap:16px; margin-top:16px; }
.moim-att .settle-card{ padding:18px; }
.moim-att .settle-sum{ font-size:13px; font-weight:700; color:var(--ink-2); }
.moim-att .settle-empty{ color:var(--ink-3); font-size:14px; font-weight:500; padding:8px 0; }
.moim-att .unpaid-list{ display:flex; flex-direction:column; gap:8px; }
.moim-att .unpaid-row{ display:flex; align-items:center; gap:10px; padding:9px 11px; background:var(--bg-warm); border:1px solid var(--line); border-radius:12px; }
.moim-att .unpaid-name{ flex:1; font-weight:700; font-size:14.5px; }
.moim-att .sms-btn{ background:var(--brand); color:#fff; font-size:13px; font-weight:700; padding:8px 13px; border-radius:10px; text-decoration:none; flex-shrink:0; }
.moim-att .sms-btn:hover{ background:var(--brand-strong); }
.moim-att .sms-none{ font-size:12px; color:var(--ink-3); font-weight:500; }
.moim-att .remind-card{ padding:18px; }
.moim-att .remind-box{ white-space:pre-wrap; background:var(--navy); color:#f5f5f7; border-radius:14px; padding:16px; font-family:inherit; font-size:13.5px; line-height:1.6; }
.moim-att .remind-hint{ font-size:12px; color:var(--ink-3); margin-top:8px; font-weight:500; }

.moim-att .toast{ position:fixed; bottom:26px; left:50%; transform:translateX(-50%); z-index:80; background:var(--ink); color:#fff; font-size:13.5px; font-weight:600; padding:12px 20px; border-radius:999px; box-shadow:0 10px 30px rgba(0,0,0,.25); }

@media (min-width:860px){
  .moim-att .att-grid{ display:grid; grid-template-columns:330px 1fr; align-items:start; }
  .moim-att .settle{ display:grid; grid-template-columns:1fr 1fr; }
}
`;
