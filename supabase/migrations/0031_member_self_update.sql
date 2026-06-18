-- ============================================================
-- 0031. 회원 자기입력 폼 — 로그인 없이 '본인 정보'만 조회/수정 (SECURITY DEFINER RPC)
-- 새서울 CBMC '아름다운 만남'
-- Supabase 대시보드 → SQL Editor 에 붙여넣어 실행. (여러 번 실행해도 안전)
--
-- 회원은 이름 + 전화 뒷4자리로 본인 확인 → 개인정보(연락처·이메일·회사 등)만 수정.
-- members 테이블 직접 접근(RLS 운영진만)은 그대로, 이 RPC로만 본인 레코드 통과.
-- 등급·상태·태그 등 회원 분류는 절대 못 바꿈(운영진 전용).
-- ============================================================

-- 전화 뒷4자리 비교 헬퍼 (phone이 없으면 통과 — 정보 누락 회원도 입력 가능)
create or replace function public.member_self_lookup(p_name text, p_last4 text)
returns table (id uuid, name text, phone text, email text, company text, "position" text, industry text, spouse_name text, car_model text, car_number text)
language sql security definer set search_path = public as $$
  select id, name, phone, email, company, "position", industry, spouse_name, car_model, car_number
  from public.members
  where chapter_id = '새서울' and name = p_name
    and (phone is null or phone = '' or right(regexp_replace(coalesce(phone,''),'[^0-9]','','g'), 4) = p_last4)
  order by created_at nulls last
  limit 1;
$$;

create or replace function public.member_self_update(
  p_id uuid, p_name text, p_last4 text,
  p_phone text, p_email text, p_company text, p_position text, p_industry text,
  p_spouse text, p_car_model text, p_car_number text
) returns boolean
language plpgsql security definer set search_path = public as $$
declare ok boolean;
begin
  -- 저장 전 다시 본인 확인 (id + 이름 + 기존 전화 뒷4)
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
    car_number = nullif(btrim(p_car_number), '')
  where id = p_id;
  return true;
end; $$;

grant execute on function public.member_self_lookup(text, text) to anon, authenticated;
grant execute on function public.member_self_update(uuid, text, text, text, text, text, text, text, text, text, text) to anon, authenticated;
