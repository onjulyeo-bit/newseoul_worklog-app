// 출석·식대 페이지 (서버) — 연간일정의 '회차(모임)'를 불러와 보드에 전달.
import { createClient } from "@/lib/supabase/server";
import AttendanceBoard, { type Meeting, type Member, type Att } from "./AttendanceBoard";

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ meeting?: string }>;
}) {
  const { meeting } = await searchParams;
  const supabase = await createClient();

  // 실제 모임(온라인/오프라인)만 — 휴회·미정 제외
  const { data: meetingsData } = await supabase
    .from("meetings")
    .select("id, date, session_no, mode, title, program, fee, account_info, checkin_token")
    .eq("chapter_id", "새서울")
    .in("mode", ["online", "offline"])
    .order("date", { ascending: false });
  const all: Meeting[] = meetingsData ?? [];

  // 정렬: 오늘·지난 회차를 최신순으로 앞에, 다가올(미래) 회차는 뒤로.
  // (체크인·식대는 보통 진행된/오늘 회차를 다루므로 현재가 맨 앞에 오게 한다)
  const today = new Date().toISOString().slice(0, 10);
  const pastOrToday = all.filter((m) => (m.date ?? "") <= today); // 쿼리가 내림차순 → 최신 지난회차 먼저
  const future = all.filter((m) => (m.date ?? "") > today).reverse(); // 미래는 가까운 것부터(오름차순)
  const meetings: Meeting[] = [...pastOrToday, ...future];

  const { data: membersData } = await supabase
    .from("members")
    .select("id, name, grade, status, phone")
    .eq("chapter_id", "새서울")
    .order("name", { ascending: true });
  const members: Member[] = membersData ?? [];

  const selectedId = meeting && meetings.some((m) => m.id === meeting) ? meeting : meetings[0]?.id;

  let attendance: Att[] = [];
  if (selectedId) {
    const { data: attData } = await supabase
      .from("attendance")
      .select("member_id, present, paid")
      .eq("meeting_id", selectedId);
    attendance = attData ?? [];
  }

  return (
    <AttendanceBoard
      key={selectedId ?? "none"}
      meetings={meetings}
      members={members}
      selectedId={selectedId ?? null}
      attendance={attendance}
    />
  );
}
