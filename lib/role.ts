// 역할 플래그 (순수 함수 — 서버/클라이언트 공용)
// admin=운영진(읽기+쓰기), viewer=읽기 운영진(읽기만), member=회원, guest=관심
export function roleFlags(role: string | null | undefined) {
  const isAdmin = role === "admin";
  const isViewer = role === "viewer";
  return {
    isAdmin,
    isViewer,
    isStaff: isAdmin || isViewer, // 운영 화면 '조회' 가능
    canEdit: isAdmin, // '추가/수정/삭제' 가능 — viewer는 false
  };
}
