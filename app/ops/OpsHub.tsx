// 지회 운영 허브 — 매뉴얼(4) + 서류함(전자서명·보관 서류) 카드. 순수 컴포넌트(운영진 전용, 게이트는 page.tsx).
import Link from "next/link";
import { PenLine, FolderArchive } from "lucide-react";
import { MANUAL_SECTIONS } from "../manual/sections";
import { OPS_CSS } from "./opsCss";

const fmt = (d: string | null | undefined) => {
  if (!d) return null;
  const t = new Date(d);
  return `${t.getFullYear()}.${t.getMonth() + 1}.${t.getDate()} 수정`;
};

export type OpsHubProps = {
  manualUpdated: Record<string, string>;
  activeSigns: number;   // 진행중 서명 요청 수
  docsCount: number;     // 보관 서류 수 (서명 완료본 + 업로드)
};

export default function OpsHub({ manualUpdated, activeSigns, docsCount }: OpsHubProps) {
  return (
    <div className="moim-ops"><style>{OPS_CSS}</style>
      <div className="page-head">
        <div>
          <h1 className="page-title">지회 운영</h1>
          <p className="page-sub">운영 매뉴얼과 지회 서류함. 운영진만 볼 수 있어요.</p>
        </div>
      </div>

      <section className="ops-sec">
        <h2 className="ops-sec-t">매뉴얼</h2>
        <div className="mn-grid">
          {MANUAL_SECTIONS.map(({ key, label, desc, Icon }) => (
            <Link key={key} href={`/manual/${key}`} className="mn-card">
              <span className="mn-ic"><Icon size={22} /></span>
              <div className="mn-card-b">
                <div className="mn-card-t">{label}</div>
                <div className="mn-card-d">{desc}</div>
                {fmt(manualUpdated[key]) && <div className="mn-card-meta">{fmt(manualUpdated[key])}</div>}
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="ops-sec">
        <h2 className="ops-sec-t">서류함</h2>
        <div className="mn-grid">
          <Link href="/sign" className="mn-card">
            <span className="mn-ic"><PenLine size={22} /></span>
            <div className="mn-card-b">
              <div className="mn-card-t">전자서명</div>
              <div className="mn-card-d">문서를 올리고 링크로 서명을 받아요. 연임 동의서 등</div>
              <div className="mn-card-meta">{activeSigns > 0 ? <>진행중 <b>{activeSigns}</b>건</> : "진행중인 요청 없음"}</div>
            </div>
          </Link>
          <Link href="/ops/docs" className="mn-card">
            <span className="mn-ic amber"><FolderArchive size={22} /></span>
            <div className="mn-card-b">
              <div className="mn-card-t">보관 서류</div>
              <div className="mn-card-d">서명 완료본이 자동 보관되고, 규약·회의록·공문도 직접 올려요</div>
              <div className="mn-card-meta">{docsCount > 0 ? <><b>{docsCount}</b>건 보관 중</> : "아직 보관된 서류 없음"}</div>
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}
