// 연도별 회비 매트릭스(이름 × 연도 금액) 엑셀 → 행(name·year·amount·grade)으로 변환.
// 형식: 이름 | 구분(정회원/준회원/부부) | 2024 | 2025 | ...  (구분 열은 선택)
// 여러 시트 중 '이름' 헤더 + 4자리 연도 컬럼이 있는 시트를 자동으로 찾는다. "유보"·빈칸은 제외.
import * as XLSX from "xlsx";

export type DuesRow = { name: string; year: number; amount: number; grade: string | null };

const clean = (v: unknown) => String(v == null ? "" : v).replace(/ /g, " ").trim();

// '구분' 표기를 표준값으로: 정회원 | 부부 | 준회원 (그 외는 null → 금액으로 추정)
export function normGrade(v: string | null | undefined): string | null {
  const s = (v ?? "").replace(/\s/g, "");
  if (!s) return null;
  if (/(부부|가족)/.test(s)) return "부부";
  if (/준/.test(s)) return "준회원";
  if (/정|일반/.test(s)) return "정회원";
  return null;
}

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
    const iGrade = header.findIndex((c) => /^(구분|회원구분|등급)$/.test(c));
    const yearCols: { col: number; year: number }[] = [];
    header.forEach((c, i) => { if (/^\d{4}$/.test(c)) yearCols.push({ col: i, year: parseInt(c, 10) }); });
    if (iName < 0 || yearCols.length === 0) continue;

    const rows: DuesRow[] = [];
    let skipped = 0;
    for (let r = h + 1; r < grid.length; r++) {
      const row = (grid[r] as unknown[]) || [];
      const name = clean(row[iName]);
      if (!name || name === "이름") continue;
      const grade = iGrade >= 0 ? normGrade(clean(row[iGrade])) : null;
      for (const { col, year } of yearCols) {
        const raw = clean(row[col]);
        if (!raw) continue;
        const amt = parseInt(raw.replace(/[^0-9]/g, ""), 10);
        if (!amt) { skipped++; continue; } // "유보" 등 비숫자
        rows.push({ name, year, amount: amt, grade });
      }
    }
    const years = yearCols.map((y) => y.year).sort((a, b) => b - a);
    return { rows, years, skipped };
  }
  throw new Error("'이름'과 연도(예: 2025) 열이 있는 시트를 찾지 못했어요. 첫 시트에 이름·연도 표가 있어야 합니다.");
}

// 회원구분(grade)이 있으면 그대로, 없으면 금액으로 추정.
// 정회원 수 기여: 부부=2명, 정회원=1명, 준회원=0.  (금액 추정: 80만↑=2, 60만↑=1)
export function jungOf(grade: string | null, amount: number): number {
  if (grade === "부부") return 2;
  if (grade === "정회원") return 1;
  if (grade === "준회원") return 0;
  if (amount >= 800000) return 2;
  if (amount >= 600000) return 1;
  return 0;
}
// 준회원 수 기여: 준회원=1, 그 외 0. (금액 추정: 납부했으나 정회원이 아니면 준회원)
export function junOf(grade: string | null, amount: number): number {
  if (grade === "준회원") return 1;
  if (grade === "정회원" || grade === "부부") return 0;
  return amount > 0 && jungOf(null, amount) === 0 ? 1 : 0;
}

// 구버전 호환(혹시 다른 곳에서 import) — 금액만으로 정회원 수
export function jungCount(amount: number): number {
  return jungOf(null, amount);
}
