-- ============================================================
-- 0035. 생일 양·음력 구분 + 주소 집/회사 구분 (+ 자기입력 RPC 갱신)
-- 새서울 CBMC '아름다운 만남'
-- Supabase 대시보드 → SQL Editor 에 붙여넣어 실행. (여러 번 실행해도 안전)
--
-- birth_date=실제 생일(자유형식 text). birth_calendar='양력'|'음력'.
-- address=주소 1개(집 또는 회사). address_type='집'|'회사'(둘 다 받지 않음).
-- ============================================================

alter table public.members add column if not exists birth_calendar text; -- 양력 | 음력
alter table public.members add column if not exists address_type   text; -- 집 | 회사

-- 자기입력 RPC를 새 항목 포함해 재정의 (반환·인자 변경 → drop 후 재생성)
drop function if exists public.member_self_lookup(text, text);
create or replace function public.member_self_lookup(p_name text, p_last4 text)
returns table (
  id uuid, name text, phone text, email text, company text, "position" text,
  industry text, spouse_name text, car_model text, car_number text,
  birth_date text, birth_calendar text, address text, address_type text, home_church text
)
language sql security definer set search_path = public as $$
  select id, name, phone, email, company, "position", industry, spouse_name, car_model, car_number,
         birth_date, birth_calendar, address, address_type, home_church
  from public.members
  where chapter_id = '새서울' and name = p_name
    and (phone is null or phone = '' or right(regexp_replace(coalesce(phone,''),'[^0-9]','','g'), 4) = p_last4)
  order by created_at nulls last
  limit 1;
$$;

drop function if exists public.member_self_update(uuid, text, text, text, text, text, text, text, text, text, text, text, text, text);
create or replace function public.member_self_update(
  p_id uuid, p_name text, p_last4 text,
  p_phone text, p_email text, p_company text, p_position text, p_industry text,
  p_spouse text, p_car_model text, p_car_number text,
  p_birth text, p_birth_cal text, p_address text, p_addr_type text, p_church text
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
    phone = nullif(btrim(p_phone), ''), email = nullif(btrim(p_email), ''),
    company = nullif(btrim(p_company), ''), "position" = nullif(btrim(p_position), ''),
    industry = nullif(btrim(p_industry), ''), spouse_name = nullif(btrim(p_spouse), ''),
    car_model = nullif(btrim(p_car_model), ''), car_number = nullif(btrim(p_car_number), ''),
    birth_date = nullif(btrim(p_birth), ''), birth_calendar = nullif(btrim(p_birth_cal), ''),
    address = nullif(btrim(p_address), ''), address_type = nullif(btrim(p_addr_type), ''),
    home_church = nullif(btrim(p_church), '')
  where id = p_id;
  return true;
end; $$;

grant execute on function public.member_self_lookup(text, text) to anon, authenticated;
grant execute on function public.member_self_update(uuid, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text) to anon, authenticated;
