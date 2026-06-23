"use client";

// 특별행사 안내 — 한국대회·송년회·봄소풍·수련회 등 행사 카톡 공지글 생성기.
// 포스터는 '주간 포스터' 탭의 편집기를 재사용(여기선 공지글만).
import { useState } from "react";
import PosterEditor, { type Seed } from "./PosterEditor";
import { createClient } from "@/lib/supabase/client";
import { Sparkles, Calendar, MapPin, Wallet, ClipboardList, Backpack, Bus, Info, Copy, Megaphone, Mountain, PartyPopper, Flower2, Tent } from "lucide-react";

type TypeV = "한국대회" | "송년회" | "봄소풍" | "수련회" | "기타";
const TYPES: TypeV[] = ["한국대회", "송년회", "봄소풍", "수련회", "기타"];
type Form = { name: string; when: string; where: string; fee: string; apply: string; bring: string; transport: string; extra: string };

const ETYPE: Record<TypeV, { Icon: React.ComponentType<{ size?: number }>; bg: string; accent: string; emoji: string; intro: string; close: string }> = {
  한국대회: { Icon: Mountain, bg: "linear-gradient(160deg,#eaf2fd,#dceafb)", accent: "#003ecc", emoji: "🏔️", intro: "전국 CBMC가 함께 모이는 한국대회를 안내드립니다. 많은 참여 바랍니다.", close: "은혜로운 자리에 함께해 주세요. 🙏" },
  송년회: { Icon: PartyPopper, bg: "linear-gradient(160deg,#fdf1ec,#fbe6dc)", accent: "#c0623a", emoji: "🎄", intro: "한 해를 감사로 마무리하는 송년회를 안내드립니다. 함께해 주세요.", close: "한 해 동안 함께해 주셔서 감사합니다. 🤍" },
  봄소풍: { Icon: Flower2, bg: "linear-gradient(160deg,#e6f6ec,#d6f0e0)", accent: "#0a7d3f", emoji: "🌸", intro: "회원과 가족이 함께하는 봄소풍을 안내드립니다. 함께 친교의 시간을 가져요.", close: "가족과 함께 오셔서 좋은 추억 만드세요. 🌿" },
  수련회: { Icon: Tent, bg: "linear-gradient(160deg,#efeafe,#e4dbfb)", accent: "#6b46d9", emoji: "⛺", intro: "말씀과 교제로 재충전하는 수련회를 안내드립니다. 함께 참여해 주세요.", close: "주님 안에서 새 힘을 얻는 시간 되시길 바랍니다. 🙏" },
  기타: { Icon: Sparkles, bg: "linear-gradient(160deg,#f1f3f6,#e7eaef)", accent: "#5a6573", emoji: "📢", intro: "", close: "" },
};
const PH: Record<TypeV, string> = {
  한국대회: "예: 제52차 CBMC 한국대회",
  송년회: "예: 2026 송년회",
  봄소풍: "예: 2026 봄소풍",
  수련회: "예: 2026 가을 수련회",
  기타: "행사명",
};

function build(type: TypeV, f: Form) {
  const t = ETYPE[type];
  const lines: string[] = []; const add = (s: string) => lines.push(s);
  const opt = (label: string, v: string) => { if (v.trim()) add(`${label} ${v.trim()}`); };
  add(`${t.emoji} ${f.name.trim() || `${type} 안내`}`);
  add("");
  if (t.intro) add(t.intro);
  if (t.intro) add("");
  opt("📅 일시:", f.when);
  opt("📍 장소:", f.where);
  opt("💰 참가비:", f.fee);
  opt("📝 신청·마감:", f.apply);
  opt("🎒 준비물:", f.bring);
  opt("🚌 교통:", f.transport);
  if (f.extra.trim()) add(f.extra.trim());
  if (t.close) { add(""); add(t.close); }
  return lines.join("\n");
}

export default function SpecialEventTool() {
  const [type, setType] = useState<TypeV>("한국대회");
  const [f, setF] = useState<Form>({ name: "", when: "", where: "", fee: "", apply: "", bring: "", transport: "", extra: "" });
  const set = (k: keyof Form, v: string) => setF((s) => ({ ...s, [k]: v }));
  const [copied, setCopied] = useState(false);
  const [supabase] = useState(() => createClient());
  const [pub, setPub] = useState(false);
  const text = build(type, f);
  const t = ETYPE[type];
  const seed: Seed = {
    headline: "새서울 CBMC",
    category: type,
    title: f.name || `${type}`,
    verse: f.extra || "",
    speaker: f.fee ? `참가비 ${f.fee}` : (f.apply || ""),
    host: "",
    dateLine: f.when || "",
    modeLabel: f.where || "",
    place: "",
  };

  async function publish() {
    if (!f.name.trim()) { alert("행사명을 먼저 입력해주세요."); return; }
    if (!confirm("이 특별행사 공지를 회원 공지에 게시할까요?")) return;
    const title = f.name.trim();
    const { error } = await supabase.from("announcements").insert({ category: "행사", title, body: text });
    if (error) { alert("게시 실패: " + error.message); return; }
    setPub(true); setTimeout(() => setPub(false), 2500);
  }

  return (
    <div className="moim-sev"><style>{SEV_CSS}</style>
      <div className="cnt-grid two">
        {/* 입력 */}
        <div className="cnt-input">
          <div className="cnt-card">
            <h3 className="cnt-ct"><Sparkles size={16} /> 행사 정보</h3>
            <div className="ev-types">
              {TYPES.map((k) => <button key={k} className={`ev-tchip ${type === k ? "on" : ""}`} onClick={() => setType(k)}>{k}</button>)}
            </div>
            <label className="cf"><span className="cf-l">행사명</span><input className="inp" value={f.name} onChange={(e) => set("name", e.target.value)} placeholder={PH[type]} /></label>
            <label className="cf"><span className="cf-l">일시 (여러 날 가능)</span><input className="inp" value={f.when} onChange={(e) => set("when", e.target.value)} placeholder="예: 2026.8.12(수)~8.14(금)" /></label>
            <label className="cf"><span className="cf-l">장소</span><input className="inp" value={f.where} onChange={(e) => set("where", e.target.value)} placeholder="예: EXCO(대구)" /></label>
            <label className="cf"><span className="cf-l">참가비 (선택)</span><input className="inp" value={f.fee} onChange={(e) => set("fee", e.target.value)} placeholder="예: 1인 5만원" /></label>
            <label className="cf"><span className="cf-l">신청·마감 (선택)</span><input className="inp" value={f.apply} onChange={(e) => set("apply", e.target.value)} placeholder="예: 7/31까지 총무에게 신청" /></label>
            <label className="cf"><span className="cf-l">준비물 (선택)</span><input className="inp" value={f.bring} onChange={(e) => set("bring", e.target.value)} placeholder="예: 성경·세면도구" /></label>
            <label className="cf"><span className="cf-l">교통 (선택)</span><input className="inp" value={f.transport} onChange={(e) => set("transport", e.target.value)} placeholder="예: 오전 6시 충현교회 앞 출발" /></label>
            <label className="cf"><span className="cf-l">추가 내용 (선택)</span><textarea className="inp txta" value={f.extra} onChange={(e) => set("extra", e.target.value)} rows={2} /></label>
          </div>
        </div>

        {/* 미리보기 */}
        <div className="cnt-preview">
          <div className="ev-card" style={{ background: t.bg }}>
            <div className="ev-card-ic" style={{ color: t.accent, background: "rgba(255,255,255,.6)" }}><t.Icon size={28} /></div>
            <span className="ev-badge" style={{ color: "#fff", background: t.accent }}>{type}</span>
            <h2 className="ev-who">{f.name || "행사명을 입력하세요"}</h2>
            <div className="ev-rows">
              {f.when && <div className="ev-row"><Calendar size={15} /><span>{f.when}</span></div>}
              {f.where && <div className="ev-row"><MapPin size={15} /><span>{f.where}</span></div>}
              {f.fee && <div className="ev-row"><Wallet size={15} /><span>{f.fee}</span></div>}
              {f.apply && <div className="ev-row"><ClipboardList size={15} /><span>{f.apply}</span></div>}
              {f.bring && <div className="ev-row"><Backpack size={15} /><span>{f.bring}</span></div>}
              {f.transport && <div className="ev-row"><Bus size={15} /><span>{f.transport}</span></div>}
              {f.extra && <div className="ev-row"><Info size={15} /><span>{f.extra}</span></div>}
            </div>
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

      {/* 특별행사 포스터 (주간 포스터와 동일한 편집기) */}
      <div style={{ marginTop: 8 }}>
        <h3 className="cnt-ct" style={{ marginBottom: 10 }}><Sparkles size={16} /> 특별행사 포스터</h3>
        <PosterEditor seed={seed} publish={{ title: f.name.trim() || `${type} 안내`, body: text }} />
      </div>
    </div>
  );
}

const SEV_CSS = `
.moim-sev{
  --brand:#003ecc; --brand-strong:#0032a8; --brand-soft:#e8f1fc;
  --ink:#16181d; --ink-2:#3d424d; --ink-3:#767d8a; --line:#ecedf0; --bg:#ffffff; --navy:#1e2353;
  --shadow-sm:0 1px 2px rgba(20,24,34,.04), 0 3px 12px rgba(20,24,34,.045);
  --shadow-md:0 2px 6px rgba(20,24,34,.05), 0 14px 38px rgba(20,40,80,.08);
  color:var(--ink); line-height:1.5; letter-spacing:-0.01em;
}
.moim-sev *{ box-sizing:border-box; }
.moim-sev h2,.moim-sev h3,.moim-sev p,.moim-sev pre{ margin:0; }
.moim-sev .ui-btn{ display:inline-flex; align-items:center; justify-content:center; gap:6px; font-weight:600; border-radius:13px; border:0; cursor:pointer; transition:background .15s; white-space:nowrap; }
.moim-sev .ui-sm{ font-size:13px; padding:9px 13px; }
.moim-sev .ui-primary{ background:var(--brand); color:#fff; box-shadow:0 5px 14px rgba(0,102,204,.22); }
.moim-sev .ui-primary:hover{ background:var(--brand-strong); }
.moim-sev .ui-ghost{ background:#fff; color:var(--ink-2); border:1px solid var(--line); }
.moim-sev .ui-ghost:hover{ background:#f7f8f9; }
.moim-sev .cnt-grid{ display:grid; gap:18px; grid-template-columns:1fr; }
.moim-sev .cnt-card{ background:#fff; border:1px solid var(--line); border-radius:18px; padding:18px; box-shadow:var(--shadow-sm); }
.moim-sev .cnt-ct{ display:flex; align-items:center; gap:7px; font-size:15px; font-weight:800; letter-spacing:-0.03em; }
.moim-sev .cnt-ct svg{ color:var(--brand); }
.moim-sev .inp{ font-family:inherit; font-size:14.5px; color:var(--ink); background:#fff; border:1px solid var(--line); border-radius:11px; padding:10px 12px; outline:0; width:100%; transition:border-color .15s, box-shadow .15s; }
.moim-sev .inp:focus{ border-color:var(--brand); box-shadow:0 0 0 3px var(--brand-soft); }
.moim-sev .txta{ resize:vertical; line-height:1.6; }
.moim-sev .ev-types{ display:flex; gap:7px; flex-wrap:wrap; margin:4px 0 14px; }
.moim-sev .ev-tchip{ font-size:13px; font-weight:700; color:var(--ink-3); background:#fff; border:1px solid var(--line); border-radius:999px; padding:7px 14px; cursor:pointer; }
.moim-sev .ev-tchip.on{ background:var(--brand); color:#fff; border-color:var(--brand); }
.moim-sev .cf{ display:flex; flex-direction:column; gap:6px; margin-bottom:11px; }
.moim-sev .cf-l{ font-size:12.5px; color:var(--ink-3); font-weight:600; }
.moim-sev .cnt-preview{ display:flex; flex-direction:column; align-items:center; gap:16px; }
.moim-sev .ev-card{ width:100%; max-width:340px; border-radius:22px; padding:30px 26px; box-shadow:var(--shadow-md); display:flex; flex-direction:column; align-items:center; text-align:center; }
.moim-sev .ev-card-ic{ width:60px; height:60px; border-radius:50%; display:grid; place-items:center; margin-bottom:14px; }
.moim-sev .ev-badge{ font-size:12.5px; font-weight:800; padding:5px 13px; border-radius:999px; margin-bottom:14px; }
.moim-sev .ev-who{ font-size:21px; font-weight:800; letter-spacing:-0.03em; line-height:1.3; color:var(--ink); text-wrap:balance; }
.moim-sev .ev-rows{ display:flex; flex-direction:column; gap:8px; margin-top:18px; width:100%; }
.moim-sev .ev-row{ display:flex; align-items:center; gap:8px; justify-content:center; font-size:13.5px; font-weight:600; color:var(--ink-2); }
.moim-sev .ev-row svg{ color:var(--ink-3); flex-shrink:0; }
.moim-sev .ev-foot{ margin-top:20px; padding-top:16px; border-top:1px solid rgba(0,0,0,.08); width:100%; display:flex; align-items:center; justify-content:center; gap:7px; font-size:12.5px; font-weight:800; color:var(--ink-2); }
.moim-sev .pl-badge{ width:20px; height:20px; border-radius:6px; display:grid; place-items:center; font-size:10px; font-weight:800; }
.moim-sev .ev-text-wrap{ width:100%; max-width:340px; }
.moim-sev .ev-text-head{ display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; }
.moim-sev .ev-text-l{ font-size:13px; font-weight:800; color:var(--ink); }
.moim-sev .ev-text{ white-space:pre-wrap; background:var(--navy); color:#f5f5f7; border-radius:14px; padding:15px; font-family:inherit; font-size:13px; line-height:1.6; }
.moim-sev .sev-note{ font-size:12.5px; color:var(--ink-3); font-weight:500; text-align:center; max-width:340px; }
.moim-sev .sev-note b{ color:var(--brand-strong); }
@media (min-width:760px){ .moim-sev .cnt-grid.two{ grid-template-columns:1fr 1fr; } .moim-sev .cnt-preview{ position:sticky; top:120px; align-self:start; } }
`;
