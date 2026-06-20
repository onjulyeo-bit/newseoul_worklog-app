// 운영 매뉴얼 섹션 정의 — 메타는 코드, 내용은 DB.
//   kind 'doc' = manual_sections 마크다운 문서, kind 'checklist' = manual_checklist 체크 기능.
import { Mic, ListChecks, BookOpen, Phone } from "lucide-react";

export type ManualKind = "doc" | "checklist";
export type ManualSectionMeta = {
  key: string;   // URL 경로(/manual/[key]) + DB key
  label: string;
  desc: string;
  kind: ManualKind;
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
};

export const MANUAL_SECTIONS: ManualSectionMeta[] = [
  { key: "worship-order", label: "모임 진행 순서", desc: "온·오프라인 예배 순서표 (사회자용)", kind: "doc", Icon: Mic },
  { key: "prep-checklist", label: "모임 준비 체크리스트", desc: "요일·역할별 준비 작업 (함께 체크)", kind: "checklist", Icon: ListChecks },
  { key: "staff-guide", label: "간사 업무 매뉴얼", desc: "주간 흐름·현장·식대 정산·회계·회비", kind: "doc", Icon: BookOpen },
  { key: "contacts", label: "연락처 · 계좌", desc: "중앙회·연합회 연락처, 회비·계좌 안내", kind: "doc", Icon: Phone },
];

export const manualSectionByKey = (key: string) => MANUAL_SECTIONS.find((s) => s.key === key) ?? null;
