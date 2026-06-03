"use client";

// 노션/엑셀식 회원 표 — 정렬 + 조건 필터 + 검색 + 열 켜고끄기.
// 헤드리스 라이브러리(TanStack Table)가 정렬·필터 "계산"을 맡고, 디자인은 우리가 DESIGN.md대로 입힘.
import Link from "next/link";
import { useMemo, useState } from "react";
import { downloadXlsx, downloadCsv } from "@/lib/exportTable";
import {
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";

export type Member = {
  id: string;
  name: string;
  gender: string | null;
  phone: string | null;
  registration: string | null;
  grade: string | null;
  status: string | null;
  spouse_name: string | null;
  industry: string | null;
  company: string | null;
  position: string | null;
  vision_school: string | null;
  leadership_school: string | null;
  car_model: string | null;
  car_number: string | null;
  parking_registered: boolean | null;
  joined_on: string | null;
  tags: string[] | null;
};

function statusPill(status: string | null) {
  switch (status) {
    case "활동":
      return "bg-[rgba(0,102,204,.12)] text-present"; // 파랑 — 잘 나옴
    case "휴면":
      return "bg-[rgba(196,125,26,.14)] text-warning"; // 주황 — 한동안 안 나옴
    case "비활동":
      return "bg-[rgba(192,57,43,.13)] text-unpaid"; // 빨강 — 장기 미참
    default: // OB 등
      return "bg-surface-soft text-muted"; // 회색
  }
}

// 직책/이력 배지 색 (직책별 색 구분)
function badgeClass(tag: string) {
  if (tag === "증경회장") return "bg-[rgba(196,125,26,.15)] text-[#9a6212]"; // 예우 — 금빛
  if (["지회장", "회장"].includes(tag)) return "bg-[rgba(0,102,204,.14)] text-primary"; // 현 대표 — 파랑
  if (["총무", "간사", "감사", "부총무"].includes(tag)) return "bg-[rgba(46,125,82,.14)] text-success"; // 임원 — 초록
  if (["고문", "운영위원", "운영자문단"].includes(tag)) return "bg-surface-soft text-ink-soft"; // 자문 — 회색
  return "bg-[rgba(0,102,204,.12)] text-primary"; // 그 외 — 파랑
}

const text = (v: unknown) => (v == null || v === "" ? "—" : String(v));

// 내보내기용 행 (한글 헤더)
function toExportRows(members: Member[]) {
  return members.map((m) => ({
    이름: m.name,
    성별: m.gender ?? "",
    회원구분: m.grade ?? "",
    상태: m.status ?? "",
    연락처: m.phone ?? "",
    배우자: m.spouse_name ?? "",
    업종: m.industry ?? "",
    직장명: m.company ?? "",
    직위: m.position ?? "",
    "비전스쿨 수료": m.vision_school ?? "",
    "리더십스쿨 수료": m.leadership_school ?? "",
    차종: m.car_model ?? "",
    차량번호: m.car_number ?? "",
    주차등록: m.parking_registered ? "O" : "",
    회원등록일: m.joined_on ?? "",
    기타: (m.tags ?? []).join(", "),
  }));
}

export default function MembersTable({ members }: { members: Member[] }) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  // 처음엔 핵심 열만 보이게 (나머지는 '열' 메뉴에서 켜기)
  // 등급·상태는 '회원구분'으로 합쳐 숨김. 나머지는 모두 표시(가로 스크롤).
  // 핵심 열만 기본 표시. 나머지는 '구분' 메뉴에서 켜기.
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    industry: false,
    vision_school: false,
    leadership_school: false,
    car_number: false,
    spouse_name: false,
    joined_on: false,
    tags: false,
  });

  const columns = useMemo<ColumnDef<Member>[]>(
    () => [
      {
        accessorKey: "name",
        header: "이름",
        cell: (c) => {
          const m = c.row.original;
          return (
            <span className="flex items-center gap-1.5">
              <Link
                href={`/members/${m.id}`}
                className="font-bold text-ink hover:text-primary hover:underline"
              >
                {m.name}
              </Link>
              {(m.tags ?? []).map((t) => (
                <span
                  key={t}
                  className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${badgeClass(t)}`}
                >
                  {t}
                </span>
              ))}
            </span>
          );
        },
      },
      {
        id: "membership",
        header: "회원구분",
        // 회원구분 = 등급(상태는 별도 '상태' 칸으로 분리)
        accessorFn: (row) => row.grade ?? "",
        filterFn: "equalsString",
        cell: (c) => text(c.getValue()),
      },
      {
        accessorKey: "status",
        header: "상태",
        filterFn: "equalsString",
        cell: (c) => {
          const v = c.getValue() as string | null;
          return (
            <span className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-bold ${statusPill(v)}`}>
              {text(v)}
            </span>
          );
        },
      },
      { accessorKey: "phone", header: "연락처", cell: (c) => text(c.getValue()) },
      { accessorKey: "company", header: "직장", cell: (c) => text(c.getValue()) },
      { accessorKey: "position", header: "직위", cell: (c) => text(c.getValue()) },
      { accessorKey: "industry", header: "업종", cell: (c) => text(c.getValue()) },
      { accessorKey: "joined_on", header: "회원등록일", cell: (c) => text(c.getValue()) },
      { accessorKey: "car_number", header: "차량번호", cell: (c) => text(c.getValue()) },
      { accessorKey: "vision_school", header: "비전스쿨 수료", cell: (c) => text(c.getValue()) },
      { accessorKey: "leadership_school", header: "리더십스쿨 수료", cell: (c) => text(c.getValue()) },
      { accessorKey: "spouse_name", header: "배우자", cell: (c) => text(c.getValue()) },
      {
        accessorKey: "tags",
        header: "기타",
        enableSorting: false,
        filterFn: (row, id, val) => {
          if (!val) return true;
          const t = (row.getValue(id) as string[] | null) ?? [];
          return t.includes(val as string);
        },
        cell: (c) => {
          const t = (c.getValue() as string[] | null) ?? [];
          return t.length ? (
            <span className="flex flex-wrap gap-1">
              {t.map((x) => (
                <span
                  key={x}
                  className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${badgeClass(x)}`}
                >
                  {x}
                </span>
              ))}
            </span>
          ) : (
            "—"
          );
        },
      },
    ],
    [],
  );

  const table = useReactTable({
    data: members,
    columns,
    state: { sorting, columnFilters, globalFilter, columnVisibility },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: "includesString",
  });

  // 필터 드롭다운 값 설정 헬퍼
  const setFilter = (id: string, value: string) =>
    table.getColumn(id)?.setFilterValue(value === "" ? undefined : value);
  const getFilter = (id: string) => (table.getColumn(id)?.getFilterValue() as string) ?? "";

  const selectCls =
    "min-h-[40px] rounded-md border border-line bg-card px-3 text-[15px] text-ink-soft outline-none focus:border-primary-focus";

  const shown = table.getRowModel().rows.length;

  return (
    <div className="flex flex-col gap-3">
      {/* 툴바: 검색 + 조건 필터 + 열 메뉴 */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="검색 (이름·직장·업종 등)"
          className="min-h-[40px] min-w-[200px] flex-1 rounded-md border border-line bg-card px-3.5 text-[16px] text-ink outline-none placeholder:text-muted focus:border-primary-focus"
        />

        <select className={selectCls} value={getFilter("membership")} onChange={(e) => setFilter("membership", e.target.value)}>
          <option value="">회원구분 전체</option>
          {["정회원", "부부회원", "명예회원", "준회원", "신입회원", "유보회원"].map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>

        <select className={selectCls} value={getFilter("status")} onChange={(e) => setFilter("status", e.target.value)}>
          <option value="">상태 전체</option>
          {["활동", "휴면", "비활동", "OB"].map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>

        {/* 보일 항목(구분) 켜고끄기 메뉴 */}
        <details className="relative">
          <summary className="flex min-h-[40px] cursor-pointer list-none items-center rounded-md border border-line bg-card px-3 text-[15px] font-semibold text-ink-soft hover:border-primary hover:text-primary">
            구분 ▾
          </summary>
          <div className="absolute right-0 z-10 mt-1 w-44 rounded-md border border-line bg-card p-2 shadow-[0_8px_24px_rgba(0,0,0,.1)]">
            {table.getAllLeafColumns().map((col) => (
              <label key={col.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-[14px] text-ink hover:bg-surface-soft">
                <input
                  type="checkbox"
                  checked={col.getIsVisible()}
                  onChange={col.getToggleVisibilityHandler()}
                  className="accent-primary"
                />
                {String(col.columnDef.header)}
              </label>
            ))}
          </div>
        </details>

        <button
          onClick={() => {
            setColumnFilters([]);
            setGlobalFilter("");
          }}
          className="min-h-[40px] rounded-md border border-line px-3 text-[15px] font-semibold text-ink-soft hover:border-primary hover:text-primary"
        >
          필터 초기화
        </button>

        <button onClick={() => downloadXlsx(toExportRows(members), "회원명단")} className="min-h-[40px] rounded-md border border-line px-3 text-[15px] font-semibold text-ink-soft hover:border-primary hover:text-primary">⬇ 엑셀</button>
        <button onClick={() => downloadCsv(toExportRows(members), "회원명단")} className="min-h-[40px] rounded-md border border-line px-3 text-[15px] font-semibold text-ink-soft hover:border-primary hover:text-primary">⬇ CSV</button>
      </div>

      <div className="text-[13px] text-ink-soft">
        {shown}명 표시 {shown !== members.length && `(전체 ${members.length}명 중)`}
      </div>

      {/* 표 */}
      <div className="overflow-x-auto rounded-lg border border-line bg-card">
        <table className="w-full border-collapse text-[15px]">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="border-b-[1.5px] border-line">
                {hg.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const dir = header.column.getIsSorted();
                  return (
                    <th
                      key={header.id}
                      onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                      className={`px-3 py-3 text-left text-[12px] font-bold uppercase tracking-wide text-ink-soft ${canSort ? "cursor-pointer select-none hover:text-primary" : ""}`}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {dir === "asc" ? " ▲" : dir === "desc" ? " ▼" : canSort ? " ⇅" : ""}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={table.getVisibleLeafColumns().length} className="px-3 py-10 text-center text-[15px] text-ink-soft">
                  조건에 맞는 회원이 없습니다.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="border-b border-line last:border-b-0 hover:bg-surface-soft">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-3 py-3 align-top text-ink-soft">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
