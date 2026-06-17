// 연도별 회비 매트릭스(이름 × 연도 금액) 엑셀 → 행(name·year·amount)으로 변환.
// 여러 시트 중 '이름' 헤더 + 4자리 연도 컬럼이 있는 시트를 자동으로 찾는다. "유보"·빈칸은 제외.
import * as XLSX from "xlsx";

export type DuesRow = { name: string; year: number; amount: number };

const clean = (v: unknown) => String(v == null ? "" : v).replace(/ /g, " ").trim();

export function parseDuesXlsx(buf: ArrayBuffer): { rows: DuesRow[]; years: number[]; skipped: number } {
  const wb = XLSX.read(buf, { type: "array" });
  for (const sheetName of wb.SheetNames) {
    const grid = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[sheetName], { header: 1, blankrows: false, raw: false });
    // 헤더행 = '이름' 포함하고 4자리 연도 컬럼이 있는 줄
    let h = -1;
    for (let i = 0; i < Math.min(grid.length, 12); i++) {
      const r = (grid[i] || []).map(clean);
      if (r.some((c) => c === "이름") && r.some((c) => /^\d{4}$/.test(c))) { h = i; break; }
    }
    if (h < 0) continue;

    const header = (grid[h] as unknown[]).map(clean);
    const iName = header.findIndex((c) => c === "이름");
    const yearCols: { col: number; year: number }[] = [];
    header.forEach((c, i) => { if (/^\d{4}$/.test(c)) yearCols.push({ col: i, year: parseInt(c, 10) }); });
    if (iName < 0 || yearCols.length === 0) continue;

    const rows: DuesRow[] = [];
    let skipped = 0;
    for (let r = h + 1; r < grid.length; r++) {
      const row = (grid[r] as unknown[]) || [];
      const name = clean(row[iName]);
      if (!name || name === "이름") continue;
      for (const { col, year } of yearCols) {
        const raw = clean(row[col]);
        if (!raw) continue;
        const amt = parseInt(raw.replace(/[^0-9]/g, ""), 10);
        if (!amt) { skipped++; continue; } // "유보" 등 비숫자
        rows.push({ name, year, amount: amt });
      }
    }
    const years = yearCols.map((y) => y.year).sort((a, b) => b - a);
    return { rows, years, skipped };
  }
  throw new Error("'이름'과 연도(예: 2025) 열이 있는 시트를 찾지 못했어요. 첫 시트에 이름·연도 표가 있어야 합니다.");
}

// 정회원 수: 80만↑=2명(부부), 60만↑=1명, 그 외(준회원 등)=0
export function jungCount(amount: number): number {
  if (amount >= 800000) return 2;
  if (amount >= 600000) return 1;
  return 0;
}
