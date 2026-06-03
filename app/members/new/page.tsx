// 회원 추가 화면 — 폼을 채워 저장하면 members 테이블에 새 회원이 들어갑니다.
// 저장은 "서버 액션"(아래 addMember)이 처리 → RLS상 임원(admin)만 추가 가능.
import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// 빈 문자열은 null로 (DB의 등급/상태 check 제약은 빈 문자열을 허용하지 않으므로)
function emptyToNull(formData: FormData, key: string): string | null {
  const s = String(formData.get(key) ?? "").trim();
  return s === "" ? null : s;
}

async function addMember(formData: FormData) {
  "use server";
  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    redirect("/members/new?error=" + encodeURIComponent("이름은 꼭 입력해 주세요."));
  }

  const supabase = await createClient();
  const { error } = await supabase.from("members").insert({
    chapter_id: "새서울",
    name,
    grade: emptyToNull(formData, "grade"),
    status: emptyToNull(formData, "status"),
    registration: emptyToNull(formData, "registration"),
    phone: emptyToNull(formData, "phone"),
    company: emptyToNull(formData, "company"),
    position: emptyToNull(formData, "position"),
    industry: emptyToNull(formData, "industry"),
  });

  if (error) {
    redirect("/members/new?error=" + encodeURIComponent(error.message));
  }

  revalidatePath("/"); // 목록 화면을 새 데이터로 갱신
  redirect("/");
}

export default async function NewMemberPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  const labelCls = "mb-1.5 block text-[14px] font-bold text-ink-soft";
  const inputCls =
    "min-h-[44px] w-full rounded-md border border-line bg-card px-3.5 text-[17px] text-ink outline-none placeholder:text-muted focus:border-primary-focus";

  return (
    <div className="mx-auto max-w-[560px] pt-2">
      <div className="mb-4">
        <Link href="/" className="text-[15px] font-semibold text-primary hover:underline">
          ← 회원 목록으로
        </Link>
      </div>

      <div className="rounded-lg border border-line bg-card p-6">
        <h2 className="text-[21px] font-bold text-ink">회원 추가</h2>
        <p className="mt-1 text-[15px] text-ink-soft">
          이름만 필수예요. 나머지는 비워 두고 나중에 채워도 됩니다.
        </p>

        {error && (
          <p className="mt-4 rounded-md bg-[rgba(192,57,43,.1)] px-3 py-2 text-[15px] text-unpaid">
            ⚠️ {error}
          </p>
        )}

        <form action={addMember} className="mt-5 flex flex-col gap-4">
          <div>
            <label className={labelCls}>이름 *</label>
            <input name="name" required placeholder="예: 홍길동" className={inputCls} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>등급</label>
              <select name="grade" className={inputCls} defaultValue="">
                <option value="">선택 안 함</option>
                <option value="명예회원">명예회원</option>
                <option value="정회원">정회원</option>
                <option value="부부회원">부부회원</option>
                <option value="준회원">준회원</option>
                <option value="신입회원">신입회원</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>상태</label>
              <select name="status" className={inputCls} defaultValue="">
                <option value="">선택 안 함</option>
                <option value="활동중">활동중</option>
                <option value="유보">유보</option>
                <option value="등록전">등록전</option>
                <option value="OB">OB</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls}>등록 여부</label>
            <select name="registration" className={inputCls} defaultValue="">
              <option value="">선택 안 함</option>
              <option value="등록회원">등록회원</option>
              <option value="비등록">비등록·관심</option>
            </select>
          </div>

          <div>
            <label className={labelCls}>연락처</label>
            <input name="phone" placeholder="예: 010-1234-5678" className={inputCls} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>직장명</label>
              <input name="company" placeholder="예: 새서울상사" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>직위</label>
              <input name="position" placeholder="예: 대표이사" className={inputCls} />
            </div>
          </div>

          <div>
            <label className={labelCls}>업종</label>
            <input name="industry" placeholder="예: 제조업" className={inputCls} />
          </div>

          <div className="mt-2 flex gap-3">
            <button
              type="submit"
              className="min-h-[44px] flex-1 rounded-full bg-primary px-5 text-[16px] font-semibold text-white hover:bg-primary-pressed"
            >
              저장
            </button>
            <Link
              href="/"
              className="flex min-h-[44px] items-center rounded-full border border-line px-5 text-[16px] font-semibold text-ink-soft hover:border-primary hover:text-primary"
            >
              취소
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
