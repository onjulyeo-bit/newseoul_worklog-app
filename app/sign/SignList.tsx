"use client";

// 서명 요청 목록 — 탭: 진행중 / 완료 서류함 / 만료·취소. 완료 탭이 곧 '서명 완료 서류 보관함'(A안).
import { useState } from "react";
import Link from "next/link";
import { SIGN_CSS } from "./signCss";
import type { SignRequestRow } from "@/lib/signTypes";

export type ReqItem = SignRequestRow & { total: number; signed: number };

const fmt = (s: string | null) => { if (!s) return ""; const d = new Date(s); return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`; };

export default function SignList({ items, canEdit }: { items: ReqItem[]; canEdit: boolean }) {
  const active = items.filter((r) => r.status === "active" || r.status === "draft");
  const done = items.filter((r) => r.status === "completed");
  const etc = items.filter((r) => r.status === "expired" || r.status === "cancelled");
  const [tab, setTab] = useState<"active" | "done" | "etc">(active.length === 0 && done.length > 0 ? "done" : "active");
  const list = tab === "active" ? active : tab === "done" ? done : etc;

  return (
    <div className="moim-sign">
      <style>{SIGN_CSS}</style>
      <div className="page-head">
        <div><h1 className="page-title">서명</h1><p className="page-sub">문서를 올리고 링크로 서명을 받으세요. 완료된 서류는 서류함에 보관됩니다.</p></div>
        {canEdit && <Link href="/sign/new" className="ui-btn ui-primary ui-md">＋ 새 서명 요청</Link>}
      </div>

      <div className="tabs">
        <button className={`tab ${tab === "active" ? "on" : ""}`} onClick={() => setTab("active")}>진행중 <span className="tab-n">{active.length}</span></button>
        <button className={`tab ${tab === "done" ? "on" : ""}`} onClick={() => setTab("done")}>📁 완료 서류함 <span className="tab-n">{done.length}</span></button>
        <button className={`tab ${tab === "etc" ? "on" : ""}`} onClick={() => setTab("etc")}>만료·취소 <span className="tab-n">{etc.length}</span></button>
      </div>

      {list.length === 0 ? (
        <div className="card empty-card">
          {tab === "active" ? (canEdit ? <>진행중인 서명 요청이 없어요.<br /><Link href="/sign/new" className="lnk">새 서명 요청</Link>으로 문서를 올려 보세요.</> : "진행중인 서명 요청이 없어요.")
            : tab === "done" ? "아직 완료된 서류가 없어요. 전원 서명이 끝나면 여기에 보관됩니다." : "만료되거나 취소된 요청이 없어요."}
        </div>
      ) : (
        <ul className="req-list">
          {list.map((r) => {
            const pct = r.total ? Math.round((r.signed / r.total) * 100) : 0;
            const isDone = r.status === "completed";
            return (
              <li key={r.id}>
                <Link href={`/sign/${r.id}`} className="card req-card">
                  <div className={`req-ic ${isDone ? "done" : ""}`}>{isDone ? "✓" : "✍️"}</div>
                  <div className="req-body">
                    <div className="req-title">{r.title}</div>
                    <div className="req-meta">
                      <span>{fmt(r.created_at)} 생성</span>
                      {r.expires_at && <span>· {fmt(r.expires_at)} 까지</span>}
                      {isDone && <span>· {fmt(r.updated_at)} 완료</span>}
                      {r.status === "cancelled" && <span className="badge b-gray">취소</span>}
                      {r.status === "expired" && <span className="badge b-amber">만료</span>}
                    </div>
                  </div>
                  <div className="req-prog">
                    <span className="req-prog-n"><b>{r.signed}</b> / {r.total} 서명</span>
                    <span className={`bar ${isDone ? "done" : ""}`}><i style={{ width: `${pct}%` }} /></span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
