// 엑셀(.xlsx)을 읽어 회원 행으로 변환. 헤더 '이름'을 찾고, 열은 헤더 이름으로 인식.
import * as XLSX from "xlsx";

export type ParsedMember = {
  name: string;
  gender: string | null;
  phone: string | null;
  grade: string | null;
  status: string;
  spouse_name: string | null;
  industry: string | null;
  company: string | null;
  position: string | null;
  vision_school: string | null;
  leadership_school: string | null;
  car_model: string | null;
  car_number: string | null;
  joined_on: string | null;
  tags: string[];
};

const clean = (v: unknown): string | null => {
  if (v == null) return null;
  const s = String(v).replace(/ /g, " ").trim().replace(/\s+/g, " ");
  return s === "" ? null : s;
};

const GRADES = ["명예회원", "정회원", "부부회원", "준회원", "신입회원", "유보회원"];

export function parseMembersXlsx(buf: ArrayBuffer): ParsedMember[] {
  const wb = XLSX.read(buf, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, blankrows: false });

  // 헤더 행 찾기 ('이름' 포함하는 줄)
  let h = -1;
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    if (rows[i]?.some((c) => clean(c) === "이름")) { h = i; break; }
  }
  if (h < 0) throw new Error("'이름' 열을 찾지 못했어요. 첫 시트에 '이름' 헤더가 있어야 합니다.");

  // 빈 칸이 있는 행은 '구멍'이 생기므로 빈틈 없이 문자열 배열로 정규화
  const rawHeader = rows[h] as unknown[];
  const headers: string[] = [];
  for (let i = 0; i < rawHeader.length; i++) headers[i] = clean(rawHeader[i]) ?? "";
  const find = (...kw: string[]) =>
    headers.findIndex((hh) => hh !== "" && kw.some((k) => hh.includes(k)));

  const iName = find("이름");
  const iGender = find("성별");
  const iPhone = find("연락처");
  const iIndustry = find("업종");
  const iCompany = find("직장");
  const iPosition = find("직위");
  const iRole = headers.findIndex((hh) => ["직책", "?", "임원", "이력", "배지"].includes(hh));
  const iGrade = find("회원구분", "등급");
  const iSpouse = find("배우자");
  const iCarModel0 = find("차종");
  const iCarNum0 = find("차량번호");
  const iJoined = find("등록시기", "가입");
  const iVision = find("비전");
  const iLeader = find("리더십");

  const out: ParsedMember[] = [];
  for (let r = h + 1; r < rows.length; r++) {
    const row = (rows[r] as unknown[]) || [];
    const cell = (i: number) => (i >= 0 ? clean(row[i]) : null);
    const name = cell(iName);
    if (!name) continue;

    // 연락처: '연락처' 칸 + (헤더가 빈) 다음 칸 합치기 → 010-XXXX-XXXX
    let phone: string | null = null;
    const p = cell(iPhone);
    const p2 = iPhone >= 0 && (headers[iPhone + 1] ?? "") === "" ? cell(iPhone + 1) : null;
    if (p && p2) phone = `${p}-${p2.replace(/\s+/g, "-")}`;
    else if (p) phone = p.includes(" ") && !p.startsWith("010") ? `010-${p.replace(/\s+/g, "-")}` : p;

    // 차량: '차종'이 있으면 그게 모델 / '차량번호'가 번호. '차량번호'만 있으면 그게 모델 + 다음칸이 번호
    let car_model: string | null = null;
    let car_number: string | null = null;
    if (iCarModel0 >= 0) {
      car_model = cell(iCarModel0);
      car_number = cell(iCarNum0);
    } else if (iCarNum0 >= 0) {
      car_model = cell(iCarNum0);
      car_number = (headers[iCarNum0 + 1] ?? "") === "" ? cell(iCarNum0 + 1) : null;
    }

    const gradeRaw = cell(iGrade);
    const grade = gradeRaw && GRADES.includes(gradeRaw) ? gradeRaw : null;
    const role = cell(iRole);
    const vRaw = cell(iVision);
    const lRaw = cell(iLeader);
    const jRaw = cell(iJoined);

    out.push({
      name,
      gender: cell(iGender),
      phone,
      grade,
      status: "활동",
      spouse_name: cell(iSpouse),
      industry: cell(iIndustry),
      company: cell(iCompany),
      position: cell(iPosition),
      vision_school: vRaw === "O" ? "수료" : vRaw === "X" ? null : vRaw,
      leadership_school: lRaw === "O" ? "수료" : lRaw === "X" ? null : lRaw,
      car_model,
      car_number,
      joined_on: jRaw && /^\d{4}$/.test(jRaw) ? `${jRaw}-01-01` : null,
      tags: role ? [role] : [],
    });
  }
  return out;
}

// 부부 배우자 서로 매칭 (한쪽만 입력돼 있으면 반대쪽도 채움)
export function fillSpouses(members: ParsedMember[]): ParsedMember[] {
  const byName = new Map(members.map((m) => [m.name, m]));
  for (const m of members) {
    if (m.spouse_name && byName.has(m.spouse_name)) {
      const sp = byName.get(m.spouse_name)!;
      if (!sp.spouse_name) sp.spouse_name = m.name;
    }
  }
  return members;
}
