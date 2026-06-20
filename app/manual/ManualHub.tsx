// 운영 매뉴얼 허브 — 섹션 카드 목록(운영진 전용). 순수 컴포넌트.
import Link from "next/link";
import { MANUAL_SECTIONS } from "./sections";
import { MN_CSS } from "./manualCss";

const fmt = (d: string | null) => {
  if (!d) return null;
  const t = new Date(d);
  return `${t.getFullYear()}.${t.getMonth() + 1}.${t.getDate()} 수정`;
};

export default function ManualHub({ updated }: { updated: Record<string, string> }) {
  return (
    <div className="moim-mn"><style>{MN_CSS}</style>
      <div className="page-head">
        <div>
          <h1 className="page-title">운영 매뉴얼</h1>
          <p className="page-sub">사회 진행·직임별 역할·연중 운영 안내. 운영진만 볼 수 있어요.</p>
        </div>
      </div>
      <div className="mn-grid">
        {MANUAL_SECTIONS.map(({ key, label, desc, Icon }) => (
          <Link key={key} href={`/manual/${key}`} className="mn-card">
            <span className="mn-ic"><Icon size={22} /></span>
            <div className="mn-card-b">
              <div className="mn-card-t">{label}</div>
              <div className="mn-card-d">{desc}</div>
              {fmt(updated[key]) && <div className="mn-card-meta">{fmt(updated[key])}</div>}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
