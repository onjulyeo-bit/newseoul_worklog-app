// 보관 서류 분류 — 코드 고정(서버/클라이언트 공용). 지회 운영 → 보관 서류 칩과 서명 요청의 doc_category 에 사용.
export const DOC_CATEGORIES = ["임원·연임 서류", "규약·정관", "회의록·총회", "공문·대외", "기타"] as const;
export type DocCategory = (typeof DOC_CATEGORIES)[number];
export const DEFAULT_DOC_CATEGORY: DocCategory = "임원·연임 서류";

export const isDocCategory = (v: unknown): v is DocCategory => typeof v === "string" && (DOC_CATEGORIES as readonly string[]).includes(v);

// 업로드 허용 확장자·크기 (서명 모듈과 동일한 5MB, base64 ≈ 6.7MB)
export const DOC_ACCEPT_EXT = [".pdf", ".hwp", ".hwpx", ".docx", ".xlsx", ".pptx", ".png", ".jpg", ".jpeg"] as const;
export const DOC_MAX_BYTES = 5 * 1024 * 1024;
export const DOC_MAX_B64 = 7_000_000;
