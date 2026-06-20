// 운영 매뉴얼 공용 CSS — .moim-mn 스코프.
export const MN_CSS = `
.moim-mn{
  --brand:#003ecc; --brand-strong:#0032a8; --brand-soft:#e8f1fc; --navy:#1e2353;
  --ink:#16181d; --ink-2:#3d424d; --ink-3:#767d8a; --line:#ecedf0; --bg:#fff;
  --shadow-sm:0 1px 2px rgba(20,24,34,.04), 0 4px 14px rgba(20,24,34,.05);
  color:var(--ink); line-height:1.6; letter-spacing:-0.01em;
}
.moim-mn *{ box-sizing:border-box; }
.moim-mn h1,.moim-mn h2,.moim-mn h3,.moim-mn p,.moim-mn ul,.moim-mn ol{ margin:0; }

.moim-mn .page-head{ display:flex; align-items:flex-end; justify-content:space-between; gap:14px; margin-bottom:6px; flex-wrap:wrap; }
.moim-mn .page-title{ font-size:clamp(21px,5vw,26px); font-weight:800; letter-spacing:-0.04em; }
.moim-mn .page-sub{ color:var(--ink-3); font-size:14px; margin-top:5px; font-weight:500; }

.moim-mn .mn-grid{ display:grid; grid-template-columns:repeat(2,1fr); gap:14px; margin-top:20px; }
@media (max-width:559px){ .moim-mn .mn-grid{ grid-template-columns:1fr; } }
.moim-mn .mn-card{ display:flex; align-items:flex-start; gap:14px; background:var(--bg); border:1px solid var(--line); border-radius:18px; padding:18px; box-shadow:var(--shadow-sm); text-decoration:none; color:inherit; transition:transform .14s, box-shadow .14s, border-color .14s; }
.moim-mn .mn-card:hover{ transform:translateY(-2px); box-shadow:0 2px 6px rgba(20,24,34,.05),0 14px 38px rgba(20,40,80,.08); border-color:#dde7f3; }
.moim-mn .mn-ic{ flex:none; width:46px; height:46px; border-radius:13px; background:var(--brand-soft); color:var(--brand); display:grid; place-items:center; }
.moim-mn .mn-card-b{ min-width:0; }
.moim-mn .mn-card-t{ font-size:16.5px; font-weight:800; letter-spacing:-0.03em; }
.moim-mn .mn-card-d{ font-size:13.5px; color:var(--ink-3); margin-top:4px; font-weight:500; }
.moim-mn .mn-card-meta{ font-size:12px; color:var(--ink-3); margin-top:8px; }

.moim-mn .mn-bar{ display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:16px; }
.moim-mn .mn-back{ display:inline-flex; align-items:center; gap:5px; font-size:14px; font-weight:600; color:var(--ink-2); background:none; border:0; cursor:pointer; text-decoration:none; }
.moim-mn .mn-back:hover{ color:var(--brand); }
.moim-mn .mn-doc{ background:var(--bg); border:1px solid var(--line); border-radius:20px; padding:28px; box-shadow:var(--shadow-sm); max-width:760px; }
.moim-mn .mn-head{ display:flex; align-items:center; gap:12px; margin-bottom:18px; padding-bottom:18px; border-bottom:1px solid var(--line); }
.moim-mn .mn-head .mn-ic{ width:42px; height:42px; }
.moim-mn .mn-head-t{ font-size:21px; font-weight:800; letter-spacing:-0.03em; }
.moim-mn .mn-head-d{ font-size:13px; color:var(--ink-3); margin-top:2px; }

.moim-mn .ui-btn{ display:inline-flex; align-items:center; justify-content:center; gap:6px; font-weight:600; border-radius:12px; border:0; cursor:pointer; font-size:13.5px; padding:9px 14px; transition:background .15s; }
.moim-mn .ui-primary{ background:var(--brand); color:#fff; box-shadow:0 5px 14px rgba(0,62,204,.2); }
.moim-mn .ui-primary:hover{ background:var(--brand-strong); }
.moim-mn .ui-primary:disabled{ opacity:.6; cursor:default; }
.moim-mn .ui-ghost{ background:#fff; color:var(--ink-2); border:1px solid var(--line); }
.moim-mn .ui-ghost:hover{ background:#f7f8f9; }

/* 마크다운 본문 */
.moim-mn .mn-md > *{ margin:0; }
.moim-mn .mn-md h1{ font-size:20px; font-weight:800; margin:22px 0 10px; letter-spacing:-0.03em; }
.moim-mn .mn-md h2{ font-size:17px; font-weight:800; margin:22px 0 10px; letter-spacing:-0.03em; color:var(--navy); }
.moim-mn .mn-md h2:first-child,.moim-mn .mn-md h1:first-child{ margin-top:0; }
.moim-mn .mn-md h3{ font-size:15px; font-weight:800; margin:16px 0 8px; }
.moim-mn .mn-md p{ font-size:14.5px; color:var(--ink-2); margin:9px 0; }
.moim-mn .mn-md ul,.moim-mn .mn-md ol{ padding-left:22px; margin:9px 0; display:flex; flex-direction:column; gap:5px; }
.moim-mn .mn-md li{ font-size:14.5px; color:var(--ink-2); }
.moim-mn .mn-md strong{ font-weight:800; color:var(--ink); }
.moim-mn .mn-tablewrap{ overflow-x:auto; margin:12px 0; border:1px solid var(--line); border-radius:12px; }
.moim-mn .mn-md table{ width:100%; border-collapse:collapse; font-size:13.5px; min-width:460px; }
.moim-mn .mn-md thead th{ background:#f6f7f9; color:var(--navy); font-weight:800; text-align:left; padding:9px 12px; border-bottom:1px solid var(--line); white-space:nowrap; }
.moim-mn .mn-md tbody td{ padding:9px 12px; border-bottom:1px solid #f1f2f4; color:var(--ink-2); vertical-align:top; }
.moim-mn .mn-md tbody tr:last-child td{ border-bottom:0; }
.moim-mn .mn-md tbody td:first-child{ font-weight:700; color:var(--ink); white-space:nowrap; }

/* 체크리스트 */
.moim-mn .ck-tools{ display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:14px; flex-wrap:wrap; }
.moim-mn .ck-prog{ font-size:13.5px; font-weight:700; color:var(--ink-2); }
.moim-mn .ck-prog b{ color:var(--brand); }
.moim-mn .ck-list{ display:flex; flex-direction:column; gap:0; background:var(--bg); border:1px solid var(--line); border-radius:16px; overflow:hidden; box-shadow:var(--shadow-sm); }
.moim-mn .ck-row{ display:flex; align-items:flex-start; gap:12px; padding:13px 16px; border-bottom:1px solid #f2f3f5; }
.moim-mn .ck-row:last-child{ border-bottom:0; }
.moim-mn .ck-box{ flex:none; width:22px; height:22px; margin-top:1px; border-radius:7px; border:1.5px solid #c9ccd2; background:#fff; display:grid; place-items:center; cursor:pointer; color:#fff; transition:background .12s, border-color .12s; }
.moim-mn .ck-box.on{ background:var(--brand); border-color:var(--brand); }
.moim-mn .ck-box:disabled{ cursor:default; opacity:.7; }
.moim-mn .ck-body{ flex:1; min-width:0; }
.moim-mn .ck-label{ font-size:15px; font-weight:700; color:var(--ink); }
.moim-mn .ck-row.done .ck-label{ color:var(--ink-3); text-decoration:line-through; }
.moim-mn .ck-tags{ display:flex; flex-wrap:wrap; gap:5px; margin-top:5px; align-items:center; }
.moim-mn .ck-role{ font-size:11.5px; font-weight:700; padding:2px 8px; border-radius:999px; background:var(--brand-soft); color:var(--brand-strong); }
.moim-mn .ck-when{ font-size:11.5px; font-weight:600; padding:2px 8px; border-radius:999px; background:#f1f2f4; color:#6b717c; }
.moim-mn .ck-note{ font-size:12.5px; color:var(--ink-3); margin-top:4px; }
.moim-mn .ck-del{ flex:none; width:30px; height:30px; border-radius:8px; border:1px solid var(--line); background:#fff; color:var(--ink-3); cursor:pointer; display:grid; place-items:center; }
.moim-mn .ck-del:hover{ color:#c0392b; border-color:#f3c6c0; background:#fdecea; }
.moim-mn .ck-add{ display:grid; grid-template-columns:2fr 1fr 1fr auto; gap:8px; margin-top:14px; }
@media (max-width:640px){ .moim-mn .ck-add{ grid-template-columns:1fr 1fr; } }
.moim-mn .ck-inp{ font-family:inherit; font-size:13.5px; color:var(--ink); background:#fff; border:1px solid var(--line); border-radius:10px; padding:9px 11px; outline:none; width:100%; }
.moim-mn .ck-inp:focus{ border-color:var(--brand); box-shadow:0 0 0 3px var(--brand-soft); }

.moim-mn .mn-edit{ width:100%; min-height:420px; font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:13.5px; line-height:1.7; color:var(--ink); background:#fff; border:1px solid var(--line); border-radius:14px; padding:16px; outline:none; resize:vertical; }
.moim-mn .mn-edit:focus{ border-color:var(--brand); box-shadow:0 0 0 3px var(--brand-soft); }
.moim-mn .mn-hint{ font-size:12px; color:var(--ink-3); margin-top:8px; }
.moim-mn .mn-err{ color:#c0392b; font-size:13px; font-weight:600; }
.moim-mn .empty{ padding:40px; text-align:center; color:var(--ink-3); font-size:14px; border:1px solid var(--line); border-radius:18px; background:#fff; }
.moim-mn .toast{ position:fixed; bottom:26px; left:50%; transform:translateX(-50%); z-index:80; background:var(--ink); color:#fff; font-size:13.5px; font-weight:600; padding:12px 20px; border-radius:999px; box-shadow:0 10px 30px rgba(0,0,0,.25); }
`;
