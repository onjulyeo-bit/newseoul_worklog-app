// 표 데이터를 엑셀(.xlsx) / CSV로 내려받기. (CSV는 구글시트·넘버스·한셀·엑셀 어디서나 열림)
import * as XLSX from "xlsx";

export function downloadXlsx(rows: Record<string, unknown>[], filename: string) {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function downloadCsv(rows: Record<string, unknown>[], filename: string) {
  const ws = XLSX.utils.json_to_sheet(rows);
  // ﻿(BOM) 붙여야 엑셀에서 한글이 안 깨짐
  const csv = "﻿" + XLSX.utils.sheet_to_csv(ws);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
