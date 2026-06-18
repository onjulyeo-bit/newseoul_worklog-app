"use client";
// 클라이언트 컴포넌트에서 '수정 권한(운영진)' 여부 확인.
// viewer(읽기 운영진)·회원은 false. 확정 전까지는 false(편집 버튼 숨김 → 확인되면 노출).
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function useCanEdit() {
  const [canEdit, setCanEdit] = useState(false);
  useEffect(() => {
    const sb = createClient();
    sb.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      sb.from("profiles").select("role").eq("id", user.id).single()
        .then(({ data }) => setCanEdit(data?.role === "admin"));
    });
  }, []);
  return canEdit;
}
