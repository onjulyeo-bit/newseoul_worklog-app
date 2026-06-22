"use client";

// 아카이브 허브 — 6섹션 카드. 클로드디자인(아카이브.dc.html) 비주얼 이식.
import Link from "next/link";
import { Clock, Crown, Image as ImageIcon, ClipboardList, FolderDown, PlayCircle, ChevronRight } from "lucide-react";
import { SECTIONS } from "./sections";
import { ARC_CSS } from "./arcCss";

const ICONS: Record<string, React.ComponentType<{ size?: number; strokeWidth?: number }>> = {
  Clock, Crown, ImageIcon, ClipboardList, FolderDown, PlayCircle,
};

export default function ArchiveHub({ counts, isAdmin }: { counts: Record<string, number>; isAdmin: boolean }) {
  return (
    <div className="moim-arc">
      <style>{ARC_CSS}</style>
      <div className="arc-wrap">
        <h1 className="arc-h1">새서울 CBMC 아카이브</h1>
        <p className="arc-sub">연혁·역대 지회장·행사 사진·자료실·중앙회 소개를 한곳에 모았어요.</p>

        <div className="arc-grid">
          {SECTIONS.map((s) => {
            const Icon = ICONS[s.icon] ?? Clock;
            const n = counts[s.category] ?? 0;
            const unit = s.key === "chairs" ? "명" : "건";
            return (
              <Link key={s.key} href={`/archive/${s.key}`} className="arc-card">
                <div className="arc-card-top">
                  <span className="arc-ic"><Icon size={24} strokeWidth={2} /></span>
                  <ChevronRight className="arc-chev" size={22} strokeWidth={2.2} />
                </div>
                <div>
                  <div className="arc-ct">{s.label}</div>
                  <div className="arc-cd">{s.desc}</div>
                </div>
                <span className="arc-count">{n}{unit}</span>
              </Link>
            );
          })}
        </div>

        {isAdmin && <p className="arc-sub" style={{ marginTop: 18, marginBottom: 0, fontSize: 13 }}>※ 각 섹션에 들어가면 운영진은 기록을 추가·삭제할 수 있어요.</p>}
      </div>
    </div>
  );
}
