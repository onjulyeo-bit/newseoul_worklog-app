-- ============================================================
-- 0027. 회원 '운영진 예정'(intended_role) — 로그인 전 미리 권한 지정
-- 새서울 CBMC '아름다운 만남'
-- Supabase 대시보드 → SQL Editor 에 붙여넣어 실행. (여러 번 실행해도 안전)
--
-- 명단에서 회원에게 '운영진 예정'을 표시해두면, 그 회원이 (이메일 자동연결 or
-- 수동연결)될 때 자동으로 운영진 권한이 부여된다. 비어 있으면 일반 회원.
-- ============================================================

-- 1) members.intended_role (null=회원 / 'admin'=운영진 예정) ----
alter table public.members
  add column if not exists intended_role text
  check (intended_role is null or intended_role in ('admin'));

comment on column public.members.intended_role is '연결 시 적용할 예정 권한. null=회원, admin=운영진 예정.';

-- 2) 자동 연결 시 예정 권한 적용 ----------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  matched uuid;
  intended text;
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;

  if new.email is not null and new.email <> '' then
    select id, intended_role into matched, intended
    from public.members
    where chapter_id = '새서울'
      and email is not null
      and lower(email) = lower(new.email)
    limit 1;

    if matched is not null then
      update public.profiles
      set member_id = matched,
          role = case when role = 'guest' then coalesce(nullif(intended, ''), 'member') else role end
      where id = new.id;
    end if;
  end if;

  return new;
end;
$$;
