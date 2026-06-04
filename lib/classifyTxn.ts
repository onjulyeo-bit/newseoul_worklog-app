// 거래 자동 분류 — 회계모듈_상세문서 규칙 기반. 규칙이 바뀌면 이 파일만 수정.
// 트랙 A=메인회계(보고대상) / B=식대정산(보고서엔 인원수만).

export const A_INCOME = ["이월금", "연회비", "후원금", "기타수입"];
export const A_EXPENSE = ["강사비", "간사급여", "경조사·회원행사", "중앙회비", "신입회원입회비", "남부연합회비", "기타경비", "행사지원", "장학금"];
export const A_CATEGORIES = [...A_INCOME, ...A_EXPENSE, "미분류"];
export const B_CATEGORIES = ["식대입금", "식대결재"];
export const ALL_CATEGORIES = [...A_CATEGORIES, ...B_CATEGORIES];

export type Direction = "입금" | "출금";
export type Txn = {
  txn_date: string; direction: Direction; amount: number; balance: number | null;
  memo: string; counterparty: string;
  track: "A" | "B"; category: string; confident: boolean;
};

export function parseAmount(s: unknown): number {
  const n = parseInt(String(s ?? "").replace(/[^0-9-]/g, ""), 10);
  return isNaN(n) ? 0 : n;
}

// "2025.12.30 17:51:45" → "2025-12-30T17:51:45"
export function parseDate(s: unknown): string | null {
  const m = String(s ?? "").trim().match(/(\d{4})\.(\d{1,2})\.(\d{1,2})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (!m) return null;
  const [, y, mo, d, h = "0", mi = "0", se = "0"] = m;
  return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}T${h.padStart(2, "0")}:${mi.padStart(2, "0")}:${se.padStart(2, "0")}`;
}

export function classify(memo: string, direction: Direction): { track: "A" | "B"; category: string; confident: boolean } {
  const m = (memo || "").replace(/\s/g, "");
  if (!m) return { track: "A", category: "미분류", confident: false };

  // 식대 → B트랙
  if (m.includes("식대")) return { track: "B", category: direction === "입금" ? "식대입금" : "식대결재", confident: true };

  // A트랙 키워드 (확실)
  const rules: [RegExp, string][] = [
    [/이월/, "이월금"],
    [/연회비/, "연회비"],
    [/강사/, "강사비"],
    [/간사/, "간사급여"],
    [/구독/, "기타경비"],
    [/남부연합/, "남부연합회비"],
    [/중앙회|입회비/, "신입회원입회비"],
    [/경조/, "경조사·회원행사"],
    [/장학/, "장학금"],
    [/찬조/, "후원금"],
    [/기타수입/, "기타수입"],
  ];
  for (const [re, cat] of rules) if (re.test(m)) return { track: "A", category: cat, confident: true };

  // 애매 (방향으로 추정 → 사람 확정 필요)
  if (/후원/.test(m)) return { track: "A", category: direction === "입금" ? "후원금" : "행사지원", confident: false };
  if (/지원|행사|심방/.test(m)) return { track: "A", category: direction === "입금" ? "기타수입" : "행사지원", confident: false };

  return { track: "A", category: "미분류", confident: false };
}

// 연회비 입금액 → 회원 판정 (참고/표시용)
export function memberJudge(amount: number, counterparty: string): string | null {
  const names = counterparty.split(/[,，]/).map((s) => s.trim()).filter(Boolean);
  if (amount >= 800000) return `부부 정회원 (${names.join("·") || "2명"})`;
  if (amount >= 650000) return "정회원(신입)";
  if (amount >= 600000) return "정회원(기존)";
  if (amount >= 50000 && amount < 100000) return "준회원";
  return null;
}
