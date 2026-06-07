"use client";

// 콘텐츠 생성 허브 ⑫ — 클로드디자인 모임온 톤(헤더·서브탭). 주간 포스터 / 경조사 전환.
import { useState } from "react";
import { Image as ImageIcon, CalendarHeart } from "lucide-react";
import ContentTool, { type MeetingOpt } from "./ContentTool";
import OccasionTool from "./OccasionTool";

export default function ContentHub({ meetings }: { meetings: MeetingOpt[] }) {
  const [tab, setTab] = useState<"weekly" | "occasion">("weekly");
  return (
    <div className="moim-content">
      <style>{HUB_CSS}</style>
      <div className="page-head"><div><h1 className="page-title">콘텐츠 생성</h1><p className="page-sub">이번 주 포스터와 안내글을 몇 번의 클릭으로 만들어요.</p></div></div>
      <div className="fin-subtabs">
        <button className={`fin-subtab ${tab === "weekly" ? "active" : ""}`} onClick={() => setTab("weekly")}><ImageIcon size={16} /> 주간 포스터</button>
        <button className={`fin-subtab ${tab === "occasion" ? "active" : ""}`} onClick={() => setTab("occasion")}><CalendarHeart size={16} /> 경조사 안내</button>
      </div>
      {tab === "weekly" ? <ContentTool meetings={meetings} /> : <OccasionTool />}
    </div>
  );
}

const HUB_CSS = `
.moim-content{ --brand:#0066cc; --line:#ecedf0; --ink:#16181d; --ink-3:#767d8a; color:var(--ink); }
.moim-content .page-head{ margin-bottom:16px; }
.moim-content .page-title{ font-size:clamp(21px,5vw,26px); font-weight:800; letter-spacing:-0.04em; }
.moim-content .page-sub{ color:var(--ink-3); font-size:14px; margin-top:5px; font-weight:500; }
.moim-content .fin-subtabs{ display:flex; gap:4px; background:#fff; border:1px solid var(--line); border-radius:14px; padding:5px; margin-bottom:22px; width:fit-content; max-width:100%; overflow-x:auto; scrollbar-width:none; }
.moim-content .fin-subtabs::-webkit-scrollbar{ display:none; }
.moim-content .fin-subtab{ display:inline-flex; align-items:center; gap:6px; font-size:14px; font-weight:700; color:var(--ink-3); padding:9px 16px; border-radius:10px; white-space:nowrap; border:0; background:none; cursor:pointer; transition:background .15s, color .15s; }
.moim-content .fin-subtab:hover{ color:var(--ink); }
.moim-content .fin-subtab.active{ background:var(--brand); color:#fff; box-shadow:0 3px 10px rgba(0,102,204,.25); }
`;
