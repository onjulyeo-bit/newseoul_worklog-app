// 모임온 랜딩 시안 (미리보기 전용) — 레퍼런스(밝은 하늘빛 SaaS) 참고.
import Link from "next/link";

const FEATURES = [
  { icon: "👥", t: "회원 관리", d: "노션식 표로 회원·연락처·구분 정리, 엑셀 가져오기" },
  { icon: "📅", t: "연간 일정", d: "회차·온오프·프로그램까지 한눈에" },
  { icon: "🍽", t: "출석·식대", d: "QR 자가 체크인 + 식대 입금 안내, 미납 자동 정리" },
  { icon: "🎨", t: "콘텐츠·포스터", d: "주간 안내글·포스터를 클릭 몇 번에" },
  { icon: "💰", t: "회계 보고서", d: "거래 올리면 자동 분류·집계, 감사 보고서까지" },
  { icon: "📢", t: "공지", d: "포스터·안내를 회원에게 바로 게시" },
];

export default function PreviewLanding() {
  return (
    <div className="-mx-5 -mt-6">
      {/* 히어로 */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#dbeafe] via-[#eef5ff] to-white px-5 pb-20 pt-16 text-center">
        <div className="mx-auto max-w-[720px]">
          <div className="text-[13px] font-bold uppercase tracking-[3px] text-primary">모임온 · MoimON</div>
          <h1 className="mt-4 text-[40px] font-black leading-[1.15] tracking-tight text-ink sm:text-[52px]">잡무 말고,<br />모임에 집중하세요</h1>
          <p className="mx-auto mt-5 max-w-[520px] text-[17px] leading-relaxed text-ink-soft">회원·출석·식대·회계·공지·콘텐츠까지 — 모임 운영을 한 곳에서. <b className="text-ink">모임온</b>이 총무·간사의 일을 대신합니다.</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link href="/login" className="rounded-full bg-primary px-7 py-3 text-[16px] font-semibold text-white shadow-sm hover:bg-primary-pressed">시작하기</Link>
            <Link href="/login" className="rounded-full border border-line bg-white px-7 py-3 text-[16px] font-semibold text-ink-soft hover:border-primary hover:text-primary">로그인</Link>
          </div>
          <p className="mt-4 text-[13px] text-muted">슬로건 · 모임 운영을 ON</p>
        </div>
        {/* 앱 미리보기 카드 (목업) */}
        <div className="mx-auto mt-12 max-w-[560px] rounded-2xl border border-white/60 bg-white/70 p-3 shadow-xl backdrop-blur">
          <div className="grid grid-cols-3 gap-2">
            {["대시보드", "출석 통계", "회계 보고서"].map((s) => (
              <div key={s} className="rounded-lg bg-gradient-to-br from-navy to-deep px-2 py-6 text-center">
                <div className="text-[18px]">📊</div><div className="mt-1 text-[11px] font-bold text-on-dark">{s}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 가치 */}
      <section className="px-5 py-16 text-center">
        <h2 className="text-[26px] font-bold text-ink">매주 몇 시간을 아껴요</h2>
        <p className="mt-2 text-[15px] text-ink-soft">반복되는 운영 잡무를 모임온이 자동으로.</p>
        <div className="mx-auto mt-8 grid max-w-[900px] gap-4 sm:grid-cols-3">
          {[
            { i: "🍽", t: "출석·식대 자동", d: "QR로 출석, 식대 안내·미납까지 척척" },
            { i: "🎨", t: "콘텐츠 한 번에", d: "주간 안내글·포스터 자동 생성" },
            { i: "💰", t: "회계 자동", d: "거래 올리면 분류·보고서 자동 완성" },
          ].map((c) => (
            <div key={c.t} className="rounded-2xl border border-line bg-card p-6 text-left shadow-sm">
              <div className="text-[28px]">{c.i}</div>
              <div className="mt-3 text-[17px] font-bold text-ink">{c.t}</div>
              <p className="mt-1.5 text-[14px] leading-relaxed text-ink-soft">{c.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 기능 그리드 */}
      <section className="bg-surface-soft px-5 py-16">
        <div className="mx-auto max-w-[900px] text-center">
          <h2 className="text-[26px] font-bold text-ink">모임 운영에 필요한 모든 것</h2>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.t} className="rounded-xl border border-line bg-card p-5 text-left">
                <div className="flex items-center gap-2"><span className="text-[22px]">{f.icon}</span><span className="text-[16px] font-bold text-ink">{f.t}</span></div>
                <p className="mt-2 text-[13.5px] leading-relaxed text-ink-soft">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 타깃 */}
      <section className="px-5 py-16 text-center">
        <h2 className="text-[26px] font-bold text-ink">이런 모임에 딱</h2>
        <p className="mt-2 text-[15px] text-ink-soft">임원(총무·간사)이 있는 정기 모임이라면.</p>
        <div className="mx-auto mt-7 flex max-w-[680px] flex-wrap justify-center gap-2.5">
          {["⛪ 교회 소그룹", "🎯 동호회", "🤝 봉사단체", "📚 독서모임", "💡 스터디"].map((t) => (
            <span key={t} className="rounded-full border border-line bg-card px-4 py-2 text-[15px] font-semibold text-ink-soft">{t}</span>
          ))}
        </div>
      </section>

      {/* 안전 */}
      <section className="bg-gradient-to-b from-white to-[#eef5ff] px-5 py-16">
        <div className="mx-auto max-w-[900px] text-center">
          <h2 className="text-[26px] font-bold text-ink">🔒 데이터는 안전합니다</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              { t: "권한 분리", d: "임원·회원 권한을 DB 단에서 차단(RLS). 남의 정보 못 봐요" },
              { t: "민감정보 미저장", d: "주민번호·계좌번호는 저장하지 않아요" },
              { t: "자동 백업", d: "데이터는 클라우드에 안전 보관" },
            ].map((c) => (
              <div key={c.t} className="rounded-2xl border border-line bg-card p-6 text-left shadow-sm">
                <div className="text-[16px] font-bold text-ink">{c.t}</div>
                <p className="mt-1.5 text-[14px] leading-relaxed text-ink-soft">{c.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-5 py-20 text-center">
        <h2 className="text-[30px] font-black text-ink">지금, 모임 운영을 켜세요</h2>
        <p className="mt-3 text-[16px] text-ink-soft">로그인 한 번이면 시작이에요.</p>
        <Link href="/login" className="mt-7 inline-block rounded-full bg-primary px-8 py-3.5 text-[17px] font-semibold text-white shadow-sm hover:bg-primary-pressed">로그인 / 시작하기</Link>
      </section>

      <footer className="border-t border-line px-5 py-8 text-center text-[13px] text-muted">© 모임온 · MoimON — 모임 운영을 ON</footer>
    </div>
  );
}
