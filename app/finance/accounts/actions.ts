"use server";

// 계좌관리 — 추가·삭제. RLS상 운영진만.
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function addAccount(data: { purpose: string; payee: string; bank: string; account_no: string; holder: string; note: string }): Promise<{ ok?: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("accounts").insert({ ...data, chapter_id: "새서울" });
  if (error) return { error: error.message };
  revalidatePath("/finance/accounts");
  return { ok: true };
}

export async function deleteAccount(id: string): Promise<{ ok?: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("accounts").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/finance/accounts");
  return { ok: true };
}
