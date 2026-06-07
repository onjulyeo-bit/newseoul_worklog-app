// 홈 — 익명:랜딩 / 회원:공지 / 임원:회원 목록(새 디자인).
import { createClient } from "@/lib/supabase/server";
import NoticesBoard, { type Announcement, type MemberHero } from "./notices/NoticesBoard";
import Welcome from "./Welcome";
import MembersList, { type RawMember } from "./members/MembersList";

export default async function MemberListPage() {
  const supabase = await createClient();

  // 로그인한 사람 + 역할(role)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 비로그인(익명) 방문자 → 새서울 CBMC 환영 + 로그인 (현관)
  if (!user) return <Welcome />;

  let role: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    role = profile?.role ?? null;
  }

  // 회원(비관리자) 로그인 → 회원 전용 홈(인사 + 이번 주 모임 + 공지 피드)
  if (user && role !== "admin") {
    const today = new Date().toISOString().slice(0, 10);
    const [annR, mtR, chapR] = await Promise.all([
      supabase.from("announcements").select("id, category, title, body, created_at, image_url").eq("chapter_id", "새서울").order("created_at", { ascending: false }),
      supabase.from("meetings").select("id, date, program, title, checkin_token").eq("chapter_id", "새서울").in("mode", ["online", "offline"]).gte("date", today).order("date", { ascending: true }).limit(1),
      supabase.from("chapters").select("meeting_place, meeting_time").eq("chapter_id", "새서울").maybeSingle(),
    ]);
    const nx = mtR.data?.[0];
    const chap = chapR.data as { meeting_place?: string; meeting_time?: string } | null;
    const memberHero: MemberHero = {
      name: (user.email ?? "").split("@")[0] || "회원",
      meeting: nx ? {
        date: nx.date, program: nx.program, title: nx.title,
        place: chap?.meeting_place ?? null, time: chap?.meeting_time ?? null,
        checkinHref: nx.checkin_token ? `/checkin/${nx.id}?t=${nx.checkin_token}` : null,
      } : null,
    };
    return <NoticesBoard isAdmin={false} initial={(annR.data as Announcement[]) ?? []} memberHero={memberHero} />;
  }

  // 회원 전체 (RLS: 임원만 조회 가능). 표에서 정렬·필터·검색은 화면에서 처리.
  const { data: membersData } = await supabase
    .from("members")
    .select(
      "id, name, gender, phone, registration, grade, status, spouse_name, industry, company, position, vision_school, leadership_school, car_model, car_number, parking_registered, joined_on, tags, photo_url",
    )
    .eq("chapter_id", "새서울")
    .order("name", { ascending: true });

  const members = (membersData ?? []) as RawMember[];

  // 새 디자인 회원 목록 ③ + 상세 드로어 ④ (헤더의 로그아웃·역할은 앱 셸에 있음)
  return <MembersList members={members} />;
}
