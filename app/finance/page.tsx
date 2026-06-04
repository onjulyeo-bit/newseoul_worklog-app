// 회계 모듈 — 카테고리(개요) 화면. 상세문서(회계모듈_상세문서.md) 기반으로 단계별 구축.
// 단식부기 · 앱은 분류·집계·보고서까지만 · 계좌번호 등 민감정보 저장 금지.
import Link from "next/link";

const FLOW = [
  "카카오뱅크에서 월 거래내역 엑셀 다운로드",
  "앱에 업로드 → 자동 분류 미리보기 (모호 항목만 노란 표시)",
  "노란 항목 확인·확정 → 저장",
  "월간 보고서 자동 생성 → 감사에게 공유",
  "연말: 12개월 누적 → 연간 결산서 자동 완성",
];

const FEATURES = [
  { icon: "📥", title: "거래 업로드·자동분류", desc: "카뱅 엑셀 업로드 → 키워드로 자동 분류(메인회계 A · 식대정산 B). 모호한 건만 사람이 확정.", href: "/finance/import" },
  { icon: "📒", title: "거래 내역·수정", desc: "저장된 거래를 보고 항목·내용을 고치거나 삭제. 월·구분·트랙 필터.", href: "/finance/transactions" },
  { icon: "📊", title: "보고서 (월별·분기별)", desc: "수입·지출 요약 + 연회비 현황 + 식대 정산 + 잔액을 한 보고서로. 인쇄·PDF 저장.", href: "/finance/report" },
  { icon: "📅", title: "연간 결산서", desc: "보고서에서 ‘연별·전체’로 보면 연간 누적이 자동 집계돼요. (전용 결산 양식은 추후)" },
];

export default function FinancePage() {
  return (
    <div className="mx-auto max-w-[1000px]">
      <h1 className="text-[22px] font-bold text-ink">회계</h1>
      <p className="mt-1 text-[15px] text-ink-soft">회비·입출금을 자동 분류하고, 감사 보고서까지 자동으로. <b className="text-ink">매월 말 5분</b>이면 끝나요.</p>

      <div className="mt-3 flex flex-wrap gap-2">
        <Link href="/finance/import" className="rounded-full bg-primary px-4 py-2 text-[14px] font-semibold text-white hover:bg-primary-pressed">📥 거래 업로드</Link>
        <Link href="/finance/transactions" className="rounded-full border border-line px-4 py-2 text-[14px] font-semibold text-ink-soft hover:border-primary hover:text-primary">📒 거래 내역·수정</Link>
        <Link href="/finance/report" className="rounded-full border border-line px-4 py-2 text-[14px] font-semibold text-ink-soft hover:border-primary hover:text-primary">📊 보고서</Link>
      </div>

      {/* 매월 흐름 */}
      <section className="mt-4 rounded-lg border border-line bg-card p-5">
        <h2 className="text-[16px] font-bold text-ink">📆 매월 운영 흐름</h2>
        <ol className="mt-3 flex flex-col gap-2">
          {FLOW.map((s, i) => (
            <li key={i} className="flex items-start gap-3 text-[15px] text-ink">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-[13px] font-bold text-white">{i + 1}</span>
              <span>{s}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* 들어갈 기능 */}
      <section className="mt-4">
        <h2 className="mb-2 text-[16px] font-bold text-ink">들어갈 기능 (단계별 제작)</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {FEATURES.map((f) => {
            const inner = (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-[20px]">{f.icon}</span>
                  <span className="text-[15px] font-bold text-ink">{f.title}</span>
                  <span className={`ml-auto rounded-full px-2 py-0.5 text-[11px] font-semibold ${f.href ? "bg-primary text-white" : "bg-surface-soft text-ink-soft"}`}>{f.href ? "열기 →" : "준비 중"}</span>
                </div>
                <p className="mt-2 text-[13.5px] leading-relaxed text-ink-soft">{f.desc}</p>
              </>
            );
            return f.href ? (
              <Link key={f.title} href={f.href} className="rounded-lg border border-line bg-card p-4 transition hover:border-primary hover:shadow-sm">{inner}</Link>
            ) : (
              <div key={f.title} className="rounded-lg border border-line bg-card p-4">{inner}</div>
            );
          })}
        </div>
      </section>

      {/* 원칙 */}
      <section className="mt-4 rounded-lg border border-line bg-surface-soft p-4 text-[13px] leading-relaxed text-ink-soft">
        <b className="text-ink">운영 원칙</b> · 모임 규모에 맞는 <b>단식부기</b> · 앱은 <b>분류·집계·보고서까지만</b>(송금·입금확인·세무는 사람) · 자동분류 ~90%, 모호한 건 <b>사람이 확정</b> · 두 트랙(메인회계 A / 식대정산 B) ·
        <b className="text-unpaid"> 계좌번호 등 민감정보는 저장하지 않습니다</b>(이름·금액·내용까지만).
      </section>
    </div>
  );
}
