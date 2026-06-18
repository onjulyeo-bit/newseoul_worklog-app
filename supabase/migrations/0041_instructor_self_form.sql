-- ============================================================
-- 0041. 강사·간사 자기입력 폼 — 링크로 받아 본인이 작성 → 자동 저장 (SECURITY DEFINER RPC)
-- 새서울 CBMC '아름다운 만남'
-- Supabase 대시보드 → SQL Editor 에 붙여넣어 실행. (여러 번 실행해도 안전)
--
-- instructors 테이블은 운영진만(RLS) 쓰지만, 이 RPC로 비로그인 강사·간사도 본인 정보 등록.
-- 같은 이름이 이미 있으면 업데이트, 없으면 새로 추가(이름 기준 upsert).
-- ============================================================

create or replace function public.instructor_self_upsert(
  p_name text, p_kind text, p_external boolean,
  p_org text, p_phone text, p_field text, p_fee text, p_note text
) returns boolean
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if coalesce(btrim(p_name), '') = '' then return false; end if;
  update public.instructors set
    kind = coalesce(nullif(btrim(p_kind), ''), '강사'),
    is_external = coalesce(p_external, true),
    org = nullif(btrim(p_org), ''), phone = nullif(btrim(p_phone), ''),
    field = nullif(btrim(p_field), ''), fee_note = nullif(btrim(p_fee), ''), note = nullif(btrim(p_note), '')
  where chapter_id = '새서울' and name = btrim(p_name);
  get diagnostics n = row_count;
  if n = 0 then
    insert into public.instructors (chapter_id, name, kind, is_external, org, phone, field, fee_note, note)
    values ('새서울', btrim(p_name), coalesce(nullif(btrim(p_kind), ''), '강사'), coalesce(p_external, true),
            nullif(btrim(p_org), ''), nullif(btrim(p_phone), ''), nullif(btrim(p_field), ''),
            nullif(btrim(p_fee), ''), nullif(btrim(p_note), ''));
  end if;
  return true;
end; $$;

grant execute on function public.instructor_self_upsert(text, text, boolean, text, text, text, text, text) to anon, authenticated;
