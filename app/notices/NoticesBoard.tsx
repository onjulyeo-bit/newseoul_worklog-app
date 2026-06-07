"use client";

// 공지 게시판 ⑭ + 회원용 홈 ⑮ 히어로 — 클로드디자인 시안 이식.
// 실제 announcements insert/delete 보존. 회원은 읽기 전용.
import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Megaphone, Heart, Presentation, X, Plus, Send, ArrowLeft, Trash2, ChevronDown, MapPin, QrCode } from "lucide-react";

export type Announcement = { id: string; category: string; title: string; body: string; created_at: string; image_url?: string | null };
export type MemberHero = { name: string; meeting: { date: string; program: string | null; title: string | null; place: string | null; time: string | null; checkinHref: string | null } | null };

const COMPOSE_CATS = ["주간모임", "경조사", "일반"];
const DAYS = ["일", "월", "화", "수", "목", "금", "토"];
const fmt = (d: string) => { const t = new Date(d); return `${t.getFullYear()}.${t.getMonth() + 1}.${t.getDate()}`; };
const dayOf = (d: string) => DAYS[new Date(d + "T00:00").getDay()];
const mdOf = (d: string) => { const t = new Date(d + "T00:00"); return `${t.getMonth() + 1}월 ${t.getDate()}일`; };
const catTone = (c: string) => (c === "경조사" ? "warm" : c === "일반" ? "gray" : "brand");
const CatIcon = ({ c, size = 22 }: { c: string; size?: number }) => (c === "경조사" ? <Heart size={size} /> : c === "포럼" ? <Presentation size={size} /> : <Megaphone size={size} />);
const excerpt = (b: string, n = 80) => { const t = b.replace(/\n+/g, " "); return t.length > n ? t.slice(0, n) + "…" : t; };

export default function NoticesBoard({ isAdmin, initial, memberHero }: { isAdmin: boolean; initial: Announcement[]; memberHero?: MemberHero }) {
  const [supabase] = useState(() => createClient());
  const [list, setList] = useState<Announcement[]>(initial);
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState<Announcement | null>(null);
  const [composing, setComposing] = useState(false);
  const [toast, setToast] = useState("");
  const showToast = (t: string) => { setToast(t); setTimeout(() => setToast(""), 2000); };

  const cats = useMemo(() => Array.from(new Set(list.map((n) => n.category))).filter(Boolean), [list]);
  const filtered = list.filter((n) => !filter || n.category === filter);

  async function publish(category: string, title: string, body: string) {
    const { data, error } = await supabase.from("announcements").insert({ category, title: title.trim(), body: body.trim() }).select("id, category, title, body, created_at, image_url").single();
    if (error) { alert("게시 실패: " + error.message); return; }
    setList((l) => [data as Announcement, ...l]); setComposing(false); showToast("공지를 게시했어요");
  }
  async function remove(id: string) {
    if (!confirm("이 공지를 삭제할까요?")) return;
    setList((l) => l.filter((n) => n.id !== id)); setSelected(null); showToast("삭제되었습니다");
    await supabase.from("announcements").delete().eq("id", id);
  }

  // 상세 보기
  if (selected) {
    const n = selected;
    return (
      <div className="moim-nt"><style>{NT_CSS}</style>
        <div className="nt-detail-bar">
          <button className="nt-back" onClick={() => setSelected(null)}><ArrowLeft size={16} /> 목록</button>
          {isAdmin && <button className="ui-btn ui-ghost ui-sm" onClick={() => remove(n.id)}><Trash2 size={16} /> 삭제</button>}
        </div>
        <article className="nt-doc">
          <span className={`badge b-${catTone(n.category)}`}>{n.category}</span>
          <h1 className="nt-title">{n.title}</h1>
          <div className="nt-meta">{fmt(n.created_at)}</div>
          {n.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="nt-img" src={n.image_url} alt="포스터" />
          )}
          <p className="nt-body">{n.body}</p>
        </article>
        {toast && <div className="toast">{toast}</div>}
      </div>
    );
  }

  return (
    <div className="moim-nt"><style>{NT_CSS}</style>
      {memberHero ? (
        <div className="mh-hero">
          <h1 className="mh-greet">반가워요, {memberHero.name} 회원님</h1>
          <p className="mh-sub">이번 주 모임 소식을 확인하세요.</p>
          {memberHero.meeting && (
            <div className="mh-meet">
              <div className="mh-meet-l">
                <span className="mh-meet-when">{mdOf(memberHero.meeting.date)} ({dayOf(memberHero.meeting.date)}){memberHero.meeting.time ? ` · ${memberHero.meeting.time}` : ""}</span>
                {memberHero.meeting.program && <span className="mh-meet-prog">{memberHero.meeting.program}</span>}
                <h3 className="mh-meet-topic">{memberHero.meeting.title || "이번 주 모임"}</h3>
                {memberHero.meeting.place && <span className="mh-meet-place"><MapPin size={14} /> {memberHero.meeting.place}</span>}
              </div>
              {memberHero.meeting.checkinHref && <a className="mh-meet-cta" href={memberHero.meeting.checkinHref}><QrCode size={18} /> 출석 체크인</a>}
            </div>
          )}
          <h2 className="mh-feed-t">이번 주 소식</h2>
        </div>
      ) : isAdmin ? (
        <div className="page-head">
          <div><h1 className="page-title">공지</h1><p className="page-sub">모임 소식·포스터·경조사를 올리고 전달하세요.</p></div>
          <div className="page-acts"><button className="ui-btn ui-primary ui-sm" onClick={() => setComposing(true)}><Plus size={16} /> 새 공지</button></div>
        </div>
      ) : (
        <div className="page-head"><div><h1 className="page-title">공지</h1><p className="page-sub">모임 소식을 확인하세요.</p></div></div>
      )}

      {cats.length > 0 && (
        <div className="nt-filters">
          <button className={`chip-f ${!filter ? "on" : ""}`} onClick={() => setFilter("")}>전체</button>
          {cats.map((c) => <button key={c} className={`chip-f ${filter === c ? "on" : ""}`} onClick={() => setFilter(c)}>{c}</button>)}
        </div>
      )}

      <div className="nt-feed">
        {filtered.length === 0 ? (
          <div className="empty">{list.length === 0 ? "아직 공지가 없어요." : "해당 카테고리의 공지가 없습니다."}</div>
        ) : filtered.map((n) => (
          <button key={n.id} className="nt-card" onClick={() => setSelected(n)}>
            <div className={`nt-thumb tone-${catTone(n.category)}`} style={n.image_url ? { background: `#000 center/cover url(${n.image_url})` } : undefined}>
              {!n.image_url && <CatIcon c={n.category} />}
            </div>
            <div className="nt-card-body">
              <div className="nt-card-top"><span className={`badge b-${catTone(n.category)}`}>{n.category}</span><span className="nt-date">{fmt(n.created_at)}</span></div>
              <h3 className="nt-card-title">{n.title}</h3>
              <p className="nt-card-ex">{excerpt(n.body)}</p>
            </div>
          </button>
        ))}
      </div>

      {composing && <Compose onClose={() => setComposing(false)} onSubmit={publish} />}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

function Compose({ onClose, onSubmit }: { onClose: () => void; onSubmit: (c: string, t: string, b: string) => void }) {
  const [category, setCategory] = useState("주간모임");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const submit = () => { if (!title.trim() || !body.trim()) { alert("제목과 내용을 입력해 주세요."); return; } onSubmit(category, title, body); };
  return (
    <div className="drawer-root" onClick={onClose}>
      <aside className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-head">
          <button className="icon-btn" onClick={onClose} aria-label="닫기"><X size={20} /></button>
          <div className="drawer-acts"><button className="ui-btn ui-ghost ui-sm" onClick={onClose}>취소</button><button className="ui-btn ui-primary ui-sm" onClick={submit}><Send size={16} /> 게시</button></div>
        </div>
        <div className="drawer-body">
          <h2 className="cmp-title">새 공지 작성</h2>
          <label className="cf"><span className="cf-l">카테고리</span>
            <div className="sel-wrap"><select className="inp sel" value={category} onChange={(e) => setCategory(e.target.value)}>{COMPOSE_CATS.map((c) => <option key={c} value={c}>{c}</option>)}</select><ChevronDown size={16} /></div>
          </label>
          <label className="cf"><span className="cf-l">제목</span><input className="inp" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="공지 제목" /></label>
          <label className="cf"><span className="cf-l">본문</span><textarea className="inp txta" value={body} onChange={(e) => setBody(e.target.value)} placeholder="내용을 입력하세요 (콘텐츠 생성에서 만든 안내글을 붙여넣어도 돼요)" rows={8} /></label>
          <p className="cmp-hint">※ 포스터 이미지는 <b>콘텐츠 생성</b>에서 만들어 게시돼요.</p>
        </div>
      </aside>
    </div>
  );
}

const NT_CSS = `
.moim-nt{
  --brand:#0066cc; --brand-strong:#0052a8; --brand-soft:#e8f1fc; --brand-softer:#f3f8fe;
  --ink:#16181d; --ink-2:#3d424d; --ink-3:#767d8a; --line:#ecedf0; --bg:#ffffff; --bg-warm:#fafafb;
  --green:#0a7d3f; --green-soft:#e4f6ec;
  --radius-btn:14px; --radius-card:20px;
  --shadow-sm:0 1px 2px rgba(20,24,34,.04), 0 3px 12px rgba(20,24,34,.045);
  --shadow-md:0 2px 6px rgba(20,24,34,.05), 0 14px 38px rgba(20,40,80,.08);
  color:var(--ink); line-height:1.5; letter-spacing:-0.01em;
}
.moim-nt *{ box-sizing:border-box; }
.moim-nt h1,.moim-nt h2,.moim-nt h3,.moim-nt p{ margin:0; }
.moim-nt .badge{ display:inline-flex; align-items:center; font-size:12px; font-weight:700; padding:4px 10px; border-radius:999px; }
.moim-nt .b-brand{ background:var(--brand-soft); color:var(--brand-strong); }
.moim-nt .b-warm{ background:#fcefe7; color:#b5562a; }
.moim-nt .b-gray{ background:#eff0f2; color:#6b717c; }
.moim-nt .ui-btn{ display:inline-flex; align-items:center; justify-content:center; gap:6px; font-weight:600; border-radius:var(--radius-btn); border:0; cursor:pointer; transition:background .15s; }
.moim-nt .ui-sm{ font-size:13px; padding:8px 13px; }
.moim-nt .ui-primary{ background:var(--brand); color:#fff; box-shadow:0 5px 14px rgba(0,102,204,.22); }
.moim-nt .ui-ghost{ background:#fff; color:var(--ink-2); border:1px solid var(--line); }
.moim-nt .ui-ghost:hover{ background:#f7f8f9; }
.moim-nt .icon-btn{ width:36px; height:36px; border-radius:10px; display:grid; place-items:center; color:var(--ink-3); background:none; border:0; cursor:pointer; }
.moim-nt .icon-btn:hover{ background:#f1f2f4; color:var(--ink); }

.moim-nt .page-head{ display:flex; align-items:flex-end; justify-content:space-between; gap:14px; margin-bottom:18px; flex-wrap:wrap; }
.moim-nt .page-title{ font-size:clamp(21px,5vw,26px); font-weight:800; letter-spacing:-0.04em; }
.moim-nt .page-sub{ color:var(--ink-3); font-size:14px; margin-top:5px; font-weight:500; }

.moim-nt .mh-greet{ font-size:clamp(22px,5.5vw,27px); font-weight:800; letter-spacing:-0.04em; }
.moim-nt .mh-sub{ color:var(--ink-3); font-size:14.5px; margin-top:5px; font-weight:500; }
.moim-nt .mh-meet{ margin-top:18px; background:linear-gradient(150deg, var(--brand), var(--brand-strong)); border-radius:20px; padding:22px; color:#fff; display:flex; align-items:center; justify-content:space-between; gap:14px; box-shadow:0 12px 30px rgba(0,82,168,.25); flex-wrap:wrap; }
.moim-nt .mh-meet-l{ display:flex; flex-direction:column; gap:3px; min-width:0; }
.moim-nt .mh-meet-when{ font-size:13px; font-weight:600; opacity:.9; }
.moim-nt .mh-meet-prog{ font-size:12px; font-weight:800; background:rgba(255,255,255,.2); padding:3px 10px; border-radius:999px; width:fit-content; margin:3px 0; }
.moim-nt .mh-meet-topic{ font-size:19px; font-weight:800; letter-spacing:-0.03em; }
.moim-nt .mh-meet-place{ font-size:12.5px; opacity:.9; font-weight:600; display:inline-flex; align-items:center; gap:5px; margin-top:3px; }
.moim-nt .mh-meet-cta{ background:#fff; color:var(--brand-strong); font-weight:800; font-size:14px; padding:13px 18px; border-radius:14px; display:inline-flex; align-items:center; gap:7px; box-shadow:0 6px 16px rgba(0,0,0,.14); white-space:nowrap; text-decoration:none; }
.moim-nt .mh-feed-t{ font-size:17px; font-weight:800; letter-spacing:-0.03em; margin:26px 0 14px; }

.moim-nt .nt-filters{ display:flex; gap:8px; flex-wrap:wrap; margin-bottom:18px; }
.moim-nt .chip-f{ font-size:13.5px; font-weight:700; color:var(--ink-3); background:#fff; border:1px solid var(--line); border-radius:999px; padding:8px 15px; cursor:pointer; transition:background .15s, color .15s, border-color .15s; }
.moim-nt .chip-f:hover{ color:var(--ink-2); }
.moim-nt .chip-f.on{ background:var(--brand); color:#fff; border-color:var(--brand); }
.moim-nt .nt-feed{ display:flex; flex-direction:column; gap:12px; max-width:760px; }
.moim-nt .nt-card{ display:flex; gap:14px; background:#fff; border:1px solid var(--line); border-radius:18px; padding:16px; box-shadow:var(--shadow-sm); text-align:left; cursor:pointer; transition:transform .14s, box-shadow .14s, border-color .14s; }
.moim-nt .nt-card:hover{ transform:translateY(-2px); box-shadow:var(--shadow-md); border-color:#dde7f3; }
.moim-nt .nt-thumb{ width:72px; height:72px; border-radius:14px; flex-shrink:0; display:grid; place-items:center; color:#fff; background-size:cover; background-position:center; }
.moim-nt .nt-thumb.tone-brand{ background:linear-gradient(140deg,#3a8bff,#0066cc); }
.moim-nt .nt-thumb.tone-warm{ background:linear-gradient(140deg,#f0894e,#d4612f); }
.moim-nt .nt-thumb.tone-gray{ background:linear-gradient(140deg,#9aa3b0,#6b717c); }
.moim-nt .nt-card-body{ flex:1; min-width:0; }
.moim-nt .nt-card-top{ display:flex; align-items:center; gap:8px; margin-bottom:7px; }
.moim-nt .nt-date{ font-size:12px; color:var(--ink-3); font-weight:500; }
.moim-nt .nt-card-title{ font-size:16px; font-weight:700; letter-spacing:-0.03em; line-height:1.35; }
.moim-nt .nt-card-ex{ font-size:13px; color:var(--ink-3); margin-top:5px; line-height:1.5; font-weight:500; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
.moim-nt .empty{ padding:40px; text-align:center; color:var(--ink-3); font-size:14px; font-weight:500; border:1px solid var(--line); border-radius:18px; background:#fff; }

.moim-nt .nt-detail-bar{ display:flex; align-items:center; justify-content:space-between; margin-bottom:18px; }
.moim-nt .nt-back{ display:inline-flex; align-items:center; gap:5px; font-size:14px; font-weight:600; color:var(--ink-2); background:none; border:0; cursor:pointer; }
.moim-nt .nt-back:hover{ color:var(--brand); }
.moim-nt .nt-doc{ background:#fff; border:1px solid var(--line); border-radius:20px; padding:28px; box-shadow:var(--shadow-sm); max-width:720px; }
.moim-nt .nt-title{ font-size:24px; font-weight:800; letter-spacing:-0.04em; line-height:1.3; margin-top:12px; }
.moim-nt .nt-meta{ font-size:13px; color:var(--ink-3); font-weight:600; margin-top:8px; padding-bottom:18px; border-bottom:1px solid var(--line); }
.moim-nt .nt-img{ display:block; width:100%; max-width:320px; border-radius:16px; margin:20px 0; border:1px solid var(--line); box-shadow:var(--shadow-md); }
.moim-nt .nt-body{ font-size:14.5px; line-height:1.7; color:var(--ink-2); white-space:pre-wrap; font-weight:500; margin-top:20px; }

.moim-nt .drawer-root{ position:fixed; inset:0; z-index:60; background:rgba(20,24,34,.34); backdrop-filter:blur(2px); display:flex; justify-content:flex-end; animation:nt-fade .18s ease; }
@keyframes nt-fade{ from{opacity:0} to{opacity:1} }
.moim-nt .drawer{ width:100%; max-width:460px; background:var(--bg); height:100%; overflow-y:auto; box-shadow:-10px 0 40px rgba(20,30,60,.18); animation:nt-slide .26s cubic-bezier(.2,.7,.2,1); }
@keyframes nt-slide{ from{transform:translateX(30px);opacity:.6} to{transform:none;opacity:1} }
.moim-nt .drawer-head{ position:sticky; top:0; z-index:2; display:flex; align-items:center; justify-content:space-between; padding:12px 16px; background:rgba(255,255,255,.9); backdrop-filter:blur(10px); border-bottom:1px solid var(--line); }
.moim-nt .drawer-acts{ display:flex; gap:8px; }
.moim-nt .drawer-body{ padding:22px 22px 40px; }
.moim-nt .cmp-title{ font-size:20px; font-weight:800; letter-spacing:-0.03em; margin-bottom:18px; }
.moim-nt .cf{ display:flex; flex-direction:column; gap:6px; margin-bottom:11px; }
.moim-nt .cf-l{ font-size:12.5px; color:var(--ink-3); font-weight:600; }
.moim-nt .inp{ font-family:inherit; font-size:14.5px; color:var(--ink); background:#fff; border:1px solid var(--line); border-radius:11px; padding:10px 12px; outline:0; width:100%; transition:border-color .15s, box-shadow .15s; }
.moim-nt .inp:focus{ border-color:var(--brand); box-shadow:0 0 0 3px var(--brand-soft); }
.moim-nt .txta{ resize:vertical; line-height:1.6; }
.moim-nt .sel-wrap{ position:relative; display:flex; align-items:center; }
.moim-nt .sel-wrap svg{ position:absolute; right:12px; color:var(--ink-3); pointer-events:none; }
.moim-nt .sel{ appearance:none; -webkit-appearance:none; padding-right:34px; cursor:pointer; }
.moim-nt .cmp-hint{ font-size:12px; color:var(--ink-3); margin-top:6px; font-weight:500; }
.moim-nt .toast{ position:fixed; bottom:26px; left:50%; transform:translateX(-50%); z-index:80; background:var(--ink); color:#fff; font-size:13.5px; font-weight:600; padding:12px 20px; border-radius:999px; box-shadow:0 10px 30px rgba(0,0,0,.25); }
`;
