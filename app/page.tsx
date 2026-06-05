// 회원 목록 (메인 화면) — 노션식 표(MembersTable)로 표시.
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import MembersTable, { type Member } from "./members/MembersTable";
import NoticesBoard, { type Announcement } from "./notices/NoticesBoard";

export default async function MemberListPage() {
  const supabase = await createClient();

  // 로그인한 사람 + 역할(role)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let role: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    role = profile?.role ?? null;
  }
  const roleLabel: Record<string, string> = {
    admin: "임원",
    member: "회원",
    guest: "관심회원",
  };

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

  const members: Member[] = membersData ?? [];

  const total = members.length;
  const active = members.filter((m) => m.status === "활동").length;
  const regular = members.filter((m) => m.grade === "정회원").length;
  const couple = members.filter((m) => m.grade === "부부회원").length;

  const stats = [
    { n: total, label: "전체 회원" },
    { n: active, label: "활동", accent: "text-present" },
    { n: regular, label: "정회원", accent: "text-deep" },
    { n: couple, label: "부부회원", accent: "text-deep" },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* 로그인 상태 바 */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-card px-4 py-3">
        {user ? (
          <>
            <span className="text-[15px] text-ink-soft">
              로그인됨 · <b className="text-ink">{user.email}</b>
              {role && (
                <span className="ml-2 rounded-full bg-[rgba(0,102,204,.12)] px-2.5 py-1 text-[13px] font-bold text-primary">
                  {roleLabel[role] ?? role}
                </span>
              )}
            </span>
            <form action="/auth/signout" method="post">
              <button className="rounded-full border border-line px-4 py-2 text-[14px] font-bold text-primary hover:border-primary">
                로그아웃
              </button>
            </form>
          </>
        ) : (
          <>
            <span className="text-[15px] text-ink-soft">로그인하지 않았습니다.</span>
            <a
              href="/login"
              className="rounded-full bg-primary px-4 py-2 text-[14px] font-semibold text-white hover:bg-primary-pressed"
            >
              로그인
            </a>
          </>
        )}
      </div>

      {/* 요약 통계 */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border border-line bg-card px-4 py-4">
            <div className={`text-[26px] font-black leading-none ${s.accent ?? "text-deep"}`}>
              {s.n}
            </div>
            <div className="mt-1 text-[11.5px] font-bold tracking-wide text-ink-soft">
              {s.label}
            </div>
          </div>
        ))}
      </section>

      {/* 회원 추가 / 엑셀 업로드 */}
      <div className="flex justify-end gap-2">
        <Link
          href="/members/import"
          className="flex min-h-[44px] items-center rounded-full border border-primary px-5 text-[16px] font-semibold text-primary hover:bg-[rgba(0,102,204,.06)]"
        >
          ⬆ 엑셀 업로드
        </Link>
        <Link
          href="/members/new"
          className="flex min-h-[44px] items-center rounded-full bg-primary px-5 text-[16px] font-semibold text-white hover:bg-primary-pressed"
        >
          + 회원 추가
        </Link>
      </div>

      {/* 노션식 회원 표 (정렬·필터·검색·열 선택) */}
      <MembersTable members={members} />
    </div>
  );
}
