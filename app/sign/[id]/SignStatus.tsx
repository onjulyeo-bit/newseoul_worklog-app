"use client";

// 서명 현황판 — 슬롯별 대기/열람/완료, 서명자 링크 복사·공유(Web Share), 전체 링크 목록 복사(카톡용),
//   서명본 PDF 보기/다운로드(즉시 합성, 진행중이면 '현재까지 서명본'), 취소·삭제(운영진).
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SIGN_CSS } from "../signCss";
import { cancelSignRequest, deleteSignRequest, markLinkSent, setPhoneConsent, revertSigner } from "../actions";
import { STATUS_LABEL, type SignRequestRow, type SignSlotRow, type SignSignerRow } from "@/lib/signTypes";

const AV_COLORS = ["#003ecc", "#16a34a", "#7c5cff", "#e8643c", "#0d9488", "#d4a017"];
const fmtDT = (s: string | null) => { if (!s) return ""; const d = new Date(s); const p = (n: number) => String(n).padStart(2, "0"); return `${d.getMonth() + 1}.${d.getDate()} ${p(d.getHours())}:${p(d.getMinutes())}`; };
const fmtD = (s: string | null) => { if (!s) return ""; const d = new Date(s); return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`; };

export default function SignStatus({ request, slots, signers, sentIds, phoneIds = [], canEdit, groupToken }: {
  request: SignRequestRow; slots: SignSlotRow[]; signers: SignSignerRow[]; sentIds: string[];
  phoneIds?: string[]; canEdit: boolean; groupToken?: string | null;
}) {
  const router = useRouter();
  const [, start] = useTransition();
  const [toast, setToast] = useState("");
  const [sent, setSent] = useState(new Set(sentIds));
  const phoneSet = new Set(phoneIds);
  const show = (t: string) => { setToast(t); setTimeout(() => setToast(""), 2000); };

  const siteBase = process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL}`
    : (typeof window !== "undefined" ? window.location.origin : "");
  const linkOf = (g: SignSignerRow) => `${siteBase}/s/${g.token}`;

  const rows = slots.map((s) => ({ slot: s, signer: signers.find((g) => g.slot_id === s.id) ?? null }));
  const total = rows.length, done = rows.filter((r) => r.signer?.status === "signed").length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const isActive = request.status === "active";
  // 취소·만료가 아니면 서명자 상태를 고칠 수 있다(완료 후에도 유선 동의로 정정 가능).
  const canManage = request.status === "active" || request.status === "completed";
  const isDone = request.status === "completed";
  const badge = isDone ? "b-green" : isActive ? "b-brand" : request.status === "expired" ? "b-amber" : "b-gray";

  async function copy(text: string, msg: string) { try { await navigator.clipboard.writeText(text); show(msg); } catch { show("복사에 실패했어요"); } }
  function noteSent(g: SignSignerRow) { if (sent.has(g.id)) return; setSent((p) => new Set(p).add(g.id)); start(() => { markLinkSent(request.id, g.id); }); }
  async function share(g: SignSignerRow) {
    const url = linkOf(g);
    const text = `[새서울 CBMC] ${g.name}님, 「${request.title}」 서명을 부탁드립니다.\n아래 링크를 열어 서명해 주세요.\n${url}`;
    noteSent(g);
    if (typeof navigator !== "undefined" && navigator.share) { try { await navigator.share({ title: request.title, text }); return; } catch { /* 취소 */ } }
    await copy(text, "안내 문구+링크를 복사했어요 — 카톡에 붙여넣으세요");
  }
  async function copyAll() {
    const lines = rows.filter((r) => r.signer).map((r) => `${r.signer!.name}: ${linkOf(r.signer!)}`);
    await copy(`[${request.title}] 서명 링크\n\n${lines.join("\n")}`, `${lines.length}명 링크 목록을 복사했어요`);
    rows.forEach((r) => r.signer && noteSent(r.signer));
  }
  // 단체 링크 — 단톡방에 1개만 올리면 각자 명단에서 본인을 눌러 서명 (0061)
  const groupUrl = groupToken ? `${siteBase}/s/g/${groupToken}` : null;
  async function shareGroup() {
    if (!groupUrl) return;
    const text = `[새서울 CBMC] 「${request.title}」 전자서명 안내\n아래 링크를 열어 명단에서 본인 이름을 누른 뒤 서명해 주세요. (한 번이면 됩니다)\n${groupUrl}`;
    rows.forEach((r) => r.signer && noteSent(r.signer));
    if (typeof navigator !== "undefined" && navigator.share) { try { await navigator.share({ title: request.title, text }); return; } catch { /* 취소 */ } }
    await copy(text, "단체 안내 문구+링크를 복사했어요 — 단톡방에 붙여넣으세요");
  }
  // 유선(전화) 동의로 기록 — 자필 서명 이미지가 있으면 지워진다(대리 서명 흔적 제거).
  async function toPhoneConsent(g: SignSignerRow) {
    const had = g.status === "signed";
    const msg = had
      ? `${g.name}님을 '유선 동의'로 바꿀까요?\n\n· 저장된 서명 이미지가 지워집니다 (되돌릴 수 없어요)\n· 서류의 서명란에는 '유선 동의'라고 표기됩니다\n· 증빙 페이지 인증란도 '유선 동의'로 기록됩니다`
      : `${g.name}님을 '유선 동의'로 기록할까요?\n\n전화로 동의를 확인한 경우에만 사용하세요. 서류에는 '유선 동의'라고 표기됩니다.`;
    if (!confirm(msg)) return;
    const res = await setPhoneConsent(request.id, g.id);
    if (res.error) { show("실패: " + res.error); return; }
    show(`${g.name}님을 유선 동의로 기록했어요`);
    router.refresh();
  }
  // 되돌리기 — 다시 링크로 서명받을 수 있는 '대기' 상태로.
  async function undoSigner(g: SignSignerRow) {
    if (!confirm(`${g.name}님을 '대기'로 되돌릴까요?\n\n기록된 서명·유선 동의가 지워지고, 링크로 다시 서명받을 수 있어요.`)) return;
    const res = await revertSigner(request.id, g.id);
    if (res.error) { show("실패: " + res.error); return; }
    show(`${g.name}님을 대기로 되돌렸어요`);
    router.refresh();
  }
  async function cancel() {
    if (!confirm("이 서명 요청을 취소할까요? 서명자 링크가 모두 막힙니다.")) return;
    const res = await cancelSignRequest(request.id);
    if (res.error) { show("취소 실패: " + res.error); return; }
    router.refresh();
  }
  async function remove() {
    if (!confirm("이 서명 요청과 받은 서명을 모두 삭제할까요? 되돌릴 수 없어요.")) return;
    const res = await deleteSignRequest(request.id);
    if (res.error) { show("삭제 실패: " + res.error); return; }
    router.push("/sign");
  }

  const pdfHref = `/api/sign/pdf/${request.id}`;

  return (
    <div className="moim-sign">
      <style>{SIGN_CSS}</style>
      <div className="page-head">
        <div><Link href="/sign" className="lnk" style={{ fontSize: 13 }}>← 서명 목록</Link><h1 className="page-title" style={{ marginTop: 6 }}>서명 현황</h1></div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <a href={pdfHref} target="_blank" rel="noreferrer" className="ui-btn ui-ghost ui-sm">📄 {isDone ? "서명본 보기" : "현재까지 서명본"}</a>
          <a href={`${pdfHref}?dl=1`} className="ui-btn ui-primary ui-sm">⬇ PDF 다운로드</a>
        </div>
      </div>

      {isDone && (
        <div className="card done-card" style={{ marginBottom: 16 }}>
          <div className="done-ic">✓</div>
          <div><div className="done-t">전원 서명 완료 · 서류함에 보관 중</div><div className="done-s">{fmtD(request.updated_at)} 완료 · 서명 {done}명 · 마지막 쪽에 서명 증빙 페이지가 붙습니다. PC에도 한 부 내려받아 두세요.</div></div>
        </div>
      )}

      <div className="st-grid">
        <div className="card st-head">
          <span className={`badge ${badge}`}>{STATUS_LABEL[request.status]}</span>
          <h2 className="st-title" style={{ marginTop: 8 }}>{request.title}</h2>
          {request.description && <p className="st-desc">{request.description}</p>}
          <div className="st-meta">
            <span>{fmtD(request.created_at)} 생성</span>
            {request.expires_at && <span>· 만료 {fmtD(request.expires_at)}</span>}
            <span>· 서명란 {total}개</span>
          </div>
          <div className="st-prog"><span className={`bar ${isDone ? "done" : ""}`}><i style={{ width: `${pct}%` }} /></span><span className="st-prog-n">{done} / {total} 서명</span></div>
          {canEdit && (
            <div className="st-actions">
              {isActive && groupUrl && <button className="ui-btn ui-primary ui-sm" onClick={shareGroup}>🔗 단체 링크 (단톡방용)</button>}
              {isActive && <button className="ui-btn ui-ghost ui-sm" onClick={copyAll}>📋 개인별 링크 목록 복사</button>}
              {isActive && <button className="ui-btn ui-danger ui-sm" onClick={cancel}>요청 취소</button>}
              {!isActive && <button className="ui-btn ui-danger ui-sm" onClick={remove}>삭제</button>}
            </div>
          )}
          {isActive && canEdit && (
            <p className="fhint" style={{ marginTop: 10 }}>
              {groupUrl
                ? "제일 쉬운 방법: [단체 링크] 하나를 단톡방에 올리면, 각자 명단에서 본인 이름을 누르고 서명합니다. 개인별 링크도 그대로 쓸 수 있어요."
                : "각 서명자에게 링크를 카톡으로 보내세요. 단체 링크(단톡방용)를 쓰려면 0061 마이그레이션을 적용하세요."}
            </p>
          )}
        </div>

        <div className="card">
          <div className="sec-row" style={{ padding: "16px 18px 0" }}><h2 className="sec-title">서명자 {total}명</h2><span className="fhint">대기 → 열람 → 서명 완료</span></div>
          <ul className="signer-list">
            {rows.map(({ slot, signer: g }, i) => {
              const st = g?.status ?? "pending";
              const isPhone = st === "signed" && !!g && phoneSet.has(g.id);
              const color = AV_COLORS[((g?.name ?? slot.label).charCodeAt(0) || 0) % AV_COLORS.length];
              return (
                <li key={slot.id} className="signer-row">
                  <span className="av" style={{ background: color }}>{(g?.name ?? slot.label).charAt(0)}</span>
                  <div className="signer-who">
                    <span className="signer-name">{g?.name ?? "(미배정)"}{slot.label !== g?.name && <span className="signer-lbl">{slot.label}</span>}</span>
                    <span className="signer-sub">
                      {isPhone ? `☎ ${fmtDT(g!.signed_at)} 유선 동의` : st === "signed" ? `✓ ${fmtDT(g!.signed_at)} 서명` : st === "viewed" ? `👀 ${fmtDT(g!.viewed_at)} 열람` : st === "declined" ? "거절" : sent.has(g?.id ?? "") ? "링크 보냄 · 대기" : "대기"}
                      {` · ${slot.page}쪽 #${i + 1}`}
                    </span>
                  </div>
                  <span className={`badge ${isPhone ? "b-violet" : st === "signed" ? "b-green" : st === "viewed" ? "b-amber" : "b-gray"}`}>{isPhone ? "유선 동의" : st === "signed" ? "완료" : st === "viewed" ? "열람" : "대기"}</span>
                  {g && canEdit && canManage && (
                    <div className="signer-acts">
                      {isActive && st !== "signed" && (
                        <>
                          <button className="ico-btn" title="링크 복사" aria-label="링크 복사" onClick={() => { noteSent(g); copy(linkOf(g), `${g.name}님 링크를 복사했어요`); }}>⧉</button>
                          <button className="ico-btn" title="공유" aria-label="공유" onClick={() => share(g)}>↗</button>
                        </>
                      )}
                      {!isPhone && <button className="ico-btn" title="유선 동의로 기록 (서명 대신 전화 동의)" aria-label="유선 동의로 기록" onClick={() => toPhoneConsent(g)}>☎</button>}
                      {st !== "pending" && <button className="ico-btn" title="대기로 되돌리기" aria-label="대기로 되돌리기" onClick={() => undoSigner(g)}>↺</button>}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
