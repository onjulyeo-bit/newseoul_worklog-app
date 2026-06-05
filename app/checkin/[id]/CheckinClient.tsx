"use client";

// 회원이 QR로 들어와 본인 이름을 눌러 출석하는 화면. 로그인 불필요.
// 보안함수(checkin_roster / check_in)만 호출 — 토큰이 맞아야 동작.
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Row = { member_id: string; name: string; present: boolean };
type Meal = { mode: string; fee: number | null; account: string | null; pay_link: string | null };

export default function CheckinClient({ meetingId, token }: { meetingId: string; token: string }) {
  const supabase = createClient();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [err, setErr] = useState(false);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [justDone, setJustDone] = useState<string | null>(null);
  const [meal, setMeal] = useState<Meal | null>(null);
  const [guideName, setGuideName] = useState<string | null>(null);
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
    if (guideName === r.name) setGuideName(null);
  }

  async function checkIn(r: Row) {
    if (r.present || busy) return;
    setBusy(r.member_id);
    const { error } = await supabase.rpc("check_in", { p_meeting: meetingId, p_member: r.member_id, p_token: token });
    setBusy(null);
    if (error) { alert("출석 처리 중 문제가 생겼어요. 잠시 후 다시 눌러 주세요."); return; }
    setRows((prev) => prev?.map((x) => (x.member_id === r.member_id ? { ...x, present: true } : x)) ?? null);
    setJustDone(r.member_id);
    setTimeout(() => setJustDone((v) => (v === r.member_id ? null : v)), 2500);
    if (meal?.mode === "offline" && meal.fee) setGuideName(r.name);
  }

  const filtered = useMemo(() => {
    if (!rows) return [];
    const k = q.trim();
    return k ? rows.filter((r) => r.name.includes(k)) : rows;
  }, [rows, q]);

  const doneCount = rows?.filter((r) => r.present).length ?? 0;

  return (
    <div className="mx-auto min-h-[70vh] max-w-[480px] px-1 py-2">
      <div className="rounded-2xl border border-line bg-card p-5 shadow-sm">
        <h1 className="text-center text-[24px] font-extrabold text-ink">출석 체크인</h1>
        <p className="mt-1 text-center text-[15px] text-ink-soft">아래에서 <b className="text-primary">본인 이름</b>을 한 번 눌러 주세요.</p>

        {guideName && meal?.fee != null && (
          <div className="mt-4 rounded-xl border-2 border-primary bg-primary/5 p-4 text-center">
            <div className="text-[17px] font-bold text-ink">{guideName}님, 출석 완료! 🎉</div>
            <div className="mt-2 text-[15px] text-ink-soft">식대 <b className="text-[20px] text-primary">{meal.fee.toLocaleString("ko-KR")}원</b> 입금 부탁드려요</div>
            {meal.account && <div className="mt-2 break-all rounded-lg border border-line bg-card px-3 py-2 text-[15px] font-semibold text-ink">{meal.account}</div>}
            <div className="mt-3 flex flex-col gap-2">
              {meal.account && <button onClick={copyAcct} className="min-h-[48px] rounded-full bg-primary px-4 text-[16px] font-semibold text-white hover:bg-primary-pressed">{copied ? "✓ 계좌 복사됨" : "📋 계좌번호 복사"}</button>}
              {meal.pay_link && <a href={meal.pay_link} target="_blank" rel="noreferrer" className="flex min-h-[48px] items-center justify-center rounded-full bg-[#0064FF] px-4 text-[16px] font-semibold text-white">💸 간편 송금</a>}
            </div>
            <button onClick={() => setGuideName(null)} className="mt-2 text-[13px] text-ink-soft underline">닫기</button>
          </div>
        )}

        {err ? (
          <p className="mt-8 rounded-xl border border-line bg-surface-soft px-4 py-10 text-center text-[16px] text-ink-soft">
            링크가 올바르지 않거나 만료되었어요.<br />안내받은 QR·링크로 다시 들어와 주세요. 🙏
          </p>
        ) : rows === null ? (
          <p className="mt-8 text-center text-[16px] text-ink-soft">명단을 불러오는 중…</p>
        ) : (
          <>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="🔍 이름 검색 (예: 홍길동)"
              className="mt-4 min-h-[52px] w-full rounded-xl border border-line bg-card px-4 text-[17px] text-ink outline-none placeholder:text-muted focus:border-primary-focus"
            />
            <p className="mt-2 text-center text-[13px] text-ink-soft">출석 완료 {doneCount}명</p>

            <div className="mt-3 flex flex-col gap-2.5">
              {filtered.map((r) => {
                const done = r.present;
                return (
                  <div key={r.member_id} className={`flex min-h-[60px] items-center gap-1 rounded-xl border pr-2 transition ${done ? "border-success bg-[rgba(46,125,82,.08)]" : "border-line bg-card"}`}>
                    <button
                      onClick={() => (done ? (meal?.mode === "offline" && meal.fee && setGuideName(r.name)) : checkIn(r))}
                      disabled={busy === r.member_id}
                      className={`flex flex-1 items-center justify-between px-4 py-3 text-left text-[19px] font-bold ${done ? "text-success" : "text-ink active:scale-[.99]"}`}
                    >
                      <span>{r.name}</span>
                      <span className="text-[14px] font-semibold">
                        {busy === r.member_id ? "처리 중…" : done ? (justDone === r.member_id ? "✓ 출석 완료!" : "✓ 출석") : "눌러서 출석 →"}
                      </span>
                    </button>
                    {done && <button onClick={() => undo(r)} disabled={busy === r.member_id} className="shrink-0 rounded-lg border border-line px-2.5 py-1.5 text-[13px] font-semibold text-ink-soft hover:border-unpaid hover:text-unpaid">취소</button>}
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <p className="py-8 text-center text-[15px] text-ink-soft">‘{q}’ 와 일치하는 이름이 없어요.</p>
              )}
            </div>
          </>
        )}
      </div>
      <p className="mt-4 text-center text-[12px] text-muted">새서울 CBMC · 출석 체크인</p>
    </div>
  );
}
