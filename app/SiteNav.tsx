"use client";

// 앱 셸 — 상단 헤더 + 가로 메뉴바 (클로드디자인 '모임온 앱' 시안 이식).
// 역할(임원/회원)별 메뉴, 현재 메뉴 파란 밑줄 강조. /checkin·랜딩·익명에선 숨김.
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, CalendarDays, ClipboardCheck, ReceiptText,
  Image as ImageIcon, Megaphone, BarChart3, Archive, LogOut,
} from "lucide-react";

type Item = { href: string; label: string; Icon: React.ComponentType<{ size?: number; strokeWidth?: number }> };

const ADMIN: Item[] = [
  { href: "/dashboard", label: "대시보드", Icon: LayoutDashboard },
  { href: "/", label: "회원관리", Icon: Users },
  { href: "/schedule", label: "연간일정", Icon: CalendarDays },
  { href: "/attendance", label: "출석식대", Icon: ClipboardCheck },
  { href: "/finance", label: "회계", Icon: ReceiptText },
  { href: "/content", label: "콘텐츠", Icon: ImageIcon },
  { href: "/notices", label: "공지", Icon: Megaphone },
  { href: "/attendance/stats", label: "출석통계", Icon: BarChart3 },
  { href: "/archive", label: "아카이브", Icon: Archive },
];
const MEMBER: Item[] = [{ href: "/", label: "공지", Icon: Megaphone }];

// 현재 경로에 가장 잘 맞는(가장 긴) href 하나만 active
function activeHref(pathname: string, items: Item[]): string | null {
  let best: string | null = null;
  for (const { href } of items) {
    const match = href === "/"
      ? pathname === "/" || pathname.startsWith("/members")
      : pathname === href || pathname.startsWith(href + "/");
    if (match && (best === null || href.length > best.length)) best = href;
  }
  return best;
}

export default function SiteNav({ role, email }: { role: string | null; email?: string | null }) {
  const pathname = usePathname() ?? "";

  if (pathname.startsWith("/checkin") || pathname.startsWith("/preview-landing")) return null;
  if (!role) return null; // 익명 → 랜딩 자체 헤더만

  const isExec = role === "admin";
  const items = isExec ? ADMIN : MEMBER;
  const active = activeHref(pathname, items);
  const name = (email ?? "").split("@")[0] || "사용자";

  return (
    <div className="moim-shell">
      <style>{SHELL_CSS}</style>
      <header className="hdr">
        <div className="hdr-in">
          <Link href={isExec ? "/dashboard" : "/"} className="brand" aria-label="모임온 홈">
            <span className="brand-badge">ON</span>
            <span className="brand-name">모임<span className="brand-on">온</span></span>
          </Link>
          <div className="hdr-right">
            <div className="who">
              <span className="who-name">{name}</span>
              <span className="who-mail">{email}</span>
            </div>
            <span className={`role-badge ${isExec ? "is-exec" : ""}`}>
              <span className="role-dot" />{isExec ? "임원" : "회원"}
            </span>
            <form action="/auth/signout" method="post">
              <button className="icon-btn" title="로그아웃" aria-label="로그아웃" type="submit"><LogOut size={19} /></button>
            </form>
          </div>
        </div>

        <nav className="navbar">
          <div className="navbar-in">
            {items.map(({ href, label, Icon }) => {
              const on = active === href;
              return (
                <Link key={href} href={href} className={`navtab ${on ? "active" : ""}`}>
                  <Icon size={17} strokeWidth={on ? 2.4 : 2} /><span>{label}</span>
                </Link>
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
.moim-shell .brand-badge{ width:26px; height:26px; border-radius:9px; display:grid; place-items:center; background:var(--brand); color:#fff; font-size:12.5px; font-weight:800; box-shadow:0 3px 9px rgba(0,102,204,.32); }
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
.moim-shell .navtab{ position:relative; display:inline-flex; align-items:center; gap:7px; padding:13px 14px 14px; font-size:14.5px; font-weight:600; color:var(--ink-3); white-space:nowrap; text-decoration:none; transition:color .15s; }
.moim-shell .navtab:hover{ color:var(--ink-2); }
.moim-shell .navtab.active{ color:var(--brand); }
.moim-shell .navtab.active::after{ content:""; position:absolute; left:12px; right:12px; bottom:-1px; height:2.5px; border-radius:3px 3px 0 0; background:var(--brand); }
@media (min-width:760px){
  .moim-shell .hdr-in, .moim-shell .navbar-in{ padding-left:24px; padding-right:24px; }
  .moim-shell .who{ display:flex; }
}
`;
