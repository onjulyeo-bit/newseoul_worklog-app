"use client";

// 콘텐츠 생성 허브 — 탭으로 '주간 모임'과 '경조사·안내'를 전환.
import { useState } from "react";
import ContentTool, { type MeetingOpt } from "./ContentTool";
import OccasionTool from "./OccasionTool";

export default function ContentHub({ meetings }: { meetings: MeetingOpt[] }) {
  const [tab, setTab] = useState<"weekly" | "occasion">("weekly");
  return (
    <div className="mx-auto max-w-[1100px] pt-2">
      <h1 className="mb-3 text-[22px] font-bold text-ink">콘텐츠 생성</h1>
      <div className="mb-4 flex gap-2">
        {[
          { v: "weekly", label: "주간 모임" },
          { v: "occasion", label: "경조사·안내" },
        ].map((t) => (
          <button
            key={t.v}
            onClick={() => setTab(t.v as "weekly" | "occasion")}
            className={`rounded-full px-4 py-2 text-[15px] font-semibold ${tab === t.v ? "bg-primary text-white" : "border border-line text-ink-soft hover:border-primary hover:text-primary"}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === "weekly" ? <ContentTool meetings={meetings} /> : <OccasionTool />}
    </div>
  );
}
