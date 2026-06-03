-- ============================================================
-- 0001. profiles(회원 권한) + 역할(role) + RLS 보안
-- 새서울 CBMC '아름다운 만남'
-- 이 파일은 Supabase 대시보드 → SQL Editor 에 붙여넣어 실행합니다.
-- 여러 번 실행해도 안전하도록(idempotent) 작성했습니다.
-- ============================================================

-- 1) profiles 테이블 -----------------------------------------
--   로그인 사용자(auth.users) 1명당 1행. 여기에 '역할'을 저장.
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  chapter_id  text not null default '새서울',     -- 모든 주요 테이블에 지회 구분자(지금은 전부 '새서울')
  role        text not null default 'guest'
              check (role in ('admin', 'member', 'guest')),  -- 임원/회원/관심
  email       text,
  full_name   text,
  created_at  timestamptz not null default now()
);

comment on table public.profiles is '로그인 사용자별 권한·기본정보. role: admin(임원)/member(회원)/guest(관심)';

-- 2) 임원 여부 확인 함수 --------------------------------------
--   RLS 정책 안에서 profiles를 다시 조회하면 무한루프가 나므로,
--   SECURITY DEFINER 함수로 RLS를 우회해 안전하게 역할을 읽는다.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- 3) 새 가입자 → profile 자동 생성 ---------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4) RLS(행 수준 보안) 켜기 + 정책 ---------------------------
alter table public.profiles enable row level security;

-- (a) 본인 프로필은 본인이 조회 가능
drop policy if exists "select_own_profile" on public.profiles;
create policy "select_own_profile" on public.profiles
  for select using (auth.uid() = id);

-- (b) 임원(admin)은 전체 조회 가능
drop policy if exists "admin_select_all" on public.profiles;
create policy "admin_select_all" on public.profiles
  for select using (public.is_admin());

-- (c) 임원(admin)은 전체 수정 가능
--     (회원의 직접 수정은 막음 — 권한 상승 방지. 회원 프로필 수정은 추후 '수정요청'으로)
drop policy if exists "admin_update_all" on public.profiles;
create policy "admin_update_all" on public.profiles
  for update using (public.is_admin()) with check (public.is_admin());

-- 5) 기존 가입자 백필 + 사장님을 임원으로 지정 ----------------
--   (트리거가 없던 시절 가입한 사용자는 profile이 없으므로 채워준다)
insert into public.profiles (id, email)
select id, email from auth.users
on conflict (id) do nothing;

update public.profiles
set role = 'admin'
where email = 'onjulyeo@gmail.com';
