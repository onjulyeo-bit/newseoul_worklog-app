"use server";

// 출석·식대: 주차(meeting) 생성 + 출석/입금 저장. (RLS상 임원만)
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createMeeting(formData: FormData) {
  const supabase = await createClient();
  const date = String(formData.get("date") ?? "").trim();
  if (!date) redirect("/attendance?error=" + encodeURIComponent("날짜를 입력해 주세요."));

  const feeRaw = String(formData.get("fee") ?? "").trim();
  const { data, error } = await supabase
    .from("meetings")
    .insert({
      chapter_id: "새서울",
      date,
      week_label: String(formData.get("week") ?? "").trim() || null,
      fee: feeRaw ? Number(feeRaw) : null,
      account_info: String(formData.get("account") ?? "").trim() || null,
    })
    .select("id")
    .single();

  if (error) redirect("/attendance?error=" + encodeURIComponent(error.message));
  revalidatePath("/attendance");
  redirect(`/attendance?meeting=${data!.id}`);
}

export async function saveAttendance(
  meetingId: string,
  memberId: string,
  present: boolean,
  paid: boolean,
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("attendance")
    .upsert(
      { meeting_id: meetingId, member_id: memberId, present, paid },
      { onConflict: "meeting_id,member_id" },
    );
  if (error) return { error: error.message };
  return { ok: true };
}
