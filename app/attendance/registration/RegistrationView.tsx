"use client";

// 정회원 등록 현황 — 올해 연회비 납부/미납. (체크인 통계와 같은 통계 탭)
import Link from "next/link";
import StatsTabs from "../StatsTabs";

export type RegRow = { name: string; grade: string | null; paid: boolean; amount: number; judge: string | null };
export type UnmatchedRow = { name: string; amount: number; date: string };

const won = (n: number) => "₩" + (n || 0).toLocaleString("ko-KR");

export default function RegistrationView({
  curYear, years, rows, unmatched, paidCount, unpaidCount, total,
}: {
  curYear: string; years: string[]; rows: RegRow[]; unmatched: UnmatchedRow[];
  paidCount: number; unpaidCount: number; total: number;
}) {
  // 미납 먼저(처리할 것) → 납부, 각 그룹은 이름순
  const sorted = [...rows].sort((a, b) => (a.paid === b.paid ? a.name.localeCompare(b.name, "ko") : a.paid ? 1 : -1));

  return (
    <div className="text-ink">
      <StatsTabs />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-[clamp(21px,5vw,26px)] font-extrabold tracking-tight">정회원 등록 현황</h1>
          <p className="mt-1 text-[14px] font-medium text-ink-soft">{curYear}년 연회비 납부 현황 (입출금 내역의 ‘연회비’ 자동 집계)</p>
        </div>
        <div className="flex gap-1.5">
          {years.length > 0 ? years.map((y) => (
            <Link key={y} href={`/attendance/registration?year=${y}`} className={`rounded-full px-3 py-1.5 text-[13px] font-bold ${y === curYear ? "bg-primary text-white" : "border border-line bg-card text-ink-soft"}`}>{y}년</Link>
          )) : <span className="rounded-full border border-line bg-card px-3 py-1.5 text-[13px] font-bold text-ink-soft">{curYear}년</span>}
        </div>
      </div>

      <div className="mb-5 grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-line bg-card p-4"><div className="text-[13px] font-semibold text-ink-soft">납부</div><div className="mt-1 text-[22px] font-extrabold text-success">{paidCount}명</div></div>
        <div className="rounded-2xl border border-line bg-card p-4"><div className="text-[13px] font-semibold text-ink-soft">미납</div><div className="mt-1 text-[22px] font-extrabold text-unpaid">{unpaidCount}명</div></div>
        <div className="rounded-2xl border border-line bg-card p-4"><div className="text-[13px] font-semibold text-ink-soft">총 연회비</div><div className="mt-1 text-[22px] font-extrabold text-primary">{won(total)}</div></div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-card">
        <table className="w-full border-collapse text-[14px]">
          <thead className="bg-surface-soft text-left text-[12px] text-ink-soft">
            <tr><th className="px-4 py-2.5 font-bold">이름</th><th className="px-4 py-2.5 font-bold">회원구분</th><th className="px-4 py-2.5 font-bold">납부</th><th className="px-4 py-2.5 font-bold">금액</th><th className="px-4 py-2.5 font-bold">판정</th></tr>
          </thead>
          <tbody>
            {sorted.map((r) => (
              <tr key={r.name} className="border-t border-line">
                <td className="px-4 py-2.5 font-bold">{r.name}</td>
                <td className="px-4 py-2.5 text-ink-soft">{r.grade ?? "—"}</td>
                <td className="px-4 py-2.5">{r.paid
                  ? <span className="rounded-full bg-[rgba(10,125,63,.12)] px-2 py-0.5 text-[12px] font-bold text-success">납부</span>
                  : <span className="rounded-full bg-[rgba(192,57,43,.1)] px-2 py-0.5 text-[12px] font-bold text-unpaid">미납</span>}</td>
                <td className="px-4 py-2.5 font-semibold tabular-nums">{r.amount ? won(r.amount) : "—"}</td>
                <td className="px-4 py-2.5 text-ink-soft">{r.judge ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {unmatched.length > 0 && (
        <div className="mt-5">
          <h2 className="mb-2 text-[15px] font-extrabold">명단 외 입금 <span className="text-[13px] font-medium text-ink-soft">— 이름이 명단과 안 맞는 연회비 입금({unmatched.length}건). 직접 확인하세요.</span></h2>
          <div className="overflow-hidden rounded-2xl border border-line bg-card">
            <table className="w-full border-collapse text-[14px]">
              <thead className="bg-surface-soft text-left text-[12px] text-ink-soft"><tr><th className="px-4 py-2.5 font-bold">입금자</th><th className="px-4 py-2.5 font-bold">금액</th><th className="px-4 py-2.5 font-bold">날짜</th></tr></thead>
              <tbody>
                {unmatched.map((u, i) => (
                  <tr key={i} className="border-t border-line"><td className="px-4 py-2.5 font-bold">{u.name}</td><td className="px-4 py-2.5 font-semibold tabular-nums">{won(u.amount)}</td><td className="px-4 py-2.5 text-ink-soft">{u.date}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="mt-4 text-[12.5px] text-ink-soft">※ 입출금 내역의 ‘연회비’ 항목 입금자 이름을 회원과 자동 매칭합니다. 금액 기준: 정회원 60만/신입 65만/부부 80만/준회원 5만. 동명이인·부부·이름 불일치는 위 ‘명단 외 입금’이나 거래 내역에서 확인하세요.</p>
    </div>
  );
}
