// 연간 일정 엑셀/CSV를 읽어 행으로 변환. 헤더 '날짜'를 찾고 회차·모드·주제·강사 인식.
import * as XLSX from "xlsx";
import type { Row, Mode } from "./generateSchedule";

const clean = (v: unknown): string | null => {
  if (v == null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
};

const MODE_MAP: Record<string, Mode> = {
  온라인: "online", 오프라인: "offline", 휴회: "recess", 미정: "pending",
  online: "online", offline: "offline", recess: "recess", pending: "pending",
};

function toYmd(v: unknown): string | null {
  if (v == null) return null;
  if (v instanceof Date) return `${v.getFullYear()}-${String(v.getMonth() + 1).padStart(2, "0")}-${String(v.getDate()).padStart(2, "0")}`;
  const m = String(v).trim().match(/(\d{4})[-./](\d{1,2})[-./](\d{1,2})/);
  return m ? `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}` : null;
}

export function parseScheduleXlsx(buf: ArrayBuffer): Row[] {
  const wb = XLSX.read(buf, { type: "array", cellDates: true });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, blankrows: false });

  let h = -1;
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    if (rows[i]?.some((c) => clean(c) === "날짜")) { h = i; break; }
  }
  if (h < 0) throw new Error("'날짜' 열을 찾지 못했어요. (회차·날짜·모드·주제·강사 헤더 필요)");

  const raw = rows[h] as unknown[];
  const headers: string[] = [];
  for (let i = 0; i < raw.length; i++) headers[i] = clean(raw[i]) ?? "";
  const find = (...kw: string[]) => headers.findIndex((x) => x !== "" && kw.some((k) => x.includes(k)));
  const iDate = find("날짜"), iSession = find("회차"), iMode = find("모드"), iTitle = find("주제"), iSpeaker = find("강사", "발제");

  const out: Row[] = [];
  for (let r = h + 1; r < rows.length; r++) {
    const row = (rows[r] as unknown[]) || [];
    const cell = (i: number) => (i >= 0 ? row[i] : null);
    const date = toYmd(cell(iDate));
    if (!date) continue;
    const nth = Math.ceil(new Date(date + "T00:00").getDate() / 7);
    const sRaw = clean(cell(iSession));
    const session = sRaw ? parseInt(String(sRaw).replace(/[^0-9]/g, ""), 10) || null : null;
    const modeRaw = clean(cell(iMode));
    const mode: Mode = (modeRaw && MODE_MAP[modeRaw]) || "pending";
    out.push({ date, nth, mode, session, title: clean(cell(iTitle)) ?? "", speaker: clean(cell(iSpeaker)) ?? "", note: "", program: "" });
  }
  out.sort((a, b) => a.date.localeCompare(b.date));
  return out;
}
