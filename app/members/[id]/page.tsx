// 회원 상세·편집 페이지. 회원을 불러와 편집 폼(MemberEditForm)에 넘깁니다.
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MemberEditForm from "./MemberEditForm";

export default async function MemberDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { id } = await params;
  const { error, saved } = await searchParams;

  const supabase = await createClient();
  const { data: member } = await supabase
    .from("members")
    .select("*")
    .eq("id", id)
    .single();

  if (!member) notFound();

  return (
    <div className="mx-auto max-w-[640px] pt-2">
      <div className="mb-4">
        <Link href="/" className="text-[15px] font-semibold text-primary hover:underline">
          ← 회원 목록으로
        </Link>
      </div>
      {saved && (
        <p className="mb-4 rounded-md bg-[rgba(46,125,82,.1)] px-3 py-2 text-[15px] text-success">
          ✓ 저장되었습니다.
        </p>
      )}
      {error && (
        <p className="mb-4 rounded-md bg-[rgba(192,57,43,.1)] px-3 py-2 text-[15px] text-unpaid">
          ⚠️ {error}
        </p>
      )}
      <MemberEditForm member={member} />
    </div>
  );
}
