"use client";

// 출석·식대 보드 — 연간일정의 '회차' 선택 → 출석·입금 체크 → 통계 + 미납 독촉 문구.
import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import { saveAttendance } from "./actions";

export type Meeting = {
  id: string; date: string; session_no: number | null; mode: string;
  title: string | null; fee: number | null; account_info: string | null;
  checkin_token: string | null;
};
export type Member = { id: string; name: string; grade: string | null; status: string | null };
export type Att = { member_id: string; present: boolean; paid: boolean };

const DAYS = ["일", "월", "화", "수", "목", "금", "토"];
function fmtDate(d: string) {
  if (!d) return "";
  const dt = new Date(d + "T00:00");
  return `${dt.getMonth() + 1}월 ${dt.getDate()}일(${DAYS[dt.getDay()]})`;
}
const modeLabel = (m: string) => (m === "online" ? "온라인" : m === "offline" ? "오프라인" : m);
function meetingLabel(m: Meeting) {
  return `${m.session_no != null ? m.session_no + "회 · " : ""}${fmtDate(m.date)} (${modeLabel(m.mode)})`;
}

export default function AttendanceBoard({
  meetings, members, selectedId, attendance,
}: {
  meetings: Meeting[];
  members: Member[];
  selectedId: string | null;
  attendance: Att[];
}) {
  const router = useRouter();
  const meeting = meetings.find((m) => m.id === selectedId) ?? null;
  const fee = meeting?.fee ?? 0;

  const init: Record<string, { present: boolean; paid: boolean }> = {};
  attendance.forEach((a) => { init[a.member_id] = { present: a.present, paid: a.paid }; });
  const [att, setAtt] = useState(init);
  const [, startTransition] = useTransition();
  const get = (id: string) => att[id] ?? { present: false, paid: false };

  // QR 자가 체크인: 회원이 스캔→본인 이름 탭→출석 자동기록
  const [showQr, setShowQr] = useState(false);
  const [qr, setQr] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);
  const checkinLink =
    meeting && meeting.checkin_token && typeof window !== "undefined"
      ? `${window.location.origin}/checkin/${meeting.id}?t=${meeting.checkin_token}`
      : "";
  useEffect(() => {
    if (showQr && checkinLink) {
      QRCode.toDataURL(checkinLink, { width: 280, margin: 1 }).then(setQr).catch(() => setQr(""));
    }
  }, [showQr, checkinLink]);

  function toggle(memberId: string, field: "present" | "paid") {
    if (!selectedId) return;
    setAtt((prev) => {
      const cur = prev[memberId] ?? { present: false, paid: false };
      const next = { ...cur, [field]: !cur[field] };
      if (field === "present" && !next.present) next.paid = false;
      startTransition(() => { saveAttendance(selectedId, memberId, next.present, next.paid); });
      return { ...prev, [memberId]: next };
    });
  }

  const present = members.filter((m) => get(m.id).present);
  const paid = present.filter((m) => get(m.id).paid);
  const unpaid = present.filter((m) => !get(m.id).paid);
  const totalAmount = paid.length * fee;

  const reminderText = (() => {
    if (!meeting) return "";
    if (unpaid.length === 0) return present.length === 0
      ? "출석을 체크하면 미납자 문구가 자동으로 만들어집니다."
      : "🎉 출석하신 모든 분이 식대를 납부하셨습니다!";
    const feeStr = fee ? fee.toLocaleString("ko-KR") + "원" : "";
    let t = "🙏 [새서울 CBMC] 식대 납부 안내\n\n";
    t += `${meeting.session_no != null ? meeting.session_no + "회 " : ""}${fmtDate(meeting.date)} 모임에 함께해 주셔서 감사합니다.\n`;
    t += `아직 식대${feeStr ? " " + feeStr : ""} 입금이 확인되지 않은 분들께 안내드립니다.\n\n`;
    t += `▫️ ${unpaid.map((m) => m.name).join(", ")}\n\n`;
    if (meeting.account_info) t += `💳 입금: ${meeting.account_info}\n`;
    t += "확인 후 다시 안내드리겠습니다. 감사합니다 🤍";
    return t;
  })();

  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(reminderText); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch {}
  };

  const stat = (n: number | string, label: string, cls = "text-deep") => (
    <div className="rounded-lg border border-line bg-card px-4 py-3">
      <div className={`text-[24px] font-black leading-none ${cls}`}>{n}</div>
      <div className="mt-1 text-[11.5px] font-bold text-ink-soft">{label}</div>
    </div>
  );

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-[22px] font-bold text-ink">출석 · 식대 관리</h1>

      {meetings.length === 0 ? (
        <p className="rounded-lg border border-line bg-card px-4 py-10 text-center text-[15px] text-ink-soft">
          아직 모임(회차)이 없어요. <Link href="/schedule" className="font-semibold text-primary hover:underline">연간 일정</Link>에서 일정을 만들어 저장해 주세요.
        </p>
      ) : (
        <>
          {/* 회차 선택 */}
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-line bg-card px-4 py-3">
            <span className="text-[14px] font-bold text-ink-soft">회차 선택</span>
            <select
              value={selectedId ?? ""}
              onChange={(e) => router.push(`/attendance?meeting=${e.target.value}`)}
              className="min-h-[40px] flex-1 rounded-md border border-line bg-card px-3 text-[15px] text-ink outline-none focus:border-primary-focus"
            >
              {meetings.map((m) => (<option key={m.id} value={m.id}>{meetingLabel(m)}</option>))}
            </select>
            <Link href="/schedule" className="text-[13px] font-semibold text-primary hover:underline">일정 관리 →</Link>
          </div>

          {meeting && (
            <>
              {meeting.title && <p className="text-[15px] text-ink-soft">주제: <b className="text-ink">{meeting.title}</b></p>}

              {/* QR 자가 체크인 */}
              <section className="rounded-lg border border-line bg-card p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[15px] font-bold text-ink">📱 QR 자가 체크인</span>
                  <button onClick={() => setShowQr((v) => !v)} className="rounded-full border border-line px-4 py-1.5 text-[13px] font-semibold text-ink-soft hover:border-primary hover:text-primary">{showQr ? "닫기" : "QR 열기"}</button>
                </div>
                {showQr && (
                  <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
                    <div className="shrink-0 rounded-lg border border-line bg-white p-3">
                      {qr ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={qr} alt="체크인 QR" width={220} height={220} />
                      ) : (
                        <div className="flex h-[220px] w-[220px] items-center justify-center text-[13px] text-ink-soft">QR 생성 중…</div>
                      )}
                    </div>
                    <div className="flex-1 text-[14px] text-ink-soft">
                      <p className="font-bold text-ink">회원이 이 QR을 스캔하면 본인 이름을 눌러 출석됩니다.</p>
                      <ul className="mt-2 list-disc space-y-1 pl-5">
                        <li><b className="text-ink">오프라인</b>: 모임 장소 화면·인쇄물에 QR을 띄워두세요.</li>
                        <li><b className="text-ink">온라인(Zoom)</b>: 아래 링크를 채팅에 붙여넣으세요.</li>
                      </ul>
                      <div className="mt-3 break-all rounded-md border border-line bg-surface-soft px-3 py-2 text-[12.5px] text-ink">{checkinLink || "링크 준비 중…"}</div>
                      <button onClick={async () => { try { await navigator.clipboard.writeText(checkinLink); setLinkCopied(true); setTimeout(() => setLinkCopied(false), 1800); } catch {} }} className="mt-2 rounded-full bg-primary px-4 py-1.5 text-[13px] font-semibold text-white hover:bg-primary-pressed">{linkCopied ? "✓ 링크 복사됨" : "🔗 링크 복사"}</button>
                      {checkinLink.includes("localhost") ? (
                        <p className="mt-2 text-[12px] text-muted">※ 지금은 테스트 주소(localhost)라 같은 컴퓨터에서만 열려요.</p>
                      ) : (
                        <p className="mt-2 text-[12px] text-muted">※ 이 QR을 모임 장소에 띄우거나 인쇄해 두면 회원이 폰으로 스캔해 출석합니다.</p>
                      )}
                    </div>
                  </div>
                )}
              </section>

              <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {stat(present.length, "출석 인원", "text-present")}
                {stat(paid.length, "식대 납부", "text-success")}
                {stat(unpaid.length, "미납 인원", "text-unpaid")}
                {stat(totalAmount.toLocaleString("ko-KR"), "수금 합계(원)", "text-deep")}
              </section>

              <section className="overflow-hidden rounded-lg border border-line bg-card">
                <table className="w-full border-collapse text-[15px]">
                  <thead>
                    <tr className="border-b-[1.5px] border-line text-left">
                      <th className="px-3 py-2.5 text-[12px] font-bold text-ink-soft">출석</th>
                      <th className="px-3 py-2.5 text-[12px] font-bold text-ink-soft">이름</th>
                      <th className="px-3 py-2.5 text-[12px] font-bold text-ink-soft">입금</th>
                      <th className="px-3 py-2.5 text-[12px] font-bold text-ink-soft">식대</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((m) => {
                      const s = get(m.id);
                      return (
                        <tr key={m.id} className={`border-b border-line last:border-b-0 ${s.present && s.paid ? "bg-[rgba(46,125,82,.05)]" : ""}`}>
                          <td className="px-3 py-2"><input type="checkbox" checked={s.present} onChange={() => toggle(m.id, "present")} className="h-[18px] w-[18px] accent-primary" /></td>
                          <td className="px-3 py-2 font-bold text-ink">{m.name}</td>
                          <td className="px-3 py-2">{s.present && <input type="checkbox" checked={s.paid} onChange={() => toggle(m.id, "paid")} className="h-[18px] w-[18px] accent-success" />}</td>
                          <td className="px-3 py-2 text-ink-soft">{s.present ? (fee ? fee.toLocaleString("ko-KR") + "원" : "-") : "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </section>

              <section className="rounded-lg border border-line bg-card p-5">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[15px] font-bold text-ink">🔔 미납 독촉 문구</span>
                  <button onClick={copy} className="rounded-full bg-primary px-4 py-1.5 text-[13px] font-semibold text-white hover:bg-primary-pressed">{copied ? "✓ 복사됨" : "📋 복사"}</button>
                </div>
                <pre className="whitespace-pre-wrap rounded-lg border border-[#2c3654] bg-navy p-4 font-sans text-[14px] leading-relaxed text-on-dark">{reminderText}</pre>
              </section>
            </>
          )}
        </>
      )}
    </div>
  );
}
