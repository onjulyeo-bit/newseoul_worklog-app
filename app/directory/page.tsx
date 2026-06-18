// 회원 명단(제한) — 로그인 회원/임원이 이름·연락처·회사만 열람. 관심(guest)·비로그인 차단.
import { createClient } from "@/lib/supabase/server";
import DirectoryView, { type DirEntry } from "./DirectoryView";

export default async function DirectoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return <p className="rounded-lg border border-line bg-card px-4 py-10 text-center text-[15px] text-ink-soft">로그인이 필요해요.</p>;
  }

  const { data: prof } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const role = prof?.role ?? "guest";
  if (role !== "member" && role !== "admin") {
    return <p className="rounded-lg border border-line bg-card px-4 py-10 text-center text-[15px] text-ink-soft">회원 전용 명단이에요. (관심 단계에서는 공지만 볼 수 있어요)</p>;
  }

  // 제한 뷰: 이름·연락처·회사만 (민감정보 제외)
  const { data } = await supabase
    .from("members_directory")
    .select("id, name, phone, company, email, position, industry, intro, business_card_url")
    .order("name", { ascending: true });

  return <DirectoryView entries={(data as DirEntry[]) ?? []} />;
}
