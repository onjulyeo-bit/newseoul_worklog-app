-- ============================================================
-- 0026. 로그인 계정(profiles) ↔ 명단 회원(members) 연결
-- 새서울 CBMC '아름다운 만남'
-- Supabase 대시보드 → SQL Editor 에 붙여넣어 실행. (여러 번 실행해도 안전)
--
-- A안: 회원은 카카오로 로그인, 메인이 명단 회원과 연결 + 권한 지정.
--   이메일이 채워진 회원은 로그인 시 자동 연결 + '회원(member)' 권한 부여.
-- ============================================================

-- 1) profiles에 member_id (명단 회원 연결) ------------------
alter table public.profiles
  add column if not exists member_id uuid references public.members (id) on delete set null;

comment on column public.profiles.member_id is '이 로그인 계정이 가리키는 명단 회원(members.id). 미연결이면 null.';

-- 2) 새 로그인 시 이메일로 자동 연결 -----------------------
--    이메일이 명단 회원과 같으면 member_id 연결 + role을 member로(guest일 때만).
--    이메일이 없거나(카카오 미동의) 매칭이 없으면 guest 유지 → 관리자가 수동 연결.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  matched uuid;
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;

  if new.email is not null and new.email <> '' then
    select id into matched
    from public.members
    where chapter_id = '새서울'
      and email is not null
      and lower(email) = lower(new.email)
    limit 1;

    if matched is not null then
      update public.profiles
      set member_id = matched,
          role = case when role = 'guest' then 'member' else role end
      where id = new.id;
    end if;
  end if;

  return new;
end;
$$;

-- 트리거는 0001에서 이미 생성됨(on_auth_user_created) — 함수만 교체하면 적용됨.
