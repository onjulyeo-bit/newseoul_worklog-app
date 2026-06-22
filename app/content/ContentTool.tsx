"use client";

// 주간 콘텐츠 도구 — 회차 선택 → 카톡 공지글·순서지·포스터(PNG) 자동 생성.
import { useState } from "react";
import Link from "next/link";
import PosterEditor, { type Seed } from "./PosterEditor";

export type MeetingOpt = { id: string; date: string; session_no: number | null; mode: string; title: string | null; speaker: string | null; program: string | null };

const DAYS = ["일", "월", "화", "수", "목", "금", "토"];
function fmtDate(d: string) { if (!d) return ""; const t = new Date(d + "T00:00"); return `${t.getMonth() + 1}월 ${t.getDate()}일(${DAYS[t.getDay()]})`; }
function fmtKakao(d: string) { if (!d) return ""; const t = new Date(d + "T00:00"); const z = (n: number) => String(n).padStart(2, "0"); return `${String(t.getFullYear()).slice(2)}.${z(t.getMonth() + 1)}.${z(t.getDate())} (${DAYS[t.getDay()]})`; }
const modeL = (m: string) => (m === "online" ? "온라인" : "오프라인");

// 형식(program)별 섹션 제목 + 진행자 라벨
const PROGRAMS = ["예배", "포럼", "특강", "회만시", "기타"];
const SECTION: Record<string, string> = { 예배: "예배", 포럼: "포럼 및 QT", 특강: "특강", 회만시: "회원이 만드는 시간", 기타: "모임" };
const LABEL: Record<string, string> = { 예배: "설교", 포럼: "발제", 특강: "강사", 회만시: "나눔", 기타: "발제" };
const secOf = (p: string) => SECTION[p] ?? "모임";
const whoOf = (p: string) => LABEL[p] ?? "발제";

const ORDER_OFFLINE = ["개회 — 다같이", "여는 기도 — 사회자", "허깅 — 다같이", "찬양 — 다같이", "말씀·설교", "소그룹 및 기도제목 나눔", "조별 발표", "합심·마침 기도 — 발제자", "광고 — 총무", "폐회 — 사회자"];
const ORDER_ONLINE = ["개회 — 다같이", "여는 기도 — 사회자", "찬양 — 다같이", "말씀·설교", "소그룹 및 기도제목 나눔 (소회의실)", "조별 발표", "합심·마침 기도 — 발제자", "광고 — 총무", "폐회 — 사회자"];

type Form = {
  session: string; mode: "online" | "offline"; program: string; date: string;
  title: string; verse: string; speaker: string; praiseTitle: string; praiseVerse: string; discussion: string;
  place: string; fee: string; account: string; zoomLink: string; zoomId: string; zoomPw: string;
  sender: string;
};

function downloadMd(name: string, text: string) {
  const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function buildNotice(f: Form) {
  const sess = f.session !== "" ? `${f.session}회 ` : "";
  const online = f.mode === "online";
  const sec = secOf(f.program);
  const who = whoOf(f.program);

  let t = `(${modeL(f.mode)})\n\n`;
  t += `⭐ ${sess}${online ? "(온라인) " : ""}새서울 CBMC 아름다운 만남 ⭐\n\n`;
  t += `✔ ${sec}\n`;
  if (online) {
    if (f.title) t += `■ ${f.title}${f.verse ? ` (${f.verse})` : ""}\n`;
    if (f.speaker) t += `■ ${who} : ${f.speaker}\n`;
  } else {
    if (f.title) t += `▪︎제목 : ${f.title}\n`;
    if (f.speaker) t += `▪︎${who} : ${f.speaker}\n`;
    if (f.verse) t += `▪︎본문 : ${f.verse}\n`;
  }
  if (f.praiseTitle) t += `${online ? "■" : "▪︎"} 찬양 : ${f.praiseTitle}${f.praiseVerse ? ` (${f.praiseVerse})` : ""}\n`;
  const qs = f.discussion.split("\n").map((s) => s.trim()).filter(Boolean);
  if (qs.length) { t += `\n<소그룹 토의주제>\n`; qs.forEach((q, i) => (t += `${i + 1}. ${q}\n`)); }

  if (online) {
    t += `\n✔ 일시\n- ${fmtKakao(f.date)} 오전 7시\n`;
    t += `\n➡ 온라인 (zoom) 참가\n`;
    if (f.zoomLink) t += `1) 링크접속\n${f.zoomLink}\n\n`;
    t += `2) 아이디 접속\n* ID : ${f.zoomId}\n* PW : ${f.zoomPw}\n`;
  } else {
    t += `\n✔ 일시 & 장소\n- ${fmtKakao(f.date)} 오전 7시\n`;
    if (f.place) t += `- ${f.place}\n`;
    if (f.fee || f.account) {
      const fs = f.fee ? Number(f.fee).toLocaleString("ko-KR") + "원" : "";
      t += `\n🍽 식대 ${fs}${f.account ? ` · 입금 ${f.account}` : ""}\n`;
    }
  }
  return t;
}
// 형식별 본문 순서 라벨
const MAINSTEP: Record<string, string> = { 예배: "말씀·설교", 포럼: "포럼·발제", 특강: "특강 강의", 회만시: "회원 나눔", 기타: "말씀" };
const orderSteps = (f: Form) => {
  const base = f.mode === "online" ? ORDER_ONLINE : ORDER_OFFLINE;
  const main = MAINSTEP[f.program] ?? "말씀·설교";
  return base.map((s) => {
    if (s !== "말씀·설교") return s;
    return main + (f.speaker ? ` — ${f.speaker}` : "");
  });
};
function buildOrder(f: Form) {
  let t = `📋 진행순서 — ${f.session !== "" ? f.session + "회 " : ""}${fmtDate(f.date)} (${modeL(f.mode)})\n\n`;
  orderSteps(f).forEach((s, i) => { t += `${i + 1}. ${s}\n`; });
  return t;
}
// 노션 붙여넣기용 마크다운
function buildOrderMd(f: Form) {
  let t = `## 진행순서 — ${f.session !== "" ? f.session + "회 " : ""}${fmtDate(f.date)} (${modeL(f.mode)})\n\n`;
  orderSteps(f).forEach((s, i) => { t += `${i + 1}. ${s}\n`; });
  return t;
}
// 강사·목사·회원에게 보내는 자료 요청 메시지
function buildRequest(_f: Form, sender: string) {
  const who = sender.trim() || "○○○";
  return (
    `안녕하세요, 새서울지회 간사 ${who}입니다. 😊\n\n` +
    `다음 주 조찬모임 준비를 위해 연락드립니다.\n\n` +
    `강의 제목, 성경 본문, 그리고 선정하신 찬양곡을 공유해 주시면 감사하겠습니다.\n` +
    `PPT 자료가 있으신 경우 파일로 함께 전달 부탁드립니다.\n\n` +
    `찬양곡을 별도로 선정하지 않으시면 운영진에서 준비하도록 하겠습니다.\n\n` +
    `화요일부터 광고가 진행될 예정이므로, 가능하시면 월요일 오후까지 회신 부탁드립니다. 🙏\n\n` +
    `오늘도 평안하고 좋은 하루 보내세요.\n감사합니다.`
  );
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

export default function ContentTool({ meetings }: { meetings: MeetingOpt[] }) {
  const [f, setF] = useState<Form>({
    session: "", mode: "online", program: "예배", date: "", title: "", verse: "", speaker: "",
    praiseTitle: "", praiseVerse: "", discussion: "", place: "충현교회", fee: "", account: "",
    zoomLink: "https://us06web.zoom.us/j/3226796758?pwd=cy8yMCtHOXVjaDFpaTFxZDVNNGh2QT09", zoomId: "322 679 6758", zoomPw: "newseoul",
    sender: "박정윤",
  });
  const set = (k: keyof Form, v: string) => setF((s) => ({ ...s, [k]: v }));

  const pickMeeting = (id: string) => {
    const m = meetings.find((x) => x.id === id);
    if (!m) return;
    setF((s) => ({ ...s, session: m.session_no != null ? String(m.session_no) : "", mode: (m.mode === "online" ? "online" : "offline"), program: m.program && PROGRAMS.includes(m.program) ? m.program : s.program, date: m.date, title: m.title ?? s.title, speaker: m.speaker ?? s.speaker }));
  };

  // 포스터 편집기에 넘길 초기 글자(양식에서 자동) — 업로드한 포스터 구조 기준
  const fmtPosterDate = (d: string) => {
    if (!d) return "";
    const t = new Date(d + "T00:00");
    const yy = String(t.getFullYear()).slice(2);
    const mm = String(t.getMonth() + 1).padStart(2, "0");
    const dd = String(t.getDate()).padStart(2, "0");
    return `${yy}.${mm}.${dd} (${DAYS[t.getDay()]})`;
  };
  const seed: Seed = {
    headline: `${f.session ? f.session + "회 " : ""}새서울 CBMC 아름다운 만남`,
    category: `새서울 ${secOf(f.program)}`,
    title: f.title || "주제",
    verse: f.verse || "",
    speaker: f.speaker ? `${whoOf(f.program)} : ${f.speaker}` : "",
    dateLine: f.date ? `${fmtPosterDate(f.date)} 오전 7시` : "",
    modeLabel: modeL(f.mode),
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* 입력 */}
        <div className="rounded-[18px] border border-line bg-card p-6 shadow-sm">
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
            <div><label className={lab}>형식</label>
              <select value={f.program} onChange={(e) => set("program", e.target.value)} className={inp}>{PROGRAMS.map((p) => <option key={p} value={p}>{p}</option>)}</select>
            </div>
            <div><label className={lab}>제목 (말씀·주제)</label><input value={f.title} onChange={(e) => set("title", e.target.value)} placeholder="예) 다시 보아라 / '스크루테이프의 편지'" className={inp} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={lab}>본문 (성경구절)</label><input value={f.verse} onChange={(e) => set("verse", e.target.value)} placeholder="행9:10-22" className={inp} /></div>
              <div><label className={lab}>{whoOf(f.program)} ({f.program})</label><input value={f.speaker} onChange={(e) => set("speaker", e.target.value)} placeholder="조동천 목사" className={inp} /></div>
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

        {/* 카톡 글 */}
        <div className="flex flex-col gap-6">
          <div className="rounded-[18px] border border-line bg-card p-6 shadow-sm"><CopyBox label="📣 카톡 공지글" text={buildNotice(f)} /></div>
          <div className="rounded-[18px] border border-line bg-card p-6 shadow-sm">
            <CopyBox label={`📋 진행 순서지 (${modeL(f.mode)})`} text={buildOrder(f)} />
            <button onClick={() => downloadMd(`진행순서_${f.session || ""}회.md`, buildOrderMd(f))} className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-3.5 py-1.5 text-[13px] font-semibold text-ink-soft hover:border-primary hover:text-primary">📥 노션용(.md) 저장</button>
          </div>
          <div className="rounded-[18px] border border-line bg-card p-6 shadow-sm">
            <div className="mb-2"><label className={lab}>보내는 사람 (간사)</label><input value={f.sender} onChange={(e) => set("sender", e.target.value)} placeholder="박정윤" className={inp} /></div>
            <CopyBox label="✉️ 강사·목사·회원 자료 요청 메시지" text={buildRequest(f, f.sender)} />
            <button onClick={async () => { const text = buildRequest(f, f.sender); try { if (navigator.share) await navigator.share({ text }); else { await navigator.clipboard.writeText(text); alert("복사됐어요. 카톡에서 강사님께 붙여넣어 보내세요."); } } catch {} }}
              className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#fee500] px-4 py-2 text-[13.5px] font-bold text-[#191600] hover:opacity-90">📲 카톡 등으로 공유 (받는 사람 선택)</button>
            <p className="mt-1.5 text-[12px] text-ink-soft">공유를 누르면 휴대폰 공유창에서 <b>카카오톡</b>을 골라 강사님께 바로 보낼 수 있어요. (PC는 복사됩니다)</p>
          </div>
        </div>
      </div>

      {/* 포스터 편집기 (전체 폭) */}
      <PosterEditor seed={seed} publish={{ title: `${f.session ? f.session + "회 " : ""}새서울 CBMC 모임${f.date ? " · " + fmtDate(f.date) : ""}`, body: buildNotice(f) }} />
    </div>
  );
}
