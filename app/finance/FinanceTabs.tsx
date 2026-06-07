"use client";

// 회계 서브탭 — 가져오기·내역·보고서 (현재 경로 강조). 부모 .moim-fin이 CSS 제공.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Upload, List, FileText } from "lucide-react";

const TABS = [
  { href: "/finance/import", label: "거래 가져오기", Icon: Upload },
  { href: "/finance/transactions", label: "거래 내역", Icon: List },
  { href: "/finance/report", label: "보고서", Icon: FileText },
];

export default function FinanceTabs() {
  const pathname = usePathname() ?? "";
  return (
    <div className="fin-subtabs">
      {TABS.map(({ href, label, Icon }) => (
        <Link key={href} href={href} className={`fin-subtab ${pathname.startsWith(href) ? "active" : ""}`}>
          <Icon size={16} /> {label}
        </Link>
      ))}
    </div>
  );
}
