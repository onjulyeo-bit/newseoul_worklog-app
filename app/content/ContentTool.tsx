"use client";

// 주간 콘텐츠 도구 — 회차 선택 → 카톡 공지글·순서지·포스터(PNG) 자동 생성.
import { useRef, useState } from "react";
import Link from "next/link";
import { toPng } from "html-to-image";

export type MeetingOpt = { id: string; date: string; session_no: number | null; mode: string; title: string | null; speaker: string | null };

const DAYS = ["일", "월", "화", "수", "목", "금", "토"];
function fmtDate(d: string) { if (!d) return ""; const t = new Date(d + "T00:00"); return `${t.getMonth() + 1}월 ${t.getDate()}일(${DAYS[t.getDay()]})`; }
function fmtKakao(d: string) { if (!d) return ""; const t = new Date(d + "T00:00"); return `${String(t.getFullYear()).slice(2)}.${t.getMonth() + 1}.${t.getDate()}(${DAYS[t.getDay()]})`; }
const modeL = (m: string) => (m === "online" ? "온라인" : "오프라인");

const ORDER_OFFLINE = ["개회", "여는 기도", "허깅 인사", "찬양", "말씀·설교", "소그룹 나눔", "삼겹줄 기도", "조별 발표", "합심·마침 기도", "광고", "폐회"];
const ORDER_ONLINE = ["개회", "여는 기도", "찬양", "말씀·설교", "소그룹 나눔(소회의실)", "삼겹줄 기도", "합심·마침 기도", "광고", "폐회"];

type Form = {
  session: string; mode: "online" | "offline"; date: string;
  title: string; verse: string; speaker: string; praiseTitle: string; praiseVerse: string; discussion: string;
  place: string; fee: string; account: string; zoomLink: string; zoomId: string; zoomPw: string;
};

function buildNotice(f: Form) {
  const sess = f.session !== "" ? `${f.session}회 ` : "";
  let t = `⭐ ${sess}(${modeL(f.mode)}) 새서울 CBMC 모임⭐\n\n`;
  t += `✔ 포럼 및 QT\n`;
  if (f.title) t += `■ ${f.title}\n`;
  if (f.verse) t += `(${f.verse})\n`;
  if (f.speaker) t += `■ 발제 : ${f.speaker}\n`;
  if (f.praiseTitle) t += `■ 찬양 : ${f.praiseTitle}${f.praiseVerse ? ` (${f.praiseVerse})` : ""}\n`;
  const qs = f.discussion.split("\n").map((s) => s.trim()).filter(Boolean);
  if (qs.length) { t += `\n<소그룹 토의주제>\n`; qs.forEach((q, i) => (t += `${i + 1}. ${q}\n`)); }
  t += `\n✔ 일시\n- ${fmtKakao(f.date)} 오전 7시\n`;
  if (f.mode === "online") {
    t += `\n➡ 온라인 (zoom) 참가\n`;
    if (f.zoomLink) t += `1) 링크접속\n${f.zoomLink}\n\n`;
    t += `2) 아이디 접속\n* ID : ${f.zoomId}\n* PW : ${f.zoomPw}\n`;
  } else {
    if (f.place) t += `\n✔ 장소\n- ${f.place}\n`;
    if (f.fee || f.account) {
      const fs = f.fee ? Number(f.fee).toLocaleString("ko-KR") + "원" : "";
      t += `\n🍽 식대 ${fs}${f.account ? ` · 입금 ${f.account}` : ""}\n`;
    }
  }
  return t;
}
function buildOrder(f: Form) {
  const steps = f.mode === "online" ? ORDER_ONLINE : ORDER_OFFLINE;
  let t = `📋 진행순서 — ${f.session !== "" ? f.session + "회 " : ""}${fmtDate(f.date)} (${modeL(f.mode)})\n\n`;
  steps.forEach((s, i) => {
    let line = `${i + 1}. ${s}`;
    if (s === "말씀·설교" && f.speaker) line += ` — ${f.speaker}`;
    t += line + "\n";
  });
  return t;
}

function CopyBox({ label, text }: { label: string; text: string }) {
  const [c, setC] = useState(false);
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[14px] font-bold text-ink-soft">{label}</span>
        <button onClick={async () => { try { await navigator.clipboard.writeText(text); setC(true); setTimeout(() => setC(false), 1800); } catch {} }}
          className="rounded-full bg-primary px-3.5 py-1.5 text-[13px] font-semibold text-white hover:bg-primary-pressed">{c ? "✓ 복사됨" : "📋 복사"}</button>
      </div>
      <pre className="whitespace-pre-wrap rounded-lg border border-[#2c3654] bg-navy p-4 font-sans text-[14px] leading-relaxed text-on-dark">{text || "정보를 입력하면 자동으로 만들어집니다."}</pre>
    </div>
  );
}

const inp = "min-h-[42px] w-full rounded-md border border-line bg-card px-3 text-[16px] text-ink outline-none placeholder:text-muted focus:border-primary-focus";
const lab = "mb-1 block text-[13px] font-bold text-ink-soft";

// 포스터 디자인 테마 — 글자는 그대로, 배경·강조색만 다양하게.
type Theme = { key: string; label: string; bg: string; fg: string; kicker: string; muted: string; accent: string; verse: string };
const THEMES: Theme[] = [
  { key: "navy",   label: "남색",   bg: "bg-gradient-to-br from-navy via-deep to-deep2",                fg: "text-white", kicker: "text-primary-on-dark", muted: "text-on-dark-muted", accent: "text-primary-on-dark", verse: "border-l-2 border-primary-on-dark bg-white/10" },
  { key: "dawn",   label: "새벽",   bg: "bg-gradient-to-br from-[#16203c] via-[#46406b] to-[#c98a5e]",  fg: "text-white", kicker: "text-[#ffd9a8]",       muted: "text-white/75",      accent: "text-[#ffd9a8]",       verse: "border-l-2 border-[#ffd9a8] bg-white/10" },
  { key: "forest", label: "숲",     bg: "bg-gradient-to-br from-[#0f2a22] via-[#163d2f] to-[#21684a]",  fg: "text-white", kicker: "text-[#ecd29a]",       muted: "text-white/75",      accent: "text-[#ecd29a]",       verse: "border-l-2 border-[#ecd29a] bg-white/10" },
  { key: "sunset", label: "노을",   bg: "bg-gradient-to-br from-[#2a1a3e] via-[#7b3b6e] to-[#e2895a]",  fg: "text-white", kicker: "text-[#ffe3b3]",       muted: "text-white/80",      accent: "text-[#ffe3b3]",       verse: "border-l-2 border-[#ffe3b3] bg-white/10" },
  { key: "light",  label: "화이트", bg: "bg-gradient-to-br from-white to-[#e9eef7]",                    fg: "text-navy",  kicker: "text-primary",         muted: "text-ink-soft",      accent: "text-primary",         verse: "border-l-2 border-primary bg-primary/5" },
];

export default function ContentTool({ meetings }: { meetings: MeetingOpt[] }) {
  const [f, setF] = useState<Form>({
    session: "", mode: "online", date: "", title: "", verse: "", speaker: "",
    praiseTitle: "", praiseVerse: "", discussion: "", place: "충현교회", fee: "", account: "",
    zoomLink: "https://us06web.zoom.us/j/3226796758?pwd=cy8yMCtHOXVjaDFpaTFxZDVNNGh2QT09", zoomId: "322 679 6758", zoomPw: "newseoul",
  });
  const set = (k: keyof Form, v: string) => setF((s) => ({ ...s, [k]: v }));

  const pickMeeting = (id: string) => {
    const m = meetings.find((x) => x.id === id);
    if (!m) return;
    setF((s) => ({ ...s, session: m.session_no != null ? String(m.session_no) : "", mode: (m.mode === "online" ? "online" : "offline"), date: m.date, title: m.title ?? s.title, speaker: m.speaker ?? s.speaker }));
  };

  const posterRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);
  const [theme, setTheme] = useState(0);

  async function savePoster() {
    if (!posterRef.current) return;
    setSaving(true);
    try {
      const url = await toPng(posterRef.current, { pixelRatio: 3, cacheBust: true, skipFonts: true });
      const a = document.createElement("a"); a.href = url; a.download = `포스터_${f.session || f.date || "새서울CBMC"}회.png`; a.click();
    } catch { alert("이미지 저장 실패"); } finally { setSaving(false); }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
        {/* 입력 */}
        <div className="rounded-lg border border-line bg-card p-6">
          {/* 회차 선택 */}
          <label className={lab}>회차 선택 (연간 일정에서 불러오기)</label>
          {meetings.length > 0 ? (
            <select onChange={(e) => pickMeeting(e.target.value)} defaultValue="" className={inp}>
              <option value="">— 회차를 고르면 자동 입력 —</option>
              {meetings.map((m) => (<option key={m.id} value={m.id}>{m.session_no}회 · {fmtDate(m.date)} ({modeL(m.mode)})</option>))}
            </select>
          ) : (
            <p className="text-[14px] text-ink-soft"><Link href="/schedule" className="font-semibold text-primary hover:underline">연간 일정</Link>을 먼저 만들면 회차를 불러올 수 있어요. (지금은 직접 입력)</p>
          )}

          <div className="mt-4 flex flex-col gap-3">
            <div className="grid grid-cols-3 gap-3">
              <div><label className={lab}>회차</label><input value={f.session} onChange={(e) => set("session", e.target.value)} placeholder="1385" className={inp} /></div>
              <div><label className={lab}>모드</label>
                <select value={f.mode} onChange={(e) => set("mode", e.target.value)} className={inp}><option value="online">온라인</option><option value="offline">오프라인</option></select>
              </div>
              <div><label className={lab}>날짜</label><input type="date" value={f.date} onChange={(e) => set("date", e.target.value)} className={inp} /></div>
            </div>
            <div><label className={lab}>주제 (포럼·북토크)</label><input value={f.title} onChange={(e) => set("title", e.target.value)} placeholder="'스크루테이프의 편지' 북토크" className={inp} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={lab}>성경구절</label><input value={f.verse} onChange={(e) => set("verse", e.target.value)} placeholder="엡6:12" className={inp} /></div>
              <div><label className={lab}>발제자</label><input value={f.speaker} onChange={(e) => set("speaker", e.target.value)} placeholder="황국주 대표" className={inp} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={lab}>찬양 제목</label><input value={f.praiseTitle} onChange={(e) => set("praiseTitle", e.target.value)} placeholder="하나님의 음성을" className={inp} /></div>
              <div><label className={lab}>찬양 구절</label><input value={f.praiseVerse} onChange={(e) => set("praiseVerse", e.target.value)} placeholder="시40편" className={inp} /></div>
            </div>
            <div><label className={lab}>소그룹 토의주제 (한 줄에 하나)</label><textarea value={f.discussion} onChange={(e) => set("discussion", e.target.value)} placeholder={"최근 나는 무엇에 마음을 빼앗기나요?\n스크루테이프가 내 삶을 분석한다면…?"} className={`${inp} min-h-[80px] py-2`} /></div>

            {f.mode === "online" ? (
              <div className="grid grid-cols-1 gap-3">
                <div><label className={lab}>Zoom 링크</label><input value={f.zoomLink} onChange={(e) => set("zoomLink", e.target.value)} className={inp} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={lab}>Zoom ID</label><input value={f.zoomId} onChange={(e) => set("zoomId", e.target.value)} className={inp} /></div>
                  <div><label className={lab}>Zoom PW</label><input value={f.zoomPw} onChange={(e) => set("zoomPw", e.target.value)} className={inp} /></div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                <div><label className={lab}>장소</label><input value={f.place} onChange={(e) => set("place", e.target.value)} className={inp} /></div>
                <div><label className={lab}>식대(원)</label><input type="number" value={f.fee} onChange={(e) => set("fee", e.target.value)} className={inp} /></div>
                <div><label className={lab}>입금</label><input value={f.account} onChange={(e) => set("account", e.target.value)} className={inp} /></div>
              </div>
            )}
          </div>
        </div>

        {/* 결과 */}
        <div className="flex flex-col gap-6">
          <div className="rounded-lg border border-line bg-card p-6">
            <h2 className="mb-3 text-[21px] font-bold text-ink">포스터</h2>
            <div ref={posterRef} className={`relative mx-auto aspect-[3/4] w-full max-w-[320px] overflow-hidden rounded-[14px] ${THEMES[theme].bg} ${THEMES[theme].fg}`}>
              <div className="relative z-10 flex h-full flex-col p-6">
                <div className={`text-[11px] font-bold uppercase tracking-[3px] ${THEMES[theme].kicker}`}>NEW SEOUL CBMC</div>
                <div className="mt-1 text-[18px] font-bold">새서울 CBMC 아름다운 만남</div>
                <div className="mt-auto">
                  <div className={`text-[13px] ${THEMES[theme].muted}`}>{(f.session ? f.session + "회 · " : "") + (f.date ? fmtDate(f.date) : "날짜") + ` · ${modeL(f.mode)}`}</div>
                  <div className="mt-2 text-[21px] font-bold leading-snug">{f.title || "주제"}</div>
                  {f.speaker && <div className={`mt-2 text-[14px] font-bold ${THEMES[theme].accent}`}>발제 {f.speaker}</div>}
                  {f.verse && <div className={`mt-3 px-3 py-2 text-[13px] italic ${THEMES[theme].verse}`}>{f.verse}</div>}
                </div>
              </div>
            </div>

            {/* 디자인 선택 */}
            <div className="mt-3">
              <div className="mb-1.5 text-[13px] font-bold text-ink-soft">🎨 디자인 선택</div>
              <div className="flex flex-wrap gap-2">
                {THEMES.map((t, i) => (
                  <button key={t.key} onClick={() => setTheme(i)} className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold ${theme === i ? "bg-primary text-white" : "border border-line text-ink-soft hover:border-primary hover:text-primary"}`}>{t.label}</button>
                ))}
              </div>
            </div>

            <button onClick={savePoster} disabled={saving} className="mt-3 rounded-full bg-primary px-4 py-2 text-[15px] font-semibold text-white hover:bg-primary-pressed disabled:opacity-50">{saving ? "만드는 중…" : "🖼 이미지로 저장 (PNG)"}</button>
          </div>

          <div className="rounded-lg border border-line bg-card p-6"><CopyBox label="📣 카톡 공지글" text={buildNotice(f)} /></div>
          <div className="rounded-lg border border-line bg-card p-6"><CopyBox label={`📋 진행 순서지 (${modeL(f.mode)})`} text={buildOrder(f)} /></div>
        </div>
      </div>
  );
}
