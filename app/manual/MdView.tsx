// 의존성 없는 가벼운 마크다운 렌더러 — 운영 매뉴얼 본문용.
//   지원: # ## ### 제목, - / * 목록, 1. 번호목록, | 표 |, **굵게**, 빈 줄=문단.
import React from "react";

function inline(text: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((p, i) =>
    p.startsWith("**") && p.endsWith("**") ? <strong key={i}>{p.slice(2, -2)}</strong> : <span key={i}>{p}</span>,
  );
}
const cells = (line: string) => line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
const isSep = (line: string) => /^\|?[\s:|-]+\|?$/.test(line.trim()) && line.includes("-");

export default function MdView({ md }: { md: string }) {
  const lines = (md || "").replace(/\r/g, "").split("\n");
  const blocks: React.ReactNode[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  let k = 0;
  const flush = () => {
    if (!list) return;
    const items = list.items.map((t, i) => <li key={i}>{inline(t)}</li>);
    blocks.push(list.ordered ? <ol key={k++}>{items}</ol> : <ul key={k++}>{items}</ul>);
    list = null;
  };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trimEnd();
    // 표: |...| 다음 줄이 |---| 구분선
    if (line.trim().startsWith("|") && i + 1 < lines.length && isSep(lines[i + 1])) {
      flush();
      const head = cells(line);
      i++; // skip separator
      const rows: string[][] = [];
      while (i + 1 < lines.length && lines[i + 1].trim().startsWith("|")) { i++; rows.push(cells(lines[i])); }
      blocks.push(
        <div key={k++} className="mn-tablewrap"><table>
          <thead><tr>{head.map((c, j) => <th key={j}>{inline(c)}</th>)}</tr></thead>
          <tbody>{rows.map((r, ri) => <tr key={ri}>{r.map((c, ci) => <td key={ci}>{inline(c)}</td>)}</tr>)}</tbody>
        </table></div>,
      );
      continue;
    }
    if (/^###\s+/.test(line)) { flush(); blocks.push(<h3 key={k++}>{inline(line.replace(/^###\s+/, ""))}</h3>); continue; }
    if (/^##\s+/.test(line)) { flush(); blocks.push(<h2 key={k++}>{inline(line.replace(/^##\s+/, ""))}</h2>); continue; }
    if (/^#\s+/.test(line)) { flush(); blocks.push(<h1 key={k++}>{inline(line.replace(/^#\s+/, ""))}</h1>); continue; }
    const ol = line.match(/^\d+\.\s+(.*)/);
    if (ol) { if (!list || !list.ordered) { flush(); list = { ordered: true, items: [] }; } list.items.push(ol[1]); continue; }
    const ul = line.match(/^[-*]\s+(.*)/);
    if (ul) { if (!list || list.ordered) { flush(); list = { ordered: false, items: [] }; } list.items.push(ul[1]); continue; }
    if (line.trim() === "") { flush(); continue; }
    flush(); blocks.push(<p key={k++}>{inline(line)}</p>);
  }
  flush();
  return <div className="mn-md">{blocks}</div>;
}
