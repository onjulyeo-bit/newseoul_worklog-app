// 입회 안내(/join) — 공개용. 새서울지회 입회 절차 먼저 → CBMC 중앙회 등록 연결.
//   정적 콘텐츠(전문가 버전 확정안). 익명·회원 누구나 열람 가능.
import Link from "next/link";
import { UserCheck, MessageSquareText, Users, PartyPopper, ArrowUpRight, LogIn } from "lucide-react";

export const metadata = {
  title: "입회 안내 · 새서울 CBMC",
  description: "CBMC 새서울지회 입회 절차 안내 — 정기모임 3회 이상 참석 후 면담을 거쳐 정회원으로 등록됩니다.",
};

const STEPS = [
  { Icon: UserCheck, t: "참석", d: "온라인·오프라인 정기모임에 3회 이상 참석하여 모임을 충분히 경험합니다." },
  { Icon: MessageSquareText, t: "등록 의사 표명", d: "정회원으로 함께하고자 하는 뜻을 밝힙니다." },
  { Icon: Users, t: "면담", d: "당해 연도 지회장 및 신입회원 분과와 면담을 진행합니다." },
  { Icon: PartyPopper, t: "환영", d: "면담 후 지회 단체방에 초대되어 정식 회원으로 활동을 시작합니다." },
];

export default function JoinPage() {
  return (
    <div className="moim-join">
      <style>{JOIN_CSS}</style>

      <header className="jn-hero">
        <span className="jn-badge">{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/cbmc-symbol.webp" alt="CBMC" /></span>
        <p className="jn-kicker">CBMC 새서울지회</p>
        <h1 className="jn-title">입회 안내</h1>
        <p className="jn-lead">
          CBMC(한국기독실업인회)는 일터를 선교지 삼아 비즈니스 현장에서 그리스도를 증거하는
          기독 실업인들의 모임입니다. 새서울지회는 매주 금요일 정기모임을 중심으로
          신앙과 사업을 함께 나누며 동역합니다.
        </p>
      </header>

      {/* 2단계 개요 */}
      <section className="jn-flow">
        <div className="jn-flow-card">
          <span className="jn-step-no">1</span>
          <div><b>새서울지회 입회</b><span>아래 절차를 먼저 진행합니다</span></div>
        </div>
        <div className="jn-flow-arrow">→</div>
        <div className="jn-flow-card">
          <span className="jn-step-no">2</span>
          <div><b>CBMC 중앙회 등록</b><span>지회 입회 확정 후 진행합니다</span></div>
        </div>
      </section>

      {/* ① 새서울지회 입회 절차 */}
      <section className="jn-sec">
        <h2 className="jn-h2"><span className="jn-num">①</span> 새서울지회 입회 절차</h2>
        <ol className="jn-steps">
          {STEPS.map((s, i) => (
            <li key={s.t} className="jn-step">
              <span className="jn-ic"><s.Icon size={20} /></span>
              <div className="jn-step-body">
                <div className="jn-step-h"><span className="jn-step-i">{i + 1}</span><b>{s.t}</b></div>
                <p>{s.d}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* ② 중앙회 등록 */}
      <section className="jn-sec">
        <h2 className="jn-h2"><span className="jn-num">②</span> CBMC 중앙회 등록</h2>
        <p className="jn-p">
          지회 입회가 확정되면 CBMC 중앙회에 회원 등록을 진행합니다.
          중앙회의 사명·자격·혜택은 아래에서 확인하실 수 있습니다.
        </p>
        <a className="jn-cta" href="https://www.cbmc.or.kr/src/pre_intro.php" target="_blank" rel="noreferrer">
          CBMC 중앙회 입회안내 바로가기 <ArrowUpRight size={18} />
        </a>
      </section>

      <footer className="jn-foot">
        <p className="jn-contact">문의 — 새서울지회 사무국 / 지회장</p>
        <Link href="/" className="jn-login"><LogIn size={16} /> 이미 회원이신가요? 로그인</Link>
      </footer>
    </div>
  );
}

const JOIN_CSS = `
.moim-join{
  --brand:#003ecc; --brand-strong:#0032a8; --brand-soft:#e8f1fc; --brand-softer:#f3f8fe;
  --navy:#1e2353; --ink:#16181d; --ink-2:#3d424d; --ink-3:#767d8a; --line:#ecedf0; --bg:#fff;
  max-width:740px; margin:0 auto; padding:8px 18px 56px; color:var(--ink); line-height:1.6; letter-spacing:-0.01em;
}
.moim-join *{ box-sizing:border-box; }
.moim-join h1,.moim-join h2,.moim-join p,.moim-join ol{ margin:0; }
.moim-join .jn-hero{ text-align:center; padding:28px 8px 22px; }
.moim-join .jn-badge{ display:inline-grid; place-items:center; width:60px; height:60px; border-radius:16px; background:var(--brand-soft); margin-bottom:14px; }
.moim-join .jn-badge img{ width:38px; height:38px; object-fit:contain; }
.moim-join .jn-kicker{ font-size:13px; font-weight:800; color:var(--brand); letter-spacing:0.02em; }
.moim-join .jn-title{ font-size:clamp(26px,7vw,34px); font-weight:800; letter-spacing:-0.04em; margin:4px 0 14px; }
.moim-join .jn-lead{ font-size:16px; color:var(--ink-2); max-width:560px; margin:0 auto; }

.moim-join .jn-flow{ display:flex; align-items:stretch; gap:10px; margin:8px 0 30px; }
.moim-join .jn-flow-card{ flex:1; display:flex; align-items:center; gap:12px; background:var(--bg); border:1px solid var(--line); border-radius:16px; padding:16px; box-shadow:0 1px 2px rgba(20,24,34,.04), 0 4px 14px rgba(20,24,34,.05); }
.moim-join .jn-step-no{ flex:none; width:34px; height:34px; border-radius:50%; background:var(--brand); color:#fff; font-weight:800; display:grid; place-items:center; font-size:16px; }
.moim-join .jn-flow-card div{ display:flex; flex-direction:column; }
.moim-join .jn-flow-card b{ font-size:15.5px; font-weight:800; }
.moim-join .jn-flow-card span{ font-size:12.5px; color:var(--ink-3); }
.moim-join .jn-flow-arrow{ display:grid; place-items:center; color:var(--ink-3); font-size:20px; font-weight:700; }

.moim-join .jn-sec{ background:var(--bg); border:1px solid var(--line); border-radius:20px; padding:24px 22px; margin-bottom:18px; box-shadow:0 1px 2px rgba(20,24,34,.04), 0 4px 14px rgba(20,24,34,.05); }
.moim-join .jn-h2{ font-size:19px; font-weight:800; letter-spacing:-0.03em; display:flex; align-items:center; gap:9px; margin-bottom:16px; }
.moim-join .jn-num{ color:var(--brand); }
.moim-join .jn-p{ font-size:15.5px; color:var(--ink-2); margin-bottom:18px; }

.moim-join .jn-steps{ list-style:none; padding:0; display:flex; flex-direction:column; gap:4px; }
.moim-join .jn-step{ display:flex; gap:14px; padding:12px 0; border-bottom:1px solid var(--line); }
.moim-join .jn-step:last-child{ border-bottom:0; padding-bottom:0; }
.moim-join .jn-step:first-child{ padding-top:0; }
.moim-join .jn-ic{ flex:none; width:42px; height:42px; border-radius:12px; background:var(--brand-soft); color:var(--brand); display:grid; place-items:center; }
.moim-join .jn-step-body{ flex:1; }
.moim-join .jn-step-h{ display:flex; align-items:center; gap:9px; margin-bottom:3px; }
.moim-join .jn-step-i{ width:22px; height:22px; border-radius:50%; background:var(--navy); color:#fff; font-size:12.5px; font-weight:800; display:grid; place-items:center; }
.moim-join .jn-step-h b{ font-size:16px; font-weight:800; }
.moim-join .jn-step-body p{ font-size:14.5px; color:var(--ink-2); }

.moim-join .jn-cta{ display:inline-flex; align-items:center; gap:7px; background:var(--brand); color:#fff; font-weight:700; font-size:15px; padding:13px 20px; border-radius:14px; text-decoration:none; box-shadow:0 5px 14px rgba(0,62,204,.22); }
.moim-join .jn-cta:hover{ background:var(--brand-strong); }

.moim-join .jn-foot{ text-align:center; margin-top:26px; }
.moim-join .jn-contact{ font-size:14px; color:var(--ink-3); margin-bottom:14px; }
.moim-join .jn-login{ display:inline-flex; align-items:center; gap:6px; font-size:14px; font-weight:700; color:var(--brand); text-decoration:none; }

@media (max-width:559px){
  .moim-join .jn-flow{ flex-direction:column; }
  .moim-join .jn-flow-arrow{ transform:rotate(90deg); }
}
`;
