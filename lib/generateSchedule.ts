// 연간 일정 자동 생성: 금요일마다 온/오프/미정 + 회차 부여.
// 규칙: 1·3번째 금요일=온라인, 2·4번째=오프라인, 5번째·공휴일=미정(pending, 임원 결정).
// 회차는 기준점(어느 날짜=몇 회)을 받아, 휴회 제외하고 순서대로 매김.

export type Mode = "online" | "offline" | "recess" | "pending";
export type Row = {
  date: string;        // YYYY-MM-DD
  nth: number;         // 그 달의 N번째 금요일
  mode: Mode;
  session: number | null;
  title: string;
  speaker: string;
  note: string;
};

// 2026 대한민국 공휴일(빨간날) — 금요일에 걸리면 '미정'으로 표시(임원이 휴회 확정)
const HOLIDAYS_2026: Record<string, string> = {
  "2026-01-01": "신정", "2026-02-16": "설날", "2026-02-17": "설날", "2026-02-18": "설날",
  "2026-03-01": "삼일절", "2026-03-02": "대체공휴일", "2026-05-05": "어린이날",
  "2026-05-24": "부처님오신날", "2026-05-25": "대체공휴일", "2026-06-06": "현충일",
  "2026-08-15": "광복절", "2026-08-17": "대체공휴일", "2026-09-24": "추석", "2026-09-25": "추석",
  "2026-09-26": "추석", "2026-10-03": "개천절", "2026-10-05": "대체공휴일", "2026-10-09": "한글날",
  "2026-12-25": "성탄절",
};

function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// 한 해의 모든 금요일 (요일 5 = 금)
function fridaysOfYear(year: number): Date[] {
  const out: Date[] = [];
  const d = new Date(year, 0, 1);
  while (d.getDay() !== 5) d.setDate(d.getDate() + 1);
  while (d.getFullYear() === year) {
    out.push(new Date(d));
    d.setDate(d.getDate() + 7);
  }
  return out;
}

export function generateSchedule(year: number, anchorDate: string, anchorSession: number): Row[] {
  const rows: Row[] = fridaysOfYear(year).map((d) => {
    const date = ymd(d);
    const nth = Math.ceil(d.getDate() / 7); // 그 달 N번째 금요일
    const holiday = HOLIDAYS_2026[date];
    let mode: Mode;
    let note = "";
    if (holiday) { mode = "pending"; note = `공휴일: ${holiday}`; }
    else if (nth === 5) { mode = "pending"; note = "5번째 금요일"; }
    else if (nth === 1 || nth === 3) { mode = "online"; }
    else { mode = "offline"; }
    return { date, nth, mode, session: null, title: "", speaker: "", note };
  });
  return renumber(rows, anchorDate, anchorSession);
}

// 회차 재계산: 기준날짜=기준회차, 휴회(recess) 제외하고 순서대로
export function renumber(rows: Row[], anchorDate: string, anchorSession: number): Row[] {
  const sorted = [...rows].sort((a, b) => a.date.localeCompare(b.date));
  const ai = sorted.findIndex((r) => r.date === anchorDate);
  if (ai < 0) {
    // 기준 날짜가 목록에 없으면 회차 비움
    sorted.forEach((r) => (r.session = null));
    return sorted;
  }
  let s = anchorSession;
  for (let i = ai; i < sorted.length; i++) {
    if (sorted[i].mode === "recess") sorted[i].session = null;
    else { sorted[i].session = s; s++; }
  }
  let back = anchorSession - 1;
  for (let i = ai - 1; i >= 0; i--) {
    if (sorted[i].mode === "recess") sorted[i].session = null;
    else { sorted[i].session = back; back--; }
  }
  return sorted;
}
