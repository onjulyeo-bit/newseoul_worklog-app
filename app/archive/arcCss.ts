// 아카이브 화면 공유 CSS — .moim-arc 스코프. 클로드디자인 핸드오프(아카이브.dc.html) 비주얼 이식.
export const ARC_CSS = `
.moim-arc{ --b:#0066cc; --b-strong:#0052a8; --b-soft:#e8f1fc; --b-softer:#f3f8fe; --b-line:#dbe6f5;
  --ink:#16181d; --ink-2:#3d424d; --ink-3:#767d8a; --line:#ecedf0; --bg:#fff; --warm:#fafafb; --red:#c0392b;
  color:var(--ink-2); letter-spacing:-0.01em; }
.moim-arc *{ box-sizing:border-box; }
.moim-arc h1,.moim-arc h2,.moim-arc h3,.moim-arc p{ margin:0; }
@keyframes arcFade{ from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
.moim-arc .arc-wrap{ animation:arcFade .3s ease; }

/* 허브 */
.moim-arc .arc-h1{ font-size:28px; font-weight:800; letter-spacing:-0.8px; color:var(--ink); margin:4px 0 8px; }
.moim-arc .arc-sub{ font-size:16px; line-height:1.6; color:var(--ink-3); margin:0 0 28px; max-width:620px; }
.moim-arc .arc-grid{ display:grid; grid-template-columns:repeat(auto-fit,minmax(258px,1fr)); gap:16px; }
.moim-arc .arc-card{ background:var(--bg); border:1px solid var(--line); border-radius:20px; padding:22px; cursor:pointer; box-shadow:0 1px 2px rgba(22,24,29,.04); transition:transform .14s ease, box-shadow .14s ease, border-color .14s ease; display:flex; flex-direction:column; gap:14px; text-decoration:none; }
.moim-arc .arc-card:hover{ transform:translateY(-3px); box-shadow:0 10px 24px rgba(22,24,29,.08); border-color:var(--b-line); }
.moim-arc .arc-card-top{ display:flex; align-items:flex-start; justify-content:space-between; }
.moim-arc .arc-ic{ width:48px; height:48px; border-radius:14px; background:var(--b-soft); color:var(--b); display:flex; align-items:center; justify-content:center; }
.moim-arc .arc-chev{ color:#bcc1cc; }
.moim-arc .arc-ct{ font-size:18px; font-weight:800; color:var(--ink); letter-spacing:-0.4px; margin-bottom:5px; }
.moim-arc .arc-cd{ font-size:14.5px; color:var(--ink-3); line-height:1.5; }
.moim-arc .arc-count{ align-self:flex-start; font-size:13px; font-weight:700; color:var(--b-strong); background:var(--b-soft); padding:5px 11px; border-radius:999px; }

/* 섹션 공통 */
.moim-arc .arc-back{ display:inline-flex; align-items:center; gap:4px; background:none; border:none; cursor:pointer; color:var(--ink-3); font-size:15px; font-weight:600; padding:6px 0; margin-bottom:14px; text-decoration:none; }
.moim-arc .arc-shead{ display:flex; align-items:flex-end; justify-content:space-between; gap:16px; flex-wrap:wrap; margin-bottom:24px; }
.moim-arc .arc-stitle{ font-size:26px; font-weight:800; letter-spacing:-0.7px; color:var(--ink); margin:0 0 7px; }
.moim-arc .arc-sdesc{ font-size:15.5px; color:var(--ink-3); margin:0; line-height:1.5; }
.moim-arc .arc-add{ display:inline-flex; align-items:center; gap:6px; background:var(--b); color:#fff; border:none; border-radius:999px; padding:11px 18px; font-size:15px; font-weight:700; cursor:pointer; flex-shrink:0; box-shadow:0 2px 8px rgba(0,102,204,.25); }
.moim-arc .arc-add:hover{ background:var(--b-strong); }

/* 추가 폼 */
.moim-arc .arc-form{ background:var(--bg); border:1px solid var(--b-line); border-radius:20px; padding:22px; margin-bottom:24px; box-shadow:0 4px 16px rgba(22,24,29,.06); display:flex; flex-direction:column; gap:14px; }
.moim-arc .arc-form-t{ font-size:16px; font-weight:800; color:var(--ink); }
.moim-arc .arc-label{ display:block; font-size:13.5px; font-weight:700; color:var(--ink-2); margin-bottom:6px; }
.moim-arc .arc-inp{ width:100%; border:1px solid var(--line); border-radius:12px; padding:12px 14px; font-size:15px; color:var(--ink); outline:none; background:var(--warm); font-family:inherit; }
.moim-arc .arc-inp:focus{ border-color:var(--b); background:#fff; }
.moim-arc textarea.arc-inp{ resize:vertical; line-height:1.55; }
.moim-arc .arc-file{ font-size:14px; color:var(--ink-3); }
.moim-arc .arc-file::file-selector-button{ margin-right:12px; border:0; border-radius:999px; background:var(--b); color:#fff; padding:9px 16px; font-size:14px; font-weight:700; cursor:pointer; }
.moim-arc .arc-form-acts{ display:flex; gap:10px; justify-content:flex-end; margin-top:4px; align-items:center; }
.moim-arc .arc-btn-cancel{ background:rgba(112,115,124,.08); color:var(--ink-2); border:none; border-radius:999px; padding:11px 20px; font-size:15px; font-weight:700; cursor:pointer; }
.moim-arc .arc-btn-save{ background:var(--b); color:#fff; border:none; border-radius:999px; padding:11px 22px; font-size:15px; font-weight:700; cursor:pointer; }
.moim-arc .arc-btn-save:disabled{ opacity:.5; cursor:default; }
.moim-arc .arc-err{ font-size:14px; font-weight:600; color:var(--red); }
.moim-arc .arc-empty{ background:var(--bg); border:1px solid var(--line); border-radius:20px; padding:48px; text-align:center; color:var(--ink-3); font-size:15px; }

/* 삭제 버튼들 */
.moim-arc .arc-del{ background:none; border:none; cursor:pointer; color:#bcc1cc; padding:6px; border-radius:8px; flex-shrink:0; display:inline-flex; }
.moim-arc .arc-del:hover{ color:var(--red); background:#fdecea; }
.moim-arc .arc-del-abs{ position:absolute; top:12px; right:12px; }
.moim-arc .arc-del-img{ position:absolute; top:10px; right:10px; background:rgba(22,24,29,.45); color:#fff; border:none; cursor:pointer; padding:7px; border-radius:10px; display:flex; }
.moim-arc .arc-del-img:hover{ background:var(--red); }

/* 연혁 타임라인 */
.moim-arc .arc-tl{ position:relative; padding-left:8px; }
.moim-arc .arc-tl-item{ position:relative; padding:0 0 26px 30px; border-left:2px solid var(--b-soft); }
.moim-arc .arc-tl-item:last-child{ border-left-color:transparent; }
.moim-arc .arc-tl-dot{ position:absolute; left:-8px; top:2px; width:14px; height:14px; border-radius:999px; background:var(--b); border:3px solid #fff; box-shadow:0 0 0 1px var(--b-line); }
.moim-arc .arc-tl-row{ display:flex; align-items:flex-start; justify-content:space-between; gap:12px; }
.moim-arc .arc-tl-date{ font-size:14px; font-weight:800; color:var(--b); margin-bottom:4px; }
.moim-arc .arc-tl-title{ font-size:17px; font-weight:800; color:var(--ink); letter-spacing:-0.3px; margin-bottom:6px; }
.moim-arc .arc-tl-body{ font-size:15px; color:var(--ink-2); line-height:1.6; white-space:pre-wrap; }
.moim-arc .arc-photo{ margin-top:12px; max-height:280px; border-radius:14px; border:1px solid var(--line); object-fit:cover; max-width:100%; }

/* 역대 지회장 */
.moim-arc .arc-people{ display:grid; grid-template-columns:repeat(auto-fill,minmax(156px,1fr)); gap:14px; }
.moim-arc .arc-person{ background:var(--bg); border:1px solid var(--line); border-radius:18px; padding:22px 16px; text-align:center; position:relative; box-shadow:0 1px 2px rgba(22,24,29,.04); }
.moim-arc .arc-avatar{ width:72px; height:72px; border-radius:999px; background:linear-gradient(135deg,#e8f1fc,#dbe6f5); color:var(--b); font-size:26px; font-weight:800; display:flex; align-items:center; justify-content:center; margin:0 auto 12px; object-fit:cover; }
.moim-arc .arc-name{ font-size:16.5px; font-weight:800; color:var(--ink); letter-spacing:-0.3px; margin-bottom:4px; }
.moim-arc .arc-term{ font-size:13.5px; color:var(--ink-3); line-height:1.45; }

/* 행사 갤러리 */
.moim-arc .arc-gallery{ display:grid; grid-template-columns:repeat(auto-fill,minmax(244px,1fr)); gap:16px; }
.moim-arc .arc-event{ background:var(--bg); border:1px solid var(--line); border-radius:18px; overflow:hidden; position:relative; box-shadow:0 1px 2px rgba(22,24,29,.04); }
.moim-arc .arc-event-ph{ height:158px; background:linear-gradient(135deg,#1a2238,#33405e); display:flex; align-items:center; justify-content:center; color:rgba(255,255,255,.7); }
.moim-arc .arc-event-img{ height:158px; width:100%; object-fit:cover; display:block; }
.moim-arc .arc-event-body{ padding:15px 17px 17px; }
.moim-arc .arc-event-name{ font-size:16px; font-weight:800; color:var(--ink); letter-spacing:-0.3px; margin-bottom:5px; }
.moim-arc .arc-event-date{ font-size:13.5px; color:var(--ink-3); }

/* 입회안내·소개 (글 카드) */
.moim-arc .arc-stack{ display:flex; flex-direction:column; gap:16px; }
.moim-arc .arc-cards{ display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:16px; }
.moim-arc .arc-doc{ background:var(--bg); border:1px solid var(--line); border-radius:20px; padding:24px; box-shadow:0 1px 2px rgba(22,24,29,.04); position:relative; }
.moim-arc .arc-doc-title{ font-size:19px; font-weight:800; color:var(--ink); letter-spacing:-0.4px; margin-bottom:10px; padding-right:30px; }
.moim-arc .arc-doc-body{ font-size:15.5px; color:var(--ink-2); line-height:1.65; margin-bottom:16px; white-space:pre-wrap; }
.moim-arc .arc-link{ display:inline-flex; align-items:center; gap:6px; background:var(--b-softer); color:var(--b-strong); text-decoration:none; border:1px solid var(--b-line); border-radius:999px; padding:10px 16px; font-size:14.5px; font-weight:700; }
.moim-arc .arc-link.solid{ background:var(--b); color:#fff; border-color:var(--b); }

/* 자료실 */
.moim-arc .arc-res{ background:var(--bg); border:1px solid var(--line); border-radius:20px; overflow:hidden; box-shadow:0 1px 2px rgba(22,24,29,.04); }
.moim-arc .arc-res-row{ display:flex; align-items:center; gap:14px; padding:18px 20px; border-bottom:1px solid #f2f3f5; }
.moim-arc .arc-res-row:last-child{ border-bottom:0; }
.moim-arc .arc-res-badge{ flex-shrink:0; font-size:12px; font-weight:800; letter-spacing:.3px; padding:5px 9px; border-radius:8px; }
.moim-arc .arc-res-mid{ flex:1; min-width:0; }
.moim-arc .arc-res-name{ font-size:16px; font-weight:700; color:var(--ink); letter-spacing:-0.3px; margin-bottom:3px; }
.moim-arc .arc-res-desc{ font-size:13.5px; color:var(--ink-3); line-height:1.45; }
.moim-arc .arc-dl{ flex-shrink:0; display:inline-flex; align-items:center; gap:6px; background:var(--b); color:#fff; text-decoration:none; border-radius:999px; padding:9px 15px; font-size:14px; font-weight:700; }
`;
