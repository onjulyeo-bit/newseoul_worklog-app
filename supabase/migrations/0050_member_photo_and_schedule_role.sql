-- 0050. (1) 회원 자기입력에 프로필 사진(photo_url) 추가  (2) 연간일정은 '회원 이상'만 열람.
--   재실행 안전. members.photo_url 컬럼은 이미 존재(명단에서 사용 중).

-- ── (1) 자기입력 RPC 재정의 — photo_url 포함 ──────────────────
drop function if exists public.member_self_lookup(text, text);
create or replace function public.member_self_lookup(p_name text, p_last4 text)
returns table (
  id uuid, name text, phone text, email text, company text, "position" text,
  industry text, spouse_name text, car_model text, car_number text,
  birth_date text, birth_calendar text, address text, address_type text, home_church text,
  intro text, business_card_url text, photo_url text
)
language sql security definer set search_path = public as $$
  select id, name, phone, email, company, "position", industry, spouse_name, car_model, car_number,
         birth_date, birth_calendar, address, address_type, home_church, intro, business_card_url, photo_url
  from public.members
  where chapter_id = '새서울' and name = p_name
    and (phone is null or phone = '' or right(regexp_replace(coalesce(phone,''),'[^0-9]','','g'), 4) = p_last4)
  order by created_at nulls last
  limit 1;
$$;

drop function if exists public.member_self_update(uuid, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text);
create or replace function public.member_self_update(
  p_id uuid, p_name text, p_last4 text,
  p_phone text, p_email text, p_company text, p_position text, p_industry text,
  p_spouse text, p_car_model text, p_car_number text,
  p_birth text, p_birth_cal text, p_address text, p_addr_type text, p_church text,
  p_intro text, p_card text, p_photo text
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
    home_church = nullif(btrim(p_church), ''),
    intro = nullif(btrim(p_intro), ''), business_card_url = nullif(btrim(p_card), ''),
    photo_url = nullif(btrim(p_photo), '')
  where id = p_id;
  return true;
end; $$;

grant execute on function public.member_self_lookup(text, text) to anon, authenticated;
grant execute on function public.member_self_update(uuid, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text) to anon, authenticated;

-- ── (2) 연간일정 열람: 관심(guest) 제외, 회원·운영진만 ──────────
create or replace function public.is_member_or_above() returns boolean
language sql security definer set search_path = public stable as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','viewer','member'));
$$;
grant execute on function public.is_member_or_above() to authenticated;

drop policy if exists meetings_read_all on public.meetings;
drop policy if exists meetings_read_member on public.meetings;
create policy meetings_read_member on public.meetings
  for select using (public.is_member_or_above());
