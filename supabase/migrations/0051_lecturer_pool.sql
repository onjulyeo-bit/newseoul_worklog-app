-- 0051. 강사풀 — 간사 제거 + 자기입력을 회원 수준 필드로 확장.
--   재실행 안전.

-- 기존 '간사' 데이터 삭제
delete from public.instructors where chapter_id = '새서울' and kind = '간사';

-- 회원형 필드 추가 (instructors엔 phone·org·field·fee_note·note·kind·is_external 이미 존재)
alter table public.instructors add column if not exists email             text;
alter table public.instructors add column if not exists company           text;
alter table public.instructors add column if not exists "position"        text;
alter table public.instructors add column if not exists intro             text;
alter table public.instructors add column if not exists photo_url         text;
alter table public.instructors add column if not exists business_card_url text;

-- 자기입력 RPC 재정의 (회원형 필드) — 이름 기준 upsert, 항상 강사
drop function if exists public.instructor_self_upsert(text, text, boolean, text, text, text, text, text);
create or replace function public.instructor_self_upsert(
  p_name text, p_phone text, p_email text, p_company text, p_position text,
  p_field text, p_intro text, p_card text, p_photo text
) returns boolean
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if coalesce(btrim(p_name), '') = '' then return false; end if;
  update public.instructors set
    kind = '강사',
    phone = nullif(btrim(p_phone), ''), email = nullif(btrim(p_email), ''),
    company = nullif(btrim(p_company), ''), "position" = nullif(btrim(p_position), ''),
    field = nullif(btrim(p_field), ''), intro = nullif(btrim(p_intro), ''),
    business_card_url = nullif(btrim(p_card), ''), photo_url = nullif(btrim(p_photo), '')
  where chapter_id = '새서울' and name = btrim(p_name);
  get diagnostics n = row_count;
  if n = 0 then
    insert into public.instructors (chapter_id, name, kind, is_external, phone, email, company, "position", field, intro, business_card_url, photo_url)
    values ('새서울', btrim(p_name), '강사', true, nullif(btrim(p_phone), ''), nullif(btrim(p_email), ''),
            nullif(btrim(p_company), ''), nullif(btrim(p_position), ''), nullif(btrim(p_field), ''),
            nullif(btrim(p_intro), ''), nullif(btrim(p_card), ''), nullif(btrim(p_photo), ''));
  end if;
  return true;
end; $$;
grant execute on function public.instructor_self_upsert(text, text, text, text, text, text, text, text, text) to anon, authenticated;
