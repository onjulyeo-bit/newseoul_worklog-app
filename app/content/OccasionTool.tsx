"use client";

// 경조사·안내 공지 생성 — 부고·결혼·개업·심방 등. 몇 칸 입력 → 따뜻한 카톡 공지글 자동 생성(복사).
import { useState } from "react";

type TypeV = "부고" | "결혼" | "개업" | "심방" | "기타";
const TYPES: { v: TypeV; label: string }[] = [
  { v: "부고", label: "부고" },
  { v: "결혼", label: "결혼(청첩)" },
  { v: "개업", label: "개업·이전" },
  { v: "심방", label: "사업장 심방" },
  { v: "기타", label: "기타 안내" },
];

type Form = { who: string; when: string; where: string; link: string; extra: string };

function build(type: TypeV, f: Form) {
  const lines: string[] = [];
  const add = (s: string) => lines.push(s);
  const opt = (label: string, v: string) => { if (v.trim()) add(`${label} ${v.trim()}`); };

  if (type === "부고") {
    add("🕊️ 부고안내");
    add("");
    add(`${f.who.trim() || "○○○ 대표님 부친"}께서 소천하셨기에 부고를 전해 드립니다.`);
    add("유가족에게 하나님의 위로하심과 평안이 함께하시기를 마음 모아 기도드립니다.");
    add("");
    opt("🏥 빈소:", f.where);
    opt("🕯️ 발인:", f.when);
    opt("🔗 모바일 부고:", f.link);
    if (f.extra.trim()) add(f.extra.trim());
    add("");
    add("함께 위로의 마음을 전해 주시면 감사하겠습니다. 🤍");
  } else if (type === "결혼") {
    add("💐 결혼 안내");
    add("");
    add(`${f.who.trim() || "○○○ 대표님 가정"}의 기쁜 결혼 소식을 전해 드립니다. 함께 축복해 주세요.`);
    add("");
    opt("📅 일시:", f.when);
    opt("📍 장소:", f.where);
    opt("🔗 모바일 청첩장:", f.link);
    if (f.extra.trim()) add(f.extra.trim());
    add("");
    add("새로 이루는 가정에 주님의 은혜가 충만하시길 기도합니다. 🤍");
  } else if (type === "개업") {
    add("🎉 개업 안내");
    add("");
    add(`${f.who.trim() || "○○○ 대표님"}의 새로운 시작을 전해 드립니다. 함께 축하해 주세요.`);
    add("");
    opt("📅 일시:", f.when);
    opt("📍 장소:", f.where);
    opt("🔗 안내:", f.link);
    if (f.extra.trim()) add(f.extra.trim());
    add("");
    add("하시는 사업 위에 하나님의 형통하심이 함께하시길 기도합니다. 🙏");
  } else if (type === "심방") {
    add("🙏 사업장 심방 안내");
    add("");
    add(`${f.who.trim() || "○○○ 대표님"} 사업장 심방을 안내드립니다. 함께 기도로 동행해 주세요.`);
    add("");
    opt("📅 일시:", f.when);
    opt("📍 장소:", f.where);
    opt("🔗 안내:", f.link);
    if (f.extra.trim()) add(f.extra.trim());
    add("");
    add("일터에 임하시는 주님의 은혜를 함께 구합니다. 🤍");
  } else {
    add("📢 안내");
    add("");
    if (f.who.trim()) add(f.who.trim());
    opt("📅 일시:", f.when);
    opt("📍 장소:", f.where);
    opt("🔗 링크:", f.link);
    if (f.extra.trim()) add(f.extra.trim());
  }
  return lines.join("\n");
}

const inp = "min-h-[42px] w-full rounded-md border border-line bg-card px-3 text-[16px] text-ink outline-none placeholder:text-muted focus:border-primary-focus";
const lab = "mb-1 block text-[13px] font-bold text-ink-soft";

const PLACEHOLDERS: Record<TypeV, { who: string; when: string; where: string }> = {
  부고: { who: "예: 허승필 대표님 부친", when: "발인 일시", where: "쉴낙원 경기장례식장" },
  결혼: { who: "예: 조강민 대표님 장녀", when: "결혼 일시", where: "예식장" },
  개업: { who: "예: 김영근 대표님", when: "개업 일시", where: "장소" },
  심방: { who: "예: 박경선 대표님", when: "심방 일시", where: "사업장" },
  기타: { who: "안내 대상/내용", when: "일시", where: "장소" },
};

export default function OccasionTool() {
  const [type, setType] = useState<TypeV>("부고");
  const [f, setF] = useState<Form>({ who: "", when: "", where: "", link: "", extra: "" });
  const set = (k: keyof Form, v: string) => setF((s) => ({ ...s, [k]: v }));
  const [copied, setCopied] = useState(false);
  const text = build(type, f);
  const ph = PLACEHOLDERS[type];

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="rounded-lg border border-line bg-card p-6">
        <h2 className="text-[19px] font-bold text-ink">경조사·안내 공지</h2>
        <p className="mt-1 text-[14px] text-ink-soft">종류를 고르고 몇 칸만 채우면 따뜻한 공지글이 자동으로 만들어집니다.</p>

        <div className="mt-4 flex flex-wrap gap-2">
          {TYPES.map((t) => (
            <button key={t.v} onClick={() => setType(t.v)} className={`rounded-full px-3.5 py-1.5 text-[14px] font-semibold ${type === t.v ? "bg-primary text-white" : "border border-line text-ink-soft hover:border-primary hover:text-primary"}`}>{t.label}</button>
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-3">
          <div><label className={lab}>대상 (누구의 경조사/안내)</label><input value={f.who} onChange={(e) => set("who", e.target.value)} placeholder={ph.who} className={inp} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={lab}>일시</label><input value={f.when} onChange={(e) => set("when", e.target.value)} placeholder={ph.when} className={inp} /></div>
            <div><label className={lab}>{type === "부고" ? "빈소" : "장소"}</label><input value={f.where} onChange={(e) => set("where", e.target.value)} placeholder={ph.where} className={inp} /></div>
          </div>
          <div><label className={lab}>모바일 부고/청첩 링크</label><input value={f.link} onChange={(e) => set("link", e.target.value)} placeholder="https://preed.e-baro.co.kr/..." className={inp} /></div>
          <div><label className={lab}>추가 내용 (선택)</label><textarea value={f.extra} onChange={(e) => set("extra", e.target.value)} className={`${inp} min-h-[60px] py-2`} /></div>
        </div>
      </div>

      <div className="rounded-lg border border-line bg-card p-6">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[15px] font-bold text-ink">📣 공지글</span>
          <button onClick={async () => { try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch {} }} className="rounded-full bg-primary px-4 py-1.5 text-[13px] font-semibold text-white hover:bg-primary-pressed">{copied ? "✓ 복사됨" : "📋 복사"}</button>
        </div>
        <pre className="whitespace-pre-wrap rounded-lg border border-[#2c3654] bg-navy p-4 font-sans text-[14px] leading-relaxed text-on-dark">{text}</pre>
        <p className="mt-2 text-[13px] text-ink-soft">※ 부고는 위로의 마음을 담았습니다. 필요하면 ‘추가 내용’에 한 줄 더 적으세요.</p>
      </div>
    </div>
  );
}
