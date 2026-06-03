-- 0005. 데이터 보정: 전화번호 010 추가 + 배우자 서로 매칭

-- (1) 전화번호 앞에 010이 없으면 붙이고, 공백은 하이픈으로
--     '3618 3469' → '010-3618-3469',  '3921-0577' → '010-3921-0577'
--     이미 '010'으로 시작하면 그대로 둠
update public.members
set phone = '010-' || replace(phone, ' ', '-')
where chapter_id = '새서울'
  and phone is not null
  and phone not like '010%';

-- (2) 배우자 서로 매칭: A의 배우자가 B인데 B는 배우자가 비어 있으면, B의 배우자를 A로 채움
update public.members a
set spouse_name = b.name
from public.members b
where a.chapter_id = '새서울'
  and b.chapter_id = '새서울'
  and a.id <> b.id
  and (a.spouse_name is null or a.spouse_name = '')
  and b.spouse_name = a.name;
