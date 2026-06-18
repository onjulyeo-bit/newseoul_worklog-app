"use client";

// 회원 명단(제한) 표시 — 이름·연락처·회사·이메일·직위·업종. 검색 + 전화·메일. 고령 배려로 큼직하게.
import { useMemo, useState } from "react";
import { Search, Phone, Mail } from "lucide-react";

export type DirEntry = { id: string; name: string | null; phone: string | null; company: string | null; email: string | null; position: string | null; industry: string | null };

const AV = ["#0066cc", "#16a34a", "#7c5cff", "#e8643c", "#0d9488", "#d4a017"];

export default function DirectoryView({ entries }: { entries: DirEntry[] }) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const k = q.trim().toLowerCase();
    if (!k) return entries;
    return entries.filter((e) =>
      [e.name, e.company, e.phone, e.email, e.position, e.industry].some((v) => (v ?? "").toLowerCase().includes(k)),
    );
  }, [entries, q]);

  return (
    <div className="moim-dir">
      <style>{CSS}</style>
      <div className="page-head">
        <h1 className="page-title">회원 명단</h1>
        <p className="page-sub">새서울 CBMC 회원 {entries.length}명 · 이름·연락처·회사·이메일·직위·업종</p>
      </div>

      <div className="search">
        <Search size={18} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="이름·회사·연락처 검색" />
      </div>

      {filtered.length === 0 ? (
        <div className="empty">{q ? "검색 결과가 없어요." : "아직 명단이 없어요."}</div>
      ) : (
        <div className="list">
          {filtered.map((e) => {
            const initial = (e.name ?? "?").charAt(0);
            const color = AV[(e.name?.charCodeAt(0) ?? 0) % AV.length];
            return (
              <div key={e.id} className="row">
                <span className="av" style={{ background: color }}>{initial}</span>
                <div className="who">
                  <span className="nm">{e.name ?? "(이름 없음)"}{e.position && <span className="pos"> · {e.position}</span>}</span>
                  {(e.company || e.industry) && <span className="co">{[e.company, e.industry].filter(Boolean).join(" · ")}</span>}
                  {e.email && <span className="em">{e.email}</span>}
                </div>
                <div className="acts">
                  {e.phone && (
                    <a className="call" href={`tel:${e.phone.replace(/[^0-9+]/g, "")}`}>
                      <Phone size={16} /><span>{e.phone}</span>
                    </a>
                  )}
                  {e.email && (
                    <a className="mail" href={`mailto:${e.email}`} aria-label="메일 보내기">
                      <Mail size={16} />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const CSS = `
.moim-dir{
  --brand:#0066cc; --brand-strong:#0052a8; --brand-soft:#e8f1fc;
  --ink:#16181d; --ink-2:#3d424d; --ink-3:#767d8a; --line:#ecedf0; --bg:#ffffff; --bg-warm:#fafafb;
  --radius-card:20px; --shadow-sm:0 1px 2px rgba(20,24,34,.04), 0 3px 12px rgba(20,24,34,.045);
  color:var(--ink); line-height:1.5; letter-spacing:-0.01em;
}
.moim-dir *{ box-sizing:border-box; }
.moim-dir h1,.moim-dir p{ margin:0; }
.moim-dir .page-head{ margin-bottom:16px; }
.moim-dir .page-title{ font-size:clamp(21px,5vw,26px); font-weight:800; letter-spacing:-0.04em; }
.moim-dir .page-sub{ color:var(--ink-3); font-size:14px; margin-top:5px; font-weight:500; }
.moim-dir .search{ display:flex; align-items:center; gap:9px; background:var(--bg); border:1px solid var(--line); border-radius:14px; padding:0 14px; margin-bottom:16px; box-shadow:var(--shadow-sm); color:var(--ink-3); max-width:520px; }
.moim-dir .search input{ flex:1; border:0; outline:none; background:none; padding:13px 0; font-size:16px; color:var(--ink); }
.moim-dir .list{ display:flex; flex-direction:column; gap:10px; }
.moim-dir .row{ display:flex; align-items:center; gap:13px; background:var(--bg); border:1px solid var(--line); border-radius:16px; padding:14px 16px; box-shadow:var(--shadow-sm); flex-wrap:wrap; }
.moim-dir .av{ width:42px; height:42px; border-radius:50%; display:grid; place-items:center; color:#fff; font-weight:700; font-size:17px; flex-shrink:0; }
.moim-dir .who{ flex:1; min-width:120px; display:flex; flex-direction:column; gap:2px; }
.moim-dir .nm{ font-weight:700; font-size:17px; }
.moim-dir .pos{ font-size:14px; color:var(--ink-3); font-weight:600; }
.moim-dir .co{ font-size:14px; color:var(--ink-3); font-weight:500; }
.moim-dir .em{ font-size:13px; color:var(--ink-3); font-weight:500; word-break:break-all; }
.moim-dir .acts{ display:flex; align-items:center; gap:8px; flex-shrink:0; }
.moim-dir .call{ display:inline-flex; align-items:center; gap:7px; background:var(--brand-soft); color:var(--brand-strong); font-weight:700; font-size:15px; padding:10px 16px; border-radius:999px; text-decoration:none; white-space:nowrap; }
.moim-dir .call:hover{ background:#dbeafe; }
.moim-dir .mail{ display:inline-grid; place-items:center; width:42px; height:42px; background:var(--bg-warm); color:var(--ink-2); border:1px solid var(--line); border-radius:999px; text-decoration:none; }
.moim-dir .mail:hover{ background:#eef2f7; }
.moim-dir .empty{ padding:48px; text-align:center; color:var(--ink-3); font-size:15px; font-weight:500; background:var(--bg); border:1px solid var(--line); border-radius:16px; }
`;
