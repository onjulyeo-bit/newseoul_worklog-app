"use server";

// 히스토리 아카이브 추가·삭제 (RLS상 임원만). 사진은 클라이언트가 Storage에 올리고 URL만 받음.
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createArchive(data: {
  category: string | null; title: string; event_date: string | null;
  content: string | null; image_url: string | null; link: string | null;
}): Promise<{ ok?: boolean; error?: string }> {
  if (!data.title?.trim()) return { error: "제목은 필수예요." };
  const supabase = await createClient();
  const { error } = await supabase.from("archive").insert({
    chapter_id: "새서울",
    category: data.category || null,
    title: data.title.trim(),
    event_date: data.event_date || null,
    content: data.content || null,
    image_url: data.image_url || null,
    link: data.link || null,
  });
  if (error) return { error: error.message };
  revalidatePath("/archive");
  return { ok: true };
}

export async function deleteArchive(id: string): Promise<{ ok?: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("archive").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/archive");
  return { ok: true };
}
