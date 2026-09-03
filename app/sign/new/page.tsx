// 새 서명 요청 마법사 (서버) — 운영진(쓰기)만. 회원 명부(이름·연락처·이력태그)를 매핑용으로 전달.
import { getStaffGate } from "@/lib/staffGate";
import SignWizard from "./SignWizard";
import type { MemberOpt } from "@/lib/signTypes";

export default async function SignNewPage() {
  const { supabase, canEdit } = await getStaffGate();
  if (!canEdit) return <p className="rounded-lg border border-line bg-card px-4 py-10 text-center text-[15px] text-ink-soft">운영진(쓰기 권한) 전용 화면이에요.</p>;

  const { data } = await supabase.from("members").select("id, name, phone, tags").eq("chapter_id", "새서울").order("name", { ascending: true });
  return <SignWizard members={(data ?? []) as MemberOpt[]} />;
}
