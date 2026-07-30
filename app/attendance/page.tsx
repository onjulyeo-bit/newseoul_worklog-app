// 출석·식대 페이지 (서버) — 연간일정의 '회차(모임)'를 불러와 보드에 전달.
import { createClient } from "@/lib/supabase/server";
import AttendanceBoard, { type Meeting, type Member, type Att, type Guest } from "./AttendanceBoard";

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

  // 정렬: 시간순(과거→미래)으로 두고, '당회'(오늘/직전 회차)를 기본 선택 + 가운데로(전·후 회차가 양옆에 보임).
  const today = new Date().toISOString().slice(0, 10);
  const meetings: Meeting[] = [...all].sort((a, b) => (a.date ?? "").localeCompare(b.date ?? "")); // 오름차순
  // 당회 = 오늘이거나 가장 최근 지난 회차(없으면 가장 가까운 다음 회차)
  const pastOrToday = meetings.filter((m) => (m.date ?? "") <= today);
  const currentId = (pastOrToday.length ? pastOrToday[pastOrToday.length - 1] : meetings[0])?.id;

  const { data: membersData } = await supabase
    .from("members")
    .select("id, name, grade, status, phone")
    .eq("chapter_id", "새서울")
    .order("name", { ascending: true });
  const members: Member[] = membersData ?? [];

  const selectedId = meeting && meetings.some((m) => m.id === meeting) ? meeting : currentId;

  let attendance: Att[] = [];
  let guests: Guest[] = [];
  if (selectedId) {
    const { data: attData } = await supabase
      .from("attendance")
      .select("member_id, present, paid")
      .eq("meeting_id", selectedId);
    attendance = attData ?? [];

    const { data: guestData } = await supabase
      .from("guests")
      .select("id, name, branch, present, paid")
      .eq("meeting_id", selectedId)
      .order("sort_order", { ascending: true, nullsFirst: false });
    guests = guestData ?? [];
  }

  return (
    <AttendanceBoard
      key={selectedId ?? "none"}
      meetings={meetings}
      members={members}
      selectedId={selectedId ?? null}
      attendance={attendance}
      guests={guests}
    />
  );
}
