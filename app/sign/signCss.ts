// 서명 모듈 관리자 화면 공용 CSS (.moim-sign 스코프). 목록·현황판·마법사가 함께 씀.
export const SIGN_CSS = `
.moim-sign{
  --brand:#003ecc; --brand-strong:#0032a8; --brand-soft:#e8f1fc; --brand-softer:#f3f8fe;
  --ink:#16181d; --ink-2:#3d424d; --ink-3:#767d8a; --line:#ecedf0; --bg:#ffffff; --bg-warm:#fafafb;
  --green:#0a7d3f; --green-soft:#e4f6ec; --amber:#b45309; --amber-soft:#fff4e0; --red:#c8392c; --red-soft:#fdecea;
  --radius-btn:14px; --radius-card:20px;
  --shadow-sm:0 1px 2px rgba(20,24,34,.04), 0 3px 12px rgba(20,24,34,.045);
  color:var(--ink); line-height:1.5; letter-spacing:-0.01em;
}
.moim-sign *{ box-sizing:border-box; }
.moim-sign h1,.moim-sign h2,.moim-sign h3,.moim-sign p,.moim-sign ul{ margin:0; padding:0; }
.moim-sign ul{ list-style:none; }
.moim-sign .card{ background:var(--bg); border:1px solid var(--line); border-radius:var(--radius-card); box-shadow:var(--shadow-sm); }
.moim-sign .lnk{ color:var(--brand); font-weight:700; text-decoration:none; }
.moim-sign .badge{ display:inline-flex; align-items:center; gap:5px; font-size:11.5px; font-weight:700; padding:4px 9px; border-radius:999px; white-space:nowrap; }
.moim-sign .b-brand{ background:var(--brand-soft); color:var(--brand-strong); }
.moim-sign .b-green{ background:var(--green-soft); color:var(--green); }
.moim-sign .b-amber{ background:var(--amber-soft); color:var(--amber); }
.moim-sign .b-gray{ background:#f1f2f4; color:var(--ink-3); }
.moim-sign .b-red{ background:var(--red-soft); color:var(--red); }
.moim-sign .ui-btn{ display:inline-flex; align-items:center; justify-content:center; gap:6px; font-weight:600; letter-spacing:-0.02em; border-radius:var(--radius-btn); border:0; cursor:pointer; text-decoration:none; transition:background .15s, box-shadow .15s, transform .12s; white-space:nowrap; font-family:inherit; }
.moim-sign .ui-btn:active{ transform:translateY(1px) scale(.99); }
.moim-sign .ui-btn:disabled{ opacity:.5; cursor:default; transform:none; }
.moim-sign .ui-sm{ font-size:13px; padding:8px 13px; }
.moim-sign .ui-md{ font-size:14.5px; padding:11px 18px; }
.moim-sign .ui-primary{ background:var(--brand); color:#fff; box-shadow:0 5px 14px rgba(0,102,204,.22); }
.moim-sign .ui-primary:hover{ background:var(--brand-strong); }
.moim-sign .ui-ghost{ background:#fff; color:var(--ink-2); border:1px solid var(--line); }
.moim-sign .ui-ghost:hover{ background:#f7f8f9; }
.moim-sign .ui-danger{ background:#fff; color:var(--red); border:1px solid #f0c5c0; }
.moim-sign .ui-danger:hover{ background:var(--red-soft); }
.moim-sign .inp{ font-family:inherit; font-size:14.5px; color:var(--ink); background:#fff; border:1px solid var(--line); border-radius:11px; padding:10px 12px; outline:0; width:100%; transition:border-color .15s, box-shadow .15s; }
.moim-sign .inp:focus{ border-color:var(--brand); box-shadow:0 0 0 3px var(--brand-soft); }
.moim-sign textarea.inp{ resize:vertical; line-height:1.55; }
.moim-sign .fld{ display:flex; flex-direction:column; gap:6px; margin-bottom:14px; }
.moim-sign .flabel{ font-size:12.5px; color:var(--ink-3); font-weight:700; }
.moim-sign .fhint{ font-size:12px; color:var(--ink-3); font-weight:500; }
.moim-sign .sec-row{ display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:12px; flex-wrap:wrap; }
.moim-sign .sec-title{ font-size:16px; font-weight:800; letter-spacing:-0.03em; }
.moim-sign .toast{ position:fixed; bottom:26px; left:50%; transform:translateX(-50%); z-index:80; background:var(--ink); color:#fff; font-size:13.5px; font-weight:600; padding:12px 20px; border-radius:999px; box-shadow:0 10px 30px rgba(0,0,0,.25); }

.moim-sign .page-head{ display:flex; align-items:flex-end; justify-content:space-between; gap:14px; margin-bottom:18px; flex-wrap:wrap; }
.moim-sign .page-title{ font-size:clamp(21px,5vw,26px); font-weight:800; letter-spacing:-0.04em; }
.moim-sign .page-sub{ color:var(--ink-3); font-size:14px; margin-top:5px; font-weight:500; }
.moim-sign .empty-card{ padding:40px 20px; text-align:center; color:var(--ink-3); font-size:15px; line-height:1.6; }

.moim-sign .tabs{ display:flex; gap:6px; background:var(--bg-warm); border:1px solid var(--line); border-radius:14px; padding:4px; width:fit-content; margin-bottom:16px; }
.moim-sign .tab{ font-size:13.5px; font-weight:700; color:var(--ink-3); padding:8px 14px; border-radius:10px; border:0; background:none; cursor:pointer; display:inline-flex; align-items:center; gap:6px; font-family:inherit; }
.moim-sign .tab.on{ background:#fff; color:var(--ink); box-shadow:var(--shadow-sm); }
.moim-sign .tab-n{ font-size:11.5px; background:#e9ebef; color:var(--ink-2); padding:1px 7px; border-radius:999px; }
.moim-sign .tab.on .tab-n{ background:var(--brand-soft); color:var(--brand-strong); }

.moim-sign .req-list{ display:flex; flex-direction:column; gap:12px; }
.moim-sign .req-card{ display:flex; align-items:center; gap:14px; padding:16px 18px; text-decoration:none; color:inherit; transition:border-color .15s; }
.moim-sign .req-card:hover{ border-color:#bcd6f5; }
.moim-sign .req-ic{ width:44px; height:44px; border-radius:13px; background:var(--brand-soft); color:var(--brand-strong); display:grid; place-items:center; flex-shrink:0; font-size:20px; }
.moim-sign .req-ic.done{ background:var(--green-soft); color:var(--green); }
.moim-sign .req-body{ flex:1; min-width:0; }
.moim-sign .req-title{ font-weight:800; font-size:15.5px; letter-spacing:-0.03em; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.moim-sign .req-meta{ font-size:12.5px; color:var(--ink-3); font-weight:500; margin-top:3px; display:flex; gap:8px; flex-wrap:wrap; }
.moim-sign .req-prog{ display:flex; flex-direction:column; align-items:flex-end; gap:5px; flex-shrink:0; }
.moim-sign .req-prog-n{ font-size:13px; font-weight:800; }
.moim-sign .req-prog-n b{ color:var(--brand); font-size:16px; }
.moim-sign .bar{ width:110px; height:6px; background:#eceef2; border-radius:999px; overflow:hidden; }
.moim-sign .bar i{ display:block; height:100%; background:var(--brand); border-radius:999px; transition:width .3s; }
.moim-sign .bar.done i{ background:var(--green); }

.moim-sign .st-head{ padding:20px; }
.moim-sign .st-title{ font-size:20px; font-weight:800; letter-spacing:-0.04em; }
.moim-sign .st-desc{ font-size:14px; color:var(--ink-2); margin-top:6px; white-space:pre-wrap; }
.moim-sign .st-meta{ display:flex; gap:12px; flex-wrap:wrap; margin-top:10px; font-size:12.5px; color:var(--ink-3); font-weight:600; }
.moim-sign .st-prog{ margin-top:14px; display:flex; align-items:center; gap:12px; }
.moim-sign .st-prog .bar{ flex:1; width:auto; height:8px; }
.moim-sign .st-prog-n{ font-size:14px; font-weight:800; white-space:nowrap; }
.moim-sign .st-actions{ display:flex; gap:8px; flex-wrap:wrap; margin-top:16px; }
.moim-sign .done-card{ padding:18px 20px; display:flex; align-items:center; gap:14px; background:var(--green-soft); border-color:#bfe6cd; }
.moim-sign .done-ic{ width:46px; height:46px; border-radius:50%; background:var(--green); color:#fff; display:grid; place-items:center; flex-shrink:0; font-size:20px; }
.moim-sign .done-t{ font-weight:800; font-size:15.5px; color:var(--green); letter-spacing:-0.03em; }
.moim-sign .done-s{ font-size:13px; color:var(--ink-2); font-weight:500; margin-top:2px; }

.moim-sign .signer-list{ display:flex; flex-direction:column; }
.moim-sign .signer-row{ display:flex; align-items:center; gap:12px; padding:13px 18px; border-bottom:1px solid var(--line); }
.moim-sign .signer-row:last-child{ border-bottom:0; }
.moim-sign .av{ width:36px; height:36px; border-radius:50%; display:grid; place-items:center; color:#fff; font-weight:700; font-size:15px; flex-shrink:0; }
.moim-sign .signer-who{ flex:1; min-width:0; display:flex; flex-direction:column; }
.moim-sign .signer-name{ font-weight:700; font-size:14.5px; display:flex; align-items:center; gap:6px; flex-wrap:wrap; }
.moim-sign .signer-lbl{ font-size:11px; font-weight:700; color:var(--ink-3); background:#f1f2f4; padding:2px 7px; border-radius:999px; }
.moim-sign .signer-sub{ font-size:12px; color:var(--ink-3); font-weight:500; margin-top:2px; }
.moim-sign .signer-acts{ display:flex; gap:6px; flex-shrink:0; }
.moim-sign .ico-btn{ width:34px; height:34px; border-radius:10px; border:1px solid var(--line); background:#fff; display:grid; place-items:center; color:var(--ink-2); cursor:pointer; font-size:15px; }
.moim-sign .ico-btn:hover{ color:var(--brand); border-color:#bcd6f5; }

/* 마법사 */
.moim-sign .steps{ display:flex; gap:8px; margin-bottom:18px; }
.moim-sign .step{ flex:1; display:flex; align-items:center; gap:8px; padding:10px 12px; border-radius:12px; background:var(--bg-warm); border:1px solid var(--line); font-size:13px; font-weight:700; color:var(--ink-3); }
.moim-sign .step.on{ background:var(--brand-soft); border-color:#bcd6f5; color:var(--brand-strong); }
.moim-sign .step.ok{ color:var(--green); }
.moim-sign .step-n{ width:22px; height:22px; border-radius:50%; background:#fff; border:1.5px solid currentColor; display:grid; place-items:center; font-size:11.5px; flex-shrink:0; }
.moim-sign .wz-body{ padding:18px 20px; }
.moim-sign .wz-foot{ display:flex; justify-content:space-between; gap:10px; padding:14px 20px; border-top:1px solid var(--line); flex-wrap:wrap; }
.moim-sign .drop{ border:2px dashed #cdd5e0; border-radius:16px; padding:34px 20px; text-align:center; color:var(--ink-3); font-size:14.5px; font-weight:600; cursor:pointer; transition:border-color .15s, background .15s; }
.moim-sign .drop:hover,.moim-sign .drop.over{ border-color:var(--brand); background:var(--brand-softer); }
.moim-sign .drop small{ display:block; font-size:12px; font-weight:500; margin-top:6px; }
.moim-sign .file-ok{ display:flex; align-items:center; gap:10px; padding:12px 14px; background:var(--green-soft); border:1px solid #bfe6cd; border-radius:12px; font-size:14px; font-weight:700; color:var(--green); }
.moim-sign .file-ok small{ color:var(--ink-2); font-weight:500; }
.moim-sign .place-wrap{ display:flex; flex-direction:column; gap:14px; }
.moim-sign .place-doc{ background:#eef0f3; padding:14px 0; display:flex; flex-direction:column; align-items:center; gap:14px; border-radius:14px; }
.moim-sign .place-page{ position:relative; background:#fff; box-shadow:0 2px 10px rgba(20,24,34,.12); cursor:crosshair; user-select:none; touch-action:none; }
.moim-sign .place-page canvas{ display:block; pointer-events:none; }
.moim-sign .place-pageno{ position:absolute; right:8px; bottom:6px; font-size:11px; color:var(--ink-3); font-weight:600; background:rgba(255,255,255,.85); padding:2px 6px; border-radius:6px; pointer-events:none; }
.moim-sign .box{ position:absolute; border:2px solid var(--brand); background:rgba(0,62,204,.10); border-radius:4px; cursor:move; }
.moim-sign .box.sel{ border-color:var(--amber); background:rgba(180,83,9,.12); box-shadow:0 0 0 3px rgba(180,83,9,.2); }
.moim-sign .box-tag{ position:absolute; left:-2px; top:-22px; font-size:11px; font-weight:800; color:#fff; background:var(--brand); padding:2px 8px; border-radius:6px; white-space:nowrap; pointer-events:none; }
.moim-sign .box.sel .box-tag{ background:var(--amber); }
.moim-sign .box.drawing{ border-style:dashed; cursor:crosshair; }
.moim-sign .box-hd{ position:absolute; right:-6px; bottom:-6px; width:14px; height:14px; background:#fff; border:2px solid var(--brand); border-radius:3px; cursor:nwse-resize; }
.moim-sign .box.sel .box-hd{ border-color:var(--amber); }
.moim-sign .slot-panel{ display:flex; flex-direction:column; gap:8px; }
.moim-sign .slot-row{ display:flex; align-items:center; gap:8px; padding:8px 10px; background:var(--bg-warm); border:1px solid var(--line); border-radius:12px; cursor:pointer; }
.moim-sign .slot-row.sel{ border-color:var(--amber); background:var(--amber-soft); }
.moim-sign .slot-no{ width:24px; height:24px; border-radius:50%; background:var(--brand); color:#fff; font-size:11.5px; font-weight:800; display:grid; place-items:center; flex-shrink:0; }
.moim-sign .slot-row .inp{ padding:7px 10px; font-size:13.5px; }
.moim-sign .slot-pg{ font-size:11.5px; color:var(--ink-3); font-weight:600; white-space:nowrap; }
.moim-sign .place-hint{ font-size:13px; color:var(--ink-3); font-weight:500; line-height:1.6; background:var(--brand-softer); border:1px solid #d7e6fb; border-radius:12px; padding:10px 14px; }
.moim-sign .map-row{ display:flex; flex-direction:column; gap:8px; padding:12px 14px; background:var(--bg-warm); border:1px solid var(--line); border-radius:14px; margin-bottom:10px; }
.moim-sign .map-top{ display:flex; align-items:center; gap:10px; }
.moim-sign .map-lbl{ font-weight:800; font-size:14.5px; flex:1; }
.moim-sign .map-pick{ display:flex; gap:8px; flex-wrap:wrap; align-items:center; }
.moim-sign .map-pick .inp{ flex:1; min-width:140px; }
.moim-sign .chip{ font-size:12px; font-weight:700; padding:6px 11px; border-radius:999px; border:1px solid var(--line); background:#fff; color:var(--ink-2); cursor:pointer; font-family:inherit; }
.moim-sign .chip.on{ background:var(--brand); color:#fff; border-color:var(--brand); }
.moim-sign .sug{ display:flex; gap:6px; flex-wrap:wrap; }
.moim-sign .sug button{ font-size:12.5px; font-weight:700; padding:6px 11px; border-radius:999px; border:1px solid var(--line); background:#fff; color:var(--ink-2); cursor:pointer; font-family:inherit; }
.moim-sign .sug button:hover{ border-color:var(--brand); color:var(--brand); }
.moim-sign .picked{ display:inline-flex; align-items:center; gap:6px; font-size:13.5px; font-weight:800; color:var(--green); background:var(--green-soft); padding:6px 11px; border-radius:999px; }
.moim-sign .picked button{ border:0; background:none; color:var(--green); cursor:pointer; font-size:14px; padding:0 2px; }
.moim-sign .err-box{ background:var(--red-soft); color:var(--red); border:1px solid #f0c5c0; border-radius:12px; padding:10px 14px; font-size:13.5px; font-weight:600; margin-bottom:12px; }

@media (min-width:900px){
  .moim-sign .place-wrap{ display:grid; grid-template-columns:1fr 300px; align-items:start; }
  .moim-sign .st-grid{ display:grid; grid-template-columns:1fr 1fr; gap:16px; align-items:start; }
}
`;
