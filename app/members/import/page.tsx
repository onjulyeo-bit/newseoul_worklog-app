"use client";

// 엑셀 업로드 화면 — 파일 선택 → 미리보기 → 모드(전체교체/새회원만) → 확정.
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { parseMembersXlsx, fillSpouses, type ParsedMember } from "@/lib/parseMembersXlsx";
import { importMembers } from "../actions";

export default function ImportPage() {
  const router = useRouter();
  const [rows, setRows] = useState<ParsedMember[]>([]);
  const [fileName, setFileName] = useState("");
  const [mode, setMode] = useState<"replace" | "append">("replace");
  const [parseError, setParseError] = useState("");
  const [result, setResult] = useState<string>("");
  const [pending, startTransition] = useTransition();

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setParseError("");
    setResult("");
    try {
      const buf = await file.arrayBuffer();
      const parsed = fillSpouses(parseMembersXlsx(buf));
      setRows(parsed);
    } catch (err) {
      setRows([]);
      setParseError(err instanceof Error ? err.message : "파일을 읽지 못했습니다.");
    }
  }

  function onConfirm() {
    startTransition(async () => {
      const res = await importMembers(rows, mode);
      if (res.error) {
        setResult("❌ 오류: " + res.error);
      } else {
        setResult(
          mode === "replace"
            ? `✅ 전체 교체 완료 — ${res.inserted}명 반영`
            : `✅ 새 회원 ${res.inserted}명 추가 (이미 있던 ${res.skipped}명은 건너뜀)`,
        );
        router.refresh();
      }
    });
  }

  return (
    <div className="mx-auto max-w-[820px] pt-2">
      <div className="mb-4">
        <Link href="/" className="text-[15px] font-semibold text-primary hover:underline">
          ← 회원 목록으로
        </Link>
      </div>

      <div className="rounded-lg border border-line bg-card p-6">
        <h2 className="text-[21px] font-bold text-ink">엑셀 업로드</h2>
        <p className="mt-1 text-[15px] text-ink-soft">
          회원 명단 엑셀(.xlsx)을 올리면 미리보기로 확인한 뒤 반영합니다. (SQL 필요 없음)
        </p>

        {/* 1. 파일 선택 */}
        <div className="mt-5">
          <label className="mb-1.5 block text-[14px] font-bold text-ink-soft">1. 엑셀 파일 선택</label>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={onFile}
            className="block w-full text-[15px] text-ink-soft file:mr-3 file:rounded-full file:border-0 file:bg-primary file:px-4 file:py-2 file:text-[15px] file:font-semibold file:text-white hover:file:bg-primary-pressed"
          />
          {fileName && <p className="mt-1 text-[14px] text-muted">{fileName}</p>}
          {parseError && (
            <p className="mt-2 rounded-md bg-[rgba(192,57,43,.1)] px-3 py-2 text-[15px] text-unpaid">
              ⚠️ {parseError}
            </p>
          )}
        </div>

        {rows.length > 0 && (
          <>
            {/* 2. 미리보기 */}
            <div className="mt-6">
              <label className="mb-1.5 block text-[14px] font-bold text-ink-soft">
                2. 미리보기 — 총 {rows.length}명
              </label>
              <div className="max-h-[320px] overflow-auto rounded-lg border border-line">
                <table className="w-full border-collapse text-[14px]">
                  <thead className="sticky top-0 bg-surface-soft">
                    <tr className="text-left">
                      {["이름", "성별", "회원구분", "연락처", "직장", "배지"].map((th) => (
                        <th key={th} className="whitespace-nowrap px-3 py-2 text-[12px] font-bold text-ink-soft">{th}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((m, i) => (
                      <tr key={i} className="border-t border-line">
                        <td className="px-3 py-1.5 font-bold text-ink">{m.name}</td>
                        <td className="px-3 py-1.5 text-ink-soft">{m.gender ?? "—"}</td>
                        <td className="px-3 py-1.5 text-ink-soft">{m.grade ?? "—"}</td>
                        <td className="px-3 py-1.5 text-ink-soft">{m.phone ?? "—"}</td>
                        <td className="px-3 py-1.5 text-ink-soft">{m.company ?? "—"}</td>
                        <td className="px-3 py-1.5 text-ink-soft">{m.tags.join(", ") || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 3. 모드 선택 */}
            <div className="mt-6">
              <label className="mb-1.5 block text-[14px] font-bold text-ink-soft">3. 반영 방식</label>
              <div className="flex flex-col gap-2">
                <label className="flex cursor-pointer items-start gap-2 rounded-md border border-line p-3 hover:border-primary">
                  <input type="radio" checked={mode === "replace"} onChange={() => setMode("replace")} className="mt-1 accent-primary" />
                  <span className="text-[15px] text-ink">
                    <b>전체 교체</b> — 기존 명단을 지우고 이 파일 {rows.length}명으로 새로 채움
                  </span>
                </label>
                <label className="flex cursor-pointer items-start gap-2 rounded-md border border-line p-3 hover:border-primary">
                  <input type="radio" checked={mode === "append"} onChange={() => setMode("append")} className="mt-1 accent-primary" />
                  <span className="text-[15px] text-ink">
                    <b>새 회원만 추가</b> — 이름 기준, 없는 사람만 추가하고 기존 회원은 그대로 둠
                  </span>
                </label>
              </div>
            </div>

            {/* 4. 확정 */}
            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={onConfirm}
                disabled={pending}
                className="min-h-[44px] rounded-full bg-primary px-6 text-[16px] font-semibold text-white hover:bg-primary-pressed disabled:opacity-50"
              >
                {pending ? "반영 중…" : mode === "replace" ? "전체 교체 실행" : "새 회원 추가 실행"}
              </button>
              {result && <span className="text-[15px] font-semibold text-ink">{result}</span>}
            </div>
            {result.startsWith("✅") && (
              <Link href="/" className="mt-3 inline-block text-[15px] font-semibold text-primary hover:underline">
                → 회원 목록에서 확인하기
              </Link>
            )}
          </>
        )}

        <div className="mt-6 rounded-md border border-[rgba(0,102,204,.2)] bg-[rgba(0,102,204,.07)] px-3.5 py-3 text-[14px] text-ink-soft">
          💡 엑셀 첫 시트에 <b>이름</b> 헤더가 있어야 하고, 성별·연락처·업종·직장명·직위·회원구분·배우자·차량·등록시기·비전스쿨·리더십 열을 자동 인식합니다. (열 순서 바뀌어도 OK)
        </div>
      </div>
    </div>
  );
}
