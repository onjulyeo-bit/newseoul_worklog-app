-- ============================================================
-- 0039. 자기소개 + 명함 이미지 (+ 자기입력 RPC·명단 뷰 갱신, 명함 버킷)
-- 새서울 CBMC '아름다운 만남'
-- Supabase 대시보드 → SQL Editor 에 붙여넣어 실행. (여러 번 실행해도 안전)
--
-- intro=한 줄 자기소개, business_card_url=명함 이미지 URL.
-- 명함은 자기입력 폼(비로그인 회원)도 올릴 수 있어야 해 'member-cards' 공개 버킷 + 익명 업로드 허용.
-- ============================================================

alter table public.members add column if not exists intro             text;
alter table public.members add column if not exists business_card_url text;

-- ── 명함 이미지 버킷 (공개 읽기 + 누구나 업로드 / 수정·삭제는 운영진) ──
insert into storage.buckets (id, name, public) values ('member-cards', 'member-cards', true)
  on conflict (id) do nothing;
drop policy if exists "member_cards_read"   on storage.objects;
drop policy if exists "member_cards_insert" on storage.objects;
drop policy if exists "member_cards_admin"  on storage.objects;
create policy "member_cards_read"   on storage.objects for select using (bucket_id = 'member-cards');
create policy "member_cards_insert" on storage.objects for insert with check (bucket_id = 'member-cards');
create policy "member_cards_admin"  on storage.objects for all
  using (bucket_id = 'member-cards' and public.is_admin())
  with check (bucket_id = 'member-cards' and public.is_admin());

-- ── 회원 명단(directory) 뷰에 자기소개·명함 추가 (기존 컬럼 뒤) ──
create or replace view public.members_directory as
  select id, name, phone, company, email, "position", industry, intro, business_card_url
  from public.members
  where chapter_id = '새서울';
revoke all on public.members_directory from anon;
grant select on public.members_directory to authenticated;

-- ── 자기입력 RPC 재정의 (intro·명함 포함) ──
drop function if exists public.member_self_lookup(text, text);
create or replace function public.member_self_lookup(p_name text, p_last4 text)
returns table (
  id uuid, name text, phone text, email text, company text, "position" text,
  industry text, spouse_name text, car_model text, car_number text,
  birth_date text, birth_calendar text, address text, address_type text, home_church text,
  intro text, business_card_url text
)
language sql security definer set search_path = public as $$
  select id, name, phone, email, company, "position", industry, spouse_name, car_model, car_number,
         birth_date, birth_calendar, address, address_type, home_church, intro, business_card_url
  from public.members
  where chapter_id = '새서울' and name = p_name
    and (phone is null or phone = '' or right(regexp_replace(coalesce(phone,''),'[^0-9]','','g'), 4) = p_last4)
  order by created_at nulls last
  limit 1;
$$;

drop function if exists public.member_self_update(uuid, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text);
create or replace function public.member_self_update(
  p_id uuid, p_name text, p_last4 text,
  p_phone text, p_email text, p_company text, p_position text, p_industry text,
  p_spouse text, p_car_model text, p_car_number text,
  p_birth text, p_birth_cal text, p_address text, p_addr_type text, p_church text,
  p_intro text, p_card text
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
    intro = nullif(btrim(p_intro), ''), business_card_url = nullif(btrim(p_card), '')
  where id = p_id;
  return true;
end; $$;

grant execute on function public.member_self_lookup(text, text) to anon, authenticated;
grant execute on function public.member_self_update(uuid, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text) to anon, authenticated;
