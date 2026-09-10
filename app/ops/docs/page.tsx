// 보관 서류 (서버) — 서명 완료본(sign_requests completed) + 직접 업로드(chapter_docs) 합집합, 최신순.
//   0060 미적용이면 chapter_docs 쿼리가 실패 → needsMigration 안내(서명 완료본은 그대로 보임).
import { getStaffGate } from "@/lib/staffGate";
import { DEFAULT_DOC_CATEGORY } from "@/lib/docCategories";
import DocsView, { type DocItem } from "./DocsView";

export const metadata = { title: "보관 서류 · CBMC 새서울지회" };

export default async function DocsPage() {
  const { supabase, user, isStaff, canEdit } = await getStaffGate();
  if (!user) return <p className="rounded-lg border border-line bg-card px-4 py-10 text-center text-[15px] text-ink-soft">로그인 후 이용해 주세요.</p>;
  if (!isStaff) return <p className="rounded-lg border border-line bg-card px-4 py-10 text-center text-[15px] text-ink-soft">보관 서류는 운영진만 볼 수 있어요.</p>;

  const [signRes, docRes] = await Promise.all([
    supabase.from("sign_requests").select("id, title, doc_category, updated_at").eq("chapter_id", "새서울").eq("status", "completed"),
    supabase.from("chapter_docs").select("id, title, category, note, file_name, file_mime, file_size, created_at").eq("chapter_id", "새서울"),
  ]);

  // doc_category 컬럼이 아직 없으면(0060 전) 컬럼 없이 다시 조회
  let signRows: { id: string; title: string; doc_category?: string | null; updated_at: string }[] = signRes.data ?? [];
  if (signRes.error) {
    const retry = await supabase.from("sign_requests").select("id, title, updated_at").eq("chapter_id", "새서울").eq("status", "completed");
    signRows = retry.data ?? [];
  }

  const items: DocItem[] = [
    ...signRows.map((r) => ({
      id: r.id, source: "sign" as const, title: r.title, category: r.doc_category || DEFAULT_DOC_CATEGORY, note: null, date: r.updated_at,
      openHref: `/api/sign/pdf/${r.id}`, downloadHref: `/api/sign/pdf/${r.id}?dl=1`, file_mime: "application/pdf",
    })),
    ...(docRes.data ?? []).map((d) => ({
      id: d.id, source: "upload" as const, title: d.title, category: d.category, note: d.note, date: d.created_at,
      file_name: d.file_name, file_mime: d.file_mime, file_size: d.file_size,
      openHref: `/api/docs/${d.id}`, downloadHref: `/api/docs/${d.id}?dl=1`,
    })),
  ].sort((a, b) => (a.date < b.date ? 1 : -1));

  return <DocsView items={items} canEdit={canEdit} needsMigration={!!docRes.error} />;
}
