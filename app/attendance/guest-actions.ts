"use server";

// 게스트(방문자) 명단 관리 — 등록/삭제/참석·식대 저장. (RLS상 관리자만)
//   익명 체크인은 SECURITY DEFINER RPC(checkin_guests/check_in_guest/check_out_guest)로만.
//   여기(관리자 액션)는 로그인 세션으로 guests 테이블에 직접 접근하며 is_admin RLS가 지킨다.
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function addGuests(
  meetingId: string,
  guests: { name: string; branch: string | null }[],
) {
  if (!meetingId) return { error: "회차를 먼저 선택해 주세요." };
  const clean = guests.filter((g) => g.name.trim());
  if (clean.length === 0) return { error: "추가할 이름이 없어요." };

  const supabase = await createClient();
  // 이어붙이기: 현재 최대 sort_order 다음 번호부터 부여.
  const { data: last } = await supabase
    .from("guests")
    .select("sort_order")
    .eq("meeting_id", meetingId)
    .order("sort_order", { ascending: false, nullsFirst: false })
    .limit(1);
  const base = last?.[0]?.sort_order ?? 0;

  const rows = clean.map((g, i) => ({
    meeting_id: meetingId,
    chapter_id: "새서울",
    name: g.name.trim(),
    branch: g.branch?.trim() || null,
    sort_order: base + i + 1,
  }));

  const { error } = await supabase.from("guests").insert(rows);
  if (error) return { error: error.message };
  revalidatePath("/attendance");
  return { ok: true, count: rows.length };
}

export async function deleteGuest(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("guests").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/attendance");
  return { ok: true };
}

export async function setGuestState(id: string, present: boolean, paid: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("guests").update({ present, paid }).eq("id", id);
  if (error) return { error: error.message };
  return { ok: true };
}
