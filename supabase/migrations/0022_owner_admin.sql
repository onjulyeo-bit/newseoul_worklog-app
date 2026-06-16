-- ============================================================
-- 0022. 메인 관리자(owner) + 서브 관리자 구분
-- 새서울 CBMC '아름다운 만남'
-- Supabase 대시보드 → SQL Editor 에 붙여넣어 실행. (여러 번 실행해도 안전)
--
-- 개념:
--  - 메인 관리자(owner): onjulyeo. 영구 보호. SQL로만 지정(앱에서 못 바꿈).
--  - 서브 관리자(admin): 메인이 /역할관리에서 올리고 내림. 운영은 다 하되 역할변경 불가.
--  - 역할(role) 변경은 '메인만' 가능.
-- ============================================================

-- 1) is_owner 컬럼 ------------------------------------------
alter table public.profiles
  add column if not exists is_owner boolean not null default false;

comment on column public.profiles.is_owner is '메인 관리자 표시. SQL로만 지정, 앱에서 변경 불가(트리거 보호).';

-- 2) 메인 관리자 여부 함수 (RLS 재귀 회피용 SECURITY DEFINER) --
create or replace function public.is_owner()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_owner = true
  );
$$;

-- 3) 역할 변경은 '메인만' ------------------------------------
--    기존 admin_update_all(아무 임원이나 수정) 제거 → owner_update_all 로 교체.
drop policy if exists "admin_update_all" on public.profiles;
drop policy if exists "owner_update_all" on public.profiles;
create policy "owner_update_all" on public.profiles
  for update using (public.is_owner()) with check (public.is_owner());

-- 4) 메인 관리자 보호 트리거 --------------------------------
--    앱(로그인 사용자) 경로에서는: is_owner 변경 금지 + 메인 역할 강등 금지.
--    SQL Editor(직접 실행, auth.uid()=null)에서는 통과 → 운영자가 수동 교정 가능.
create or replace function public.protect_owner()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if auth.uid() is not null then
    if new.is_owner is distinct from old.is_owner then
      raise exception '메인 관리자 표시는 앱에서 변경할 수 없습니다.';
    end if;
    if old.is_owner and new.role <> 'admin' then
      raise exception '메인 관리자의 권한은 내릴 수 없습니다.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_owner_trg on public.profiles;
create trigger protect_owner_trg
  before update on public.profiles
  for each row execute function public.protect_owner();

-- 5) 메인 관리자 지정 ---------------------------------------
update public.profiles
set role = 'admin', is_owner = true
where email = 'onjulyeo@gmail.com';
