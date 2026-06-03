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
    .select("id, date, session_no, mode, title, fee, account_info, checkin_token")
    .eq("chapter_id", "새서울")
    .in("mode", ["online", "offline"])
    .order("date", { ascending: false });
  const meetings: Meeting[] = meetingsData ?? [];

  const { data: membersData } = await supabase
    .from("members")
    .select("id, name, grade, status")
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
