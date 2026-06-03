"use server";

// 연간 일정 저장 (upsert by chapter_id+date). RLS상 임원만.
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

type SaveRow = {
  date: string;
  mode: string;
  session: number | null;
  title: string;
  speaker: string;
  note: string;
};

export async function saveSchedule(
  rows: SaveRow[],
  fee: number | null,
  account: string | null,
): Promise<{ ok?: boolean; count?: number; error?: string }> {
  const supabase = await createClient();
  const payload = rows.map((r) => ({
    chapter_id: "새서울",
    date: r.date,
    session_no: r.session,
    mode: r.mode,
    title: r.title || null,
    speaker: r.speaker || null,
    fee,
    account_info: account,
    note: r.note || null,
  }));
  const { error } = await supabase
    .from("meetings")
    .upsert(payload, { onConflict: "chapter_id,date" });
  if (error) return { error: error.message };
  revalidatePath("/schedule");
  revalidatePath("/attendance");
  return { ok: true, count: payload.length };
}

// 특별행사(이벤트) 추가·삭제
export async function createEvent(data: {
  title: string; date: string; end_date: string | null; type: string | null; location: string | null; link: string | null;
}): Promise<{ ok?: boolean; error?: string }> {
  if (!data.title?.trim() || !data.date) return { error: "이벤트명과 날짜는 필수예요." };
  const supabase = await createClient();
  const { error } = await supabase.from("events").insert({
    chapter_id: "새서울",
    title: data.title.trim(),
    date: data.date,
    end_date: data.end_date || null,
    type: data.type || null,
    location: data.location || null,
    link: data.link || null,
  });
  if (error) return { error: error.message };
  revalidatePath("/schedule");
  return { ok: true };
}

export async function deleteEvent(id: string): Promise<{ ok?: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/schedule");
  return { ok: true };
}
