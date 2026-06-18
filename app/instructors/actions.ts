"use server";

// 강사·간사 — 추가·삭제. RLS상 운영진만.
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

type Data = { name: string; kind: string; is_external: boolean; org: string; phone: string; field: string; fee_note: string; note: string };

export async function addInstructor(data: Data): Promise<{ ok?: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("instructors").insert({ ...data, chapter_id: "새서울" });
  if (error) return { error: error.message };
  revalidatePath("/instructors");
  return { ok: true };
}

export async function deleteInstructor(id: string): Promise<{ ok?: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("instructors").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/instructors");
  return { ok: true };
}
