// 주간 콘텐츠 페이지 (서버) — 연간일정의 회차를 불러와 도구에 전달.
import { createClient } from "@/lib/supabase/server";
import ContentHub from "./ContentHub";
import { type MeetingOpt } from "./ContentTool";

export default async function ContentPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("meetings")
    .select("id, date, session_no, mode, title, speaker")
    .eq("chapter_id", "새서울")
    .in("mode", ["online", "offline"])
    .order("date", { ascending: false });
  const meetings: MeetingOpt[] = data ?? [];
  return <ContentHub meetings={meetings} />;
}
