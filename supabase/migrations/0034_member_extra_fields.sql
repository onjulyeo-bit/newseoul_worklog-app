-- ============================================================
-- 0034. 회원 추가 항목 — 생년월일·주소·출석교회 (+ 자기입력 RPC 갱신)
-- 새서울 CBMC '아름다운 만남'
-- Supabase 대시보드 → SQL Editor 에 붙여넣어 실행. (여러 번 실행해도 안전)
--
-- 이메일·가입일(joined_on)은 이미 있음. 여기선 생년월일/주소/출석교회만 추가.
-- 자기입력 폼(/my-info)에서도 본인이 채울 수 있게 RPC를 새 항목 포함해 재정의.
-- ⚠️ 주민번호 등 민감정보는 저장하지 않음(원칙 유지). 생년월일은 text(자유형식).
-- ============================================================

alter table public.members add column if not exists birth_date  text;
alter table public.members add column if not exists address     text;
alter table public.members add column if not exists home_church text;

-- 반환 타입이 바뀌므로 기존 함수 삭제 후 재생성 ---------------
drop function if exists public.member_self_lookup(text, text);
create or replace function public.member_self_lookup(p_name text, p_last4 text)
returns table (
  id uuid, name text, phone text, email text, company text, "position" text,
  industry text, spouse_name text, car_model text, car_number text,
  birth_date text, address text, home_church text
)
language sql security definer set search_path = public as $$
  select id, name, phone, email, company, "position", industry, spouse_name, car_model, car_number,
         birth_date, address, home_church
  from public.members
  where chapter_id = '새서울' and name = p_name
    and (phone is null or phone = '' or right(regexp_replace(coalesce(phone,''),'[^0-9]','','g'), 4) = p_last4)
  order by created_at nulls last
  limit 1;
$$;

drop function if exists public.member_self_update(uuid, text, text, text, text, text, text, text, text, text, text);
create or replace function public.member_self_update(
  p_id uuid, p_name text, p_last4 text,
  p_phone text, p_email text, p_company text, p_position text, p_industry text,
  p_spouse text, p_car_model text, p_car_number text,
  p_birth text, p_address text, p_church text
) returns boolean
language plpgsql security definer set search_path = public as $$
declare ok boolean;
begin
  select exists (
    select 1 from public.members
    where id = p_id and chapter_id = '새서울' and name = p_name
      and (phone is null or phone = '' or right(regexp_replace(coalesce(phone,''),'[^0-9]','','g'), 4) = p_last4)
  ) into ok;
  if not ok then return false; end if;

  update public.members set
    phone = nullif(btrim(p_phone), ''),
    email = nullif(btrim(p_email), ''),
    company = nullif(btrim(p_company), ''),
    "position" = nullif(btrim(p_position), ''),
    industry = nullif(btrim(p_industry), ''),
    spouse_name = nullif(btrim(p_spouse), ''),
    car_model = nullif(btrim(p_car_model), ''),
    car_number = nullif(btrim(p_car_number), ''),
    birth_date = nullif(btrim(p_birth), ''),
    address = nullif(btrim(p_address), ''),
    home_church = nullif(btrim(p_church), '')
  where id = p_id;
  return true;
end; $$;

grant execute on function public.member_self_lookup(text, text) to anon, authenticated;
grant execute on function public.member_self_update(uuid, text, text, text, text, text, text, text, text, text, text, text, text, text) to anon, authenticated;
