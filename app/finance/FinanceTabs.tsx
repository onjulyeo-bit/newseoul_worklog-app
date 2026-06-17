"use client";

// 회계 서브탭 — 가져오기·내역·보고서 (현재 경로 강조). 부모 .moim-fin이 CSS 제공.
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Upload, List, FileText } from "lucide-react";

const TABS = [
  { href: "/finance/import", label: "거래 가져오기", Icon: Upload },
  { href: "/finance/transactions", label: "거래 내역", Icon: List },
  { href: "/finance/report", label: "보고서", Icon: FileText },
];

export default function FinanceTabs() {
  const pathname = usePathname() ?? "";
  const axis = useSearchParams().get("axis") === "meal" ? "meal" : "fee";
  return (
    <div className="fin-subtabs">
      {TABS.map(({ href, label, Icon }) => (
        // 보고서는 통합(축 무관) — 가져오기·내역만 axis 유지
        <Link key={href} href={href === "/finance/report" ? href : `${href}?axis=${axis}`} className={`fin-subtab ${pathname.startsWith(href) ? "active" : ""}`}>
          <Icon size={16} /> {label}
        </Link>
      ))}
    </div>
  );
}
