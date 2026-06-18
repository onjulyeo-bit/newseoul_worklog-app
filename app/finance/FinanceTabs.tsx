"use client";

// 회계 서브탭 — 가져오기·내역·보고서 (현재 경로 강조). 부모 .moim-fin이 CSS 제공.
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Upload, List, FileText, CalendarRange, Landmark } from "lucide-react";

const TABS = [
  { href: "/finance/import", label: "거래 가져오기", Icon: Upload },
  { href: "/finance/transactions", label: "거래 내역", Icon: List },
  { href: "/finance/report", label: "보고서", Icon: FileText },
  { href: "/finance/dues", label: "연도별 회비 납부내역", Icon: CalendarRange },
  { href: "/finance/accounts", label: "계좌관리", Icon: Landmark },
];

// axis(회비/식대)를 유지하지 않는 탭 — 보고서·연도별회비·계좌관리는 통합/독립 (연간결산은 통계로 이동)
const NO_AXIS = ["/finance/report", "/finance/dues", "/finance/accounts"];

export default function FinanceTabs() {
  const pathname = usePathname() ?? "";
  const axis = useSearchParams().get("axis") === "meal" ? "meal" : "fee";
  return (
    <div className="fin-subtabs">
      {TABS.map(({ href, label, Icon }) => (
        <Link key={href} href={NO_AXIS.includes(href) ? href : `${href}?axis=${axis}`} className={`fin-subtab ${pathname.startsWith(href) ? "active" : ""}`}>
          <Icon size={16} /> {label}
        </Link>
      ))}
    </div>
  );
}
