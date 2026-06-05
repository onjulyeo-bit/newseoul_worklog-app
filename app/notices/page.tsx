// 공지 페이지 (서버) — 공지 목록 + 역할(관리자 여부) 전달.
import { createClient } from "@/lib/supabase/server";
import NoticesBoard, { type Announcement } from "./NoticesBoard";

export default async function NoticesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let isAdmin = false;
  if (user) {
    const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    isAdmin = data?.role === "admin";
  }
  const { data } = await supabase
    .from("announcements")
    .select("id, category, title, body, created_at, image_url")
    .eq("chapter_id", "새서울")
    .order("created_at", { ascending: false });
  return <NoticesBoard isAdmin={isAdmin} initial={(data as Announcement[]) ?? []} />;
}
