"use client";

// 상단 헤더 + 관리자 메뉴. 회원용 체크인 페이지(/checkin)에선 숨긴다.
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SiteNav() {
  const pathname = usePathname();

  // 회원이 QR로 들어오는 체크인 페이지에선 관리자 메뉴/헤더를 보이지 않게.
  if (pathname?.startsWith("/checkin")) return null;

  return (
    <>
      {/* 상단 헤더 밴드 — 로고·제목 클릭 시 홈(회원 목록)으로. 인쇄 시 숨김 */}
      <header className="border-b border-line bg-card print:hidden">
        <Link href="/" className="mx-auto flex max-w-[1320px] flex-col items-start gap-2 px-5 py-6 transition hover:opacity-80">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/cbmc-logo.png" alt="CBMC" className="h-10 w-auto" />
          <h1 className="text-[26px] font-bold tracking-tight text-ink">새서울 CBMC 아름다운 만남</h1>
        </Link>
      </header>

      {/* 관리자 메뉴 — 인쇄 시 숨김 */}
      <nav className="border-b border-line bg-card print:hidden">
        <div className="mx-auto flex max-w-[1320px] gap-1 px-5 py-2 text-[15px] font-semibold">
          <a href="/" className="rounded-md px-3 py-1.5 text-ink-soft hover:bg-surface-soft hover:text-primary">회원 관리</a>
          <a href="/schedule" className="rounded-md px-3 py-1.5 text-ink-soft hover:bg-surface-soft hover:text-primary">연간 일정</a>
          <a href="/attendance" className="rounded-md px-3 py-1.5 text-ink-soft hover:bg-surface-soft hover:text-primary">출석·식대</a>
          <a href="/finance" className="rounded-md px-3 py-1.5 text-ink-soft hover:bg-surface-soft hover:text-primary">회계</a>
          <a href="/content" className="rounded-md px-3 py-1.5 text-ink-soft hover:bg-surface-soft hover:text-primary">콘텐츠 생성</a>
          <a href="/archive" className="rounded-md px-3 py-1.5 text-ink-soft hover:bg-surface-soft hover:text-primary">아카이브</a>
        </div>
      </nav>
    </>
  );
}
