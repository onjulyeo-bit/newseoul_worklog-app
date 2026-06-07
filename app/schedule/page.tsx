// 연간 일정 페이지 (서버) — 기존 일정을 불러와 편집 보드에 전달.
import { createClient } from "@/lib/supabase/server";
import ScheduleBoard, { type ExistingRow, type EventRow } from "./ScheduleBoard";

export default async function SchedulePage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("meetings")
    .select("date, session_no, mode, title, speaker, note, fee, account_info, program")
    .eq("chapter_id", "새서울")
    .order("date", { ascending: true });

  const { data: eventsData } = await supabase
    .from("events")
    .select("id, title, date, end_date, type, location, link")
    .eq("chapter_id", "새서울")
    .order("date", { ascending: true });
  const events: EventRow[] = eventsData ?? [];

  const existing: ExistingRow[] = (data ?? []).map((m) => ({
    date: m.date,
    session: m.session_no,
    mode: m.mode,
    title: m.title ?? "",
    speaker: m.speaker ?? "",
    note: m.note ?? "",
    program: m.program ?? "",
  }));
  const fee = data?.find((m) => m.fee != null)?.fee ?? null;
  const account = data?.find((m) => m.account_info)?.account_info ?? null;

  return <ScheduleBoard existing={existing} events={events} fee={fee} account={account} />;
}
