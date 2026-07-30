// 게스트 명단 붙여넣기 파서.
//   "1.김병민(다니엘) 2.박예찬(다니엘) 3.황혜진(153) ..." 처럼
//   번호 마커(1. 2. …)가 한 줄에 이어져 있어도, 줄바꿈으로 나뉘어 있어도 모두 처리.
//   각 항목은 "이름(지회명)" 형식. 괄호가 없으면 지회명은 null.
//   지회명이 숫자(153 등)여도 안전하도록, 항목 구분은 "숫자." (마침표) 마커만 사용한다.
export type ParsedGuest = { name: string; branch: string | null };

export function parseGuestLines(text: string): ParsedGuest[] {
  const withBreaks = text.replace(/\s*\d+\s*\.\s*/g, "\n"); // "1." "17." 마커 → 줄바꿈(번호 제거). "(153)"의 ")"는 안전.
  return withBreaks
    .split(/\r?\n/)
    .map((raw): ParsedGuest | null => {
      const s = raw.trim();
      if (!s) return null;
      const m = s.match(/^(.+?)\s*[(（]\s*(.+?)\s*[)）]\s*$/); // 이름(지회) — 반각·전각 괄호 모두
      return m ? { name: m[1].trim(), branch: m[2].trim() } : { name: s, branch: null };
    })
    .filter((g): g is ParsedGuest => !!g && g.name.length > 0);
}
