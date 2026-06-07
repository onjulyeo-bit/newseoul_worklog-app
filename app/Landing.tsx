// 모임온(MoimON) 랜딩 — 익명 방문자에게 보이는 서비스 소개 + 로그인 진입.
// 클로드디자인 시안(깨끗한 흰 배경 · ON 파랑 강조 · 실제 앱 미리보기 카드) 기반.
import Link from "next/link";

const VALUE = [
  { i: "🍽", t: "출석·식대 자동", d: "QR로 자가 출석, 식대 안내·미납 정리까지 척척" },
  { i: "🎨", t: "콘텐츠 한 번에", d: "주간 안내글·포스터를 클릭 몇 번에 자동 생성" },
  { i: "💰", t: "회계 자동", d: "거래만 올리면 분류·집계·보고서가 저절로" },
];

const FEATURES = [
  { i: "👥", t: "회원 관리", d: "회원·연락처·구분을 표 하나로, 엑셀 가져오기" },
  { i: "📅", t: "연간 일정", d: "회차·온오프·프로그램까지 한눈에" },
  { i: "🍽", t: "출석·식대", d: "QR 자가 체크인 + 식대 안내, 미납 자동 정리" },
  { i: "🎨", t: "콘텐츠·포스터", d: "주간 안내글·포스터를 클릭 몇 번에" },
  { i: "💰", t: "회계 보고서", d: "거래 올리면 자동 분류·집계, 감사 보고서까지" },
  { i: "📊", t: "출석 통계·공지", d: "출석률·출석상 + 포스터를 회원에게 바로 게시" },
];

const TARGETS = ["⛪ 교회 소그룹", "🎯 동호회", "🤝 봉사단체", "📚 독서모임", "💡 스터디"];

const SAFETY = [
  { t: "권한 분리", d: "임원·회원 권한을 DB 단(RLS)에서 차단. 남의 정보는 못 봐요" },
  { t: "민감정보 미저장", d: "주민번호·계좌번호는 아예 저장하지 않아요" },
  { t: "자동 백업", d: "데이터는 클라우드에 안전하게 보관돼요" },
];

function Logo() {
  return (
    <span className="flex items-center gap-2">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-[13px] font-black text-white">ON</span>
      <span className="text-[19px] font-extrabold tracking-tight text-ink">모임<span className="text-primary">온</span></span>
    </span>
  );
}

export default function Landing() {
  return (
    // 레이아웃 <main>의 여백을 상쇄해 풀블리드로
    <div className="-mx-5 -mt-6 -mb-20 bg-white text-ink">
      {/* 상단 헤더 */}
      <header className="sticky top-0 z-30 border-b border-line/70 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-[1100px] items-center justify-between px-5 py-3.5">
          <Logo />
          <Link href="/login" className="rounded-full bg-[rgba(0,102,204,.08)] px-5 py-2 text-[14px] font-bold text-primary hover:bg-[rgba(0,102,204,.14)]">로그인</Link>
        </div>
      </header>

      {/* 히어로 */}
      <section className="px-5 pb-16 pt-16 text-center sm:pt-20">
        <div className="mx-auto max-w-[760px]">
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-1.5 text-[13px] font-bold text-ink-soft shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" /> 정기 모임을 위한 운영 도구
          </span>
          <h1 className="mt-6 text-[44px] font-black leading-[1.12] tracking-tight text-ink sm:text-[60px]">
            모임 운영을<br /><span className="text-primary">ON</span> 하세요
          </h1>
          <p className="mx-auto mt-5 max-w-[460px] text-[17px] leading-relaxed text-ink-soft sm:text-[18px]">
            회원·출석·식대·회계·공지·콘텐츠까지.<br />흩어진 모임 살림을 한 곳에서 끝내요.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/login" className="rounded-2xl bg-primary px-8 py-3.5 text-[16px] font-bold text-white shadow-sm transition hover:bg-primary-pressed">시작하기</Link>
            <Link href="/login" className="rounded-2xl border border-line bg-white px-8 py-3.5 text-[16px] font-bold text-ink-soft transition hover:border-primary hover:text-primary">로그인</Link>
          </div>
          <p className="mt-5 flex items-center justify-center gap-1.5 text-[13.5px] font-semibold text-muted">
            <span className="text-primary">✓</span> 총무·간사를 위한, 가장 쉬운 모임 관리
          </p>
        </div>

        {/* 앱 미리보기 카드 (목업) */}
        <div className="mx-auto mt-14 max-w-[560px] overflow-hidden rounded-[20px] border border-line bg-white shadow-[0_20px_60px_-25px_rgba(26,34,56,.35)]">
          <div className="flex items-center gap-2 border-b border-line/70 px-5 py-3">
            <span className="h-2.5 w-2.5 rounded-full bg-[#e2e6ee]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#e2e6ee]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#e2e6ee]" />
            <span className="ml-auto text-[12px] font-semibold text-muted">moim-on.app</span>
          </div>
          <div className="px-5 py-5 text-left">
            <div className="flex items-center justify-between">
              <span className="text-[16px] font-extrabold text-ink">이번 주 모임 · 출석</span>
              <span className="rounded-full bg-[rgba(0,102,204,.1)] px-3 py-1 text-[12px] font-bold text-primary">참석 18 · 결석 4</span>
            </div>
            <div className="mt-4 flex flex-col gap-2.5">
              {[
                { c: "bg-primary", a: "김", n: "김서연 총무", d: "식대 정산 완료 · 회비 납부" },
                { c: "bg-present", a: "이", n: "이준호", d: "3주 연속 출석 🔥" },
                { c: "bg-deep", a: "박", n: "박民수", d: "회계 보고서 업로드" },
              ].map((r) => (
                <div key={r.n} className="flex items-center gap-3 rounded-xl border border-line/70 bg-surface-soft/40 px-3.5 py-2.5">
                  <span className={`grid h-9 w-9 place-items-center rounded-full text-[14px] font-bold text-white ${r.c}`}>{r.a}</span>
                  <span className="min-w-0">
                    <span className="block text-[14px] font-bold text-ink">{r.n}</span>
                    <span className="block text-[12.5px] text-ink-soft">{r.d}</span>
                  </span>
                  <span className="ml-auto rounded-full bg-[rgba(46,125,82,.12)] px-2.5 py-1 text-[12px] font-bold text-success">참석</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 가치 */}
      <section className="px-5 py-16 text-center">
        <h2 className="text-[27px] font-extrabold tracking-tight text-ink">매주 몇 시간을 아껴요</h2>
        <p className="mt-2.5 text-[15px] text-ink-soft">반복되는 운영 잡무를 모임온이 자동으로.</p>
        <div className="mx-auto mt-9 grid max-w-[900px] gap-4 sm:grid-cols-3">
          {VALUE.map((c) => (
            <div key={c.t} className="rounded-2xl border border-line bg-white p-6 text-left shadow-sm">
              <div className="text-[30px]">{c.i}</div>
              <div className="mt-3 text-[17px] font-extrabold text-ink">{c.t}</div>
              <p className="mt-1.5 text-[14px] leading-relaxed text-ink-soft">{c.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 기능 그리드 */}
      <section className="bg-surface-soft px-5 py-16">
        <div className="mx-auto max-w-[920px] text-center">
          <h2 className="text-[27px] font-extrabold tracking-tight text-ink">모임 운영에 필요한 모든 것</h2>
          <p className="mt-2.5 text-[15px] text-ink-soft">하나의 앱에서, 처음부터 끝까지.</p>
          <div className="mt-9 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.t} className="rounded-2xl border border-line bg-white p-5 text-left">
                <div className="flex items-center gap-2"><span className="text-[22px]">{f.i}</span><span className="text-[16px] font-extrabold text-ink">{f.t}</span></div>
                <p className="mt-2 text-[13.5px] leading-relaxed text-ink-soft">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 타깃 */}
      <section className="px-5 py-16 text-center">
        <h2 className="text-[27px] font-extrabold tracking-tight text-ink">이런 모임에 딱</h2>
        <p className="mt-2.5 text-[15px] text-ink-soft">임원(총무·간사)이 있는 정기 모임이라면.</p>
        <div className="mx-auto mt-8 flex max-w-[680px] flex-wrap justify-center gap-2.5">
          {TARGETS.map((t) => (
            <span key={t} className="rounded-full border border-line bg-white px-4 py-2 text-[15px] font-bold text-ink-soft">{t}</span>
          ))}
        </div>
      </section>

      {/* 안전 */}
      <section className="bg-surface-soft px-5 py-16">
        <div className="mx-auto max-w-[920px] text-center">
          <h2 className="text-[27px] font-extrabold tracking-tight text-ink">🔒 데이터는 안전합니다</h2>
          <div className="mt-9 grid gap-4 sm:grid-cols-3">
            {SAFETY.map((c) => (
              <div key={c.t} className="rounded-2xl border border-line bg-white p-6 text-left shadow-sm">
                <div className="text-[16px] font-extrabold text-ink">{c.t}</div>
                <p className="mt-1.5 text-[14px] leading-relaxed text-ink-soft">{c.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-5 py-20 text-center">
        <h2 className="text-[32px] font-black tracking-tight text-ink">지금, 모임 운영을 켜세요</h2>
        <p className="mt-3 text-[16px] text-ink-soft">로그인 한 번이면 시작이에요.</p>
        <Link href="/login" className="mt-8 inline-block rounded-2xl bg-primary px-9 py-4 text-[17px] font-bold text-white shadow-sm transition hover:bg-primary-pressed">로그인 / 시작하기</Link>
      </section>

      <footer className="border-t border-line px-5 py-9 text-center">
        <div className="mx-auto flex max-w-[1100px] flex-col items-center gap-2 sm:flex-row sm:justify-between">
          <Logo />
          <span className="text-[13px] text-muted">© 모임온 · MoimON — 모임 운영을 ON</span>
        </div>
      </footer>
    </div>
  );
}
