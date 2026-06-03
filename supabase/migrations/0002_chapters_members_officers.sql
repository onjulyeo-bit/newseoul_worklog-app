-- ============================================================
-- 0002. chapters(지회설정) + members(회원) + officer_terms(연도별 임원)
-- 전부 chapter_id 포함(지금은 값이 전부 '새서울').
-- RLS: 회원 개인정보(members)는 임원(admin)만. 지회정보·임원명단은 로그인하면 열람.
-- 여러 번 실행해도 안전(idempotent).
-- ============================================================

-- 1) chapters (지회 설정) ------------------------------------
create table if not exists public.chapters (
  chapter_id            text primary key,             -- '새서울' (지회 구분자)
  name                  text not null,                -- 지회명
  union_name            text,                         -- 소속 연합회 (남부연합회)
  meeting_day           text,                         -- 모임 요일 (금요일)
  meeting_time          text,                         -- 모임 시간 (오전 7시)
  meeting_place         text,                         -- 모임 장소 (충현교회)
  dues_existing         integer,                      -- 기존 회비 (원)
  dues_new              integer,                      -- 신입 회비 (원)
  account_info          text,                         -- 입금 계좌 안내 (문구)
  order_template_offline text,                        -- 진행순서 템플릿(오프라인)
  order_template_online  text,                        -- 진행순서 템플릿(온라인)
  logo_url              text,
  color                 text,
  created_at            timestamptz not null default now()
);

comment on table public.chapters is '지회별 설정. 지회마다 다른 값(회비·요일·장소·템플릿)을 코드에 박지 않고 여기 저장.';

-- 새서울 기본값 1줄 (이미 있으면 그대로 둠)
insert into public.chapters
  (chapter_id, name, union_name, meeting_day, meeting_time, meeting_place, dues_existing, dues_new)
values
  ('새서울', '새서울지회', '남부연합회', '금요일', '오전 7시', '충현교회', 600000, 650000)
on conflict (chapter_id) do nothing;

-- 2) members (회원) -----------------------------------------
create table if not exists public.members (
  id                  uuid primary key default gen_random_uuid(),
  chapter_id          text not null default '새서울' references public.chapters (chapter_id),

  -- 기본
  name                text not null,
  gender              text,                            -- 남/여
  phone               text,
  email               text,
  address             text,
  photo_url           text,
  joined_on           date,                            -- 가입 시기
  intro               text,                            -- 간략 소개

  -- 분류 (3층 구조)
  registration        text check (registration in ('등록회원', '비등록')),     -- ① 등록여부
  grade               text check (grade in ('명예회원','정회원','부부회원','준회원','신입회원')), -- ② 등급
  status              text check (status in ('활동중','유보','등록전','OB')),    -- ③ 상태
  tags                text[] default '{}',             -- 이력태그(증경회장·현임원 등, 복수)

  -- 부부 / 직업
  spouse_name         text,                            -- 배우자 이름(부부회원)
  industry            text,                            -- 업종
  company             text,                            -- 직장명
  position            text,                            -- 직위

  -- 교육
  vision_school       text,                            -- 비전스쿨 수료기수
  leadership_school   text,                            -- 리더십스쿨

  -- 차량 (1인 1대, 주차 관리용)
  car_model           text,                            -- 차종
  car_number          text,                            -- 차량번호
  parking_registered  boolean not null default false,  -- 주차 등록 여부

  -- 웰커밍 (신규회원)
  inviter_name        text,                            -- 초대자
  mentor_member_id    uuid references public.members (id),  -- 담당 정회원
  followup_started_on date,                            -- 팔로업 시작일

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

comment on table public.members is '지회 회원 명단. 민감정보(주민번호·계좌번호) 저장 금지.';

-- 3) officer_terms (연도별 임원) ----------------------------
create table if not exists public.officer_terms (
  id          uuid primary key default gen_random_uuid(),
  chapter_id  text not null default '새서울' references public.chapters (chapter_id),
  year        integer not null,                        -- 연도 (예: 2026)
  role        text not null,                           -- 직임 (지회장/총무/간사/감사/부총무/중보기도/운영자문단 ...)
  member_id   uuid references public.members (id),     -- 어느 회원인지 연결
  note        text,
  created_at  timestamptz not null default now()
);

comment on table public.officer_terms is '연도별 임원 명단. 직임은 고정, 사람은 수기 선택. 매년 새 연도 행 추가.';

-- 4) RLS ----------------------------------------------------
alter table public.chapters      enable row level security;
alter table public.members       enable row level security;
alter table public.officer_terms enable row level security;

-- chapters: 로그인한 사람은 누구나 조회(모임정보), 수정은 임원만
drop policy if exists "chapters_select_authed" on public.chapters;
create policy "chapters_select_authed" on public.chapters
  for select using (auth.uid() is not null);

drop policy if exists "chapters_write_admin" on public.chapters;
create policy "chapters_write_admin" on public.chapters
  for all using (public.is_admin()) with check (public.is_admin());

-- members: 임원만 전체 권한 (회원 개인정보 보호. 회원용 디렉토리는 추후 별도)
drop policy if exists "members_admin_all" on public.members;
create policy "members_admin_all" on public.members
  for all using (public.is_admin()) with check (public.is_admin());

-- officer_terms: 로그인한 사람은 조회(임원명단은 공개), 수정은 임원만
drop policy if exists "officers_select_authed" on public.officer_terms;
create policy "officers_select_authed" on public.officer_terms
  for select using (auth.uid() is not null);

drop policy if exists "officers_write_admin" on public.officer_terms;
create policy "officers_write_admin" on public.officer_terms
  for all using (public.is_admin()) with check (public.is_admin());
