// 대시보드 표현부 — 클로드디자인 '모임온 앱' 시안 이식. 데이터는 page.tsx(서버)에서 주입.
import Link from "next/link";
import {
  Users, UserCheck, TrendingUp, CalendarClock, User, MapPin, Clock,
  ClipboardCheck, Image as ImageIcon, Megaphone, ChevronRight, CalendarDays, ReceiptText, BarChart3,
} from "lucide-react";

export type DashMeeting = { session_no: number | null; date: string; mode: string; title: string | null; speaker: string | null; program: string | null };
export type DashAnn = { id: string | number; category: string; title: string; created_at: string };

const won = (n: number) => "₩" + (n || 0).toLocaleString("ko-KR");
const DAYS = ["일", "월", "화", "수", "목", "금", "토"];
const fmtFull = (d: string) => { const t = new Date(d + "T00:00"); return { md: `${t.getMonth() + 1}월 ${t.getDate()}일`, day: DAYS[t.getDay()] }; };
const fmtShort = (d: string) => { const t = new Date(d + "T00:00"); return `${t.getMonth() + 1}.${t.getDate()} (${DAYS[t.getDay()]})`; };
const mdNum = (iso: string) => { const t = new Date(iso); return `${t.getMonth() + 1}.${t.getDate()}`; };
const noticeTone = (c: string) => (c === "공지" ? "b-blue" : c === "포럼" ? "b-brand" : c === "경조사" ? "b-warm" : "b-gray");

const SHORTCUTS = [
  { href: "/", label: "회원관리", Icon: Users, desc: "명단·등급" },
  { href: "/schedule", label: "연간일정", Icon: CalendarDays, desc: "금요 모임" },
  { href: "/attendance", label: "출석·식대", Icon: ClipboardCheck, desc: "체크·정산" },
  { href: "/finance", label: "회계", Icon: ReceiptText, desc: "수입·지출" },
  { href: "/content", label: "콘텐츠 생성", Icon: ImageIcon, desc: "포스터·안내" },
  { href: "/notices", label: "공지", Icon: Megaphone, desc: "게시·전달" },
  { href: "/attendance/stats", label: "출석통계", Icon: BarChart3, desc: "출석률" },
];

function Stat({ Icon, tone, label, value, sub }: { Icon: React.ComponentType<{ size?: number }>; tone: string; label: string; value: string; sub?: string }) {
  return (
    <div className="card stat">
      <div className={`stat-ic ${tone}`}><Icon size={20} /></div>
      <div className="stat-body">
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
        {sub && <div className="stat-sub">{sub}</div>}
      </div>
    </div>
  );
}

export default function DashboardView({
  name, next, upcoming, place, time, mTotal, mActive, income, expense, meetingsCount, anns,
}: {
  name: string; next: DashMeeting | null; upcoming: DashMeeting[]; place?: string | null; time?: string | null;
  mTotal: number; mActive: number; income: number; expense: number; meetingsCount: number; anns: DashAnn[];
}) {
  return (
    <div className="moim-dash">
      <style>{DASH_CSS}</style>

      <div className="dash-hi">
        <h1 className="dash-greet">안녕하세요, {name}님</h1>
        <p className="dash-greet-sub">이번 주 모임 현황을 한눈에 확인하세요.</p>
      </div>

      <div className="dash-grid">
        {/* 이번 주 모임 */}
        <section>
          <div className="sec-row"><h2 className="sec-title">이번 주 모임</h2>
            <Link className="link-btn" href="/schedule">연간일정 <ChevronRight size={15} /></Link></div>
          {next ? (() => {
            const f = fmtFull(next.date); const offline = next.mode === "offline";
            return (
              <div className="card meet">
                <div className="meet-top">
                  <div className="meet-when">
                    <span className="meet-date">{f.md}</span>
                    <span className="meet-day">({f.day})</span>
                    <span className={`badge ${offline ? "b-brand" : "b-blue"}`}><span className="badge-dot" />{offline ? "오프라인" : "온라인"}</span>
                  </div>
                  {next.session_no != null && <span className="meet-round">제 {next.session_no}회차</span>}
                </div>
                <div className="meet-main">
                  {next.program && <span className="meet-prog">{next.program}</span>}
                  <h3 className="meet-topic">{next.title || "주제 미정"}</h3>
                  <div className="meet-meta">
                    {next.speaker && <span><User size={15} style={{ color: "var(--ink-3)" }} /> {next.speaker}</span>}
                    {place && <span><MapPin size={15} style={{ color: "var(--ink-3)" }} /> {place}</span>}
                    {time && <span><Clock size={15} style={{ color: "var(--ink-3)" }} /> {time}</span>}
                  </div>
                </div>
                <div className="meet-actions">
                  <Link className="ui-btn ui-primary ui-md" href="/attendance"><ClipboardCheck size={18} /> 출석 관리</Link>
                  <Link className="ui-btn ui-soft ui-md" href="/content"><ImageIcon size={18} /> 포스터 만들기</Link>
                </div>
              </div>
            );
          })() : <div className="card card-pad"><p className="empty">예정된 모임이 없어요.</p></div>}
        </section>

        {/* 요약 */}
        <section>
          <div className="sec-row"><h2 className="sec-title">요약</h2></div>
          <div className="stat-grid">
            <Stat Icon={Users} tone="t-brand" label="전체 회원" value={`${mTotal}명`} />
            <Stat Icon={UserCheck} tone="t-green" label="활동 회원" value={`${mActive}명`} />
            <Stat Icon={TrendingUp} tone="t-blue" label="이번 달 수입" value={won(income)} sub={`지출 ${won(expense)} · 순 ${won(income - expense)}`} />
            <Stat Icon={CalendarClock} tone="t-warm" label="다가오는 일정" value={`${meetingsCount}건`} />
          </div>
        </section>
      </div>

      {/* 바로가기 */}
      <section className="dash-sec">
        <div className="sec-row"><div><h2 className="sec-title">바로가기</h2><p className="sec-sub">자주 쓰는 메뉴로 빠르게 이동</p></div></div>
        <div className="quick-grid">
          {SHORTCUTS.map(({ href, label, Icon, desc }) => (
            <Link key={href} href={href} className="quick">
              <span className="quick-ic"><Icon size={22} /></span>
              <span className="quick-label">{label}</span>
              <span className="quick-desc">{desc}</span>
            </Link>
          ))}
        </div>
      </section>

      <div className="dash-grid2">
        {/* 최근 공지 */}
        <section>
          <div className="sec-row"><h2 className="sec-title">최근 공지</h2>
            <Link className="link-btn" href="/notices">전체보기 <ChevronRight size={15} /></Link></div>
          <div className="card" style={{ padding: 0 }}>
            {anns.length ? (
              <ul className="notice-list">
                {anns.map((a) => (
                  <li key={a.id} className="notice-row">
                    <span className={`badge ${noticeTone(a.category)}`}>{a.category}</span>
                    <span className="notice-title">{a.title}</span>
                    <span className="notice-date">{mdNum(a.created_at)}</span>
                  </li>
                ))}
              </ul>
            ) : <p className="empty" style={{ padding: "22px 18px" }}>아직 공지가 없어요.</p>}
          </div>
        </section>

        {/* 다가오는 일정 */}
        <section>
          <div className="sec-row"><h2 className="sec-title">다가오는 일정</h2>
            <Link className="link-btn" href="/schedule">연간일정 <ChevronRight size={15} /></Link></div>
          <div className="card" style={{ padding: 0 }}>
            {upcoming.length ? (
              <ul className="up-list">
                {upcoming.map((u, i) => (
                  <li key={i} className="up-row">
                    <span className="up-date">{fmtShort(u.date)}</span>
                    {u.session_no != null && <span className="up-round">{u.session_no}회</span>}
                    <span className="up-prog">{u.program || u.title || "—"}</span>
                    <span className={`badge ${u.mode === "offline" ? "b-brand" : "b-blue"}`}>{u.mode === "offline" ? "오프라인" : "온라인"}</span>
                  </li>
                ))}
              </ul>
            ) : <p className="empty" style={{ padding: "22px 18px" }}>예정된 일정이 없어요.</p>}
          </div>
        </section>
      </div>
    </div>
  );
}

const DASH_CSS = `
.moim-dash{
  --brand:#0066cc; --brand-strong:#0052a8; --brand-soft:#e8f1fc; --brand-softer:#f3f8fe;
  --ink:#16181d; --ink-2:#3d424d; --ink-3:#767d8a; --line:#ecedf0; --bg:#ffffff; --bg-warm:#fafafb;
  --green:#0a7d3f; --green-soft:#e4f6ec;
  --radius-btn:14px; --radius-card:20px;
  --shadow-sm:0 1px 2px rgba(20,24,34,.04), 0 3px 12px rgba(20,24,34,.045);
  --shadow-md:0 2px 6px rgba(20,24,34,.05), 0 14px 38px rgba(20,40,80,.08);
  color:var(--ink); line-height:1.5; letter-spacing:-0.01em;
}
.moim-dash *{ box-sizing:border-box; }
.moim-dash h1,.moim-dash h2,.moim-dash h3,.moim-dash p,.moim-dash ul{ margin:0; padding:0; }
.moim-dash ul{ list-style:none; }
.moim-dash svg{ display:block; }
.moim-dash .empty{ color:var(--ink-3); font-size:14px; font-weight:500; }

.moim-dash .card{ background:var(--bg); border:1px solid var(--line); border-radius:var(--radius-card); box-shadow:var(--shadow-sm); }
.moim-dash .card-pad{ padding:20px; }

.moim-dash .badge{ display:inline-flex; align-items:center; gap:5px; font-size:12px; font-weight:700; letter-spacing:-0.02em; padding:4px 10px; border-radius:999px; white-space:nowrap; }
.moim-dash .badge-dot{ width:6px; height:6px; border-radius:50%; background:currentColor; }
.moim-dash .b-brand{ background:var(--brand-soft); color:var(--brand-strong); }
.moim-dash .b-blue{ background:#eaf2fd; color:#0b62c4; }
.moim-dash .b-green{ background:var(--green-soft); color:var(--green); }
.moim-dash .b-warm{ background:#fcefe7; color:#b5562a; }
.moim-dash .b-gray{ background:#eff0f2; color:#6b717c; }

.moim-dash .ui-btn{ display:inline-flex; align-items:center; justify-content:center; gap:7px; font-weight:600; letter-spacing:-0.02em; border-radius:var(--radius-btn); text-decoration:none; transition:background .15s, box-shadow .15s, transform .12s; white-space:nowrap; }
.moim-dash .ui-btn:active{ transform:translateY(1px) scale(.99); }
.moim-dash .ui-md{ font-size:14.5px; padding:11px 17px; }
.moim-dash .ui-primary{ background:var(--brand); color:#fff; box-shadow:0 5px 14px rgba(0,102,204,.22); }
.moim-dash .ui-soft{ background:var(--brand-soft); color:var(--brand-strong); }

.moim-dash .sec-row{ display:flex; align-items:flex-end; justify-content:space-between; gap:12px; margin-bottom:14px; }
.moim-dash .sec-title{ font-size:17px; font-weight:800; letter-spacing:-0.03em; }
.moim-dash .sec-sub{ font-size:13px; color:var(--ink-3); margin-top:3px; font-weight:500; }
.moim-dash .link-btn{ display:inline-flex; align-items:center; gap:2px; font-size:13.5px; font-weight:600; color:var(--brand); text-decoration:none; }
.moim-dash .link-btn:hover{ color:var(--brand-strong); }

.moim-dash .stat{ padding:16px; display:flex; gap:13px; align-items:flex-start; min-width:0; }
.moim-dash .stat-ic{ width:40px; height:40px; border-radius:12px; display:grid; place-items:center; flex-shrink:0; }
.moim-dash .stat-ic.t-brand{ background:var(--brand-soft); color:var(--brand); }
.moim-dash .stat-ic.t-green{ background:var(--green-soft); color:var(--green); }
.moim-dash .stat-ic.t-blue{ background:#eaf2fd; color:#0b62c4; }
.moim-dash .stat-ic.t-warm{ background:#fcefe7; color:#b5562a; }
.moim-dash .stat-body{ min-width:0; }
.moim-dash .stat-label{ font-size:12.5px; color:var(--ink-3); font-weight:600; }
.moim-dash .stat-value{ font-size:20px; font-weight:800; letter-spacing:-0.03em; margin-top:3px; }
.moim-dash .stat-sub{ font-size:11.5px; color:var(--ink-3); margin-top:3px; font-weight:500; }

.moim-dash .dash-hi{ margin-bottom:22px; }
.moim-dash .dash-greet{ font-size:clamp(21px,5.5vw,26px); font-weight:800; letter-spacing:-0.04em; }
.moim-dash .dash-greet-sub{ color:var(--ink-3); font-size:14.5px; margin-top:5px; font-weight:500; }
.moim-dash .dash-grid{ display:flex; flex-direction:column; gap:26px; }
.moim-dash .dash-grid2{ display:grid; grid-template-columns:1fr; gap:26px; margin-top:26px; }
.moim-dash .dash-sec{ margin-top:26px; }
.moim-dash .stat-grid{ display:grid; grid-template-columns:repeat(2,1fr); gap:12px; }

.moim-dash .meet{ padding:22px; }
.moim-dash .meet-top{ display:flex; align-items:center; justify-content:space-between; gap:10px; padding-bottom:16px; border-bottom:1px solid var(--line); }
.moim-dash .meet-when{ display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
.moim-dash .meet-date{ font-size:18px; font-weight:800; letter-spacing:-0.03em; }
.moim-dash .meet-day{ font-size:15px; color:var(--ink-3); font-weight:600; }
.moim-dash .meet-round{ font-size:13px; font-weight:700; color:var(--ink-3); background:var(--bg-warm); border:1px solid var(--line); padding:5px 11px; border-radius:999px; }
.moim-dash .meet-main{ padding:16px 0 18px; }
.moim-dash .meet-prog{ display:inline-block; font-size:12.5px; font-weight:700; color:var(--brand-strong); background:var(--brand-soft); padding:4px 11px; border-radius:999px; margin-bottom:10px; }
.moim-dash .meet-topic{ font-size:clamp(19px,5vw,23px); font-weight:800; letter-spacing:-0.035em; line-height:1.3; }
.moim-dash .meet-meta{ display:flex; flex-wrap:wrap; gap:8px 18px; margin-top:14px; }
.moim-dash .meet-meta span{ display:inline-flex; align-items:center; gap:6px; font-size:13.5px; color:var(--ink-2); font-weight:500; }
.moim-dash .meet-actions{ display:flex; gap:9px; }
.moim-dash .meet-actions .ui-btn{ flex:1; }

.moim-dash .quick-grid{ display:grid; grid-template-columns:repeat(2,1fr); gap:12px; }
.moim-dash .quick{ background:var(--bg); border:1px solid var(--line); border-radius:16px; padding:18px 14px; display:flex; flex-direction:column; align-items:flex-start; gap:4px; box-shadow:var(--shadow-sm); transition:transform .15s, box-shadow .15s, border-color .15s; text-align:left; min-width:0; text-decoration:none; color:var(--ink); }
.moim-dash .quick:hover{ transform:translateY(-2px); box-shadow:var(--shadow-md); border-color:#dde7f3; }
.moim-dash .quick-ic{ width:42px; height:42px; border-radius:12px; display:grid; place-items:center; background:var(--brand-soft); color:var(--brand); margin-bottom:8px; }
.moim-dash .quick-label{ font-weight:700; font-size:15px; letter-spacing:-0.03em; }
.moim-dash .quick-desc{ font-size:12px; color:var(--ink-3); font-weight:500; }

.moim-dash .notice-list,.moim-dash .up-list{ display:flex; flex-direction:column; }
.moim-dash .notice-row{ display:flex; align-items:center; gap:11px; padding:15px 18px; border-bottom:1px solid var(--line); }
.moim-dash .notice-row:last-child{ border-bottom:0; }
.moim-dash .notice-title{ flex:1; font-size:14.5px; font-weight:600; color:var(--ink); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.moim-dash .notice-date{ font-size:12.5px; color:var(--ink-3); font-weight:500; flex-shrink:0; }
.moim-dash .up-row{ display:flex; align-items:center; gap:11px; padding:14px 18px; border-bottom:1px solid var(--line); }
.moim-dash .up-row:last-child{ border-bottom:0; }
.moim-dash .up-date{ font-size:14px; font-weight:700; min-width:92px; }
.moim-dash .up-round{ font-size:12.5px; color:var(--ink-3); font-weight:600; }
.moim-dash .up-prog{ flex:1; font-size:14px; font-weight:600; color:var(--ink-2); }

@media (min-width:560px){
  .moim-dash .stat-grid{ grid-template-columns:repeat(4,1fr); }
  .moim-dash .quick-grid{ grid-template-columns:repeat(4,1fr); }
}
@media (min-width:760px){
  .moim-dash .dash-grid2{ grid-template-columns:1fr 1fr; }
  .moim-dash .quick-grid{ grid-template-columns:repeat(7,1fr); }
  .moim-dash .quick{ align-items:center; text-align:center; }
}
`;
