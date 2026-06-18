"use client";

// 통계 서브탭 — 체크인 통계 / 등록 현황. (현재 경로 강조)
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, BadgeCheck, PieChart } from "lucide-react";

const TABS = [
  { href: "/attendance/stats", label: "체크인 통계", Icon: BarChart3 },
  { href: "/attendance/registration", label: "연도별 회원등록 현황", Icon: BadgeCheck },
  { href: "/attendance/annual", label: "연간결산", Icon: PieChart },
];

export default function StatsTabs() {
  const p = usePathname() ?? "";
  return (
    <div className="mb-5 flex w-fit max-w-full gap-1 overflow-x-auto rounded-[14px] border border-line bg-card p-[5px]" style={{ scrollbarWidth: "none" }}>
      {TABS.map(({ href, label, Icon }) => {
        const on = p === href || p.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[10px] px-4 py-2 text-[14px] font-bold transition-colors ${on ? "bg-primary text-white shadow-[0_3px_10px_rgba(0,102,204,.25)]" : "text-ink-soft hover:text-ink"}`}
          >
            <Icon size={16} /> {label}
          </Link>
        );
      })}
    </div>
  );
}
