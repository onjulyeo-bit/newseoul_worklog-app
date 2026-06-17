"use client";

// 아카이브 허브 — 6섹션 카드. 클릭하면 섹션 화면(/archive/[key]).
import Link from "next/link";
import { Clock, Crown, Image as ImageIcon, ClipboardList, FolderDown, PlayCircle, ChevronRight } from "lucide-react";
import { SECTIONS } from "./sections";

const ICONS: Record<string, React.ComponentType<{ size?: number }>> = {
  Clock, Crown, ImageIcon, ClipboardList, FolderDown, PlayCircle,
};

export default function ArchiveHub({ counts, isAdmin }: { counts: Record<string, number>; isAdmin: boolean }) {
  return (
    <div className="text-ink">
      <div className="mb-5">
        <h1 className="text-[clamp(21px,5vw,26px)] font-extrabold tracking-tight">새서울 CBMC 아카이브</h1>
        <p className="mt-1 text-[14px] font-medium text-ink-soft">연혁·역대 지회장·행사 사진·입회 안내·자료실·중앙회 소개를 한곳에.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SECTIONS.map((s) => {
          const Icon = ICONS[s.icon] ?? Clock;
          const n = counts[s.category] ?? 0;
          return (
            <Link key={s.key} href={`/archive/${s.key}`} className="group flex items-center gap-4 rounded-2xl border border-line bg-card p-5 transition-colors hover:border-primary">
              <span className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-xl bg-[rgba(0,102,204,.1)] text-primary"><Icon size={24} /></span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-[16px] font-bold">{s.label}</h3>
                  {n > 0 && <span className="rounded-full bg-surface-soft px-2 py-0.5 text-[11px] font-bold text-ink-soft">{n}</span>}
                </div>
                <p className="mt-0.5 truncate text-[13px] text-ink-soft">{s.desc}</p>
              </div>
              <ChevronRight size={18} className="text-muted transition-transform group-hover:translate-x-0.5" />
            </Link>
          );
        })}
      </div>

      {isAdmin && <p className="mt-5 text-[13px] text-ink-soft">※ 각 섹션에 들어가면 운영진은 기록을 추가·수정·삭제할 수 있어요.</p>}
    </div>
  );
}
