// 홈 — 익명:랜딩 / 회원:공지 / 임원:회원 목록(새 디자인).
import { createClient } from "@/lib/supabase/server";
import NoticesBoard, { type Announcement } from "./notices/NoticesBoard";
import Landing from "./Landing";
import MembersList, { type RawMember } from "./members/MembersList";

export default async function MemberListPage() {
  const supabase = await createClient();

  // 로그인한 사람 + 역할(role)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 비로그인(익명) 방문자 → 서비스 소개 랜딩
  if (!user) return <Landing />;

  let role: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    role = profile?.role ?? null;
  }

  // 회원(비관리자) 로그인 → 회원 전용 홈(공지)
  if (user && role !== "admin") {
    const { data: anns } = await supabase
      .from("announcements")
      .select("id, category, title, body, created_at, image_url")
      .eq("chapter_id", "새서울")
      .order("created_at", { ascending: false });
    return (
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-card px-4 py-3">
          <span className="text-[15px] text-ink-soft">반가워요 · <b className="text-ink">{user.email}</b></span>
          <form action="/auth/signout" method="post"><button className="rounded-full border border-line px-4 py-2 text-[14px] font-bold text-primary hover:border-primary">로그아웃</button></form>
        </div>
        <NoticesBoard isAdmin={false} initial={(anns as Announcement[]) ?? []} />
      </div>
    );
  }

  // 회원 전체 (RLS: 임원만 조회 가능). 표에서 정렬·필터·검색은 화면에서 처리.
  const { data: membersData } = await supabase
    .from("members")
    .select(
      "id, name, gender, phone, registration, grade, status, spouse_name, industry, company, position, vision_school, leadership_school, car_model, car_number, parking_registered, joined_on, tags",
    )
    .eq("chapter_id", "새서울")
    .order("name", { ascending: true });

  const members = (membersData ?? []) as RawMember[];

  // 새 디자인 회원 목록 ③ + 상세 드로어 ④ (헤더의 로그아웃·역할은 앱 셸에 있음)
  return <MembersList members={members} />;
}
