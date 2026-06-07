// 회계 공유 CSS — .moim-fin 스코프 (거래 가져오기·내역·보고서 공통).
export const FIN_CSS = `
.moim-fin{
  --brand:#0066cc; --brand-strong:#0052a8; --brand-soft:#e8f1fc; --brand-softer:#f3f8fe;
  --ink:#16181d; --ink-2:#3d424d; --ink-3:#767d8a; --line:#ecedf0; --bg:#ffffff; --bg-warm:#fafafb;
  --green:#0a7d3f; --green-soft:#e4f6ec; --warning:#c47d1a;
  --radius-btn:14px; --radius-card:20px;
  --shadow-sm:0 1px 2px rgba(20,24,34,.04), 0 3px 12px rgba(20,24,34,.045);
  --shadow-md:0 2px 6px rgba(20,24,34,.05), 0 14px 38px rgba(20,40,80,.08);
  color:var(--ink); line-height:1.5; letter-spacing:-0.01em;
}
.moim-fin *{ box-sizing:border-box; }
.moim-fin h1,.moim-fin h2,.moim-fin h3,.moim-fin p{ margin:0; }
.moim-fin .card{ background:var(--bg); border:1px solid var(--line); border-radius:var(--radius-card); box-shadow:var(--shadow-sm); }
.moim-fin .badge{ display:inline-flex; align-items:center; gap:5px; font-size:12px; font-weight:700; padding:4px 10px; border-radius:999px; white-space:nowrap; }
.moim-fin .badge-dot{ width:6px; height:6px; border-radius:50%; background:currentColor; }
.moim-fin .b-brand{ background:var(--brand-soft); color:var(--brand-strong); }
.moim-fin .b-blue{ background:#eaf2fd; color:#0b62c4; }
.moim-fin .b-green{ background:var(--green-soft); color:var(--green); }
.moim-fin .b-warm{ background:#fcefe7; color:#b5562a; }
.moim-fin .b-gray{ background:#eff0f2; color:#6b717c; }
.moim-fin .b-red{ background:#fdeceb; color:#c8392c; }
.moim-fin .ui-btn{ display:inline-flex; align-items:center; justify-content:center; gap:6px; font-weight:600; border-radius:var(--radius-btn); border:0; cursor:pointer; transition:background .15s; white-space:nowrap; }
.moim-fin .ui-btn:disabled{ opacity:.55; cursor:default; }
.moim-fin .ui-sm{ font-size:13px; padding:9px 14px; }
.moim-fin .ui-primary{ background:var(--brand); color:#fff; box-shadow:0 5px 14px rgba(0,102,204,.22); }
.moim-fin .ui-ghost{ background:#fff; color:var(--ink-2); border:1px solid var(--line); }
.moim-fin .ui-ghost:hover{ background:#f7f8f9; }
.moim-fin .page-head{ display:flex; align-items:flex-end; justify-content:space-between; gap:14px; margin-bottom:16px; flex-wrap:wrap; }
.moim-fin .page-title{ font-size:clamp(21px,5vw,26px); font-weight:800; letter-spacing:-0.04em; }
.moim-fin .page-sub{ color:var(--ink-3); font-size:14px; margin-top:5px; font-weight:500; }

.moim-fin .fin-subtabs{ display:flex; gap:4px; background:#fff; border:1px solid var(--line); border-radius:14px; padding:5px; margin-bottom:22px; width:fit-content; max-width:100%; overflow-x:auto; scrollbar-width:none; }
.moim-fin .fin-subtabs::-webkit-scrollbar{ display:none; }
.moim-fin .fin-subtab{ display:inline-flex; align-items:center; gap:6px; font-size:14px; font-weight:700; color:var(--ink-3); padding:9px 16px; border-radius:10px; white-space:nowrap; text-decoration:none; transition:background .15s, color .15s; }
.moim-fin .fin-subtab:hover{ color:var(--ink-2); }
.moim-fin .fin-subtab.active{ background:var(--brand); color:#fff; box-shadow:0 3px 10px rgba(0,102,204,.25); }

.moim-fin .scroll-card{ overflow-x:auto; }
.moim-fin .mtable{ width:100%; border-collapse:collapse; font-size:13.5px; }
.moim-fin .fin-table{ min-width:640px; }
.moim-fin .mtable th{ text-align:left; font-weight:700; color:var(--ink-3); font-size:12.5px; padding:12px 12px; border-bottom:1px solid var(--line); white-space:nowrap; background:var(--bg-warm); }
.moim-fin .mtable td{ padding:9px 12px; border-bottom:1px solid var(--line); color:var(--ink-2); vertical-align:middle; }
.moim-fin .mtable tbody tr:last-child td{ border-bottom:0; }
.moim-fin .th-name,.moim-fin .td-name{ padding-left:16px !important; }
.moim-fin .td-name{ white-space:nowrap; }
.moim-fin .mono{ font-variant-numeric:tabular-nums; }
.moim-fin .nowrap{ white-space:nowrap; }
.moim-fin .muted{ color:var(--ink-3); }
.moim-fin .amt{ font-weight:700; font-variant-numeric:tabular-nums; white-space:nowrap; }
.moim-fin .amt-in{ color:#0b62c4; } .moim-fin .amt-out{ color:#c8392c; }
.moim-fin .td-act{ text-align:right; white-space:nowrap; }
.moim-fin .mini-btn{ width:30px; height:30px; border-radius:8px; display:inline-grid; place-items:center; color:var(--ink-3); border:1px solid var(--line); background:#fff; margin-left:4px; cursor:pointer; }
.moim-fin .mini-btn:hover{ color:var(--brand); border-color:#bcd6f5; }
.moim-fin .row-edit td{ background:var(--brand-softer); }
.moim-fin .row-warn td{ background:#fdf3f2; }
.moim-fin .empty{ padding:40px; text-align:center; color:var(--ink-3); font-size:14px; font-weight:500; }

.moim-fin .inp{ font-family:inherit; font-size:14px; color:var(--ink); background:#fff; border:1px solid var(--line); border-radius:10px; padding:8px 11px; outline:0; }
.moim-fin .inp:focus{ border-color:var(--brand); box-shadow:0 0 0 3px var(--brand-soft); }
.moim-fin .inp-sm{ padding:6px 9px; font-size:13px; }
.moim-fin .cell-inp{ font-family:inherit; font-size:13px; color:var(--ink); background:transparent; border:1px solid transparent; border-radius:8px; padding:6px 8px; outline:0; width:100%; min-width:90px; }
.moim-fin .cell-inp:hover{ border-color:var(--line); }
.moim-fin .cell-inp:focus{ border-color:var(--brand); background:#fff; box-shadow:0 0 0 3px var(--brand-soft); }
.moim-fin .inline-sel{ position:relative; display:inline-flex; align-items:center; }
.moim-fin .prog-sel{ appearance:none; -webkit-appearance:none; font-family:inherit; font-size:13px; font-weight:700; color:var(--ink-2); background:var(--bg-warm); border:1px solid var(--line); border-radius:9px; padding:6px 26px 6px 11px; cursor:pointer; }
.moim-fin .prog-sel.warn{ border-color:var(--warning); color:var(--warning); }
.moim-fin .inline-sel svg{ position:absolute; right:8px; color:var(--ink-3); pointer-events:none; }
.moim-fin .chk{ width:18px; height:18px; accent-color:var(--green); }

.moim-fin .fin-filters{ display:flex; align-items:center; gap:10px; flex-wrap:wrap; margin-bottom:14px; }
.moim-fin .fil-l{ font-size:12px; font-weight:700; color:var(--ink-3); }
.moim-fin .seg{ display:flex; background:var(--bg-warm); border:1px solid var(--line); border-radius:10px; padding:2px; gap:2px; }
.moim-fin .seg-btn{ font-size:12.5px; font-weight:700; color:var(--ink-3); padding:6px 12px; border-radius:8px; border:0; background:none; cursor:pointer; }
.moim-fin .seg-btn.on{ background:#fff; color:var(--brand-strong); box-shadow:var(--shadow-sm); }
.moim-fin .month-sel{ appearance:none; -webkit-appearance:none; font-family:inherit; font-size:13px; font-weight:700; color:var(--ink-2); background:#fff; border:1px solid var(--line); border-radius:10px; padding:8px 12px; cursor:pointer; }
.moim-fin .fil-count{ font-size:12.5px; color:var(--ink-3); font-weight:600; margin-left:auto; }

.moim-fin .led-sum{ display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-bottom:18px; }
.moim-fin .ls-card{ background:#fff; border:1px solid var(--line); border-radius:16px; padding:16px; box-shadow:var(--shadow-sm); display:flex; flex-direction:column; gap:6px; min-width:0; }
.moim-fin .ls-l{ font-size:12.5px; color:var(--ink-3); font-weight:600; }
.moim-fin .ls-v{ font-size:17px; font-weight:800; letter-spacing:-0.03em; font-variant-numeric:tabular-nums; }
.moim-fin .ls-in .ls-v{ color:#0b62c4; } .moim-fin .ls-out .ls-v{ color:#c8392c; }
.moim-fin .ls-net{ background:var(--brand-softer); border-color:#cfe0f5; } .moim-fin .ls-net .ls-v{ color:var(--brand-strong); }

.moim-fin .imp{ display:flex; flex-direction:column; }
.moim-fin .dropzone{ border:2px dashed #d3dae3; border-radius:20px; background:#fff; padding:46px 24px; text-align:center; display:flex; flex-direction:column; align-items:center; }
.moim-fin .dz-ic{ width:60px; height:60px; border-radius:18px; background:var(--brand-soft); color:var(--brand); display:grid; place-items:center; margin-bottom:16px; }
.moim-fin .dz-t{ font-size:18px; font-weight:800; letter-spacing:-0.03em; }
.moim-fin .dz-s{ font-size:13.5px; color:var(--ink-3); margin-top:8px; line-height:1.6; font-weight:500; }
.moim-fin .dz-file{ cursor:pointer; }
.moim-fin .imp-hint{ display:flex; align-items:center; gap:6px; font-size:12.5px; color:var(--ink-3); margin-top:14px; font-weight:500; }
.moim-fin .imp-head{ display:flex; align-items:flex-start; justify-content:space-between; gap:12px; flex-wrap:wrap; margin-bottom:16px; }
.moim-fin .imp-title{ font-size:18px; font-weight:800; letter-spacing:-0.03em; }
.moim-fin .imp-sub{ font-size:13px; color:var(--ink-3); margin-top:4px; font-weight:500; max-width:54ch; }
.moim-fin .imp-acts{ display:flex; gap:8px; align-items:center; }
.moim-fin .imp-stats{ display:grid; grid-template-columns:repeat(2,1fr); gap:10px; margin-bottom:14px; }
.moim-fin .ist{ background:#fff; border:1px solid var(--line); border-radius:14px; padding:12px 14px; }
.moim-fin .ist-v{ font-size:17px; font-weight:800; letter-spacing:-0.03em; }
.moim-fin .ist-l{ font-size:11.5px; color:var(--ink-3); font-weight:700; margin-top:2px; }
.moim-fin .ist .in{ color:var(--green); } .moim-fin .ist .out{ color:#c8392c; } .moim-fin .ist .pre{ color:#0b62c4; } .moim-fin .ist .wr{ color:#c47d1a; }
.moim-fin .imp-summary{ display:flex; flex-wrap:wrap; gap:14px; margin-top:16px; padding:14px 16px; background:var(--bg-warm); border:1px solid var(--line); border-radius:14px; }
.moim-fin .imp-chip{ display:inline-flex; align-items:center; gap:6px; font-size:13px; font-weight:600; color:var(--ink-2); }
.moim-fin .saved-msg{ font-size:14px; font-weight:700; color:var(--green); }

@media (min-width:560px){ .moim-fin .imp-stats{ grid-template-columns:repeat(5,1fr); } }
`;
