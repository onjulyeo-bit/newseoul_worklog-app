"use client";

// 강사·간사 풀 — 필터(강사/간사·내부/외부) + 추가/삭제. 운영진 전용(서버 게이트).
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Phone, Trash2, GraduationCap } from "lucide-react";
import { addInstructor, deleteInstructor } from "./actions";

export type Instructor = { id: string; name: string; kind: string | null; is_external: boolean; org: string | null; phone: string | null; field: string | null; fee_note: string | null; note: string | null };

const won = (s: string) => s;

export default function InstructorsBoard({ rows, canEdit = true }: { rows: Instructor[]; canEdit?: boolean }) {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [fKind, setFKind] = useState("");
  const [fExt, setFExt] = useState("");
  const [, startT] = useTransition();
  const [form, setForm] = useState({ name: "", kind: "강사", is_external: true, org: "", phone: "", field: "", fee_note: "", note: "" });
  const set = (k: keyof typeof form, v: string | boolean) => setForm((s) => ({ ...s, [k]: v }));

  const list = useMemo(() => rows.filter((r) =>
    (!fKind || r.kind === fKind) && (!fExt || (fExt === "외부" ? r.is_external : !r.is_external))
  ), [rows, fKind, fExt]);
  const nLect = rows.filter((r) => r.kind === "강사").length;
  const nStaff = rows.filter((r) => r.kind === "간사").length;

  async function onAdd() {
    if (!form.name.trim()) { setMsg("이름을 입력해 주세요."); return; }
    setBusy(true); setMsg("");
    const r = await addInstructor({ ...form, name: form.name.trim() });
    setBusy(false);
    if (r.error) { setMsg("❌ " + r.error); return; }
    setForm({ name: "", kind: "강사", is_external: true, org: "", phone: "", field: "", fee_note: "", note: "" }); setShow(false);
    startT(() => router.refresh());
  }
  const onDelete = (i: Instructor) => { if (!confirm(`'${i.name}'을(를) 삭제할까요?`)) return; deleteInstructor(i.id).then(() => router.refresh()); };

  const inp = "min-h-[42px] w-full rounded-md border border-line bg-card px-3 text-[15px] outline-none focus:border-primary";
  const chip = (on: boolean) => `rounded-full px-3.5 py-1.5 text-[13px] font-semibold border ${on ? "bg-primary text-white border-primary" : "bg-card text-ink-soft border-line"}`;

  return (
    <div className="text-ink">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-[clamp(21px,5vw,26px)] font-extrabold tracking-tight">강사·간사</h1>
          <p className="mt-1 text-[14px] font-medium text-ink-soft">강사 {nLect}명 · 간사 {nStaff}명 · 회원과 분리된 풀(외부 포함)</p>
        </div>
        {canEdit && <button onClick={() => setShow((v) => !v)} className="inline-flex min-h-[42px] items-center gap-1.5 rounded-full bg-primary px-5 text-[15px] font-semibold text-white hover:bg-primary-pressed"><Plus size={17} /> 추가</button>}
      </div>

      {canEdit && show && (
        <div className="mb-5 rounded-xl border border-primary/40 bg-[rgba(0,102,204,.04)] p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div><label className="mb-1 block text-[13px] font-bold text-ink-soft">이름 *</label><input value={form.name} onChange={(e) => set("name", e.target.value)} className={inp} /></div>
            <div className="flex gap-2">
              <div className="flex-1"><label className="mb-1 block text-[13px] font-bold text-ink-soft">구분</label>
                <div className="flex gap-1.5">
                  {["강사", "간사"].map((k) => <button key={k} type="button" className={chip(form.kind === k)} onClick={() => set("kind", k)}>{k}</button>)}
                </div></div>
              <div><label className="mb-1 block text-[13px] font-bold text-ink-soft">소속</label>
                <div className="flex gap-1.5">
                  <button type="button" className={chip(!form.is_external)} onClick={() => set("is_external", false)}>내부</button>
                  <button type="button" className={chip(form.is_external)} onClick={() => set("is_external", true)}>외부</button>
                </div></div>
            </div>
            <div><label className="mb-1 block text-[13px] font-bold text-ink-soft">소속/직함</label><input value={form.org} onChange={(e) => set("org", e.target.value)} className={inp} placeholder="○○대 교수 / ○○회사 대표" /></div>
            <div><label className="mb-1 block text-[13px] font-bold text-ink-soft">연락처</label><input value={form.phone} onChange={(e) => set("phone", e.target.value)} className={inp} /></div>
            <div><label className="mb-1 block text-[13px] font-bold text-ink-soft">전문분야/주제</label><input value={form.field} onChange={(e) => set("field", e.target.value)} className={inp} /></div>
            <div><label className="mb-1 block text-[13px] font-bold text-ink-soft">강사비/급여 메모</label><input value={form.fee_note} onChange={(e) => set("fee_note", e.target.value)} className={inp} placeholder="예: 30만원/회" /></div>
            <div className="sm:col-span-2"><label className="mb-1 block text-[13px] font-bold text-ink-soft">비고</label><input value={form.note} onChange={(e) => set("note", e.target.value)} className={inp} /></div>
          </div>
          <div className="mt-3 flex items-center justify-end gap-3">
            {msg && <span className="text-[14px] font-semibold text-unpaid">{msg}</span>}
            <button onClick={() => { setShow(false); setMsg(""); }} className="rounded-full bg-[rgba(112,115,124,.08)] px-5 py-2.5 text-[15px] font-semibold text-ink-soft">취소</button>
            <button onClick={onAdd} disabled={busy} className="rounded-full bg-primary px-6 py-2.5 text-[15px] font-semibold text-white hover:bg-primary-pressed disabled:opacity-50">{busy ? "저장 중…" : "저장"}</button>
          </div>
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-[12.5px] font-bold text-ink-soft">구분</span>
        <button className={chip(!fKind)} onClick={() => setFKind("")}>전체</button>
        {["강사", "간사"].map((k) => <button key={k} className={chip(fKind === k)} onClick={() => setFKind(fKind === k ? "" : k)}>{k}</button>)}
        <span className="ml-3 mr-1 text-[12.5px] font-bold text-ink-soft">소속</span>
        <button className={chip(!fExt)} onClick={() => setFExt("")}>전체</button>
        {["내부", "외부"].map((k) => <button key={k} className={chip(fExt === k)} onClick={() => setFExt(fExt === k ? "" : k)}>{k}</button>)}
      </div>

      {list.length === 0 ? (
        <p className="rounded-xl border border-line bg-card px-4 py-12 text-center text-[15px] text-ink-soft">등록된 강사·간사가 없어요. 위 ‘추가’로 시작하세요.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((i) => (
            <div key={i.id} className="relative rounded-xl border border-line bg-card p-4">
              {canEdit && <button onClick={() => onDelete(i)} className="absolute right-3 top-3 text-muted hover:text-unpaid" aria-label="삭제"><Trash2 size={16} /></button>}
              <div className="mb-1.5 flex items-center gap-2 pr-6">
                <span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg bg-[rgba(0,102,204,.1)] text-primary"><GraduationCap size={17} /></span>
                <span className="text-[16px] font-bold">{i.name}</span>
                {i.kind && <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${i.kind === "강사" ? "bg-[rgba(0,102,204,.12)] text-primary" : "bg-[rgba(10,125,63,.12)] text-success"}`}>{i.kind}</span>}
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${i.is_external ? "bg-[rgba(192,57,43,.1)] text-unpaid" : "bg-surface-soft text-ink-soft"}`}>{i.is_external ? "외부" : "내부"}</span>
              </div>
              {i.org && <div className="text-[13.5px] text-ink-soft">{i.org}</div>}
              {i.field && <div className="mt-1 text-[13.5px] text-ink">📚 {i.field}</div>}
              {i.phone && <a href={`tel:${i.phone}`} className="mt-1 inline-flex items-center gap-1 text-[13.5px] font-semibold text-primary"><Phone size={13} /> {i.phone}</a>}
              {i.fee_note && <div className="mt-1 text-[13px] text-ink-soft">💰 {won(i.fee_note)}</div>}
              {i.note && <div className="mt-1 text-[13px] text-ink-soft">{i.note}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
