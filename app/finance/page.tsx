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
  { icon: "📊", title: "월간 보고서", desc: "수입·지출 요약 + 식대 정산표(인원수만) + 잔액 대조. PDF·링크로 감사 공유." },
  { icon: "👥", title: "연회비 납부 현황", desc: "입금액·비고란으로 정회원/부부/준회원 자동 판정 → 회원별 납부 현황 자동 채움." },
  { icon: "🍽", title: "식대 정산표", desc: "회차별 입금·결재·차액. 월 누계 차액 한 줄만 메인회계에 반영. 출석 모듈과 연동." },
  { icon: "📅", title: "연간 결산서", desc: "12개월 누적 → 결산서 항목 체계(수입 4·지출 11)로 자동 완성." },
];

export default function FinancePage() {
  return (
    <div className="mx-auto max-w-[1000px]">
      <h1 className="text-[22px] font-bold text-ink">회계</h1>
      <p className="mt-1 text-[15px] text-ink-soft">회비·입출금을 자동 분류하고, 감사 보고서까지 자동으로. <b className="text-ink">매월 말 5분</b>이면 끝나요.</p>

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
