"use client";

// 로그인 ⑯ — 매직링크(비밀번호 없음). 클로드디자인 시안 이식, signInWithOtp 로직 보존.
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Mail, MailCheck, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errMsg, setErrMsg] = useState("");
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  useEffect(() => {
    const e = new URLSearchParams(window.location.search).get("error");
    if (e) { setStatus("error"); setErrMsg(e); }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setStatus("sending"); setErrMsg("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) { setStatus("error"); setErrMsg(error.message); } else { setStatus("sent"); }
  }

  return (
    <div className="moim-login">
      <style>{LOGIN_CSS}</style>
      <div className="login-card">
        {status !== "sent" ? (
          <>
            <div className="login-brand"><span className="brand-badge">ON</span><span className="brand-name">모임<span className="brand-on">온</span></span></div>
            <h1 className="login-title">모임 운영을 <span className="brand-on">ON</span></h1>
            <p className="login-sub">이메일만 입력하면 로그인 링크를 보내드려요.</p>
            <form className="login-form" onSubmit={handleSubmit}>
              <label className="cf">
                <span className="cf-l">이메일</span>
                <input className="inp login-inp" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" autoFocus />
              </label>
              <button type="submit" className="ui-btn ui-primary login-btn" disabled={status === "sending" || !valid} style={{ opacity: valid ? 1 : 0.5 }}>
                <Mail size={18} /> {status === "sending" ? "보내는 중…" : "로그인 링크 받기"}
              </button>
              {status === "error" && <p className="login-err">⚠️ {errMsg}</p>}
            </form>
            <p className="login-note"><ShieldCheck size={14} /> 비밀번호 없이 안전하게 로그인해요.</p>
          </>
        ) : (
          <>
            <div className="login-sent-ic"><MailCheck size={34} /></div>
            <h1 className="login-title">메일을 확인하세요</h1>
            <p className="login-sub"><strong>{email}</strong> 으로<br />로그인 링크를 보냈어요.</p>
            <div className="login-tip">메일이 오지 않으면 스팸함을 확인하거나 잠시 후 다시 시도해 주세요.</div>
            <button className="login-resend" onClick={() => { setStatus("idle"); setEmail(""); }}>다른 이메일로 다시 시도</button>
          </>
        )}
      </div>
      <p className="login-foot">새서울 CBMC · powered by 모임온</p>
    </div>
  );
}

const LOGIN_CSS = `
.moim-login{
  --brand:#0066cc; --brand-strong:#0052a8; --brand-soft:#e8f1fc;
  --ink:#16181d; --ink-2:#3d424d; --ink-3:#767d8a; --line:#ecedf0; --bg:#ffffff; --bg-warm:#fafafb;
  --shadow-md:0 2px 6px rgba(20,24,34,.05), 0 14px 38px rgba(20,40,80,.08);
  width:100vw; position:relative; left:50%; right:50%; margin-left:-50vw; margin-right:-50vw; margin-top:-24px; margin-bottom:-80px;
  min-height:100vh; background:var(--bg); display:flex; flex-direction:column; align-items:center; justify-content:center; padding:24px; overflow:hidden;
  color:var(--ink); letter-spacing:-0.01em;
}
.moim-login *{ box-sizing:border-box; }
.moim-login::before{ content:""; position:absolute; top:-10%; left:50%; transform:translateX(-50%); width:680px; height:480px; background:radial-gradient(circle at 50% 30%, var(--brand-soft), rgba(232,241,252,0) 70%); z-index:0; }
.moim-login .login-card{ position:relative; z-index:1; width:100%; max-width:380px; background:#fff; border:1px solid var(--line); border-radius:24px; box-shadow:var(--shadow-md); padding:34px 30px; text-align:center; }
.moim-login .login-brand{ display:inline-flex; align-items:center; gap:9px; font-weight:800; font-size:20px; letter-spacing:-0.03em; margin-bottom:22px; }
.moim-login .brand-badge{ width:26px; height:26px; border-radius:9px; display:grid; place-items:center; background:var(--brand); color:#fff; font-size:12.5px; font-weight:800; box-shadow:0 3px 9px rgba(0,102,204,.32); }
.moim-login .brand-on{ color:var(--brand); }
.moim-login .login-title{ font-size:25px; font-weight:800; letter-spacing:-0.04em; margin:0; }
.moim-login .login-sub{ font-size:14.5px; color:var(--ink-3); margin-top:10px; line-height:1.55; font-weight:500; }
.moim-login .login-sub strong{ color:var(--ink); font-weight:700; }
.moim-login .login-form{ margin-top:24px; text-align:left; display:flex; flex-direction:column; gap:14px; }
.moim-login .cf{ display:flex; flex-direction:column; gap:6px; }
.moim-login .cf-l{ font-size:12.5px; color:var(--ink-3); font-weight:600; }
.moim-login .inp{ font-family:inherit; font-size:15px; color:var(--ink); background:#fff; border:1px solid var(--line); border-radius:11px; padding:14px 15px; outline:0; width:100%; transition:border-color .15s, box-shadow .15s; }
.moim-login .inp:focus{ border-color:var(--brand); box-shadow:0 0 0 3px var(--brand-soft); }
.moim-login .ui-btn{ display:inline-flex; align-items:center; justify-content:center; gap:7px; font-weight:700; border-radius:14px; border:0; cursor:pointer; }
.moim-login .ui-primary{ background:var(--brand); color:#fff; box-shadow:0 5px 14px rgba(0,102,204,.22); }
.moim-login .ui-primary:hover{ background:var(--brand-strong); }
.moim-login .login-btn{ width:100%; padding:15px; font-size:15px; }
.moim-login .login-err{ font-size:13px; color:#c8392c; font-weight:600; }
.moim-login .login-note{ display:flex; align-items:center; justify-content:center; gap:6px; font-size:12.5px; color:var(--ink-3); margin-top:18px; font-weight:500; }
.moim-login .login-sent-ic{ width:72px; height:72px; border-radius:50%; background:var(--brand-soft); color:var(--brand); display:grid; place-items:center; margin:0 auto 18px; }
.moim-login .login-tip{ font-size:13px; color:var(--ink-3); background:var(--bg-warm); border:1px solid var(--line); border-radius:13px; padding:13px; margin:20px 0 0; line-height:1.5; font-weight:500; }
.moim-login .login-resend{ display:block; width:100%; margin-top:14px; font-size:13.5px; font-weight:600; color:var(--ink-3); background:none; border:0; cursor:pointer; }
.moim-login .login-resend:hover{ color:var(--brand); }
.moim-login .login-foot{ position:relative; z-index:1; margin-top:24px; font-size:12px; color:var(--ink-3); font-weight:500; }
`;
