// 서명 모듈 공용 타입 (서버/클라이언트 공용, 순수 타입만)
export type SignStatus = "draft" | "active" | "completed" | "expired" | "cancelled";
export type SignerStatus = "pending" | "viewed" | "signed" | "declined";

export type SignRequestRow = {
  id: string; title: string; description: string | null; status: SignStatus;
  expires_at: string | null; created_at: string; updated_at: string;
};
export type SignSlotRow = {
  id: string; request_id: string; label: string; page: number;
  x: number; y: number; w: number; h: number; order_no: number;
};
export type SignSignerRow = {
  id: string; request_id: string; slot_id: string; member_id: string | null;
  name: string; phone: string | null; token: string; status: SignerStatus;
  viewed_at: string | null; signed_at: string | null; ip: string | null; auth_kakao_id: string | null;
};

// 마법사(클라이언트)에서 만드는 신규 슬롯/서명자 — 저장 전이라 임시 key 로 연결
export type NewSlot = { key: string; label: string; page: number; x: number; y: number; w: number; h: number };
export type NewSigner = { slotKey: string; member_id: string | null; name: string; phone: string | null };

export type MemberOpt = { id: string; name: string; phone: string | null; tags: string[] | null };

export const STATUS_LABEL: Record<SignStatus, string> = {
  draft: "임시", active: "진행중", completed: "완료", expired: "만료", cancelled: "취소",
};
export const SIGNER_LABEL: Record<SignerStatus, string> = {
  pending: "대기", viewed: "열람", signed: "서명 완료", declined: "거절",
};
