"use client";

// 회계 2축 — 회비 관리 / 식대 관리 (식대는 별도 계좌). URL ?axis=fee|meal 로 가져오기·내역을 스코프.
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Wallet, UtensilsCrossed } from "lucide-react";

const AXES = [
  { k: "fee", label: "회비 관리", Icon: Wallet },
  { k: "meal", label: "식대 관리", Icon: UtensilsCrossed },
];

export function useAxis(): "fee" | "meal" {
  const sp = useSearchParams();
  return sp.get("axis") === "meal" ? "meal" : "fee";
}

export default function FinanceAxis() {
  const pathname = usePathname() ?? "/finance/transactions";
  const cur = useAxis();
  return (
    <div className="fin-axis">
      {AXES.map(({ k, label, Icon }) => (
        <Link key={k} href={`${pathname}?axis=${k}`} className={`fin-axis-btn ${cur === k ? "on" : ""}`}>
          <Icon size={17} /> {label}
        </Link>
      ))}
    </div>
  );
}
