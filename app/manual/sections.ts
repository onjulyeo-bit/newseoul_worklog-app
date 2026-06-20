// 운영 매뉴얼 섹션 정의 — 메타(키·라벨·설명·아이콘)는 코드, 본문(마크다운)은 DB(manual_sections).
import { Mic, ListChecks, CalendarClock, Coffee } from "lucide-react";

export type ManualSectionMeta = {
  key: string;   // URL 경로(/manual/[key]) + DB key
  label: string;
  desc: string;
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
};

export const MANUAL_SECTIONS: ManualSectionMeta[] = [
  { key: "worship-guide", label: "예배 사회자 가이드", desc: "모임 진행 순서·멘트 예시", Icon: Mic },
  { key: "role-todo", label: "직임별 TODO", desc: "지회장·총무·회계 등 역할별 책임", Icon: ListChecks },
  { key: "how-when", label: "방법·시기 안내", desc: "무엇을 언제·어떻게 (연중 운영)", Icon: CalendarClock },
  { key: "breakfast", label: "조찬모임", desc: "조찬 시기·장소·진행", Icon: Coffee },
];

export const manualSectionByKey = (key: string) => MANUAL_SECTIONS.find((s) => s.key === key) ?? null;
