// 보관 서류 파일 — GET /api/docs/[id]  (?dl=1 이면 다운로드, 없으면 브라우저에서 열기)
//   운영진 세션(RLS is_staff)으로 chapter_docs.file_data(base64) 를 읽어 그대로 내려줌. service_role 미사용.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: d } = await supabase.from("chapter_docs").select("file_name, file_mime, file_data").eq("id", id).single();
  if (!d?.file_data) return NextResponse.json({ error: "서류를 찾을 수 없거나 권한이 없어요." }, { status: 404 });

  const dl = new URL(req.url).searchParams.get("dl") === "1";
  const fname = encodeURIComponent(d.file_name.replace(/[\\/:*?"<>|]/g, "_"));
  return new NextResponse(Buffer.from(d.file_data, "base64"), {
    headers: {
      "Content-Type": d.file_mime || "application/octet-stream",
      "Content-Disposition": `${dl ? "attachment" : "inline"}; filename*=UTF-8''${fname}`,
      "Cache-Control": "private, no-store",
    },
  });
}
