"use client";

// 모임 준비 체크리스트 — 공유 체크(운영진 함께), 매주 '초기화'. admin만 체크/추가/삭제.
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, RotateCcw, Plus, Trash2 } from "lucide-react";
import { toggleChecklistItem, resetChecklist, addChecklistItem, deleteChecklistItem } from "../actions";
import { MN_CSS } from "../manualCss";

export type ChecklistItem = { id: string; label: string; roles: string | null; when_label: string | null; note: string | null; checked: boolean };

export default function ManualChecklist({ items, canEdit }: { items: ChecklistItem[]; canEdit: boolean }) {
  const router = useRouter();
  const [, startT] = useTransition();
  const [busy, setBusy] = useState(false);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ label: "", roles: "", when_label: "", note: "" });
  const done = items.filter((i) => i.checked).length;

  const refresh = () => startT(() => router.refresh());

  async function toggle(it: ChecklistItem) {
    if (!canEdit) return;
    await toggleChecklistItem(it.id, !it.checked); refresh();
  }
  async function reset() {
    if (!confirm("모든 체크를 해제할까요? (다음 모임 준비용)")) return;
    setBusy(true); await resetChecklist(); setBusy(false); refresh();
  }
  async function add() {
    setBusy(true); const r = await addChecklistItem(form); setBusy(false);
    if (r.error) { alert(r.error); return; }
    setForm({ label: "", roles: "", when_label: "", note: "" }); setAdding(false); refresh();
  }
  async function del(it: ChecklistItem) {
    if (!confirm(`'${it.label}' 항목을 삭제할까요?`)) return;
    await deleteChecklistItem(it.id); refresh();
  }

  return (
    <div className="moim-mn"><style>{MN_CSS}</style>
      <div className="mn-bar">
        <Link href="/manual" className="mn-back"><ArrowLeft size={16} /> 운영 매뉴얼</Link>
        {canEdit && <button className="ui-btn ui-ghost" onClick={reset} disabled={busy}><RotateCcw size={15} /> 초기화</button>}
      </div>

      <article className="mn-doc">
        <div className="mn-head" style={{ marginBottom: 14, paddingBottom: 14 }}>
          <div><div className="mn-head-t">모임 준비 체크리스트</div><div className="mn-head-d">요일·역할별 준비 작업. 함께 체크하고 매주 초기화하세요.</div></div>
        </div>
        <div className="ck-tools">
          <span className="ck-prog">완료 <b>{done}</b> / {items.length}</span>
          {canEdit && !adding && <button className="ui-btn ui-ghost" onClick={() => setAdding(true)}><Plus size={15} /> 항목 추가</button>}
        </div>

        <div className="ck-list">
          {items.map((it) => (
            <div key={it.id} className={`ck-row ${it.checked ? "done" : ""}`}>
              <button className={`ck-box ${it.checked ? "on" : ""}`} onClick={() => toggle(it)} disabled={!canEdit} aria-label="체크">
                {it.checked && <Check size={15} strokeWidth={3} />}
              </button>
              <div className="ck-body">
                <div className="ck-label">{it.label}</div>
                {(it.roles || it.when_label) && (
                  <div className="ck-tags">
                    {it.roles?.split(",").map((r) => r.trim()).filter(Boolean).map((r) => <span key={r} className="ck-role">{r}</span>)}
                    {it.when_label && <span className="ck-when">{it.when_label}</span>}
                  </div>
                )}
                {it.note && <div className="ck-note">{it.note}</div>}
              </div>
              {canEdit && <button className="ck-del" onClick={() => del(it)} aria-label="삭제"><Trash2 size={15} /></button>}
            </div>
          ))}
        </div>

        {canEdit && adding && (
          <div className="ck-add">
            <input className="ck-inp" placeholder="작업 이름" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
            <input className="ck-inp" placeholder="역할 (간사,총무)" value={form.roles} onChange={(e) => setForm({ ...form, roles: e.target.value })} />
            <input className="ck-inp" placeholder="시기 (금요일)" value={form.when_label} onChange={(e) => setForm({ ...form, when_label: e.target.value })} />
            <div style={{ display: "flex", gap: 6 }}>
              <button className="ui-btn ui-ghost" onClick={() => { setAdding(false); }}>취소</button>
              <button className="ui-btn ui-primary" onClick={add} disabled={busy}>추가</button>
            </div>
          </div>
        )}
        {!canEdit && <p className="mn-hint" style={{ marginTop: 14 }}>읽기 권한이라 체크는 운영진(admin)만 가능합니다.</p>}
      </article>
    </div>
  );
}
