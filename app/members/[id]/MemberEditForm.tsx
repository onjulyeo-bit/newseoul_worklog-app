"use client";

// 회원 편집 폼 — 전체 항목 수정 + 배지(직책/이력) 칩 선택·추가 + 저장/삭제.
import { useState, useTransition } from "react";
import { updateMember, deleteMember } from "../actions";

// 미리 만들어 둔 배지 (노션식 — 여기서 고르거나, 아래 입력칸으로 새로 추가)
const PRESET_BADGES = [
  "증경회장", "지회장", "총무", "간사", "감사",
  "부총무", "고문", "운영위원", "운영자문단", "현임원", "신입",
];

function badgeClass(tag: string) {
  if (tag === "증경회장") return "bg-[rgba(196,125,26,.15)] text-[#9a6212]";
  if (["지회장", "회장"].includes(tag)) return "bg-[rgba(0,102,204,.14)] text-primary";
  if (["총무", "간사", "감사", "부총무"].includes(tag)) return "bg-[rgba(46,125,82,.14)] text-success";
  if (["고문", "운영위원", "운영자문단"].includes(tag)) return "bg-surface-soft text-ink-soft";
  return "bg-[rgba(0,102,204,.12)] text-primary";
}

type MemberRow = Record<string, unknown> & { id: string; name: string };

const labelCls = "mb-1.5 block text-[14px] font-bold text-ink-soft";
const inputCls =
  "min-h-[44px] w-full rounded-md border border-line bg-card px-3.5 text-[17px] text-ink outline-none placeholder:text-muted focus:border-primary-focus";

export default function MemberEditForm({ member }: { member: MemberRow }) {
  const s = (k: string) => (member[k] == null ? "" : String(member[k]));
  const [form, setForm] = useState({
    name: s("name"),
    gender: s("gender"),
    grade: s("grade"),
    status: s("status"),
    phone: s("phone"),
    spouse_name: s("spouse_name"),
    industry: s("industry"),
    company: s("company"),
    position: s("position"),
    vision_school: s("vision_school"),
    leadership_school: s("leadership_school"),
    car_model: s("car_model"),
    car_number: s("car_number"),
    joined_on: s("joined_on"),
    intro: s("intro"),
  });
  const [parking, setParking] = useState<boolean>(member.parking_registered === true);
  const [tags, setTags] = useState<string[]>(
    Array.isArray(member.tags) ? (member.tags as string[]) : [],
  );
  const [newBadge, setNewBadge] = useState("");
  const [pending, startTransition] = useTransition();

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const addTag = (t: string) => {
    const v = t.trim();
    if (v && !tags.includes(v)) setTags([...tags, v]);
  };
  const removeTag = (t: string) => setTags(tags.filter((x) => x !== t));

  const onSave = () => {
    const nz = (v: string) => (v.trim() === "" ? null : v.trim());
    startTransition(() =>
      updateMember(member.id, {
        name: form.name.trim(),
        gender: nz(form.gender),
        grade: nz(form.grade),
        status: nz(form.status),
        phone: nz(form.phone),
        spouse_name: nz(form.spouse_name),
        industry: nz(form.industry),
        company: nz(form.company),
        position: nz(form.position),
        vision_school: nz(form.vision_school),
        leadership_school: nz(form.leadership_school),
        car_model: nz(form.car_model),
        car_number: nz(form.car_number),
        joined_on: nz(form.joined_on),
        intro: nz(form.intro),
        parking_registered: parking,
        tags,
      }),
    );
  };

  const onDelete = () => {
    if (confirm(`'${form.name}' 회원을 삭제할까요? 되돌릴 수 없습니다.`)) {
      startTransition(() => deleteMember(member.id));
    }
  };

  return (
    <div className="rounded-lg border border-line bg-card p-6">
      <h2 className="text-[21px] font-bold text-ink">{form.name || "회원"} 편집</h2>

      {/* 배지 (직책/이력) */}
      <div className="mt-5">
        <label className={labelCls}>배지 (직책·이력)</label>
        <div className="flex flex-wrap items-center gap-2">
          {tags.length === 0 && <span className="text-[15px] text-muted">없음</span>}
          {tags.map((t) => (
            <span
              key={t}
              className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-bold ${badgeClass(t)}`}
            >
              {t}
              <button type="button" onClick={() => removeTag(t)} className="ml-0.5 text-[13px] opacity-70 hover:opacity-100">
                ✕
              </button>
            </span>
          ))}
        </div>
        {/* 미리 만든 배지에서 고르기 */}
        <div className="mt-2 flex flex-wrap gap-1.5">
          {PRESET_BADGES.filter((b) => !tags.includes(b)).map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => addTag(b)}
              className="rounded-full border border-line px-2.5 py-1 text-[12px] font-semibold text-ink-soft hover:border-primary hover:text-primary"
            >
              + {b}
            </button>
          ))}
        </div>
        {/* 새 배지 직접 추가 */}
        <div className="mt-2 flex gap-2">
          <input
            value={newBadge}
            onChange={(e) => setNewBadge(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag(newBadge);
                setNewBadge("");
              }
            }}
            placeholder="새 배지 직접 입력"
            className="min-h-[40px] flex-1 rounded-md border border-line bg-card px-3 text-[15px] outline-none focus:border-primary-focus"
          />
          <button
            type="button"
            onClick={() => { addTag(newBadge); setNewBadge(""); }}
            className="rounded-md border border-line px-3 text-[15px] font-semibold text-ink-soft hover:border-primary hover:text-primary"
          >
            추가
          </button>
        </div>
      </div>

      {/* 기본 항목 */}
      <div className="mt-6 flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div><label className={labelCls}>이름 *</label><input value={form.name} onChange={(e) => set("name", e.target.value)} className={inputCls} /></div>
          <div>
            <label className={labelCls}>성별</label>
            <select value={form.gender} onChange={(e) => set("gender", e.target.value)} className={inputCls}>
              <option value="">선택 안 함</option><option value="남">남</option><option value="여">여</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>등급</label>
            <select value={form.grade} onChange={(e) => set("grade", e.target.value)} className={inputCls}>
              <option value="">선택 안 함</option>
              {["정회원", "부부회원", "명예회원", "준회원", "신입회원", "유보회원"].map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>상태</label>
            <select value={form.status} onChange={(e) => set("status", e.target.value)} className={inputCls}>
              <option value="">선택 안 함</option>
              {["활동", "휴면", "비활동", "OB"].map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div><label className={labelCls}>연락처</label><input value={form.phone} onChange={(e) => set("phone", e.target.value)} className={inputCls} /></div>
          <div><label className={labelCls}>배우자</label><input value={form.spouse_name} onChange={(e) => set("spouse_name", e.target.value)} className={inputCls} /></div>
        </div>

        <div><label className={labelCls}>업종</label><input value={form.industry} onChange={(e) => set("industry", e.target.value)} className={inputCls} /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className={labelCls}>직장명</label><input value={form.company} onChange={(e) => set("company", e.target.value)} className={inputCls} /></div>
          <div><label className={labelCls}>직위</label><input value={form.position} onChange={(e) => set("position", e.target.value)} className={inputCls} /></div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div><label className={labelCls}>비전스쿨 수료</label><input value={form.vision_school} onChange={(e) => set("vision_school", e.target.value)} placeholder="예: 수료 / 99기" className={inputCls} /></div>
          <div><label className={labelCls}>리더십스쿨 수료</label><input value={form.leadership_school} onChange={(e) => set("leadership_school", e.target.value)} className={inputCls} /></div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div><label className={labelCls}>차종</label><input value={form.car_model} onChange={(e) => set("car_model", e.target.value)} className={inputCls} /></div>
          <div><label className={labelCls}>차량번호</label><input value={form.car_number} onChange={(e) => set("car_number", e.target.value)} className={inputCls} /></div>
        </div>

        <div className="flex items-center gap-2">
          <input id="parking" type="checkbox" checked={parking} onChange={(e) => setParking(e.target.checked)} className="h-5 w-5 accent-primary" />
          <label htmlFor="parking" className="text-[16px] text-ink">주차 등록됨</label>
        </div>

        <div><label className={labelCls}>회원등록일</label><input type="date" value={form.joined_on} onChange={(e) => set("joined_on", e.target.value)} className={inputCls} /></div>
        <div><label className={labelCls}>비고</label><textarea value={form.intro} onChange={(e) => set("intro", e.target.value)} className={`${inputCls} min-h-[80px] py-2`} /></div>
      </div>

      {/* 액션 */}
      <div className="mt-6 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onDelete}
          disabled={pending}
          className="rounded-full border border-[rgba(192,57,43,.4)] px-4 py-2.5 text-[15px] font-semibold text-unpaid hover:bg-[rgba(192,57,43,.06)] disabled:opacity-50"
        >
          삭제
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={pending || !form.name.trim()}
          className="min-h-[44px] rounded-full bg-primary px-6 text-[16px] font-semibold text-white hover:bg-primary-pressed disabled:opacity-50"
        >
          {pending ? "저장 중…" : "저장"}
        </button>
      </div>
    </div>
  );
}
