// 지회 운영 허브·보관 서류 공용 CSS — .moim-ops 스코프 (매뉴얼 허브 카드 스타일 이식 + 서류 목록/칩/폼).
export const OPS_CSS = `
.moim-ops{
  --brand:#003ecc; --brand-strong:#0032a8; --brand-soft:#e8f1fc; --navy:#1e2353;
  --ink:#16181d; --ink-2:#3d424d; --ink-3:#767d8a; --line:#ecedf0; --bg:#fff;
  --shadow-sm:0 1px 2px rgba(20,24,34,.04), 0 4px 14px rgba(20,24,34,.05);
  color:var(--ink); line-height:1.6; letter-spacing:-0.01em;
}
.moim-ops *{ box-sizing:border-box; }
.moim-ops h1,.moim-ops h2,.moim-ops h3,.moim-ops p,.moim-ops ul,.moim-ops ol{ margin:0; }

.moim-ops .page-head{ display:flex; align-items:flex-end; justify-content:space-between; gap:14px; margin-bottom:6px; flex-wrap:wrap; }
.moim-ops .page-title{ font-size:clamp(21px,5vw,26px); font-weight:800; letter-spacing:-0.04em; }
.moim-ops .page-sub{ color:var(--ink-3); font-size:14px; margin-top:5px; font-weight:500; }
.moim-ops .back{ display:inline-flex; align-items:center; gap:5px; font-size:13.5px; font-weight:600; color:var(--ink-3); text-decoration:none; margin-bottom:10px; }
.moim-ops .back:hover{ color:var(--brand); }

/* 허브 섹션 */
.moim-ops .ops-sec{ margin-top:26px; }
.moim-ops .ops-sec-t{ display:flex; align-items:center; gap:8px; font-size:13px; font-weight:800; letter-spacing:.02em; color:var(--ink-3); text-transform:uppercase; }
.moim-ops .ops-sec-t::after{ content:""; flex:1; height:1px; background:var(--line); }
.moim-ops .mn-grid{ display:grid; grid-template-columns:repeat(2,1fr); gap:14px; margin-top:12px; }
@media (max-width:559px){ .moim-ops .mn-grid{ grid-template-columns:1fr; } }
.moim-ops .mn-card{ display:flex; align-items:flex-start; gap:14px; background:var(--bg); border:1px solid var(--line); border-radius:18px; padding:18px; box-shadow:var(--shadow-sm); text-decoration:none; color:inherit; transition:transform .14s, box-shadow .14s, border-color .14s; }
.moim-ops .mn-card:hover{ transform:translateY(-2px); box-shadow:0 2px 6px rgba(20,24,34,.05),0 14px 38px rgba(20,40,80,.08); border-color:#dde7f3; }
.moim-ops .mn-ic{ flex:none; width:46px; height:46px; border-radius:13px; background:var(--brand-soft); color:var(--brand); display:grid; place-items:center; }
.moim-ops .mn-ic.amber{ background:#fef3e7; color:#b06a18; }
.moim-ops .mn-card-b{ min-width:0; }
.moim-ops .mn-card-t{ font-size:16.5px; font-weight:800; letter-spacing:-0.03em; }
.moim-ops .mn-card-d{ font-size:13.5px; color:var(--ink-3); margin-top:4px; font-weight:500; }
.moim-ops .mn-card-meta{ font-size:12px; color:var(--ink-3); margin-top:8px; }
.moim-ops .mn-card-meta b{ color:var(--brand); font-weight:800; }

/* 버튼·폼 */
.moim-ops .ui-btn{ display:inline-flex; align-items:center; justify-content:center; gap:6px; font-weight:600; border-radius:12px; border:0; cursor:pointer; font-size:13.5px; padding:9px 14px; transition:background .15s; text-decoration:none; white-space:nowrap; }
.moim-ops .ui-sm{ font-size:12.5px; padding:6px 10px; border-radius:9px; }
.moim-ops .ui-primary{ background:var(--brand); color:#fff; box-shadow:0 5px 14px rgba(0,62,204,.2); }
.moim-ops .ui-primary:hover{ background:var(--brand-strong); }
.moim-ops .ui-primary:disabled{ opacity:.6; cursor:default; box-shadow:none; }
.moim-ops .ui-ghost{ background:#fff; color:var(--ink-2); border:1px solid var(--line); }
.moim-ops .ui-ghost:hover{ background:#f7f8f9; }
.moim-ops .ui-danger{ background:#fff; color:#c0392b; border:1px solid #f3c6c0; }
.moim-ops .ui-danger:hover{ background:#fdecea; }
.moim-ops .fld{ display:flex; flex-direction:column; gap:6px; margin-bottom:14px; }
.moim-ops .flabel{ font-size:13px; font-weight:700; color:var(--ink-2); }
.moim-ops .fhint{ font-size:12px; color:var(--ink-3); }
.moim-ops .inp{ font-family:inherit; font-size:14.5px; color:var(--ink); background:#fff; border:1px solid var(--line); border-radius:11px; padding:10px 12px; outline:0; width:100%; transition:border-color .15s, box-shadow .15s; }
.moim-ops .inp:focus{ border-color:var(--brand); box-shadow:0 0 0 3px var(--brand-soft); }
.moim-ops textarea.inp{ resize:vertical; line-height:1.55; }
.moim-ops .form-card{ background:var(--bg); border:1px solid var(--line); border-radius:18px; padding:20px; box-shadow:var(--shadow-sm); margin-top:16px; }
.moim-ops .form-row{ display:grid; grid-template-columns:1fr 1fr; gap:0 14px; }
@media (max-width:559px){ .moim-ops .form-row{ grid-template-columns:1fr; } }
.moim-ops .form-foot{ display:flex; justify-content:flex-end; gap:8px; margin-top:4px; }
.moim-ops .err-box{ background:#fdecea; color:#a93226; border:1px solid #f3c6c0; border-radius:12px; padding:10px 14px; font-size:13.5px; font-weight:600; margin:12px 0; }
.moim-ops .note-box{ background:#fff8e6; color:#8a5a12; border:1px solid #f4dfa8; border-radius:12px; padding:12px 16px; font-size:13.5px; font-weight:600; margin:14px 0; line-height:1.6; }
.moim-ops .note-box code{ font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:12.5px; background:#fff; padding:1px 6px; border-radius:6px; border:1px solid #f0dca6; }

/* 분류 칩 */
.moim-ops .chips{ display:flex; flex-wrap:wrap; gap:8px; margin:18px 0 14px; }
.moim-ops .chip{ font-size:13px; font-weight:700; padding:7px 13px; border-radius:999px; border:1px solid var(--line); background:#fff; color:var(--ink-2); cursor:pointer; transition:background .12s,border-color .12s,color .12s; }
.moim-ops .chip:hover{ background:#f7f8f9; }
.moim-ops .chip.on{ background:var(--brand); border-color:var(--brand); color:#fff; }
.moim-ops .chip-n{ opacity:.7; font-weight:600; margin-left:4px; }

/* 서류 목록 */
.moim-ops .doc-list{ list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:10px; }
.moim-ops .doc-card{ display:flex; align-items:flex-start; gap:14px; background:var(--bg); border:1px solid var(--line); border-radius:16px; padding:16px 18px; box-shadow:var(--shadow-sm); }
.moim-ops .doc-ic{ flex:none; width:42px; height:42px; border-radius:12px; display:grid; place-items:center; font-size:18px; background:var(--brand-soft); color:var(--brand); }
.moim-ops .doc-ic.sign{ background:#e6f7ee; color:#1b8a4c; }
.moim-ops .doc-body{ flex:1; min-width:0; }
.moim-ops .doc-title{ font-size:15.5px; font-weight:800; letter-spacing:-0.02em; word-break:keep-all; }
.moim-ops .doc-meta{ display:flex; flex-wrap:wrap; gap:4px 8px; font-size:12.5px; color:var(--ink-3); margin-top:4px; font-weight:500; align-items:center; }
.moim-ops .doc-note{ font-size:13px; color:var(--ink-2); margin-top:6px; }
.moim-ops .doc-acts{ display:flex; flex-wrap:wrap; gap:6px; margin-top:10px; }
.moim-ops .badge{ display:inline-flex; align-items:center; font-size:11.5px; font-weight:800; padding:2px 8px; border-radius:999px; letter-spacing:-0.01em; }
.moim-ops .b-green{ background:#e6f7ee; color:#1b8a4c; }
.moim-ops .b-brand{ background:var(--brand-soft); color:var(--brand-strong); }
.moim-ops .b-gray{ background:#f1f2f4; color:#6b717c; }
.moim-ops .empty{ padding:40px 20px; text-align:center; color:var(--ink-3); font-size:14px; border:1px solid var(--line); border-radius:18px; background:#fff; line-height:1.7; }
.moim-ops .lnk{ color:var(--brand); font-weight:700; text-decoration:none; }
.moim-ops .lnk:hover{ text-decoration:underline; }
.moim-ops .toast{ position:fixed; bottom:26px; left:50%; transform:translateX(-50%); z-index:80; background:var(--ink); color:#fff; font-size:13.5px; font-weight:600; padding:12px 20px; border-radius:999px; box-shadow:0 10px 30px rgba(0,0,0,.25); }
`;
