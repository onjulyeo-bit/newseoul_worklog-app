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

export async function updateInstructor(id: string, data: Data): Promise<{ ok?: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("instructors").update(data).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/instructors");
  return { ok: true };
}

// 엑셀 업로드 — 이름 기준 새 인원만 추가(기존 이름은 건너뜀). RLS상 운영진만.
export async function importInstructors(rows: Data[]): Promise<{ ok?: boolean; inserted?: number; skipped?: number; error?: string }> {
  const supabase = await createClient();
  const { data: existing } = await supabase.from("instructors").select("name").eq("chapter_id", "새서울");
  const names = new Set((existing ?? []).map((m) => m.name));
  const fresh = rows.filter((r) => r.name && !names.has(r.name));
  if (fresh.length) {
    const ins = await supabase.from("instructors").insert(fresh.map((r) => ({ ...r, chapter_id: "새서울" })));
    if (ins.error) return { error: ins.error.message };
  }
  revalidatePath("/instructors");
  return { ok: true, inserted: fresh.length, skipped: rows.length - fresh.length };
}

export async function deleteInstructor(id: string): Promise<{ ok?: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("instructors").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/instructors");
  return { ok: true };
}
