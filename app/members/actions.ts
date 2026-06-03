"use server";

// 회원 저장·삭제 (서버에서 실행 → RLS상 임원만 가능)
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function updateMember(id: string, data: Record<string, unknown>) {
  const supabase = await createClient();
  const { error } = await supabase.from("members").update(data).eq("id", id);
  if (error) {
    redirect(`/members/${id}?error=${encodeURIComponent(error.message)}`);
  }
  revalidatePath("/");
  revalidatePath(`/members/${id}`);
  // 저장 후 같은 회원 화면으로 (저장된 값을 바로 확인)
  redirect(`/members/${id}?saved=1`);
}

type ImportRow = Record<string, unknown> & { name: string };

// 엑셀 임포트: mode='replace'(전체 교체) | 'append'(새 회원만 추가)
export async function importMembers(
  rows: ImportRow[],
  mode: "replace" | "append",
): Promise<{ ok?: boolean; inserted?: number; skipped?: number; error?: string }> {
  const supabase = await createClient();
  const withChapter = rows.map((r) => ({ ...r, chapter_id: "새서울" }));

  if (mode === "replace") {
    const del = await supabase.from("members").delete().eq("chapter_id", "새서울");
    if (del.error) return { error: del.error.message };
    const ins = await supabase.from("members").insert(withChapter);
    if (ins.error) return { error: ins.error.message };
    revalidatePath("/");
    return { ok: true, inserted: withChapter.length, skipped: 0 };
  }

  // append: 이름 기준으로 없는 사람만 추가
  const { data: existing } = await supabase
    .from("members")
    .select("name")
    .eq("chapter_id", "새서울");
  const names = new Set((existing ?? []).map((m) => m.name));
  const newRows = withChapter.filter((r) => !names.has(r.name));
  if (newRows.length > 0) {
    const ins = await supabase.from("members").insert(newRows);
    if (ins.error) return { error: ins.error.message };
  }
  revalidatePath("/");
  return { ok: true, inserted: newRows.length, skipped: withChapter.length - newRows.length };
}

export async function deleteMember(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("members").delete().eq("id", id);
  if (error) {
    redirect(`/members/${id}?error=${encodeURIComponent(error.message)}`);
  }
  revalidatePath("/");
  redirect("/");
}
