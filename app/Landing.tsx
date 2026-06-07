"use client";

// 모임온(MoimON) 랜딩 — 클로드디자인 시안(모임온 랜딩.html)을 그대로 이식.
// 원본 CSS를 .moimon 스코프로 포팅(앱 다른 화면에 누수 없음), 버튼은 /login 연결.
import Link from "next/link";
import { useEffect } from "react";
import {
  Users, CalendarDays, ClipboardCheck, Image as ImageIcon, ReceiptText, Megaphone,
  Church, Volleyball, HeartHandshake, BookOpen, GraduationCap, CheckCircle2,
} from "lucide-react";

const FEATURES = [
  { Icon: Users, t: "회원 관리", d: "명단·연락처·역할·가입일까지 한눈에. 모임의 모든 멤버를 체계적으로." },
  { Icon: CalendarDays, t: "연간 일정", d: "정기 모임과 행사를 한 해 단위로. 다가오는 일정을 자동으로 알려드려요." },
  { Icon: ClipboardCheck, t: "출석 · 식대", d: "탭 한 번으로 출석 체크, 식대는 자동 정산. 누가 얼마인지 헷갈릴 일 없이." },
  { Icon: ImageIcon, t: "콘텐츠 · 포스터", d: "모임 소식과 행사 포스터를 손쉽게 만들고 공유. 디자인 고민은 줄이고." },
  { Icon: ReceiptText, t: "회계 보고서", d: "회비·지출을 기록하면 보고서가 척척. 투명한 살림으로 신뢰까지 함께." },
  { Icon: Megaphone, t: "공지", d: "중요한 안내를 빠짐없이 전달. 읽음 확인으로 전달 여부까지 확인해요." },
];

const USES = [
  { Icon: Church, nm: "교회 소그룹", desc: "목장·셀·구역" },
  { Icon: Volleyball, nm: "동호회", desc: "취미·운동" },
  { Icon: HeartHandshake, nm: "봉사단체", desc: "나눔·후원" },
  { Icon: BookOpen, nm: "독서모임", desc: "함께 읽기" },
  { Icon: GraduationCap, nm: "스터디", desc: "자격증·학습" },
];

function Logo() {
  return (
    <span className="logo"><span className="dot">ON</span><span>모임<span className="on">온</span></span></span>
  );
}

export default function Landing() {
  // 스크롤 시 nav 하단선 + 등장 애니메이션(원본 거동 재현). 기본 상태는 이미 보임.
  useEffect(() => {
    const nav = document.getElementById("om-nav");
    const onScroll = () => nav?.classList.toggle("scrolled", window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const reveals = Array.from(document.querySelectorAll<HTMLElement>(".moimon .reveal"));
    reveals.forEach((el, i) => { el.style.animationDelay = (Math.min(i % 6, 5) * 55) + "ms"; });
    let io: IntersectionObserver | undefined;
    if ("IntersectionObserver" in window) {
      io = new IntersectionObserver((entries) => {
        entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io!.unobserve(e.target); } });
      }, { threshold: 0.08, rootMargin: "0px 0px -30px 0px" });
      reveals.forEach((el) => io!.observe(el));
    }
    return () => { window.removeEventListener("scroll", onScroll); io?.disconnect(); };
  }, []);

  return (
    <div className="moimon">
      <style>{CSS}</style>

      {/* NAV */}
      <header className="nav" id="om-nav">
        <div className="wrap nav-inner">
          <Link href="/" className="logo" aria-label="모임온 홈"><span className="dot">ON</span><span>모임<span className="on">온</span></span></Link>
          <Link href="/login" className="btn btn-soft btn-md">로그인</Link>
        </div>
      </header>

      {/* HERO */}
      <main id="top">
        <section className="hero">
          <div className="wrap hero-inner">
            <span className="eyebrow reveal"><span className="pulse" />정기 모임을 위한 운영 도구</span>
            <h1 className="reveal">모임 운영을<br /><span className="accent">ON</span> 하세요</h1>
            <p className="sub reveal">회원·출석·식대·회계·공지·콘텐츠까지.<br />흩어진 모임 살림을 한 곳에서 끝내요.</p>
            <div className="hero-cta reveal">
              <Link href="/login" className="btn btn-primary btn-lg">시작하기</Link>
              <Link href="/login" className="btn btn-ghost btn-lg" style={{ border: "1px solid var(--om-line)" }}>로그인</Link>
            </div>
            <div className="hero-note reveal"><CheckCircle2 />총무·간사를 위한, 가장 쉬운 모임 관리</div>

            {/* Mockup */}
            <div className="mock reveal" aria-hidden="true">
              <div className="mock-bar">
                <span className="tt" /><span className="tt" /><span className="tt" />
                <span className="grow" /><span className="lbl">moim-on.app</span>
              </div>
              <div className="mock-head">
                <span className="ttl">이번 주 모임 · 출석</span>
                <span className="pill">참석 18 · 결석 4</span>
              </div>
              <div className="mock-rows">
                <div className="mrow">
                  <span className="av" style={{ background: "#0066cc" }}>김</span>
                  <div><div className="nm">김서연 총무</div><div className="meta">식대 정산 완료 · 회비 납부</div></div>
                  <span className="tag tag-on">참석</span>
                </div>
                <div className="mrow">
                  <span className="av" style={{ background: "#16a34a" }}>이</span>
                  <div><div className="nm">이준호</div><div className="meta">3주 연속 출석 🔥</div></div>
                  <span className="tag tag-on">참석</span>
                </div>
                <div className="mrow">
                  <span className="av" style={{ background: "#9ca3af" }}>박</span>
                  <div><div className="nm">박민지</div><div className="meta">사전 결석 알림</div></div>
                  <span className="tag tag-off">결석</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section className="sec-warm">
          <div className="wrap">
            <div className="sec-head reveal">
              <div className="sec-tag">주요 기능</div>
              <h2>모임에 필요한 모든 것,<br />하나로 모았어요</h2>
              <p>엑셀과 단톡방, 메모장을 오가지 마세요. 운영의 처음부터 끝까지 모임온 안에서.</p>
            </div>
            <div className="feat-grid">
              {FEATURES.map(({ Icon, t, d }) => (
                <div key={t} className="feat reveal"><div className="ic"><Icon /></div><h3>{t}</h3><p>{d}</p></div>
              ))}
            </div>
          </div>
        </section>

        {/* USE CASES */}
        <section>
          <div className="wrap">
            <div className="sec-head reveal">
              <div className="sec-tag">이런 모임에 딱</div>
              <h2>임원이 필요한 정기 모임이라면 어디든 잘 맞아요</h2>
            </div>
            <div className="uses">
              {USES.map(({ Icon, nm, desc }) => (
                <div key={nm} className="use reveal"><div className="em"><Icon /></div><div className="nm">{nm}</div><div className="desc">{desc}</div></div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="cta-band" id="login">
          <div className="wrap">
            <div className="cta-box reveal">
              <h2>오늘부터, 모임 운영을 ON</h2>
              <p>몇 분이면 충분해요. 지금 바로 우리 모임을 등록해보세요.</p>
              <div className="cta-actions">
                <Link href="/login" className="btn btn-white btn-lg">시작하기</Link>
                <Link href="/login" className="btn btn-lg" style={{ background: "rgba(255,255,255,.16)", color: "#fff" }}>로그인</Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer>
        <div className="wrap foot-inner">
          <div className="foot-brand">
            <Logo />
            <span className="slogan">모임 운영을 ON — 정기 모임의 운영을 한 곳에서.</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <nav className="foot-links">
              <a href="#">서비스 소개</a>
              <a href="#">이용약관</a>
              <a href="#">개인정보처리방침</a>
              <a href="#">고객문의</a>
            </nav>
            <div className="foot-copy">© 2026 모임온(MoimON). All rights reserved.</div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// 원본(모임온 랜딩.html) CSS를 .moimon 스코프로 이식 (전역 누수 방지).
const CSS = `
.moimon {
  --om-brand:#0066cc; --om-brand-strong:#0052a8; --om-brand-soft:#e8f1fc; --om-brand-softer:#f3f8fe;
  --om-ink:#16181d; --om-ink-2:#3d424d; --om-ink-3:#767d8a; --om-line:#ecedf0;
  --om-bg:#ffffff; --om-bg-warm:#fafafb;
  --om-radius-btn:14px; --om-radius-card:20px;
  --om-shadow-sm:0 1px 2px rgba(20,24,34,.04), 0 4px 16px rgba(20,24,34,.04);
  --om-shadow-md:0 2px 6px rgba(20,24,34,.05), 0 14px 40px rgba(20,40,80,.08);
  --om-maxw:1080px;
  width:100vw; position:relative; left:50%; right:50%; margin-left:-50vw; margin-right:-50vw;
  margin-top:-24px; margin-bottom:-80px;
  font-family:"Pretendard",-apple-system,system-ui,sans-serif;
  color:var(--om-ink); background:var(--om-bg); line-height:1.5; letter-spacing:-0.01em;
  -webkit-font-smoothing:antialiased; text-rendering:optimizeLegibility; font-synthesis:none;
}
.moimon *{ box-sizing:border-box; margin:0; padding:0; }
.moimon a{ text-decoration:none; color:inherit; }
.moimon .wrap{ width:100%; max-width:var(--om-maxw); margin:0 auto; padding:0 22px; }

.moimon .btn{ display:inline-flex; align-items:center; justify-content:center; gap:8px; font-family:inherit; font-weight:600; letter-spacing:-0.02em; border:0; cursor:pointer; border-radius:var(--om-radius-btn); transition:transform .12s ease, background .15s ease, box-shadow .15s ease, color .15s ease; white-space:nowrap; }
.moimon .btn:active{ transform:translateY(1px) scale(.99); }
.moimon .btn-primary{ background:var(--om-brand); color:#fff; box-shadow:0 6px 18px rgba(0,102,204,.24); }
.moimon .btn-primary:hover{ background:var(--om-brand-strong); box-shadow:0 8px 22px rgba(0,102,204,.30); }
.moimon .btn-ghost{ background:transparent; color:var(--om-ink-2); }
.moimon .btn-ghost:hover{ background:#f1f2f4; color:var(--om-ink); }
.moimon .btn-soft{ background:var(--om-brand-soft); color:var(--om-brand-strong); }
.moimon .btn-soft:hover{ background:#dbe9fb; }
.moimon .btn-lg{ font-size:17px; padding:17px 30px; }
.moimon .btn-md{ font-size:15px; padding:11px 18px; }

.moimon .nav{ position:sticky; top:0; z-index:50; background:rgba(255,255,255,.78); backdrop-filter:saturate(180%) blur(14px); -webkit-backdrop-filter:saturate(180%) blur(14px); border-bottom:1px solid transparent; transition:border-color .2s ease; }
.moimon .nav.scrolled{ border-bottom-color:var(--om-line); }
.moimon .nav-inner{ display:flex; align-items:center; justify-content:space-between; height:62px; }
.moimon .logo{ display:inline-flex; align-items:center; gap:9px; font-weight:800; font-size:20px; letter-spacing:-0.03em; }
.moimon .logo .dot{ width:26px; height:26px; border-radius:9px; display:grid; place-items:center; background:var(--om-brand); color:#fff; font-size:13px; font-weight:800; box-shadow:0 3px 10px rgba(0,102,204,.35); }
.moimon .logo .on{ color:var(--om-brand); }

.moimon .hero{ position:relative; overflow:hidden; padding:30px 0 14px; }
.moimon .hero::before{ content:""; position:absolute; inset:-200px 0 auto 0; height:560px; z-index:0; background:radial-gradient(680px 360px at 50% -8%, var(--om-brand-soft) 0%, rgba(232,241,252,0) 70%); }
.moimon .hero-inner{ position:relative; z-index:1; text-align:center; padding:38px 0 30px; }
.moimon .eyebrow{ display:inline-flex; align-items:center; gap:7px; background:#fff; border:1px solid var(--om-line); box-shadow:var(--om-shadow-sm); color:var(--om-ink-2); font-size:13.5px; font-weight:600; padding:7px 14px 7px 11px; border-radius:999px; margin-bottom:26px; }
.moimon .eyebrow .pulse{ width:7px; height:7px; border-radius:50%; background:var(--om-brand); box-shadow:0 0 0 0 rgba(0,102,204,.4); animation:om-pulse 2s infinite; }
@keyframes om-pulse{ 0%{box-shadow:0 0 0 0 rgba(0,102,204,.35)} 70%{box-shadow:0 0 0 7px rgba(0,102,204,0)} 100%{box-shadow:0 0 0 0 rgba(0,102,204,0)} }
.moimon .hero h1{ font-size:clamp(36px,8.5vw,62px); line-height:1.12; letter-spacing:-0.045em; font-weight:800; color:var(--om-ink); margin-bottom:20px; text-wrap:balance; }
.moimon .hero h1 .accent{ color:var(--om-brand); }
.moimon .hero p.sub{ font-size:clamp(16px,4.2vw,19px); color:var(--om-ink-3); font-weight:500; max-width:30ch; margin:0 auto 32px; text-wrap:balance; line-height:1.6; }
.moimon .hero-cta{ display:flex; flex-direction:column; gap:10px; max-width:340px; margin:0 auto; }
.moimon .hero-note{ margin-top:16px; font-size:13px; color:var(--om-ink-3); display:flex; gap:6px; align-items:center; justify-content:center; }
.moimon .hero-note svg{ width:15px; height:15px; color:var(--om-brand); }

.moimon .mock{ margin:40px auto 0; max-width:380px; background:#fff; border:1px solid var(--om-line); border-radius:26px; box-shadow:var(--om-shadow-md); padding:14px; position:relative; }
.moimon .mock-bar{ display:flex; align-items:center; gap:8px; padding:6px 8px 14px; }
.moimon .mock-bar .tt{ width:9px; height:9px; border-radius:50%; background:#e2e4e8; }
.moimon .mock-bar .grow{ flex:1; }
.moimon .mock-bar .lbl{ font-size:12px; color:var(--om-ink-3); font-weight:600; }
.moimon .mock-head{ display:flex; align-items:center; justify-content:space-between; padding:4px 6px 14px; }
.moimon .mock-head .ttl{ font-weight:800; font-size:17px; letter-spacing:-0.03em; }
.moimon .mock-head .pill{ font-size:11.5px; font-weight:700; color:var(--om-brand-strong); background:var(--om-brand-soft); padding:5px 10px; border-radius:999px; }
.moimon .mock-rows{ display:flex; flex-direction:column; gap:9px; }
.moimon .mrow{ display:flex; align-items:center; gap:12px; padding:12px; border-radius:14px; background:var(--om-bg-warm); }
.moimon .mrow .av{ width:36px; height:36px; border-radius:50%; display:grid; place-items:center; font-weight:700; font-size:14px; color:#fff; flex-shrink:0; }
.moimon .mrow .nm{ font-weight:700; font-size:14.5px; }
.moimon .mrow .meta{ font-size:12px; color:var(--om-ink-3); margin-top:1px; }
.moimon .mrow .tag{ margin-left:auto; font-size:11.5px; font-weight:700; padding:5px 10px; border-radius:999px; }
.moimon .tag-on{ color:#0a7d3f; background:#e4f6ec; }
.moimon .tag-off{ color:var(--om-ink-3); background:#eff0f2; }

.moimon section{ padding:64px 0; }
.moimon .sec-warm{ background:var(--om-bg-warm); }
.moimon .sec-head{ text-align:center; max-width:36ch; margin:0 auto 44px; }
.moimon .sec-tag{ color:var(--om-brand); font-weight:700; font-size:14px; letter-spacing:-0.01em; margin-bottom:12px; }
.moimon .sec-head h2{ font-size:clamp(26px,6vw,36px); font-weight:800; letter-spacing:-0.04em; line-height:1.22; text-wrap:balance; }
.moimon .sec-head p{ margin-top:14px; color:var(--om-ink-3); font-size:16px; font-weight:500; text-wrap:balance; }

.moimon .feat-grid{ display:grid; grid-template-columns:1fr; gap:14px; }
.moimon .feat{ background:#fff; border:1px solid var(--om-line); border-radius:var(--om-radius-card); padding:24px; box-shadow:var(--om-shadow-sm); transition:transform .16s ease, box-shadow .16s ease, border-color .16s ease; }
.moimon .feat:hover{ transform:translateY(-3px); box-shadow:var(--om-shadow-md); border-color:#dde7f3; }
.moimon .feat .ic{ width:48px; height:48px; border-radius:14px; display:grid; place-items:center; background:var(--om-brand-soft); color:var(--om-brand); margin-bottom:16px; }
.moimon .feat .ic svg{ width:24px; height:24px; stroke-width:2.1; }
.moimon .feat h3{ font-size:18px; font-weight:700; letter-spacing:-0.03em; margin-bottom:7px; }
.moimon .feat p{ font-size:14.5px; color:var(--om-ink-3); line-height:1.6; font-weight:500; }

.moimon .uses{ display:grid; grid-template-columns:repeat(2,1fr); gap:12px; }
.moimon .use{ background:#fff; border:1px solid var(--om-line); border-radius:18px; padding:22px 18px; text-align:center; box-shadow:var(--om-shadow-sm); transition:transform .16s ease, box-shadow .16s ease; }
.moimon .use:hover{ transform:translateY(-2px); box-shadow:var(--om-shadow-md); }
.moimon .use .em{ width:52px; height:52px; margin:0 auto 12px; border-radius:16px; display:grid; place-items:center; background:var(--om-brand-softer); color:var(--om-brand); }
.moimon .use .em svg{ width:26px; height:26px; stroke-width:2; }
.moimon .use .nm{ font-weight:700; font-size:16px; letter-spacing:-0.03em; }
.moimon .use .desc{ font-size:13px; color:var(--om-ink-3); margin-top:5px; font-weight:500; }

.moimon .cta-band{ padding:70px 0 78px; }
.moimon .cta-box{ background:linear-gradient(160deg, var(--om-brand) 0%, var(--om-brand-strong) 100%); border-radius:28px; padding:54px 28px; text-align:center; color:#fff; position:relative; overflow:hidden; box-shadow:0 24px 60px rgba(0,82,168,.30); }
.moimon .cta-box::after{ content:""; position:absolute; right:-80px; top:-80px; width:280px; height:280px; background:radial-gradient(circle, rgba(255,255,255,.16), transparent 65%); pointer-events:none; }
.moimon .cta-box h2{ font-size:clamp(26px,6.5vw,38px); font-weight:800; letter-spacing:-0.04em; line-height:1.2; margin-bottom:14px; text-wrap:balance; position:relative; }
.moimon .cta-box p{ font-size:16px; opacity:.92; margin-bottom:30px; font-weight:500; text-wrap:balance; position:relative; }
.moimon .cta-box .btn-white{ background:#fff; color:var(--om-brand-strong); position:relative; box-shadow:0 8px 24px rgba(0,0,0,.16); }
.moimon .cta-box .btn-white:hover{ background:#f4f8ff; }
.moimon .cta-actions{ display:flex; flex-direction:column; gap:10px; max-width:320px; margin:0 auto; }

.moimon footer{ padding:44px 0 56px; border-top:1px solid var(--om-line); }
.moimon .foot-inner{ display:flex; flex-direction:column; gap:22px; }
.moimon .foot-brand{ display:flex; flex-direction:column; gap:10px; }
.moimon .foot-brand .slogan{ color:var(--om-ink-3); font-size:14px; font-weight:500; }
.moimon .foot-links{ display:flex; flex-wrap:wrap; gap:8px 22px; }
.moimon .foot-links a{ font-size:14px; color:var(--om-ink-2); font-weight:500; }
.moimon .foot-links a:hover{ color:var(--om-brand); }
.moimon .foot-copy{ color:var(--om-ink-3); font-size:13px; }

.moimon .reveal{ opacity:1; }
@keyframes om-rise{ from{ opacity:0; transform:translateY(18px); } to{ opacity:1; transform:none; } }
@media (prefers-reduced-motion: no-preference){ .moimon .reveal.in{ animation:om-rise .6s cubic-bezier(.2,.7,.2,1) both; } }

@media (min-width:720px){
  .moimon .wrap{ padding:0 32px; }
  .moimon .hero-inner{ padding:54px 0 40px; }
  .moimon .hero-cta{ flex-direction:row; justify-content:center; max-width:none; }
  .moimon .hero-cta .btn{ min-width:168px; }
  .moimon .feat-grid{ grid-template-columns:repeat(3,1fr); gap:18px; }
  .moimon .uses{ grid-template-columns:repeat(5,1fr); }
  .moimon .cta-actions{ flex-direction:row; justify-content:center; max-width:none; }
  .moimon .cta-actions .btn{ min-width:180px; }
  .moimon .foot-inner{ flex-direction:row; align-items:flex-end; justify-content:space-between; }
  .moimon section{ padding:84px 0; }
  .moimon .mock{ max-width:420px; }
}
`;
