// 연간 일정 페이지 (서버) — 일정 + 회차별 자료(포스터·영상). 포스터는 공지 이미지에서 자동 매칭.
import { createClient } from "@/lib/supabase/server";
import ScheduleBoard, { type ExistingRow, type EventRow, type MediaMap } from "./ScheduleBoard";

const DAY = 86400000;

export default async function SchedulePage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("meetings")
    .select("date, session_no, mode, title, speaker, host, note, fee, account_info, program, poster_url, recording_url")
    .eq("chapter_id", "새서울")
    .order("date", { ascending: true });

  const { data: eventsData } = await supabase
    .from("events")
    .select("id, title, date, end_date, type, location, link")
    .eq("chapter_id", "새서울")
    .order("date", { ascending: true });
  const events: EventRow[] = eventsData ?? [];

  // 공지(포스터 후보) — 이미지 있는 공지를 회차에 자동 매칭(해당 주차: 모임 6일 전 ~ 다음날)
  const { data: annData } = await supabase
    .from("announcements")
    .select("image_url, created_at")
    .eq("chapter_id", "새서울")
    .not("image_url", "is", null);
  const imgAnns = (annData ?? []).filter((a) => a.image_url);
  const autoPoster = (meetingDate: string): string | null => {
    const D = new Date(meetingDate + "T00:00").getTime();
    let best: string | null = null, bestDiff = Infinity;
    for (const a of imgAnns) {
      const diff = (D - new Date(a.created_at as string).getTime()) / DAY; // +면 공지가 모임 전
      if (diff >= -1 && diff <= 6 && Math.abs(diff) < bestDiff) { bestDiff = Math.abs(diff); best = a.image_url as string; }
    }
    return best;
  };

  const existing: ExistingRow[] = (data ?? []).map((m) => ({
    date: m.date, session: m.session_no, mode: m.mode,
    title: m.title ?? "", speaker: m.speaker ?? "", host: m.host ?? "", note: m.note ?? "", program: m.program ?? "",
  }));

  // 회차별 자료 맵 — poster: 수동 지정 우선, 없으면 자동 매칭. recording: 수동 링크만.
  const media: MediaMap = {};
  (data ?? []).forEach((m) => {
    media[m.date] = {
      poster: m.poster_url || autoPoster(m.date),
      posterManual: m.poster_url ?? null,
      recording: m.recording_url ?? null,
    };
  });

  const fee = data?.find((m) => m.fee != null)?.fee ?? null;
  const account = data?.find((m) => m.account_info)?.account_info ?? null;

  return <ScheduleBoard existing={existing} events={events} fee={fee} account={account} media={media} />;
}
