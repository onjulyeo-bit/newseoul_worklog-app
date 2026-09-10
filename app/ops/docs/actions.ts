"use server";

// 보관 서류(직접 업로드) 서버 액션 — 업로드·수정·삭제. RLS: 읽기 is_staff / 쓰기 is_admin.
//   파일은 base64 로 chapter_docs.file_data 에 보관(≤5MB, service_role 미사용 설계와 동일).
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { DOC_ACCEPT_EXT, DOC_MAX_B64, DOC_MAX_BYTES, isDocCategory } from "@/lib/docCategories";

type Result = { ok?: boolean; error?: string; id?: string };

const extOf = (name: string) => { const m = /\.[a-z0-9]+$/i.exec(name); return m ? m[0].toLowerCase() : ""; };

export async function uploadDoc(input: {
  title: string; category: string; note: string | null;
  file_name: string; file_mime: string; file_size: number; file_b64: string;
}): Promise<Result> {
  const title = input.title.trim();
  if (!title) return { error: "제목을 입력해 주세요." };
  if (!isDocCategory(input.category)) return { error: "분류를 선택해 주세요." };
  if (!input.file_b64) return { error: "파일을 선택해 주세요." };
  if (!(DOC_ACCEPT_EXT as readonly string[]).includes(extOf(input.file_name))) return { error: `올릴 수 있는 형식: ${DOC_ACCEPT_EXT.join(", ")}` };
  if (input.file_size > DOC_MAX_BYTES || input.file_b64.length > DOC_MAX_B64) return { error: "파일이 5MB 를 넘어요. 용량을 줄여서 다시 올려 주세요." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase.from("chapter_docs").insert({
    chapter_id: "새서울", title, category: input.category, note: input.note?.trim() || null,
    file_name: input.file_name, file_mime: input.file_mime || "application/octet-stream", file_size: input.file_size,
    file_data: input.file_b64, uploaded_by: user?.id ?? null,
  }).select("id").single();
  if (error) return { error: error.message };
  revalidatePath("/ops/docs"); revalidatePath("/ops");
  return { ok: true, id: data.id as string };
}

export async function updateDoc(id: string, patch: { title: string; category: string; note: string | null }): Promise<Result> {
  const title = patch.title.trim();
  if (!title) return { error: "제목을 입력해 주세요." };
  if (!isDocCategory(patch.category)) return { error: "분류를 선택해 주세요." };
  const supabase = await createClient();
  const { error } = await supabase.from("chapter_docs")
    .update({ title, category: patch.category, note: patch.note?.trim() || null, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/ops/docs");
  return { ok: true };
}

export async function deleteDoc(id: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from("chapter_docs").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/ops/docs"); revalidatePath("/ops");
  return { ok: true };
}
