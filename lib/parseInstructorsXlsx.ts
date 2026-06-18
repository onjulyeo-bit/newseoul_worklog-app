// 강사·간사 엑셀 → 행(name·kind·is_external·org·phone·field·fee_note·note) 변환.
// 양식 열: 이름 · 구분(강사/간사) · 소속(내부/외부) · 소속·직함 · 연락처 · 전문분야 · 강사비메모 · 비고
import * as XLSX from "xlsx";

export type InstructorRow = { name: string; kind: string; is_external: boolean; org: string; phone: string; field: string; fee_note: string; note: string };

const clean = (v: unknown) => String(v == null ? "" : v).replace(/ /g, " ").trim();

export function parseInstructorsXlsx(buf: ArrayBuffer): InstructorRow[] {
  const wb = XLSX.read(buf, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const grid = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, blankrows: false });

  let h = -1;
  for (let i = 0; i < Math.min(grid.length, 10); i++) {
    if ((grid[i] || []).some((c) => clean(c) === "이름")) { h = i; break; }
  }
  if (h < 0) throw new Error("'이름' 열을 찾지 못했어요. 양식을 받아 작성해 주세요.");

  const header = (grid[h] as unknown[]).map(clean);
  const col = (...kw: string[]) => header.findIndex((c) => c !== "" && kw.some((k) => c.includes(k)));
  const iName = col("이름"), iKind = col("구분"), iExt = col("소속구분", "내부", "외부", "소속(");
  const iOrg = header.findIndex((c) => c === "소속·직함" || c === "소속/직함" || c === "소속직함");
  const iPhone = col("연락처", "전화"), iField = col("전문분야", "분야", "주제"), iFee = col("강사비", "급여"), iNote = col("비고", "메모");

  const out: InstructorRow[] = [];
  for (let r = h + 1; r < grid.length; r++) {
    const row = (grid[r] as unknown[]) || [];
    const cell = (i: number) => (i >= 0 ? clean(row[i]) : "");
    const name = cell(iName);
    if (!name || name === "이름") continue;
    const kindRaw = cell(iKind);
    const kind = kindRaw.includes("간사") ? "간사" : "강사";
    const extRaw = cell(iExt);
    const is_external = extRaw ? !extRaw.includes("내부") : true; // '내부' 아니면 외부로
    out.push({ name, kind, is_external, org: cell(iOrg), phone: cell(iPhone), field: cell(iField), fee_note: cell(iFee), note: cell(iNote) });
  }
  return out;
}
