"use client";

// 앱 셸 — 상단 헤더 + 가로 메뉴바 (클로드디자인 '모임온 앱' 시안 이식).
// 역할(임원/회원)별 메뉴, 현재 메뉴 파란 밑줄 강조. /checkin·랜딩·익명에선 숨김.
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, CalendarDays, ClipboardCheck, ReceiptText,
  Image as ImageIcon, Megaphone, BarChart3, Archive, LogOut, UserCog, Contact, GraduationCap,
} from "lucide-react";

type Item = { href: string; label: string; Icon: React.ComponentType<{ size?: number; strokeWidth?: number }>; group?: string };

// 업무 흐름순(사용자 지정). 운영 메뉴 → (구분선) → 설정(권한설정).
const ADMIN: Item[] = [
  { href: "/dashboard", label: "대시보드", Icon: LayoutDashboard, group: "main" },
  { href: "/", label: "회원관리", Icon: Users, group: "main" },
  { href: "/instructors", label: "강사·간사", Icon: GraduationCap, group: "main" },
  { href: "/schedule", label: "연간일정", Icon: CalendarDays, group: "main" },
  { href: "/content", label: "콘텐츠", Icon: ImageIcon, group: "main" },
  { href: "/notices", label: "공지", Icon: Megaphone, group: "main" },
  { href: "/attendance", label: "체크인·식대", Icon: ClipboardCheck, group: "main" },
  { href: "/finance", label: "회계", Icon: ReceiptText, group: "main" },
  { href: "/attendance/stats", label: "통계", Icon: BarChart3, group: "main" },
  { href: "/archive", label: "아카이브", Icon: Archive, group: "main" },
  { href: "/roles", label: "권한설정", Icon: UserCog, group: "settings" },
];
// 회원(member): 공지·회원명단·아카이브. 관심(guest): 공지·아카이브(개인정보 명단 제외).
const MEMBER: Item[] = [
  { href: "/", label: "공지", Icon: Megaphone },
  { href: "/directory", label: "회원명단", Icon: Contact },
  { href: "/archive", label: "아카이브", Icon: Archive },
];
const GUEST: Item[] = [
  { href: "/", label: "공지", Icon: Megaphone },
  { href: "/archive", label: "아카이브", Icon: Archive },
];

// 현재 경로에 가장 잘 맞는(가장 긴) href 하나만 active
function activeHref(pathname: string, items: Item[]): string | null {
  let best: string | null = null;
  for (const { href } of items) {
    const match = href === "/"
      ? pathname === "/" || pathname.startsWith("/members")
      : href === "/attendance/stats"
        ? pathname.startsWith("/attendance/stats") || pathname.startsWith("/attendance/registration") // 통계 탭(등록현황 포함)
        : pathname === href || pathname.startsWith(href + "/");
    if (match && (best === null || href.length > best.length)) best = href;
  }
  return best;
}

export default function SiteNav({ role, email, isOwner = false }: { role: string | null; email?: string | null; isOwner?: boolean }) {
  const pathname = usePathname() ?? "";

  if (pathname.startsWith("/checkin") || pathname.startsWith("/preview-landing")) return null;
  if (!role) return null; // 익명 → 랜딩 자체 헤더만

  const isExec = role === "admin";
  // 역할관리(/roles)는 메인 관리자(owner)에게만 노출. 서브 임원에겐 숨김.
  // 회원=공지·명단·아카이브, 관심=공지만.
  const items = isExec
    ? ADMIN.filter((it) => it.href !== "/roles" || isOwner)
    : role === "member" ? MEMBER : GUEST;
  const active = activeHref(pathname, items);
  const name = (email ?? "").split("@")[0] || "사용자";

  return (
    <div className="moim-shell">
      <style>{SHELL_CSS}</style>
      <header className="hdr">
        <div className="hdr-in">
          <Link href={isExec ? "/dashboard" : "/"} className="brand" aria-label="새서울 CBMC 홈">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <span className="brand-badge"><img src="/cbmc-symbol.webp" alt="CBMC" /></span>
            <span className="brand-name">CBMC <span className="brand-on">새서울지회</span></span>
          </Link>
          <div className="hdr-right">
            <div className="who">
              <span className="who-name">{name}</span>
              <span className="who-mail">{email}</span>
            </div>
            <span className={`role-badge ${isExec ? "is-exec" : ""}`}>
              <span className="role-dot" />{isExec ? "운영진" : role === "member" ? "회원" : "관심"}
            </span>
            <form action="/auth/signout" method="post">
              <button className="icon-btn" title="로그아웃" aria-label="로그아웃" type="submit"><LogOut size={19} /></button>
            </form>
          </div>
        </div>

        <nav className="navbar">
          <div className="navbar-in">
            {items.map(({ href, label, Icon, group }, i) => {
              const on = active === href;
              const prevGroup = i > 0 ? items[i - 1].group : undefined;
              const divider = group && prevGroup && group !== prevGroup;
              return (
                <span key={href} className="nav-cell">
                  {divider && <span className="nav-div" aria-hidden />}
                  <Link href={href} className={`navtab ${on ? "active" : ""}`}>
                    <Icon size={17} strokeWidth={on ? 2.4 : 2} /><span>{label}</span>
                  </Link>
                </span>
              );
            })}
          </div>
        </nav>
      </header>
    </div>
  );
}

const SHELL_CSS = `
.moim-shell{
  --brand:#0066cc; --brand-strong:#0052a8; --brand-soft:#e8f1fc; --brand-softer:#f3f8fe;
  --ink:#16181d; --ink-2:#3d424d; --ink-3:#767d8a; --line:#ecedf0; --maxw:1120px;
}
.moim-shell *{ box-sizing:border-box; }
@media print { .moim-shell{ display:none; } }
.moim-shell .hdr{ position:sticky; top:0; z-index:40; background:rgba(255,255,255,.86); backdrop-filter:saturate(180%) blur(14px); -webkit-backdrop-filter:saturate(180%) blur(14px); border-bottom:1px solid var(--line); }
.moim-shell .hdr-in{ max-width:var(--maxw); margin:0 auto; height:58px; padding:0 18px; display:flex; align-items:center; justify-content:space-between; gap:12px; }
.moim-shell .brand{ display:inline-flex; align-items:center; gap:9px; font-weight:800; font-size:19px; letter-spacing:-0.03em; color:var(--ink); text-decoration:none; }
.moim-shell .brand-badge{ width:30px; height:30px; border-radius:8px; display:grid; place-items:center; background:#fff; border:1px solid var(--line); padding:3px; box-shadow:0 1px 3px rgba(20,24,34,.08); flex-shrink:0; overflow:hidden; }
.moim-shell .brand-badge img{ width:100%; height:100%; object-fit:contain; display:block; }
.moim-shell .brand-on{ color:var(--brand); }
.moim-shell .hdr-right{ display:flex; align-items:center; gap:12px; }
.moim-shell .who{ display:none; flex-direction:column; align-items:flex-end; line-height:1.25; }
.moim-shell .who-name{ font-weight:700; font-size:13.5px; color:var(--ink); }
.moim-shell .who-mail{ font-size:11.5px; color:var(--ink-3); }
.moim-shell .role-badge{ display:inline-flex; align-items:center; gap:5px; font-size:12px; font-weight:700; letter-spacing:-0.02em; padding:4px 10px; border-radius:999px; white-space:nowrap; background:#eff0f2; color:#6b717c; }
.moim-shell .role-badge.is-exec{ background:var(--brand-soft); color:var(--brand-strong); }
.moim-shell .role-dot{ width:6px; height:6px; border-radius:50%; background:currentColor; }
.moim-shell .icon-btn{ width:36px; height:36px; border-radius:10px; display:grid; place-items:center; color:var(--ink-3); background:none; border:0; cursor:pointer; transition:background .15s, color .15s; }
.moim-shell .icon-btn:hover{ background:#f1f2f4; color:var(--ink); }
.moim-shell .navbar{ background:rgba(255,255,255,.86); border-bottom:1px solid var(--line); overflow-x:auto; scrollbar-width:none; }
.moim-shell .navbar::-webkit-scrollbar{ display:none; }
.moim-shell .navbar-in{ max-width:var(--maxw); margin:0 auto; padding:0 12px; display:flex; gap:2px; min-width:max-content; }
.moim-shell .nav-cell{ display:inline-flex; align-items:center; }
.moim-shell .nav-div{ width:1px; height:18px; margin:0 8px; background:var(--line); flex-shrink:0; }
.moim-shell .navtab{ position:relative; display:inline-flex; align-items:center; gap:7px; padding:13px 14px 14px; font-size:14.5px; font-weight:600; color:var(--ink-3); white-space:nowrap; text-decoration:none; transition:color .15s; }
.moim-shell .navtab:hover{ color:var(--ink-2); }
.moim-shell .navtab.active{ color:var(--brand); }
.moim-shell .navtab.active::after{ content:""; position:absolute; left:12px; right:12px; bottom:-1px; height:2.5px; border-radius:3px 3px 0 0; background:var(--brand); }
@media (min-width:760px){
  .moim-shell .hdr-in, .moim-shell .navbar-in{ padding-left:24px; padding-right:24px; }
  .moim-shell .who{ display:flex; }
}
`;
