// 아카이브 6섹션 정의 — 기존 archive 테이블의 category로 구분.
// layout: 화면 표시 방식. uploadDocs=true면 사진 대신 문서(PDF·HWP 등) 업로드.
export type SectionLayout = "timeline" | "people" | "gallery" | "docs" | "text" | "intro";

export type Section = {
  key: string;        // URL 경로(/archive/[key])
  category: string;   // archive.category 값
  label: string;
  desc: string;
  icon: string;       // lucide 아이콘 이름 (컴포넌트에서 매핑)
  layout: SectionLayout;
  uploadDocs?: boolean;
};

export const SECTIONS: Section[] = [
  { key: "history", category: "연혁", label: "새서울 연혁", desc: "걸어온 길을 연표로", icon: "Clock", layout: "timeline" },
  { key: "chairs", category: "역대지회장", label: "역대 지회장", desc: "역대 지회장 명단", icon: "Crown", layout: "people" },
  { key: "events", category: "행사사진", label: "주요행사 스케치", desc: "행사 사진 모음", icon: "ImageIcon", layout: "gallery" },
  { key: "resources", category: "자료실", label: "자료실", desc: "입회서류·기부금영수증 신청서 등", icon: "FolderDown", layout: "docs", uploadDocs: true },
  { key: "intro", category: "CBMC소개", label: "CBMC 소개", desc: "중앙회 소개 영상·자료", icon: "PlayCircle", layout: "intro" },
];

export const sectionByKey = (key: string) => SECTIONS.find((s) => s.key === key) ?? null;
