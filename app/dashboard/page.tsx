// 대시보드 — 데이터 로더(서버). 표현은 DashboardView(클로드디자인 시안 이식).
import { createClient } from "@/lib/supabase/server";
import DashboardView, { type DashMeeting, type DashAnn } from "./DashboardView";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let isAdmin = false;
  if (user) {
    const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    isAdmin = data?.role === "admin";
  }
  if (!isAdmin) {
    return <p className="rounded-lg border border-line bg-card px-4 py-10 text-center text-[15px] text-ink-soft">관리자 전용 화면이에요.</p>;
  }

  const today = new Date().toISOString().slice(0, 10);
  const monthStart = today.slice(0, 7) + "-01";

  const [membersR, meetingsR, txR, annR, chapR] = await Promise.all([
    supabase.from("members").select("status, grade").eq("chapter_id", "새서울"),
    supabase.from("meetings").select("session_no, date, mode, title, speaker, program").eq("chapter_id", "새서울").in("mode", ["online", "offline"]).gte("date", today).order("date", { ascending: true }),
    supabase.from("transactions").select("direction, amount, track").eq("chapter_id", "새서울").gte("txn_date", monthStart),
    supabase.from("announcements").select("id, category, title, created_at").eq("chapter_id", "새서울").order("created_at", { ascending: false }).limit(3),
    supabase.from("chapters").select("meeting_place, meeting_time").eq("chapter_id", "새서울").maybeSingle(),
  ]);

  const members = membersR.data ?? [];
  const tx = txR.data ?? [];
  const income = tx.filter((t) => t.track === "A" && t.direction === "입금").reduce((s, t) => s + t.amount, 0);
  const expense = tx.filter((t) => t.track === "A" && t.direction === "출금").reduce((s, t) => s + Math.abs(t.amount), 0);

  const meetings = (meetingsR.data ?? []) as DashMeeting[];
  const chap = chapR.data as { meeting_place?: string; meeting_time?: string } | null;

  return (
    <DashboardView
      name={(user?.email ?? "").split("@")[0] || "관리자"}
      next={meetings[0] ?? null}
      upcoming={meetings.slice(0, 3)}
      place={chap?.meeting_place}
      time={chap?.meeting_time}
      mTotal={members.length}
      mActive={members.filter((m) => m.status === "활동").length}
      income={income}
      expense={expense}
      meetingsCount={meetings.length}
      anns={(annR.data ?? []) as DashAnn[]}
    />
  );
}
