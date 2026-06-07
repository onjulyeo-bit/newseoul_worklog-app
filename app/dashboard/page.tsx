// 대시보드 — 관리자 한눈에 보기. 회원·다음모임·이번달 회계·연회비·최근공지 요약 + 바로가기.
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const won = (n: number) => n.toLocaleString("ko-KR");
const DAYS = ["일", "월", "화", "수", "목", "금", "토"];
const fmtDate = (d: string) => { const t = new Date(d + "T00:00"); return `${t.getMonth() + 1}월 ${t.getDate()}일(${DAYS[t.getDay()]})`; };

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

  const [membersR, meetingsR, txR, annR] = await Promise.all([
    supabase.from("members").select("status, grade").eq("chapter_id", "새서울"),
    supabase.from("meetings").select("session_no, date, mode, title").eq("chapter_id", "새서울").in("mode", ["online", "offline"]).gte("date", today).order("date", { ascending: true }).limit(3),
    supabase.from("transactions").select("direction, amount, track, category").eq("chapter_id", "새서울").gte("txn_date", monthStart),
    supabase.from("announcements").select("id, category, title, created_at").eq("chapter_id", "새서울").order("created_at", { ascending: false }).limit(4),
  ]);

  const members = membersR.data ?? [];
  const mTotal = members.length;
  const mActive = members.filter((m) => m.status === "활동").length;
  const mRegular = members.filter((m) => m.grade === "정회원").length;
  const mCouple = members.filter((m) => m.grade === "부부회원").length;

  const tx = txR.data ?? [];
  const aIn = tx.filter((t) => t.track === "A" && t.direction === "입금").reduce((s, t) => s + t.amount, 0);
  const aOut = tx.filter((t) => t.track === "A" && t.direction === "출금").reduce((s, t) => s + Math.abs(t.amount), 0);
  const sIn = tx.filter((t) => t.track === "B" && t.direction === "입금").reduce((s, t) => s + t.amount, 0);
  const sOut = tx.filter((t) => t.track === "B" && t.direction === "출금").reduce((s, t) => s + Math.abs(t.amount), 0);
  const duesCount = tx.filter((t) => t.category === "연회비" && t.direction === "입금").length;

  const meetings = meetingsR.data ?? [];
  const next = meetings[0];
  const anns = annR.data ?? [];

  const stat = (n: string | number, label: string, cls = "text-deep") => (
    <div className="rounded-lg border border-line bg-card px-4 py-3.5">
      <div className={`text-[24px] font-black leading-none ${cls}`}>{n}</div>
      <div className="mt-1 text-[11.5px] font-bold text-ink-soft">{label}</div>
    </div>
  );
  const card = "rounded-lg border border-line bg-card p-5";

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-[22px] font-bold text-ink">📊 대시보드</h1>

      {/* 회원 */}
      <section>
        <div className="mb-2 flex items-center justify-between"><h2 className="text-[15px] font-bold text-ink">회원</h2><Link href="/" className="text-[13px] font-semibold text-primary hover:underline">회원 관리 →</Link></div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stat(mTotal, "전체 회원")}
          {stat(mActive, "활동", "text-present")}
          {stat(mRegular, "정회원", "text-deep")}
          {stat(mCouple, "부부회원", "text-deep")}
        </div>
      </section>

      <div className="grid gap-5 md:grid-cols-2">
        {/* 다음 모임 */}
        <section className={card}>
          <div className="mb-2 flex items-center justify-between"><h2 className="text-[15px] font-bold text-ink">📅 다음 모임</h2><Link href="/schedule" className="text-[13px] font-semibold text-primary hover:underline">일정 →</Link></div>
          {next ? (
            <>
              <div className="rounded-md bg-surface-soft px-3 py-2.5">
                <div className="text-[17px] font-bold text-ink">{next.session_no != null ? `${next.session_no}회 · ` : ""}{fmtDate(next.date)}</div>
                <div className="mt-0.5 text-[13px] text-ink-soft">{next.mode === "online" ? "온라인" : "오프라인"}{next.title ? ` · ${next.title}` : ""}</div>
              </div>
              {meetings.slice(1).map((m, i) => (
                <div key={i} className="mt-1.5 px-1 text-[13px] text-ink-soft">{m.session_no != null ? `${m.session_no}회 · ` : ""}{fmtDate(m.date)} ({m.mode === "online" ? "온라인" : "오프라인"})</div>
              ))}
            </>
          ) : <p className="text-[14px] text-ink-soft">예정된 모임이 없어요.</p>}
        </section>

        {/* 이번 달 회계 */}
        <section className={card}>
          <div className="mb-2 flex items-center justify-between"><h2 className="text-[15px] font-bold text-ink">💰 이번 달 회계</h2><Link href="/finance/report" className="text-[13px] font-semibold text-primary hover:underline">보고서 →</Link></div>
          <div className="grid grid-cols-2 gap-2 text-[14px]">
            <div className="flex justify-between rounded-md bg-surface-soft px-3 py-2"><span className="text-ink-soft">수입</span><b className="text-success">{won(aIn)}</b></div>
            <div className="flex justify-between rounded-md bg-surface-soft px-3 py-2"><span className="text-ink-soft">지출</span><b className="text-unpaid">{won(aOut)}</b></div>
            <div className="flex justify-between rounded-md bg-surface-soft px-3 py-2"><span className="text-ink-soft">식대입금</span><b className="text-present">{won(sIn)}</b></div>
            <div className="flex justify-between rounded-md bg-surface-soft px-3 py-2"><span className="text-ink-soft">식대결재</span><b className="text-warning">{won(sOut)}</b></div>
          </div>
          {duesCount > 0 && <p className="mt-2 text-[13px] text-ink-soft">이번 달 연회비 입금 <b className="text-ink">{duesCount}건</b></p>}
        </section>
      </div>

      {/* 최근 공지 */}
      <section className={card}>
        <div className="mb-2 flex items-center justify-between"><h2 className="text-[15px] font-bold text-ink">📢 최근 공지</h2><Link href="/notices" className="text-[13px] font-semibold text-primary hover:underline">공지 →</Link></div>
        {anns.length ? (
          <ul className="flex flex-col gap-1.5">
            {anns.map((a) => (
              <li key={a.id} className="flex items-center gap-2 text-[14px]">
                <span className="rounded-full bg-surface-soft px-2 py-0.5 text-[11px] font-bold text-ink-soft">{a.category}</span>
                <span className="flex-1 truncate text-ink">{a.title}</span>
                <span className="text-[12px] text-muted">{new Date(a.created_at).getMonth() + 1}.{new Date(a.created_at).getDate()}</span>
              </li>
            ))}
          </ul>
        ) : <p className="text-[14px] text-ink-soft">아직 공지가 없어요.</p>}
      </section>

      {/* 바로가기 */}
      <section>
        <h2 className="mb-2 text-[15px] font-bold text-ink">바로가기</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[["/", "👥 회원"], ["/schedule", "📅 일정"], ["/attendance", "🍽 출석·식대"], ["/attendance/stats", "📊 출석 통계"], ["/finance", "💰 회계"], ["/content", "🎨 콘텐츠"], ["/archive", "📷 아카이브"], ["/notices", "📢 공지"]].map(([href, label]) => (
            <Link key={href} href={href} className="rounded-lg border border-line bg-card px-3 py-3 text-center text-[14px] font-semibold text-ink-soft transition hover:border-primary hover:text-primary">{label}</Link>
          ))}
        </div>
      </section>
    </div>
  );
}
