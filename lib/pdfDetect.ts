// 서명란 자동 찾기 — PDF 텍스트 위치만으로 서명 칸을 추정 (순수 함수, 클라·테스트 공용).
//   ① "(서명)" / "(인)" 표시 → 표시를 덮고 오른쪽으로 이어지는 박스 + 같은 줄 왼쪽의 마지막 한글 이름을 라벨로.
//      pdf.js 는 "(", "서명", ")" 를 따로 넘기므로 줄 단위로 합쳐서 찾는다.
//   ② 표: 머리글에 '서명' + ('성명'|'이름') 이 있으면, 머리글 바로 아래 연속된 행들 중 성명 열에 이름이 있고
//      '서명' 열이 비어 있는 칸에 박스. (인쇄된 '유선 동의' 같은 칸은 건너뜀)
//   좌표는 PDF pt(좌하단 원점). 문서마다 정확도가 달라 사용자가 확인·조정한다는 전제.
export type TItem = { str: string; x: number; y: number; w: number; h: number };
export type PageText = { page: number; ptW: number; ptH: number; items: TItem[] };
export type Detected = { page: number; x: number; y: number; w: number; h: number; label: string; kind: "marker" | "table" };

const NAME_RE = /[가-힣]{2,4}/g;
const STOP = new Set(["서명", "성명", "이름", "지회장", "확인자", "진행", "동의", "유선", "대면", "회장", "위원장", "총무", "간사", "대표", "일동", "한국", "새서울", "지회"]);

function toLines(items: TItem[]): TItem[][] {
  const sorted = items.filter((i) => i.str.trim()).sort((a, b) => b.y - a.y || a.x - b.x);
  const out: TItem[][] = [];
  for (const it of sorted) {
    const last = out[out.length - 1];
    if (last && Math.abs(last[0].y - it.y) <= Math.max(2.5, it.h * 0.4)) last.push(it); else out.push([it]);
  }
  return out.map((l) => l.sort((a, b) => a.x - b.x));
}
const cx = (i: TItem) => i.x + i.w / 2;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const lastName = (text: string) => { const n = (text.match(NAME_RE) ?? []).filter((t) => !STOP.has(t)); return n[n.length - 1] ?? ""; };

export function detectSignatureSlots(pages: PageText[]): Detected[] {
  const out: Detected[] = [];
  for (const pg of pages) {
    const ls = toLines(pg.items);

    // ① "(서명)" / "(인)" — 줄 텍스트를 합쳐 찾고, 매치 시작 글자가 속한 조각의 x 를 쓴다.
    for (const line of ls) {
      let joined = ""; const owner: TItem[] = [];
      for (const it of line) { for (const ch of it.str) { joined += ch; owner.push(it); } joined += " "; owner.push(it); }
      const re = /\(\s*(서명|인)\s*\)/g; let m: RegExpExecArray | null;
      while ((m = re.exec(joined))) {
        const first = owner[m.index], last = owner[m.index + m[0].length - 1];
        const mx = first.x, mEnd = last.x + last.w;
        const label = lastName(joined.slice(0, m.index));
        const h = Math.max(26, first.h * 2.4);
        let x = mx - 4, w = 110;
        if (x + w > pg.ptW - 8) { w = Math.max(60, pg.ptW - 8 - x); if (w < 90) { x = mEnd + 4 - 110; w = 110; } }
        out.push({ page: pg.page, x: clamp(x, 0, pg.ptW - w), y: clamp(first.y - 8, 0, pg.ptH - h), w, h, label, kind: "marker" });
      }
    }

    // ② 표
    for (const hdr of ls) {
      const signH = hdr.find((i) => i.str.trim() === "서명");
      const nameH = hdr.find((i) => ["성명", "이름"].includes(i.str.trim()));
      if (!signH || !nameH) continue;
      const cols = hdr.filter((i) => i.str.trim()).sort((a, b) => a.x - b.x);
      const range = (col: TItem) => {
        const k = cols.indexOf(col), prev = cols[k - 1], next = cols[k + 1];
        const L = prev ? (cx(prev) + cx(col)) / 2 : Math.max(0, col.x - 20);
        const R = next ? (cx(col) + cx(next)) / 2 : Math.min(pg.ptW, cx(col) + (cx(col) - L));
        return [L, R] as const;
      };
      const [nL, nR] = range(nameH), [sL, sR] = range(signH);
      const cand = ls.filter((l) => l[0].y < signH.y - 4)
        .map((l) => ({ y: l[0].y, name: l.find((i) => cx(i) >= nL && cx(i) <= nR && /^[가-힣]{2,4}$/.test(i.str.trim()) && !STOP.has(i.str.trim())) }))
        .filter((r): r is { y: number; name: TItem } => !!r.name)
        .sort((a, b) => b.y - a.y);
      if (cand.length === 0) continue;
      // 머리글 바로 아래부터 연속된 행만 (간격이 행높이의 1.8배를 넘으면 표 끝)
      const rowH = cand.length > 1 ? Math.max(8, cand[0].y - cand[1].y) : 24;
      const rows: typeof cand = [];
      let prevY = signH.y;
      for (const r of cand) { if (prevY - r.y > rowH * 1.8) break; rows.push(r); prevY = r.y; }
      for (const r of rows) {
        const occupied = pg.items.some((i) => i.str.trim() && Math.abs(i.y - r.y) < rowH / 2 && cx(i) > sL && cx(i) < sR);
        if (occupied) continue;
        const bottom = r.y - (rowH - r.name.h) / 2 - 1;
        out.push({ page: pg.page, x: sL + 3, y: clamp(bottom, 0, pg.ptH), w: (sR - sL) - 6, h: rowH - 3, label: r.name.str.trim(), kind: "table" });
      }
    }
  }
  return out.filter((a, i) => !out.slice(0, i).some((b) => b.page === a.page && Math.abs(b.x - a.x) < 20 && Math.abs(b.y - a.y) < 12))
            .sort((a, b) => a.page - b.page || b.y - a.y);
}
