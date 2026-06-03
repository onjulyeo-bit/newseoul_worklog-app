// 로그인 화면 — 이메일만 입력하면 "로그인 링크"를 메일로 보냅니다(매직링크, 비밀번호 없음).
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [errMsg, setErrMsg] = useState("");

  // 로그인 링크 처리 중 실패했으면(/login?error=...) 그 메시지를 보여줌
  useEffect(() => {
    const e = new URLSearchParams(window.location.search).get("error");
    if (e) {
      setStatus("error");
      setErrMsg(e);
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("sending");
    setErrMsg("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        // 메일 속 링크를 클릭하면 돌아올 주소
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setStatus("error");
      setErrMsg(error.message);
    } else {
      setStatus("sent");
    }
  }

  return (
    <div className="mx-auto max-w-[440px] pt-6">
      <div className="rounded-lg border border-line bg-card p-6">
        <h2 className="text-[21px] font-bold text-ink">로그인</h2>
        <p className="mt-1 text-[15px] text-ink-soft">
          이메일 주소를 적으면 <b>로그인 링크</b>를 보내드립니다. 비밀번호는
          없습니다.
        </p>

        {status === "sent" ? (
          // 메일 발송 완료 안내
          <div className="mt-5 rounded-md border border-[rgba(0,102,204,.2)] bg-[rgba(0,102,204,.07)] px-4 py-4 text-[15px] text-ink-soft">
            📧 <b className="text-ink">{email}</b> 으로 로그인 링크를
            보냈습니다.
            <br />
            메일함(또는 스팸함)을 열어 <b>링크를 클릭</b>하시면 로그인됩니다.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="min-h-[44px] w-full rounded-md border border-line bg-card px-3.5 text-[17px] text-ink outline-none placeholder:text-muted focus:border-primary-focus"
            />
            <button
              type="submit"
              disabled={status === "sending"}
              className="min-h-[44px] rounded-full bg-primary px-5 text-[16px] font-semibold text-white hover:bg-primary-pressed disabled:opacity-60"
            >
              {status === "sending" ? "보내는 중…" : "로그인 링크 받기"}
            </button>
            {status === "error" && (
              <p className="text-[14px] text-unpaid">⚠️ {errMsg}</p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
