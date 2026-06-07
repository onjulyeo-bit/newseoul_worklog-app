// 출석 통계 ⑧ — 데이터 로더(서버). 표현은 StatsView(클로드디자인 시안).
import { createClient } from "@/lib/supabase/server";
import StatsView, { type ProgRow, type SessRow, type MemRow } from "./StatsView";

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
    supabase.from("meetings").select("id, session_no, date, mode, title, program").eq("chapter_id", "새서울").in("mode", ["online", "offline"]).order("date", { ascending: true }),
    supabase.from("attendance").select("meeting_id, member_id, present").eq("present", true),
    supabase.from("members").select("id, name").eq("chapter_id", "새서울"),
  ]);
  const allMeetings = mtR.data ?? [];
  const att = attR.data ?? [];
  const members = memR.data ?? [];

  const years = Array.from(new Set(allMeetings.map((m) => m.date.slice(0, 4)))).sort().reverse();
  const curYear = year && years.includes(year) ? year : (years[0] ?? "");
  const meetings = allMeetings.filter((m) => m.date.slice(0, 4) === curYear);
  const meetingIds = new Set(meetings.map((m) => m.id));
  const past = meetings.filter((m) => m.date <= today);
  const totalMembers = members.length || 1;

  const byMeeting = new Map<string, number>();
  att.forEach((a) => { if (meetingIds.has(a.meeting_id)) byMeeting.set(a.meeting_id, (byMeeting.get(a.meeting_id) ?? 0) + 1); });

  const pastIds = new Set(past.map((m) => m.id));
  const byMember = new Map<string, number>();
  att.forEach((a) => { if (pastIds.has(a.meeting_id)) byMember.set(a.member_id, (byMember.get(a.member_id) ?? 0) + 1); });
  const denom = past.length || 1;

  const memRows: MemRow[] = members.map((m) => ({ name: m.name, n: byMember.get(m.id) ?? 0 }))
    .sort((a, b) => b.n - a.n)
    .map((m) => ({ name: m.name, attended: m.n, rate: pct(m.n, denom), award: pct(m.n, denom) >= 90 && m.n > 0 }));

  const avgRate = past.length ? Math.round(past.reduce((s, m) => s + pct(byMeeting.get(m.id) ?? 0, totalMembers), 0) / past.length) : 0;
  const awardCount = memRows.filter((r) => r.award).length;

  const progAgg = new Map<string, { meetings: number; attend: number }>();
  past.forEach((m) => {
    const p = ((m as { program?: string }).program || "미지정");
    const e = progAgg.get(p) ?? { meetings: 0, attend: 0 };
    e.meetings++; e.attend += byMeeting.get(m.id) ?? 0; progAgg.set(p, e);
  });
  const progRows: ProgRow[] = [...progAgg.entries()].map(([p, e]) => ({ name: p, meetings: e.meetings, avg: Math.round(e.attend / e.meetings), rate: pct(e.attend, e.meetings * totalMembers) })).sort((a, b) => b.rate - a.rate);

  const sessRows: SessRow[] = [...past].reverse().slice(0, 8).map((m) => {
    const c = byMeeting.get(m.id) ?? 0;
    return { id: m.id, round: m.session_no ?? "—", topic: m.title || fmtDate(m.date), online: m.mode === "online", present: c, total: totalMembers, rate: pct(c, totalMembers) };
  });

  return (
    <StatsView
      curYear={curYear} years={years} held={past.length} avgRate={avgRate} awardCount={awardCount}
      progRows={progRows} sessRows={sessRows} memRows={memRows} totalMembers={totalMembers} denom={denom}
      hasData={meetings.length > 0}
    />
  );
}
