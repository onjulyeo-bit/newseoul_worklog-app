-- 0006. 상태(status) 값 체계 변경: 활동중/유보/등록전/OB → 활동/휴면/비활동/OB
--   (회원 '신분/구분'과 '활동 정도'를 분리: 상태 = 활동 정도)

-- 1) 기존 값 변환
update public.members set status = '활동' where status = '활동중';
update public.members set status = '휴면' where status = '유보';
update public.members set status = '비활동' where status = '등록전';
-- (현재 데이터엔 OB 없음. OB는 그대로 둠)

-- 2) 허용값 제약 교체
alter table public.members drop constraint if exists members_status_check;
alter table public.members add constraint members_status_check
  check (status in ('활동', '휴면', '비활동', 'OB'));
