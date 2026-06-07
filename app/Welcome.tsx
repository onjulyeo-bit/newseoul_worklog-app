"use client";

// 새서울 CBMC 첫 화면 ⑰ — 환영 + 매직링크 로그인. 클로드디자인 시안 이식.
// 익명 방문자가 "/"에서 봄. signInWithOtp 실연결(비밀번호 없음).
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Mail, AtSign, Send, ShieldCheck, MailCheck, RotateCw, UserPlus, QrCode } from "lucide-react";

export default function Welcome() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errMsg, setErrMsg] = useState("");
  const [resent, setResent] = useState(false);
  const valid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim());

  useEffect(() => {
    const e = new URLSearchParams(window.location.search).get("error");
    if (e) { setStatus("error"); setErrMsg(e); }
  }, []);

  async function send() {
    setStatus("sending"); setErrMsg("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) { setStatus("error"); setErrMsg(error.message); } else { setStatus("sent"); }
  }
  function onSubmit(e: React.FormEvent) { e.preventDefault(); if (!valid) { setStatus("error"); setErrMsg("올바른 이메일 주소를 입력해 주세요."); return; } send(); }
  async function resend() { await send(); setResent(true); setTimeout(() => setResent(false), 2600); }

  return (
    <div className="moim-welcome">
      <style>{WELCOME_CSS}</style>
      <div className="page">
        <div className="shell">
          <div className="topbar">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <span className="brand-badge"><img src="/cbmc-logo.png" alt="CBMC" /></span>
            <div className="brand-text">
              <span className="brand-name">CBMC</span>
              <span className="brand-kicker">Connecting Business &amp; Marketplace to Christ</span>
            </div>
          </div>

          <section className="hero">
            <h1>새서울 CBMC<br /><span className="accent">아름다운 만남</span></h1>
          </section>

          {status !== "sent" ? (
            <section className="login-card">
              <div className="login-head">
                <h2>로그인</h2>
                <p>비밀번호 없이, 등록된 메일로 안전하게 로그인해요.</p>
              </div>
              <form className="field" onSubmit={onSubmit} noValidate>
                <label htmlFor="email"><Mail size={16} /> 이메일 주소</label>
                <div className="input-wrap">
                  <AtSign size={19} />
                  <input type="email" id="email" inputMode="email" autoComplete="email" required
                    value={email} onChange={(e) => { setEmail(e.target.value); if (status === "error") setStatus("idle"); }}
                    placeholder="등록된 이메일을 입력하세요" autoFocus />
                </div>
                <button type="submit" className="btn btn-primary btn-submit" disabled={status === "sending"}>
                  <Send size={19} /> {status === "sending" ? "보내는 중…" : "로그인 링크 받기"}
                </button>
                {status === "error" && <p className="login-err">⚠️ {errMsg}</p>}
              </form>
              <div className="login-note">
                <ShieldCheck size={16} />
                <span>입력하신 메일로 로그인 링크를 보내드려요. 링크를 누르면 바로 로그인돼요.</span>
              </div>
            </section>
          ) : (
            <section className="sent-card">
              <div className="sent-ic"><MailCheck size={30} /></div>
              <h2>메일을 확인하세요</h2>
              <span className="to">{email}</span>
              <p>로그인 링크를 보냈어요.<br />메일함(또는 스팸함)에서 링크를 눌러 로그인하세요.</p>
              <div className="sent-actions">
                <button type="button" className="btn btn-ghost" onClick={resend}>
                  <RotateCw size={18} /> {resent ? "다시 보냈어요" : "메일을 못 받으셨나요? 다시 보내기"}
                </button>
                <button type="button" className="btn btn-text" onClick={() => { setStatus("idle"); setEmail(""); }}>다른 이메일로 로그인</button>
              </div>
            </section>
          )}

          <div className="helps">
            <div className="help">
              <div className="help-ic"><UserPlus size={19} /></div>
              <div className="help-body"><div className="t">처음이신가요?</div><div className="d">간사(임원)가 등록한 이메일로 로그인하세요.</div></div>
            </div>
            <div className="help">
              <div className="help-ic"><QrCode size={19} /></div>
              <div className="help-body"><div className="t">출석 체크는 현장에서</div><div className="d">출석은 모임 현장 QR로 따로 진행돼요.</div></div>
            </div>
          </div>

          <footer>
            <div className="foot-brand">새서울 CBMC<span className="sep">·</span>아름다운 만남</div>
            <div className="foot-powered">powered by <b>모임온</b></div>
          </footer>
        </div>
      </div>
    </div>
  );
}

const WELCOME_CSS = `
.moim-welcome{
  --brand:#0066cc; --brand-strong:#0052a8; --brand-soft:#e8f1fc; --brand-softer:#f3f8fe;
  --ink:#16181d; --ink-2:#3d424d; --ink-3:#767d8a; --line:#ecedf0; --bg:#ffffff; --bg-warm:#fafafb;
  --radius-btn:14px; --radius-card:20px;
  --shadow-sm:0 1px 2px rgba(20,24,34,.04), 0 4px 16px rgba(20,24,34,.04);
  --shadow-md:0 2px 6px rgba(20,24,34,.05), 0 14px 40px rgba(20,40,80,.08);
  width:100vw; position:relative; left:50%; right:50%; margin-left:-50vw; margin-right:-50vw; margin-top:-24px; margin-bottom:-80px;
  background:var(--bg); color:var(--ink); line-height:1.5; letter-spacing:-0.01em; font-synthesis:none;
}
.moim-welcome *{ box-sizing:border-box; }
.moim-welcome h1,.moim-welcome h2,.moim-welcome p{ margin:0; }
.moim-welcome .page{ position:relative; min-height:100dvh; display:flex; flex-direction:column; overflow:hidden; }
.moim-welcome .page::before{ content:""; position:absolute; inset:-240px 0 auto 0; height:680px; z-index:0; pointer-events:none; background:radial-gradient(620px 380px at 50% -6%, var(--brand-soft) 0%, rgba(232,241,252,0) 72%); }
.moim-welcome .shell{ position:relative; z-index:1; width:100%; max-width:460px; margin:0 auto; padding:0 22px; flex:1; display:flex; flex-direction:column; }
.moim-welcome .topbar{ display:flex; align-items:center; gap:11px; padding:22px 2px 6px; }
.moim-welcome .brand-badge{ width:48px; height:48px; border-radius:14px; display:grid; place-items:center; background:#fff; border:1px solid var(--line); padding:5px; box-shadow:var(--shadow-sm); flex-shrink:0; overflow:hidden; }
.moim-welcome .brand-badge img{ width:100%; height:100%; object-fit:contain; display:block; }
.moim-welcome .brand-text{ display:flex; flex-direction:column; line-height:1.18; }
.moim-welcome .brand-name{ font-weight:800; font-size:17px; letter-spacing:-0.03em; }
.moim-welcome .brand-kicker{ font-size:11px; color:var(--ink-3); font-weight:600; }
.moim-welcome .hero{ text-align:center; padding:40px 0 26px; }
.moim-welcome .hero h1{ font-size:clamp(34px,9.5vw,46px); line-height:1.16; letter-spacing:-0.045em; font-weight:800; color:var(--ink); margin-bottom:20px; text-wrap:balance; }
.moim-welcome .hero h1 .accent{ color:var(--brand); }
.moim-welcome .login-card{ background:#fff; border:1px solid var(--line); border-radius:var(--radius-card); box-shadow:var(--shadow-md); padding:26px 22px 24px; margin-top:8px; }
.moim-welcome .login-head{ margin-bottom:18px; }
.moim-welcome .login-head h2{ font-size:19px; font-weight:800; letter-spacing:-0.035em; }
.moim-welcome .login-head p{ font-size:14px; color:var(--ink-3); font-weight:500; margin-top:6px; line-height:1.55; }
.moim-welcome .field{ display:flex; flex-direction:column; gap:8px; }
.moim-welcome .field label{ font-size:13.5px; font-weight:700; color:var(--ink-2); display:flex; align-items:center; gap:6px; }
.moim-welcome .input-wrap{ position:relative; display:flex; align-items:center; }
.moim-welcome .input-wrap svg{ position:absolute; left:16px; color:var(--ink-3); pointer-events:none; }
.moim-welcome input[type=email]{ width:100%; font-family:inherit; font-size:17px; font-weight:500; color:var(--ink); letter-spacing:-0.01em; padding:16px 16px 16px 44px; border:1.5px solid var(--line); border-radius:var(--radius-btn); background:var(--bg-warm); transition:border-color .15s, background .15s, box-shadow .15s; outline:none; }
.moim-welcome input[type=email]::placeholder{ color:#aab0bb; font-weight:500; }
.moim-welcome input[type=email]:focus{ border-color:var(--brand); background:#fff; box-shadow:0 0 0 4px rgba(0,102,204,.12); }
.moim-welcome .btn{ display:inline-flex; align-items:center; justify-content:center; gap:9px; width:100%; font-family:inherit; font-weight:700; letter-spacing:-0.02em; font-size:17px; padding:17px 22px; border:0; cursor:pointer; border-radius:var(--radius-btn); transition:transform .12s ease, background .15s ease, box-shadow .15s ease; white-space:nowrap; }
.moim-welcome .btn:active{ transform:translateY(1px) scale(.995); }
.moim-welcome .btn:disabled{ cursor:default; }
.moim-welcome .btn-primary{ background:var(--brand); color:#fff; box-shadow:0 7px 18px rgba(0,102,204,.26); }
.moim-welcome .btn-primary:hover{ background:var(--brand-strong); }
.moim-welcome .btn-submit{ margin-top:16px; }
.moim-welcome .login-err{ font-size:13px; color:#c8392c; font-weight:600; margin-top:10px; }
.moim-welcome .login-note{ display:flex; align-items:flex-start; gap:8px; font-size:13px; color:var(--ink-3); font-weight:500; margin-top:16px; line-height:1.55; }
.moim-welcome .login-note svg{ color:var(--brand); flex-shrink:0; margin-top:1px; }
.moim-welcome .sent-card{ background:var(--brand-softer); border:1px solid #d6e6fa; border-radius:var(--radius-card); box-shadow:var(--shadow-md); padding:30px 24px; margin-top:8px; text-align:center; }
.moim-welcome .sent-ic{ width:62px; height:62px; border-radius:18px; margin:0 auto 18px; display:grid; place-items:center; background:#fff; color:var(--brand); box-shadow:0 6px 16px rgba(0,102,204,.16); }
.moim-welcome .sent-card h2{ font-size:21px; font-weight:800; letter-spacing:-0.04em; }
.moim-welcome .sent-card .to{ display:inline-block; font-weight:700; color:var(--brand-strong); background:#fff; border:1px solid #d6e6fa; padding:6px 14px; border-radius:999px; font-size:14px; margin:14px 0 6px; }
.moim-welcome .sent-card p{ font-size:14.5px; color:var(--ink-2); font-weight:500; line-height:1.6; margin-top:8px; }
.moim-welcome .sent-actions{ display:flex; flex-direction:column; gap:10px; margin-top:22px; }
.moim-welcome .btn-ghost{ background:#fff; color:var(--ink-2); border:1px solid var(--line); box-shadow:var(--shadow-sm); }
.moim-welcome .btn-ghost:hover{ background:#f7f8f9; }
.moim-welcome .btn-text{ background:transparent; color:var(--ink-3); font-size:14.5px; font-weight:600; padding:8px; }
.moim-welcome .btn-text:hover{ color:var(--ink); }
.moim-welcome .helps{ display:flex; flex-direction:column; gap:12px; margin-top:22px; }
.moim-welcome .help{ display:flex; align-items:flex-start; gap:12px; background:var(--bg-warm); border:1px solid var(--line); border-radius:16px; padding:15px 16px; }
.moim-welcome .help-ic{ width:36px; height:36px; border-radius:11px; flex-shrink:0; display:grid; place-items:center; background:var(--brand-soft); color:var(--brand); }
.moim-welcome .help-body{ min-width:0; }
.moim-welcome .help-body .t{ font-size:14px; font-weight:700; letter-spacing:-0.02em; }
.moim-welcome .help-body .d{ font-size:13px; color:var(--ink-3); font-weight:500; margin-top:3px; line-height:1.5; }
.moim-welcome footer{ text-align:center; padding:30px 0; margin-top:auto; }
.moim-welcome .foot-brand{ font-size:14px; font-weight:700; color:var(--ink-2); letter-spacing:-0.02em; }
.moim-welcome .foot-brand .sep{ color:var(--ink-3); font-weight:500; margin:0 6px; }
.moim-welcome .foot-powered{ font-size:11.5px; color:#aab0bb; font-weight:500; margin-top:9px; }
.moim-welcome .foot-powered b{ color:var(--ink-3); font-weight:700; }
@media (min-width:600px){ .moim-welcome .hero{ padding:48px 0 30px; } }
`;
