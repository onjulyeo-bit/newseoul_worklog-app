// 출석 통계 — 회차별(프로그램별) 출석률 + 회원별 연간 출석률 + 출석상 후보.
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const DAYS = ["일", "월", "화", "수", "목", "금", "토"];
const fmtDate = (d: string) => { const t = new Date(d + "T00:00"); return `${t.getMonth() + 1}.${t.getDate()}(${DAYS[t.getDay()]})`; };
const pct = (n: number, d: number) => (d ? Math.round((n / d) * 100) : 0);

export default async function AttendanceStatsPage({ searchParams }: { searchParams: Promise<{ year?: string }> }) {
  const { year } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let isAdmin = false;
  if (user) { const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single(); isAdmin = data?.role === "admin"; }
  if (!isAdmin) return <p className="rounded-lg border border-line bg-card px-4 py-10 text-center text-[15px] text-ink-soft">관리자 전용 화면이에요.</p>;

  const today = new Date().toISOString().slice(0, 10);
  const [mtR, attR, memR] = await Promise.all([
    supabase.from("meetings").select("id, session_no, date, mode, title").eq("chapter_id", "새서울").in("mode", ["online", "offline"]).order("date", { ascending: true }),
    supabase.from("attendance").select("meeting_id, member_id, present").eq("present", true),
    supabase.from("members").select("id, name").eq("chapter_id", "새서울"),
  ]);
  const allMeetings = (mtR.data ?? []);
  const att = attR.data ?? [];
  const members = memR.data ?? [];

  const years = Array.from(new Set(allMeetings.map((m) => m.date.slice(0, 4)))).sort().reverse();
  const curYear = year && years.includes(year) ? year : years[0];
  const meetings = allMeetings.filter((m) => m.date.slice(0, 4) === curYear);
  const meetingIds = new Set(meetings.map((m) => m.id));
  const past = meetings.filter((m) => m.date <= today);

  // 회차별 출석 수
  const byMeeting = new Map<string, number>();
  att.forEach((a) => { if (meetingIds.has(a.meeting_id)) byMeeting.set(a.meeting_id, (byMeeting.get(a.meeting_id) ?? 0) + 1); });
  const totalMembers = members.length || 1;

  // 회원별 출석 수 (이 연도, 지난 모임 기준)
  const pastIds = new Set(past.map((m) => m.id));
  const byMember = new Map<string, number>();
  att.forEach((a) => { if (pastIds.has(a.meeting_id)) byMember.set(a.member_id, (byMember.get(a.member_id) ?? 0) + 1); });
  const memberRows = members
    .map((m) => ({ name: m.name, n: byMember.get(m.id) ?? 0 }))
    .sort((a, b) => b.n - a.n);
  const denom = past.length || 1;

  const avgRate = past.length ? Math.round(past.reduce((s, m) => s + pct(byMeeting.get(m.id) ?? 0, totalMembers), 0) / past.length) : 0;
  const award = memberRows.filter((r) => pct(r.n, denom) >= 90 && r.n > 0);

  const sec = "rounded-lg border border-line bg-card p-5";
  const th = "px-3 py-2 text-left text-[12px] font-bold text-ink-soft";
  const bar = (rate: number) => (
    <div className="h-2 w-full overflow-hidden rounded-full bg-surface-soft"><div className="h-full rounded-full bg-primary" style={{ width: `${rate}%` }} /></div>
  );

  return (
    <div className="mx-auto flex max-w-[900px] flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/attendance" className="text-[13px] font-semibold text-primary hover:underline">← 출석·식대</Link>
        {years.length > 1 && (
          <div className="ml-auto flex gap-1">
            {years.map((y) => (
              <Link key={y} href={`/attendance/stats?year=${y}`} className={`rounded-full px-3 py-1 text-[12px] font-semibold ${y === curYear ? "bg-primary text-white" : "border border-line text-ink-soft hover:border-primary"}`}>{y}년</Link>
            ))}
          </div>
        )}
      </div>
      <h1 className="text-[22px] font-bold text-ink">📊 출석 통계 <span className="text-[15px] font-semibold text-ink-soft">· {curYear || "—"}년</span></h1>

      {meetings.length === 0 ? (
        <p className={`${sec} text-center text-[15px] text-ink-soft`}>아직 모임이 없어요. <Link href="/schedule" className="font-semibold text-primary hover:underline">연간 일정</Link>을 만들어 주세요.</p>
      ) : (
        <>
          <section className="grid grid-cols-3 gap-3">
            <div className={sec}><div className="text-[24px] font-black text-deep">{past.length}</div><div className="text-[12px] font-bold text-ink-soft">진행된 모임</div></div>
            <div className={sec}><div className="text-[24px] font-black text-present">{avgRate}%</div><div className="text-[12px] font-bold text-ink-soft">평균 출석률</div></div>
            <div className={sec}><div className="text-[24px] font-black text-success">{award.length}</div><div className="text-[12px] font-bold text-ink-soft">출석상 후보(90%+)</div></div>
          </section>

          {/* 회차별 */}
          <section className={sec}>
            <h2 className="mb-2 text-[16px] font-bold text-ink">회차별(프로그램별) 출석률</h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-[14px]">
                <thead><tr className="border-b-[1.5px] border-line"><th className={th}>회차</th><th className={th}>날짜</th><th className={th}>주제</th><th className={th + " text-right"}>출석</th><th className={th + " w-[120px]"}>출석률</th></tr></thead>
                <tbody>
                  {[...meetings].reverse().map((m) => {
                    const c = byMeeting.get(m.id) ?? 0; const r = pct(c, totalMembers); const isPast = m.date <= today;
                    return (
                      <tr key={m.id} className={`border-b border-line ${!isPast ? "opacity-50" : ""}`}>
                        <td className="px-3 py-2 font-semibold text-ink">{m.session_no ?? "—"}{m.mode === "online" ? " 💻" : ""}</td>
                        <td className="px-3 py-2 text-ink-soft">{fmtDate(m.date)}</td>
                        <td className="px-3 py-2 text-ink-soft">{m.title || "—"}</td>
                        <td className="px-3 py-2 text-right font-semibold">{isPast ? `${c}명` : "예정"}</td>
                        <td className="px-3 py-2">{isPast && <div className="flex items-center gap-2">{bar(r)}<span className="w-9 text-right text-[12px] font-bold text-ink">{r}%</span></div>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="mt-1 text-[12px] text-muted">※ 출석률 = 출석 인원 / 전체 회원({totalMembers}명) · 출석 잘 나온 주제가 인기 프로그램</p>
          </section>

          {/* 회원별 */}
          <section className={sec}>
            <h2 className="mb-2 text-[16px] font-bold text-ink">회원별 출석률 <span className="text-[13px] font-semibold text-ink-soft">(진행된 {past.length}회 기준)</span></h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-[14px]">
                <thead><tr className="border-b-[1.5px] border-line"><th className={th}>순위</th><th className={th}>이름</th><th className={th + " text-right"}>출석</th><th className={th + " w-[120px]"}>출석률</th><th className={th}></th></tr></thead>
                <tbody>
                  {memberRows.map((m, i) => {
                    const r = pct(m.n, denom);
                    return (
                      <tr key={m.name + i} className="border-b border-line last:border-0">
                        <td className="px-3 py-2 text-ink-soft">{i + 1}</td>
                        <td className="px-3 py-2 font-bold text-ink">{m.name}</td>
                        <td className="px-3 py-2 text-right">{m.n}/{denom}</td>
                        <td className="px-3 py-2"><div className="flex items-center gap-2">{bar(r)}<span className="w-9 text-right text-[12px] font-bold text-ink">{r}%</span></div></td>
                        <td className="px-3 py-2">{r >= 90 && m.n > 0 && <span className="rounded-full bg-[rgba(46,125,82,.12)] px-2 py-0.5 text-[11px] font-bold text-success">🏅 출석상</span>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="mt-1 text-[12px] text-muted">※ 송년회 출석상 후보 = 출석률 90% 이상 🏅 (기준은 바꿀 수 있어요)</p>
          </section>
        </>
      )}
    </div>
  );
}
