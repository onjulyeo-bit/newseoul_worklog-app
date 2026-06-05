-- 0015. 식대 입금 설정 (지회 단위) + 체크인 안내
--   식대 금액·입금 계좌·송금링크를 지회에 저장. 회원이 QR 체크인하면 안내가 뜨도록.
--   계좌는 모임 통장(받는 계좌)이라 표시 OK — 회원 개인정보 아님. 송금링크는 선택.

alter table public.chapters add column if not exists meal_fee integer;
alter table public.chapters add column if not exists meal_account text;
alter table public.chapters add column if not exists pay_link text;

-- 관리자만 저장 (정의자 권한으로 RLS 우회 + is_admin 체크)
create or replace function public.set_meal_settings(p_fee integer, p_account text, p_link text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  update public.chapters set meal_fee = p_fee, meal_account = p_account, pay_link = p_link where chapter_id = '새서울';
end; $$;
grant execute on function public.set_meal_settings(integer, text, text) to authenticated;

create or replace function public.get_meal_settings()
returns table (meal_fee integer, meal_account text, pay_link text)
language sql security definer set search_path = public as $$
  select meal_fee, meal_account, pay_link from public.chapters where chapter_id = '새서울';
$$;
grant execute on function public.get_meal_settings() to authenticated;

-- 체크인 안내 (토큰 검증, 로그인 없이 anon 호출). 온라인이면 fee=null로 안내 안 함.
create or replace function public.checkin_info(p_meeting uuid, p_token text)
returns table (mode text, fee integer, account text, pay_link text)
language sql security definer set search_path = public as $$
  select mt.mode,
         case when mt.mode = 'offline' then c.meal_fee else null end,
         case when mt.mode = 'offline' then c.meal_account else null end,
         case when mt.mode = 'offline' then c.pay_link else null end
  from public.meetings mt
  join public.chapters c on c.chapter_id = mt.chapter_id
  where mt.id = p_meeting and mt.checkin_token = p_token;
$$;
grant execute on function public.checkin_info(uuid, text) to anon, authenticated;
