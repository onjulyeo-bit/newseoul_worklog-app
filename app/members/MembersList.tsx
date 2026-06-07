"use client";

// 회원 목록 ③ + 회원 상세·편집 드로어 ④ — 클로드디자인 '모임온 앱' 시안 이식.
// 실데이터(props)로 표시, 편집은 saveMember 서버액션으로 DB 저장(redirect 없이 화면 유지).
import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  ChevronDown, Check, SlidersHorizontal, Search, X, Upload, UserPlus,
  Users, UserCheck, BadgeCheck, Heart, Pencil, Phone, Camera,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { saveMember } from "./actions";

export type RawMember = {
  id: string; name: string; gender: string | null; phone: string | null; registration: string | null;
  grade: string | null; status: string | null; spouse_name: string | null; industry: string | null;
  company: string | null; position: string | null; vision_school: string | null; leadership_school: string | null;
  car_model: string | null; car_number: string | null; parking_registered: boolean | null;
  joined_on: string | null; tags: string[] | null; photo_url: string | null;
};

const GRADES = ["명예회원", "정회원", "부부회원", "준회원", "신입회원", "유보회원"];
const STATUSES = ["활동", "휴면", "비활동", "OB"];
const GRADE_TONE: Record<string, string> = { 명예회원: "purple", 정회원: "blue", 부부회원: "green", 준회원: "warm", 신입회원: "gray", 유보회원: "gray" };
const STATUS_TONE: Record<string, string> = { 활동: "green", 휴면: "warm", 비활동: "gray", OB: "brand" };
const AV_COLORS = ["#0066cc", "#16a34a", "#7c5cff", "#e8643c", "#0d9488", "#d4a017"];
const PRESET_TAGS = ["증경회장", "지회장", "총무", "간사", "감사", "부총무", "고문", "운영위원", "찬양팀", "봉사팀", "창립멤버", "새가족", "청년부"];

const COLUMNS: { key: string; label: string; field: keyof RawMember }[] = [
  { key: "gender", label: "성별", field: "gender" },
  { key: "phone", label: "연락처", field: "phone" },
  { key: "grade", label: "등급", field: "grade" },
  { key: "status", label: "상태", field: "status" },
  { key: "spouse", label: "배우자", field: "spouse_name" },
  { key: "industry", label: "업종", field: "industry" },
  { key: "company", label: "회사", field: "company" },
  { key: "position", label: "직책", field: "position" },
  { key: "vision", label: "비전스쿨", field: "vision_school" },
  { key: "leadership", label: "리더십스쿨", field: "leadership_school" },
  { key: "join", label: "가입일", field: "joined_on" },
  { key: "tags", label: "태그", field: "tags" },
];
const DEFAULT_COLS = ["gender", "phone", "grade", "status", "company", "position", "join", "tags"];

function Avatar({ name, size = 38, photo }: { name: string; size?: number; photo?: string | null }) {
  if (photo) {
    // eslint-disable-next-line @next/next/no-img-element
    return <span className="avatar avatar-photo" style={{ width: size, height: size }}><img src={photo} alt={name} /></span>;
  }
  const ch = name.trim().charAt(0) || "?";
  const color = AV_COLORS[(name.charCodeAt(0) || 0) % AV_COLORS.length];
  return <span className="avatar" style={{ width: size, height: size, background: color, fontSize: size * 0.42 }}>{ch}</span>;
}
function Badge({ tone = "gray", dot, children }: { tone?: string; dot?: boolean; children: React.ReactNode }) {
  return <span className={`badge b-${tone}`}>{dot && <span className="badge-dot" />}{children}</span>;
}
function useClickOutside(onOut: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onOut(); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onOut]);
  return ref;
}

function Dropdown({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useClickOutside(() => setOpen(false));
  return (
    <div className="dd" ref={ref}>
      <button className={`dd-btn ${value ? "active" : ""}`} onClick={() => setOpen((o) => !o)}>
        <span>{label}{value ? ` · ${value}` : ""}</span><ChevronDown size={15} />
      </button>
      {open && (
        <div className="dd-menu">
          <button className={`dd-item ${!value ? "sel" : ""}`} onClick={() => { onChange(""); setOpen(false); }}>전체</button>
          {options.map((o) => (
            <button key={o} className={`dd-item ${value === o ? "sel" : ""}`} onClick={() => { onChange(o); setOpen(false); }}>
              {o}{value === o && <Check size={15} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ColumnMenu({ visible, onToggle }: { visible: string[]; onToggle: (k: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useClickOutside(() => setOpen(false));
  return (
    <div className="dd" ref={ref}>
      <button className="dd-btn" onClick={() => setOpen((o) => !o)}><SlidersHorizontal size={15} /><span>열 선택</span></button>
      {open && (
        <div className="dd-menu dd-menu-r">
          {COLUMNS.map((c) => (
            <button key={c.key} className="dd-item" onClick={() => onToggle(c.key)}>
              <span className={`chkbox ${visible.includes(c.key) ? "on" : ""}`}>{visible.includes(c.key) && <Check size={12} />}</span>{c.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function cellValue(m: RawMember, key: string) {
  if (key === "grade") return m.grade ? <Badge tone={GRADE_TONE[m.grade] || "gray"}>{m.grade}</Badge> : <span className="fld-empty">—</span>;
  if (key === "status") return m.status ? <Badge tone={STATUS_TONE[m.status] || "gray"} dot>{m.status}</Badge> : <span className="fld-empty">—</span>;
  if (key === "phone") return <span className="mono nowrap">{m.phone || "—"}</span>;
  if (key === "join") return <span className="mono">{m.joined_on || "—"}</span>;
  if (key === "tags") return <div className="cell-tags">{(m.tags || []).map((t) => <span key={t} className="chip sm">{t}</span>)}</div>;
  const field = COLUMNS.find((c) => c.key === key)?.field;
  const v = field ? (m[field] as string | null) : null;
  return v ? <span>{v}</span> : <span className="fld-empty">—</span>;
}

export default function MembersList({ members: initial }: { members: RawMember[] }) {
  const [members, setMembers] = useState(initial);
  const [grade, setGrade] = useState("");
  const [status, setStatus] = useState("");
  const [reg, setReg] = useState("");
  const [q, setQ] = useState("");
  const [cols, setCols] = useState<string[]>(DEFAULT_COLS);
  const [selected, setSelected] = useState<RawMember | null>(null);
  const [toast, setToast] = useState("");

  const showToast = (t: string) => { setToast(t); setTimeout(() => setToast(""), 2200); };
  const toggleCol = (k: string) => setCols((c) => c.includes(k) ? c.filter((x) => x !== k) : [...c, k]);

  const filtered = members.filter((m) => {
    if (grade && m.grade !== grade) return false;
    if (status && m.status !== status) return false;
    if (reg === "등록" && m.registration !== "등록회원") return false;
    if (reg === "비등록" && m.registration !== "비등록") return false;
    if (q) {
      const s = q.toLowerCase();
      if (![m.name, m.company, m.phone, m.position, m.industry].some((f) => (f || "").toLowerCase().includes(s))) return false;
    }
    return true;
  });

  const stat = {
    total: members.length,
    active: members.filter((m) => m.status === "활동").length,
    jung: members.filter((m) => m.grade === "정회원").length,
    couple: members.filter((m) => m.grade === "부부회원").length,
  };

  const onSaved = (m: RawMember) => { setMembers((list) => list.map((x) => x.id === m.id ? m : x)); setSelected(m); showToast("저장되었습니다"); };
  const visibleCols = COLUMNS.filter((c) => cols.includes(c.key));

  return (
    <div className="moim-mem">
      <style>{MEM_CSS}</style>

      <div className="page-head">
        <div>
          <h1 className="page-title">회원관리</h1>
          <p className="page-sub">모임 회원 {stat.total}명 · 활동 {stat.active}명</p>
        </div>
        <div className="page-acts">
          <Link href="/members/import" className="ui-btn ui-ghost ui-sm"><Upload size={16} /> 엑셀 업로드</Link>
          <Link href="/members/new" className="ui-btn ui-primary ui-sm"><UserPlus size={16} /> 회원 추가</Link>
        </div>
      </div>

      <div className="stat-grid mb">
        <div className="card stat"><div className="stat-ic t-brand"><Users size={20} /></div><div className="stat-body"><div className="stat-label">전체 회원</div><div className="stat-value">{stat.total}명</div></div></div>
        <div className="card stat"><div className="stat-ic t-green"><UserCheck size={20} /></div><div className="stat-body"><div className="stat-label">활동 회원</div><div className="stat-value">{stat.active}명</div></div></div>
        <div className="card stat"><div className="stat-ic t-blue"><BadgeCheck size={20} /></div><div className="stat-body"><div className="stat-label">정회원</div><div className="stat-value">{stat.jung}명</div></div></div>
        <div className="card stat"><div className="stat-ic t-warm"><Heart size={20} /></div><div className="stat-body"><div className="stat-label">부부회원</div><div className="stat-value">{stat.couple}명</div></div></div>
      </div>

      <div className="filters">
        <div className="filter-left">
          <Dropdown label="등급" value={grade} options={GRADES} onChange={setGrade} />
          <Dropdown label="상태" value={status} options={STATUSES} onChange={setStatus} />
          <Dropdown label="등록" value={reg} options={["등록", "비등록"]} onChange={setReg} />
        </div>
        <div className="filter-right">
          <div className="search">
            <Search size={16} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="이름·회사·연락처 검색" />
            {q && <button className="search-x" onClick={() => setQ("")}><X size={14} /></button>}
          </div>
          <ColumnMenu visible={cols} onToggle={toggleCol} />
        </div>
      </div>

      <div className="result-line">{filtered.length}명 표시</div>

      {/* 표 (데스크톱) */}
      <div className="card table-card">
        <div className="table-scroll">
          <table className="mtable">
            <thead><tr><th className="th-name">이름</th>{visibleCols.map((c) => <th key={c.key}>{c.label}</th>)}</tr></thead>
            <tbody>
              {filtered.map((m) => (
                <tr key={m.id} onClick={() => setSelected(m)}>
                  <td className="td-name">
                    <Avatar name={m.name} size={30} photo={m.photo_url} /><span className="td-nm">{m.name}</span>
                    {m.registration === "비등록" && <span className="reg-dot" title="비등록" />}
                  </td>
                  {visibleCols.map((c) => {
                    const f = c.field; const raw = f ? (m[f] as unknown) : null;
                    const clip = ["company", "position", "industry", "vision", "leadership"].includes(c.key);
                    return <td key={c.key} className={clip ? "cell-clip" : ""} title={clip && typeof raw === "string" ? raw : undefined}>{cellValue(m, c.key)}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          {!filtered.length && <div className="empty">조건에 맞는 회원이 없습니다.</div>}
        </div>
      </div>

      {/* 카드 (모바일) */}
      <div className="mcards">
        {filtered.map((m) => (
          <button key={m.id} className="mcard" onClick={() => setSelected(m)}>
            <Avatar name={m.name} size={42} photo={m.photo_url} />
            <div className="mcard-body">
              <div className="mcard-top"><span className="mcard-name">{m.name}</span>{m.grade && <Badge tone={GRADE_TONE[m.grade] || "gray"}>{m.grade}</Badge>}</div>
              <div className="mcard-meta"><span>{m.company || "—"}</span><span className="dotsep">·</span><span className="mono">{m.phone || "—"}</span></div>
            </div>
            {m.status && <Badge tone={STATUS_TONE[m.status] || "gray"} dot>{m.status}</Badge>}
          </button>
        ))}
        {!filtered.length && <div className="empty">조건에 맞는 회원이 없습니다.</div>}
      </div>

      {selected && <MemberDetail member={selected} onClose={() => setSelected(null)} onSaved={onSaved} />}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return <div className="fld"><span className="fld-label">{label}</span><span className={`fld-value ${mono ? "mono" : ""}`}>{value || <span className="fld-empty">—</span>}</span></div>;
}
function EditText({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return <label className="fld-edit"><span className="fld-label">{label}</span><input className="inp" value={value} onChange={(e) => onChange(e.target.value)} /></label>;
}
function EditSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <label className="fld-edit"><span className="fld-label">{label}</span>
      <div className="sel-wrap"><select className="inp sel" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">선택 안 함</option>{options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select><ChevronDown size={16} /></div>
    </label>
  );
}

function PhotoCircle({ member, onChange }: { member: RawMember; onChange: (url: string | null) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; e.target.value = "";
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { alert("5MB 이하 이미지만 올릴 수 있어요."); return; }
    setBusy(true);
    const supabase = createClient();
    const ext = (f.name.split(".").pop() || "jpg").toLowerCase();
    const path = `${member.id}-${Date.now()}.${ext}`;
    const up = await supabase.storage.from("member-photos").upload(path, f, { upsert: true, contentType: f.type });
    if (up.error) { setBusy(false); alert("업로드 실패: " + up.error.message); return; }
    const { data } = supabase.storage.from("member-photos").getPublicUrl(path);
    const r = await saveMember(member.id, { photo_url: data.publicUrl });
    setBusy(false);
    if (r.error) { alert("저장 실패: " + r.error); return; }
    onChange(data.publicUrl);
  };
  const clear = async () => {
    setBusy(true);
    const r = await saveMember(member.id, { photo_url: null });
    setBusy(false);
    if (r.error) { alert("삭제 실패: " + r.error); return; }
    onChange(null);
  };
  return (
    <div className="photo-circle">
      <button className="photo-btn" onClick={() => fileRef.current?.click()} title="사진 변경" type="button" disabled={busy}>
        <Avatar name={member.name} size={64} photo={member.photo_url} />
        <span className="photo-cam">{busy ? "…" : <Camera size={13} />}</span>
      </button>
      {member.photo_url && !busy && <button className="photo-clear" onClick={clear} title="사진 삭제" type="button"><X size={12} /></button>}
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={pick} />
    </div>
  );
}

function MemberDetail({ member, onClose, onSaved }: { member: RawMember; onClose: () => void; onSaved: (m: RawMember) => void }) {
  const [edit, setEdit] = useState(false);
  const [m, setM] = useState(member);
  const [pending, start] = useTransition();
  useEffect(() => { setM(member); setEdit(false); }, [member]);

  const [newTag, setNewTag] = useState("");
  const set = (k: keyof RawMember, v: string | boolean) => setM((p) => ({ ...p, [k]: v }));
  const setPhoto = (url: string | null) => { setM((p) => ({ ...p, photo_url: url })); onSaved({ ...m, photo_url: url }); };
  const toggleTag = (t: string) => setM((p) => { const cur = p.tags ?? []; return { ...p, tags: cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t] }; });
  const addTag = () => { const t = newTag.trim(); if (!t) return; setM((p) => ((p.tags ?? []).includes(t) ? p : { ...p, tags: [...(p.tags ?? []), t] })); setNewTag(""); };

  const save = () => {
    start(async () => {
      const data = {
        grade: m.grade, status: m.status, gender: m.gender, phone: m.phone, spouse_name: m.spouse_name,
        industry: m.industry, company: m.company, position: m.position,
        vision_school: m.vision_school, leadership_school: m.leadership_school,
        car_model: m.car_model, car_number: m.car_number, parking_registered: m.parking_registered,
        tags: m.tags ?? [],
      };
      const r = await saveMember(m.id, data);
      if (r.error) { alert("저장 실패: " + r.error); return; }
      onSaved(m); setEdit(false);
    });
  };

  return (
    <div className="drawer-root" onClick={onClose}>
      <aside className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-head">
          <button className="icon-btn" onClick={onClose} aria-label="닫기"><X size={20} /></button>
          {edit ? (
            <div className="drawer-acts">
              <button className="ui-btn ui-ghost ui-sm" onClick={() => { setM(member); setEdit(false); }}>취소</button>
              <button className="ui-btn ui-primary ui-sm" onClick={save} disabled={pending}><Check size={16} /> {pending ? "저장 중…" : "저장"}</button>
            </div>
          ) : <button className="ui-btn ui-soft ui-sm" onClick={() => setEdit(true)}><Pencil size={16} /> 편집</button>}
        </div>

        <div className="drawer-body">
          <div className="dm-top">
            <PhotoCircle member={m} onChange={setPhoto} />
            <div className="dm-id">
              <h2 className="dm-name">{m.name}</h2>
              <div className="dm-badges">
                {m.grade && <Badge tone={GRADE_TONE[m.grade] || "gray"}>{m.grade}</Badge>}
                {m.status && <Badge tone={STATUS_TONE[m.status] || "gray"} dot>{m.status}</Badge>}
              </div>
              {m.phone && <a className="dm-phone" href={`tel:${m.phone}`}><Phone size={14} /> {m.phone}</a>}
            </div>
          </div>

          {!edit ? (
            <div className="dm-sections">
              <section className="dm-sec"><h3 className="dm-sec-t">기본</h3>
                <Field label="성별" value={m.gender} /><Field label="연락처" value={m.phone} mono /><Field label="배우자" value={m.spouse_name} /></section>
              <section className="dm-sec"><h3 className="dm-sec-t">직업</h3>
                <Field label="업종" value={m.industry} /><Field label="회사" value={m.company} /><Field label="직책" value={m.position} /></section>
              <section className="dm-sec"><h3 className="dm-sec-t">교육</h3>
                <Field label="비전스쿨" value={m.vision_school} /><Field label="리더십스쿨" value={m.leadership_school} /></section>
              <section className="dm-sec"><h3 className="dm-sec-t">차량</h3>
                <Field label="차종" value={m.car_model} /><Field label="차번호" value={m.car_number} mono /><Field label="주차등록" value={m.parking_registered ? "등록" : "미등록"} /></section>
              <section className="dm-sec"><h3 className="dm-sec-t">가입</h3><Field label="가입일" value={m.joined_on} mono /></section>
              <section className="dm-sec"><h3 className="dm-sec-t">태그</h3>
                <div className="dm-tags">{(m.tags || []).length ? (m.tags || []).map((t) => <span key={t} className="chip">{t}</span>) : <span className="fld-empty">—</span>}</div></section>
            </div>
          ) : (
            <div className="dm-sections">
              <section className="dm-sec"><h3 className="dm-sec-t">기본</h3>
                <EditSelect label="등급" value={m.grade || ""} options={GRADES} onChange={(v) => set("grade", v)} />
                <EditSelect label="상태" value={m.status || ""} options={STATUSES} onChange={(v) => set("status", v)} />
                <EditSelect label="성별" value={m.gender || ""} options={["남", "여"]} onChange={(v) => set("gender", v)} />
                <EditText label="연락처" value={m.phone || ""} onChange={(v) => set("phone", v)} />
                <EditText label="배우자" value={m.spouse_name || ""} onChange={(v) => set("spouse_name", v)} /></section>
              <section className="dm-sec"><h3 className="dm-sec-t">직업</h3>
                <EditText label="업종" value={m.industry || ""} onChange={(v) => set("industry", v)} />
                <EditText label="회사" value={m.company || ""} onChange={(v) => set("company", v)} />
                <EditText label="직책" value={m.position || ""} onChange={(v) => set("position", v)} /></section>
              <section className="dm-sec"><h3 className="dm-sec-t">교육</h3>
                <EditText label="비전스쿨" value={m.vision_school || ""} onChange={(v) => set("vision_school", v)} />
                <EditText label="리더십스쿨" value={m.leadership_school || ""} onChange={(v) => set("leadership_school", v)} /></section>
              <section className="dm-sec"><h3 className="dm-sec-t">차량</h3>
                <EditText label="차종" value={m.car_model || ""} onChange={(v) => set("car_model", v)} />
                <EditText label="차번호" value={m.car_number || ""} onChange={(v) => set("car_number", v)} />
                <label className="fld-edit toggle-row"><span className="fld-label">주차등록</span>
                  <button className={`switch ${m.parking_registered ? "on" : ""}`} onClick={() => set("parking_registered", !m.parking_registered)} type="button"><span className="switch-knob" /></button>
                </label></section>
              <section className="dm-sec"><h3 className="dm-sec-t">태그 (직책·이력)</h3>
                <div className="tag-presets">
                  {PRESET_TAGS.map((t) => <button key={t} type="button" className={`tag-chip ${(m.tags ?? []).includes(t) ? "on" : ""}`} onClick={() => toggleTag(t)}>{t}</button>)}
                </div>
                {(m.tags ?? []).length > 0 && (
                  <div className="tag-selected">
                    {(m.tags ?? []).map((t) => <span key={t} className="tag-on">{t}<button type="button" onClick={() => toggleTag(t)} aria-label="제거"><X size={12} /></button></span>)}
                  </div>
                )}
                <div className="tag-add">
                  <input className="inp" value={newTag} onChange={(e) => setNewTag(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }} placeholder="직접 추가 (예: 청년부)" />
                  <button type="button" className="ui-btn ui-soft ui-sm" onClick={addTag}>추가</button>
                </div>
              </section>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

const MEM_CSS = `
.moim-mem{
  --brand:#0066cc; --brand-strong:#0052a8; --brand-soft:#e8f1fc; --brand-softer:#f3f8fe;
  --ink:#16181d; --ink-2:#3d424d; --ink-3:#767d8a; --line:#ecedf0; --bg:#ffffff; --bg-warm:#fafafb;
  --green:#0a7d3f; --green-soft:#e4f6ec;
  --radius-btn:14px; --radius-card:20px;
  --shadow-sm:0 1px 2px rgba(20,24,34,.04), 0 3px 12px rgba(20,24,34,.045);
  --shadow-md:0 2px 6px rgba(20,24,34,.05), 0 14px 38px rgba(20,40,80,.08);
  color:var(--ink); line-height:1.5; letter-spacing:-0.01em;
}
.moim-mem *{ box-sizing:border-box; }
.moim-mem h1,.moim-mem h2,.moim-mem h3,.moim-mem p{ margin:0; }
.moim-mem .avatar{ display:inline-grid; place-items:center; border-radius:50%; color:#fff; font-weight:700; flex-shrink:0; }
.moim-mem .avatar-photo{ overflow:hidden; background:#eef0f3; }
.moim-mem .avatar-photo img{ width:100%; height:100%; object-fit:cover; border-radius:50%; display:block; }
.moim-mem .photo-circle{ position:relative; flex-shrink:0; }
.moim-mem .photo-btn{ position:relative; display:block; padding:0; border:0; background:none; cursor:pointer; border-radius:50%; }
.moim-mem .photo-btn:disabled{ opacity:.7; cursor:default; }
.moim-mem .photo-cam{ position:absolute; right:-2px; bottom:-2px; width:24px; height:24px; border-radius:50%; background:var(--brand); color:#fff; display:grid; place-items:center; border:2px solid #fff; font-size:12px; }
.moim-mem .photo-clear{ position:absolute; top:-4px; right:-4px; width:22px; height:22px; border-radius:50%; background:#16181d; color:#fff; display:grid; place-items:center; border:2px solid #fff; cursor:pointer; }
.moim-mem .badge{ display:inline-flex; align-items:center; gap:5px; font-size:12px; font-weight:700; letter-spacing:-0.02em; padding:4px 10px; border-radius:999px; white-space:nowrap; }
.moim-mem .badge-dot{ width:6px; height:6px; border-radius:50%; background:currentColor; }
.moim-mem .b-brand{ background:var(--brand-soft); color:var(--brand-strong); }
.moim-mem .b-blue{ background:#eaf2fd; color:#0b62c4; }
.moim-mem .b-green{ background:var(--green-soft); color:var(--green); }
.moim-mem .b-warm{ background:#fcefe7; color:#b5562a; }
.moim-mem .b-gray{ background:#eff0f2; color:#6b717c; }
.moim-mem .b-purple{ background:#efeafe; color:#6b46d9; }

.moim-mem .card{ background:var(--bg); border:1px solid var(--line); border-radius:var(--radius-card); box-shadow:var(--shadow-sm); }
.moim-mem .ui-btn{ display:inline-flex; align-items:center; justify-content:center; gap:7px; font-weight:600; letter-spacing:-0.02em; border-radius:var(--radius-btn); border:0; cursor:pointer; text-decoration:none; transition:background .15s, box-shadow .15s, transform .12s; white-space:nowrap; }
.moim-mem .ui-btn:active{ transform:translateY(1px) scale(.99); }
.moim-mem .ui-btn:disabled{ opacity:.6; cursor:default; }
.moim-mem .ui-sm{ font-size:13px; padding:8px 13px; }
.moim-mem .ui-primary{ background:var(--brand); color:#fff; box-shadow:0 5px 14px rgba(0,102,204,.22); }
.moim-mem .ui-soft{ background:var(--brand-soft); color:var(--brand-strong); }
.moim-mem .ui-ghost{ background:#fff; color:var(--ink-2); border:1px solid var(--line); }
.moim-mem .ui-ghost:hover{ background:#f7f8f9; }

.moim-mem .page-head{ display:flex; align-items:flex-end; justify-content:space-between; gap:14px; margin-bottom:20px; flex-wrap:wrap; }
.moim-mem .page-title{ font-size:clamp(21px,5vw,26px); font-weight:800; letter-spacing:-0.04em; }
.moim-mem .page-sub{ color:var(--ink-3); font-size:14px; margin-top:5px; font-weight:500; }
.moim-mem .page-acts{ display:flex; gap:8px; }

.moim-mem .stat-grid{ display:grid; grid-template-columns:repeat(2,1fr); gap:12px; }
.moim-mem .stat-grid.mb{ margin-bottom:20px; }
.moim-mem .stat{ padding:16px; display:flex; gap:13px; align-items:flex-start; min-width:0; }
.moim-mem .stat-ic{ width:40px; height:40px; border-radius:12px; display:grid; place-items:center; flex-shrink:0; }
.moim-mem .stat-ic.t-brand{ background:var(--brand-soft); color:var(--brand); }
.moim-mem .stat-ic.t-green{ background:var(--green-soft); color:var(--green); }
.moim-mem .stat-ic.t-blue{ background:#eaf2fd; color:#0b62c4; }
.moim-mem .stat-ic.t-warm{ background:#fcefe7; color:#b5562a; }
.moim-mem .stat-label{ font-size:12.5px; color:var(--ink-3); font-weight:600; }
.moim-mem .stat-value{ font-size:20px; font-weight:800; letter-spacing:-0.03em; margin-top:3px; }

.moim-mem .filters{ display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap; }
.moim-mem .filter-left,.moim-mem .filter-right{ display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
.moim-mem .dd{ position:relative; }
.moim-mem .dd-btn{ display:inline-flex; align-items:center; gap:6px; font-size:13.5px; font-weight:600; color:var(--ink-2); background:#fff; border:1px solid var(--line); border-radius:11px; padding:9px 12px; cursor:pointer; transition:border-color .15s, background .15s; }
.moim-mem .dd-btn:hover{ background:#f7f8f9; }
.moim-mem .dd-btn.active{ color:var(--brand-strong); border-color:#bcd6f5; background:var(--brand-softer); }
.moim-mem .dd-menu{ position:absolute; top:calc(100% + 6px); left:0; z-index:30; background:#fff; border:1px solid var(--line); border-radius:14px; box-shadow:var(--shadow-md); padding:6px; min-width:168px; max-height:320px; overflow-y:auto; }
.moim-mem .dd-menu-r{ left:auto; right:0; }
.moim-mem .dd-item{ display:flex; align-items:center; justify-content:space-between; gap:8px; width:100%; text-align:left; font-size:13.5px; font-weight:600; color:var(--ink-2); padding:9px 10px; border-radius:9px; background:none; border:0; cursor:pointer; transition:background .12s; }
.moim-mem .dd-item:hover{ background:var(--bg-warm); }
.moim-mem .dd-item.sel{ color:var(--brand-strong); background:var(--brand-softer); }
.moim-mem .chkbox{ width:17px; height:17px; border-radius:5px; border:1.5px solid #cfd3da; display:inline-grid; place-items:center; color:#fff; flex-shrink:0; }
.moim-mem .chkbox.on{ background:var(--brand); border-color:var(--brand); }
.moim-mem .search{ display:flex; align-items:center; gap:7px; background:#fff; border:1px solid var(--line); border-radius:11px; padding:8px 11px; color:var(--ink-3); min-width:200px; }
.moim-mem .search input{ border:0; outline:0; font-family:inherit; font-size:13.5px; color:var(--ink); background:none; flex:1; min-width:0; }
.moim-mem .search input::placeholder{ color:var(--ink-3); }
.moim-mem .search-x{ display:grid; place-items:center; color:var(--ink-3); background:none; border:0; cursor:pointer; }
.moim-mem .result-line{ font-size:12.5px; color:var(--ink-3); font-weight:600; margin:16px 2px 10px; }

.moim-mem .table-card{ display:none; overflow:hidden; }
.moim-mem .table-scroll{ overflow-x:auto; }
.moim-mem .mtable{ width:100%; border-collapse:collapse; font-size:13.5px; }
.moim-mem .mtable th{ text-align:left; font-weight:700; color:var(--ink-3); font-size:12.5px; padding:13px 14px; border-bottom:1px solid var(--line); white-space:nowrap; background:var(--bg-warm); position:sticky; top:0; }
.moim-mem .mtable td{ padding:11px 14px; border-bottom:1px solid var(--line); color:var(--ink-2); white-space:nowrap; vertical-align:middle; }
.moim-mem .mtable td.cell-clip{ max-width:200px; overflow:hidden; text-overflow:ellipsis; }
.moim-mem .mtable tbody tr{ cursor:pointer; transition:background .12s; }
.moim-mem .mtable tbody tr:hover{ background:var(--brand-softer); }
.moim-mem .mtable tbody tr:last-child td{ border-bottom:0; }
.moim-mem .th-name{ padding-left:18px !important; }
.moim-mem .td-name{ display:flex; align-items:center; gap:9px; padding-left:18px !important; font-weight:700; color:var(--ink); }
.moim-mem .reg-dot{ width:7px; height:7px; border-radius:50%; background:#d0a72a; }
.moim-mem .cell-tags{ display:flex; gap:4px; }
.moim-mem .chip{ display:inline-flex; align-items:center; font-size:12px; font-weight:600; color:var(--ink-2); background:var(--bg-warm); border:1px solid var(--line); padding:3px 9px; border-radius:8px; white-space:nowrap; }
.moim-mem .chip.sm{ font-size:11px; padding:2px 7px; }
.moim-mem .mono{ font-variant-numeric:tabular-nums; }
.moim-mem .nowrap{ white-space:nowrap; }
.moim-mem .empty{ padding:40px; text-align:center; color:var(--ink-3); font-size:14px; font-weight:500; }
.moim-mem .fld-empty{ color:#c2c7cf; }

.moim-mem .mcards{ display:flex; flex-direction:column; gap:10px; }
.moim-mem .mcard{ display:flex; align-items:center; gap:12px; background:#fff; border:1px solid var(--line); border-radius:16px; padding:14px; box-shadow:var(--shadow-sm); text-align:left; cursor:pointer; transition:transform .14s, box-shadow .14s; }
.moim-mem .mcard:hover{ transform:translateY(-2px); box-shadow:var(--shadow-md); }
.moim-mem .mcard-body{ flex:1; min-width:0; }
.moim-mem .mcard-top{ display:flex; align-items:center; gap:8px; }
.moim-mem .mcard-name{ font-weight:700; font-size:15.5px; }
.moim-mem .mcard-meta{ display:flex; align-items:center; gap:6px; font-size:12.5px; color:var(--ink-3); margin-top:3px; }
.moim-mem .mcard-meta span{ overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.moim-mem .dotsep{ color:#cdd1d8; }

.moim-mem .drawer-root{ position:fixed; inset:0; z-index:60; background:rgba(20,24,34,.34); backdrop-filter:blur(2px); display:flex; justify-content:flex-end; animation:mem-fade .18s ease; }
@keyframes mem-fade{ from{opacity:0} to{opacity:1} }
.moim-mem .drawer{ width:100%; max-width:460px; background:var(--bg); height:100%; overflow-y:auto; box-shadow:-10px 0 40px rgba(20,30,60,.18); animation:mem-slide .26s cubic-bezier(.2,.7,.2,1); display:flex; flex-direction:column; }
@keyframes mem-slide{ from{transform:translateX(30px);opacity:.6} to{transform:none;opacity:1} }
.moim-mem .drawer-head{ position:sticky; top:0; z-index:2; display:flex; align-items:center; justify-content:space-between; padding:12px 16px; background:rgba(255,255,255,.9); backdrop-filter:blur(10px); border-bottom:1px solid var(--line); }
.moim-mem .drawer-acts{ display:flex; gap:8px; }
.moim-mem .icon-btn{ width:36px; height:36px; border-radius:10px; display:grid; place-items:center; color:var(--ink-3); background:none; border:0; cursor:pointer; transition:background .15s, color .15s; }
.moim-mem .icon-btn:hover{ background:#f1f2f4; color:var(--ink); }
.moim-mem .drawer-body{ padding:22px 22px 40px; }
.moim-mem .dm-top{ display:flex; align-items:center; gap:15px; padding-bottom:22px; border-bottom:1px solid var(--line); margin-bottom:6px; }
.moim-mem .dm-name{ font-size:22px; font-weight:800; letter-spacing:-0.03em; }
.moim-mem .dm-badges{ display:flex; gap:6px; margin:7px 0; }
.moim-mem .dm-phone{ display:inline-flex; align-items:center; gap:5px; font-size:13.5px; color:var(--ink-2); font-weight:600; text-decoration:none; font-variant-numeric:tabular-nums; }
.moim-mem .dm-phone:hover{ color:var(--brand); }
.moim-mem .dm-sections{ display:flex; flex-direction:column; }
.moim-mem .dm-sec{ padding:18px 0; border-bottom:1px solid var(--line); }
.moim-mem .dm-sec:last-child{ border-bottom:0; }
.moim-mem .dm-sec-t{ font-size:12.5px; font-weight:800; color:var(--brand); letter-spacing:0.02em; margin-bottom:12px; }
.moim-mem .fld{ display:flex; align-items:baseline; gap:12px; padding:6px 0; }
.moim-mem .fld-label{ font-size:13.5px; color:var(--ink-3); font-weight:600; width:84px; flex-shrink:0; }
.moim-mem .fld-value{ font-size:14.5px; color:var(--ink); font-weight:600; }
.moim-mem .dm-tags{ display:flex; flex-wrap:wrap; gap:6px; }
.moim-mem .fld-edit{ display:flex; flex-direction:column; gap:6px; margin-bottom:12px; }
.moim-mem .fld-edit .fld-label{ width:auto; }
.moim-mem .inp{ font-family:inherit; font-size:14.5px; color:var(--ink); background:#fff; border:1px solid var(--line); border-radius:11px; padding:10px 12px; outline:0; transition:border-color .15s, box-shadow .15s; width:100%; }
.moim-mem .inp:focus{ border-color:var(--brand); box-shadow:0 0 0 3px var(--brand-soft); }
.moim-mem .sel-wrap{ position:relative; display:flex; align-items:center; }
.moim-mem .sel-wrap svg{ position:absolute; right:12px; color:var(--ink-3); pointer-events:none; }
.moim-mem .sel{ appearance:none; -webkit-appearance:none; padding-right:34px; cursor:pointer; }
.moim-mem .toggle-row{ flex-direction:row; align-items:center; justify-content:space-between; }
.moim-mem .switch{ width:46px; height:27px; border-radius:999px; background:#d7dae0; position:relative; transition:background .18s; flex-shrink:0; border:0; cursor:pointer; }
.moim-mem .switch.on{ background:var(--brand); }
.moim-mem .switch-knob{ position:absolute; top:3px; left:3px; width:21px; height:21px; border-radius:50%; background:#fff; box-shadow:0 1px 3px rgba(0,0,0,.2); transition:transform .18s; }
.moim-mem .switch.on .switch-knob{ transform:translateX(19px); }
.moim-mem .tag-presets{ display:flex; flex-wrap:wrap; gap:6px; }
.moim-mem .tag-chip{ font-size:12.5px; font-weight:600; color:var(--ink-2); background:#fff; border:1px solid var(--line); border-radius:999px; padding:6px 12px; cursor:pointer; transition:all .12s; }
.moim-mem .tag-chip:hover{ border-color:#bcd6f5; }
.moim-mem .tag-chip.on{ background:var(--brand); color:#fff; border-color:var(--brand); }
.moim-mem .tag-selected{ display:flex; flex-wrap:wrap; gap:6px; margin-top:10px; }
.moim-mem .tag-on{ display:inline-flex; align-items:center; gap:4px; font-size:12.5px; font-weight:700; color:var(--brand-strong); background:var(--brand-soft); border-radius:999px; padding:5px 6px 5px 11px; }
.moim-mem .tag-on button{ display:grid; place-items:center; width:16px; height:16px; border-radius:50%; background:rgba(0,82,168,.18); color:var(--brand-strong); border:0; cursor:pointer; }
.moim-mem .tag-add{ display:flex; gap:8px; margin-top:10px; }
.moim-mem .tag-add .inp{ flex:1; }

.moim-mem .toast{ position:fixed; bottom:26px; left:50%; transform:translateX(-50%); z-index:80; background:var(--ink); color:#fff; font-size:13.5px; font-weight:600; padding:12px 20px; border-radius:999px; box-shadow:0 10px 30px rgba(0,0,0,.25); }

@media (min-width:560px){ .moim-mem .stat-grid{ grid-template-columns:repeat(4,1fr); } }
@media (min-width:760px){ .moim-mem .table-card{ display:block; } .moim-mem .mcards{ display:none; } }
`;
