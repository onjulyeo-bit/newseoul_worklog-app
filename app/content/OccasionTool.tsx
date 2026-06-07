"use client";

// 경조사·안내 ⑬ — 클로드디자인 시안(카드 미리보기) + 실기능(AI 추출·공지글 생성·게시) 머지.
import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Link2, WandSparkles, Image as ImageIcon, ChevronDown, Calendar, MapPin, Info, ExternalLink, Megaphone, Heart, Flower2, PartyPopper, HeartHandshake, Sparkles, Copy } from "lucide-react";

type TypeV = "부고" | "결혼" | "개업" | "심방" | "기타";
const TYPES: TypeV[] = ["부고", "결혼", "개업", "심방", "기타"];
type Form = { who: string; when: string; where: string; link: string; extra: string };

const ETYPE: Record<TypeV, { Icon: React.ComponentType<{ size?: number }>; bg: string; accent: string }> = {
  부고: { Icon: Flower2, bg: "linear-gradient(160deg,#f1f3f6,#e7eaef)", accent: "#5a6573" },
  결혼: { Icon: Heart, bg: "linear-gradient(160deg,#fdf1ec,#fbe6dc)", accent: "#c0623a" },
  개업: { Icon: PartyPopper, bg: "linear-gradient(160deg,#e6f6ec,#d6f0e0)", accent: "#0a7d3f" },
  심방: { Icon: HeartHandshake, bg: "linear-gradient(160deg,#eaf2fd,#dceafb)", accent: "#0b62c4" },
  기타: { Icon: Sparkles, bg: "linear-gradient(160deg,#efeafe,#e4dbfb)", accent: "#6b46d9" },
};
const PH: Record<TypeV, { who: string; when: string; where: string }> = {
  부고: { who: "예: 허승필 대표님 부친", when: "발인 일시", where: "쉴낙원 경기장례식장" },
  결혼: { who: "예: 조강민 대표님 장녀", when: "결혼 일시", where: "예식장" },
  개업: { who: "예: 김영근 대표님", when: "개업 일시", where: "장소" },
  심방: { who: "예: 박경선 대표님", when: "심방 일시", where: "사업장" },
  기타: { who: "안내 대상/내용", when: "일시", where: "장소" },
};

function build(type: TypeV, f: Form) {
  const lines: string[] = []; const add = (s: string) => lines.push(s);
  const opt = (label: string, v: string) => { if (v.trim()) add(`${label} ${v.trim()}`); };
  if (type === "부고") { add("🕊️ 부고안내"); add(""); add(`${f.who.trim() || "○○○ 대표님 부친"}께서 소천하셨기에 부고를 전해 드립니다.`); add("유가족에게 하나님의 위로하심과 평안이 함께하시기를 마음 모아 기도드립니다."); add(""); opt("🏥 빈소:", f.where); opt("🕯️ 발인:", f.when); opt("🔗 모바일 부고:", f.link); if (f.extra.trim()) add(f.extra.trim()); add(""); add("함께 위로의 마음을 전해 주시면 감사하겠습니다. 🤍"); }
  else if (type === "결혼") { add("💐 결혼 안내"); add(""); add(`${f.who.trim() || "○○○ 대표님 가정"}의 기쁜 결혼 소식을 전해 드립니다. 함께 축복해 주세요.`); add(""); opt("📅 일시:", f.when); opt("📍 장소:", f.where); opt("🔗 모바일 청첩장:", f.link); if (f.extra.trim()) add(f.extra.trim()); add(""); add("새로 이루는 가정에 주님의 은혜가 충만하시길 기도합니다. 🤍"); }
  else if (type === "개업") { add("🎉 개업 안내"); add(""); add(`${f.who.trim() || "○○○ 대표님"}의 새로운 시작을 전해 드립니다. 함께 축하해 주세요.`); add(""); opt("📅 일시:", f.when); opt("📍 장소:", f.where); opt("🔗 안내:", f.link); if (f.extra.trim()) add(f.extra.trim()); add(""); add("하시는 사업 위에 하나님의 형통하심이 함께하시길 기도합니다. 🙏"); }
  else if (type === "심방") { add("🙏 사업장 심방 안내"); add(""); add(`${f.who.trim() || "○○○ 대표님"} 사업장 심방을 안내드립니다. 함께 기도로 동행해 주세요.`); add(""); opt("📅 일시:", f.when); opt("📍 장소:", f.where); opt("🔗 안내:", f.link); if (f.extra.trim()) add(f.extra.trim()); add(""); add("일터에 임하시는 주님의 은혜를 함께 구합니다. 🤍"); }
  else { add("📢 안내"); add(""); if (f.who.trim()) add(f.who.trim()); opt("📅 일시:", f.when); opt("📍 장소:", f.where); opt("🔗 링크:", f.link); if (f.extra.trim()) add(f.extra.trim()); }
  return lines.join("\n");
}

export default function OccasionTool() {
  const [type, setType] = useState<TypeV>("결혼");
  const [f, setF] = useState<Form>({ who: "", when: "", where: "", link: "", extra: "" });
  const set = (k: keyof Form, v: string) => setF((s) => ({ ...s, [k]: v }));
  const [copied, setCopied] = useState(false);
  const [supabase] = useState(() => createClient());
  const [pub, setPub] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extractErr, setExtractErr] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const text = build(type, f);
  const ph = PH[type];
  const t = ETYPE[type];

  async function runExtract(body: { image?: string; url?: string }) {
    setExtracting(true); setExtractErr("");
    try {
      const res = await fetch("/api/occasion-extract", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const d = await res.json();
      if (!res.ok || !d.fields) { setExtractErr(d.error || "추출에 실패했어요."); return; }
      const fl = d.fields as Partial<Record<keyof Form | "type", string>>;
      if (fl.type && TYPES.includes(fl.type as TypeV)) setType(fl.type as TypeV);
      setF({ who: fl.who || "", when: fl.when || "", where: fl.where || "", link: fl.link || "", extra: fl.extra || "" });
    } catch { setExtractErr("네트워크 오류가 났어요."); } finally { setExtracting(false); }
  }
  async function uploadInvite(file: File) {
    const dataUrl: string = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result as string); r.onerror = rej; r.readAsDataURL(file); });
    await runExtract({ image: dataUrl });
  }
  async function publish() {
    if (!f.who.trim()) { alert("내용을 먼저 채워주세요."); return; }
    if (!confirm("이 경조사·안내 공지를 회원 공지에 게시할까요?")) return;
    const title = text.split("\n")[0].replace(/^[^\w가-힣]+/, "").trim() || `${type} 안내`;
    const { error } = await supabase.from("announcements").insert({ category: "경조사", title, body: text });
    if (error) { alert("게시 실패: " + error.message); return; }
    setPub(true); setTimeout(() => setPub(false), 2500);
  }

  return (
    <div className="moim-ev"><style>{EV_CSS}</style>
      <div className="cnt-grid two">
        {/* 입력 */}
        <div className="cnt-input">
          <div className="cnt-card">
            <h3 className="cnt-ct"><Link2 size={16} /> 링크·이미지로 자동 채우기</h3>
            <p className="cnt-cs">모바일 청첩장·부고 링크를 붙이거나 캡처 이미지를 올리면 내용을 자동으로 추출해요.</p>
            <input className="inp" value={inviteUrl} onChange={(e) => setInviteUrl(e.target.value)} placeholder="https:// 청첩장·부고 링크 붙여넣기" />
            <div className="ev-actions">
              <button className="ui-btn ui-primary ui-sm" onClick={() => inviteUrl.trim() ? runExtract({ url: inviteUrl.trim() }) : setExtractErr("링크를 먼저 붙여넣어 주세요")} disabled={extracting}><WandSparkles size={16} /> {extracting ? "읽는 중…" : "자동 채우기"}</button>
              <button className="ui-btn ui-ghost ui-sm" onClick={() => fileRef.current?.click()} disabled={extracting}><ImageIcon size={16} /> 이미지 업로드</button>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { const file = e.target.files?.[0]; if (file) uploadInvite(file); e.currentTarget.value = ""; }} />
            </div>
            {extractErr && <p className="ev-err">{extractErr}</p>}
          </div>

          <div className="cnt-card">
            <h3 className="cnt-ct"><Sparkles size={16} /> 내용 확인·수정</h3>
            <div className="ev-types">
              {TYPES.map((k) => <button key={k} className={`ev-tchip ${type === k ? "on" : ""}`} onClick={() => setType(k)}>{k}</button>)}
            </div>
            <label className="cf"><span className="cf-l">대상</span><input className="inp" value={f.who} onChange={(e) => set("who", e.target.value)} placeholder={ph.who} /></label>
            <label className="cf"><span className="cf-l">일시</span><input className="inp" value={f.when} onChange={(e) => set("when", e.target.value)} placeholder={ph.when} /></label>
            <label className="cf"><span className="cf-l">{type === "부고" ? "빈소" : "장소"}</span><input className="inp" value={f.where} onChange={(e) => set("where", e.target.value)} placeholder={ph.where} /></label>
            <label className="cf"><span className="cf-l">모바일 부고/청첩 링크</span><input className="inp" value={f.link} onChange={(e) => set("link", e.target.value)} placeholder="https://…" /></label>
            <label className="cf"><span className="cf-l">추가 내용 (선택)</span><textarea className="inp txta" value={f.extra} onChange={(e) => set("extra", e.target.value)} rows={2} /></label>
          </div>
        </div>

        {/* 미리보기 */}
        <div className="cnt-preview">
          <div className="ev-card" style={{ background: t.bg }}>
            <div className="ev-card-ic" style={{ color: t.accent, background: "rgba(255,255,255,.6)" }}><t.Icon size={28} /></div>
            <span className="ev-badge" style={{ color: "#fff", background: t.accent }}>{type} 안내</span>
            <h2 className="ev-who">{f.who || "대상을 입력하세요"}</h2>
            <div className="ev-rows">
              {f.when && <div className="ev-row"><Calendar size={15} /><span>{f.when}</span></div>}
              {f.where && <div className="ev-row"><MapPin size={15} /><span>{f.where}</span></div>}
              {f.extra && <div className="ev-row"><Info size={15} /><span>{f.extra}</span></div>}
            </div>
            {f.link && <a className="ev-link" href={f.link} target="_blank" rel="noreferrer"><ExternalLink size={14} /> 원문 보기</a>}
            <div className="ev-foot"><span className="pl-badge" style={{ background: t.accent, color: "#fff" }}>ON</span> 새서울 CBMC</div>
          </div>

          <div className="ev-text-wrap">
            <div className="ev-text-head"><span className="ev-text-l">공지글 (카톡용)</span>
              <button className="ui-btn ui-ghost ui-sm" onClick={async () => { try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch {} }}><Copy size={15} /> {copied ? "복사됨" : "복사"}</button></div>
            <pre className="ev-text">{text}</pre>
          </div>

          <button className="ui-btn ui-primary" style={{ width: "100%", maxWidth: 340, padding: "13px" }} onClick={publish}><Megaphone size={17} /> {pub ? "✓ 공지에 게시됨!" : "공지에 게시"}</button>
        </div>
      </div>
    </div>
  );
}

const EV_CSS = `
.moim-ev{
  --brand:#0066cc; --brand-strong:#0052a8; --brand-soft:#e8f1fc; --brand-softer:#f3f8fe;
  --ink:#16181d; --ink-2:#3d424d; --ink-3:#767d8a; --line:#ecedf0; --bg:#ffffff; --bg-warm:#fafafb; --navy:#1a2238;
  --shadow-sm:0 1px 2px rgba(20,24,34,.04), 0 3px 12px rgba(20,24,34,.045);
  --shadow-md:0 2px 6px rgba(20,24,34,.05), 0 14px 38px rgba(20,40,80,.08);
  color:var(--ink); line-height:1.5; letter-spacing:-0.01em;
}
.moim-ev *{ box-sizing:border-box; }
.moim-ev h2,.moim-ev h3,.moim-ev p,.moim-ev pre{ margin:0; }
.moim-ev .ui-btn{ display:inline-flex; align-items:center; justify-content:center; gap:6px; font-weight:600; border-radius:13px; border:0; cursor:pointer; transition:background .15s; white-space:nowrap; }
.moim-ev .ui-btn:disabled{ opacity:.55; cursor:default; }
.moim-ev .ui-sm{ font-size:13px; padding:9px 13px; }
.moim-ev .ui-primary{ background:var(--brand); color:#fff; box-shadow:0 5px 14px rgba(0,102,204,.22); }
.moim-ev .ui-primary:hover{ background:var(--brand-strong); }
.moim-ev .ui-ghost{ background:#fff; color:var(--ink-2); border:1px solid var(--line); }
.moim-ev .ui-ghost:hover{ background:#f7f8f9; }
.moim-ev .cnt-grid{ display:grid; gap:18px; grid-template-columns:1fr; }
.moim-ev .cnt-card{ background:#fff; border:1px solid var(--line); border-radius:18px; padding:18px; box-shadow:var(--shadow-sm); }
.moim-ev .cnt-card + .cnt-card{ margin-top:16px; }
.moim-ev .cnt-ct{ display:flex; align-items:center; gap:7px; font-size:15px; font-weight:800; letter-spacing:-0.03em; }
.moim-ev .cnt-ct svg{ color:var(--brand); }
.moim-ev .cnt-cs{ font-size:12.5px; color:var(--ink-3); margin:5px 0 14px; font-weight:500; }
.moim-ev .inp{ font-family:inherit; font-size:14.5px; color:var(--ink); background:#fff; border:1px solid var(--line); border-radius:11px; padding:10px 12px; outline:0; width:100%; transition:border-color .15s, box-shadow .15s; }
.moim-ev .inp:focus{ border-color:var(--brand); box-shadow:0 0 0 3px var(--brand-soft); }
.moim-ev .txta{ resize:vertical; line-height:1.6; }
.moim-ev .ev-actions{ display:flex; gap:8px; flex-wrap:wrap; margin-top:12px; }
.moim-ev .ev-err{ font-size:12.5px; color:#c8392c; font-weight:600; margin-top:8px; }
.moim-ev .ev-types{ display:flex; gap:7px; flex-wrap:wrap; margin:4px 0 14px; }
.moim-ev .ev-tchip{ font-size:13px; font-weight:700; color:var(--ink-3); background:#fff; border:1px solid var(--line); border-radius:999px; padding:7px 14px; cursor:pointer; }
.moim-ev .ev-tchip.on{ background:var(--brand); color:#fff; border-color:var(--brand); }
.moim-ev .cf{ display:flex; flex-direction:column; gap:6px; margin-bottom:11px; }
.moim-ev .cf-l{ font-size:12.5px; color:var(--ink-3); font-weight:600; }
.moim-ev .cnt-preview{ display:flex; flex-direction:column; align-items:center; gap:16px; }
.moim-ev .ev-card{ width:100%; max-width:340px; border-radius:22px; padding:30px 26px; box-shadow:var(--shadow-md); display:flex; flex-direction:column; align-items:center; text-align:center; }
.moim-ev .ev-card-ic{ width:60px; height:60px; border-radius:50%; display:grid; place-items:center; margin-bottom:14px; }
.moim-ev .ev-badge{ font-size:12.5px; font-weight:800; padding:5px 13px; border-radius:999px; margin-bottom:14px; }
.moim-ev .ev-who{ font-size:21px; font-weight:800; letter-spacing:-0.03em; line-height:1.3; color:var(--ink); text-wrap:balance; }
.moim-ev .ev-rows{ display:flex; flex-direction:column; gap:8px; margin-top:18px; width:100%; }
.moim-ev .ev-row{ display:flex; align-items:center; gap:8px; justify-content:center; font-size:13.5px; font-weight:600; color:var(--ink-2); }
.moim-ev .ev-row svg{ color:var(--ink-3); flex-shrink:0; }
.moim-ev .ev-link{ margin-top:16px; display:inline-flex; align-items:center; gap:5px; font-size:13px; font-weight:700; color:var(--ink-2); background:rgba(255,255,255,.6); padding:8px 14px; border-radius:999px; text-decoration:none; }
.moim-ev .ev-foot{ margin-top:20px; padding-top:16px; border-top:1px solid rgba(0,0,0,.08); width:100%; display:flex; align-items:center; justify-content:center; gap:7px; font-size:12.5px; font-weight:800; color:var(--ink-2); }
.moim-ev .pl-badge{ width:20px; height:20px; border-radius:6px; display:grid; place-items:center; font-size:10px; font-weight:800; }
.moim-ev .ev-text-wrap{ width:100%; max-width:340px; }
.moim-ev .ev-text-head{ display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; }
.moim-ev .ev-text-l{ font-size:13px; font-weight:800; color:var(--ink); }
.moim-ev .ev-text{ white-space:pre-wrap; background:var(--navy); color:#f5f5f7; border-radius:14px; padding:15px; font-family:inherit; font-size:13px; line-height:1.6; }
@media (min-width:760px){ .moim-ev .cnt-grid.two{ grid-template-columns:1fr 1fr; } .moim-ev .cnt-preview{ position:sticky; top:120px; align-self:start; } }
`;
