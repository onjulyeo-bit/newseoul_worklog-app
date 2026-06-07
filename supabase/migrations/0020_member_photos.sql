-- 0020. 회원 사진(프로필) — members.photo_url 컬럼 + 공개 Storage 버킷.
--   회원 상세에서 사진 업로드 → URL 저장 → 목록·카드·상세에 표시(없으면 이니셜).
--   공개 읽기(public), 추가·교체·삭제는 관리자(is_admin)만.

-- 1) 회원 사진 주소 컬럼
alter table public.members add column if not exists photo_url text;

-- 2) 사진 버킷 (공개)
insert into storage.buckets (id, name, public)
values ('member-photos', 'member-photos', true)
on conflict (id) do nothing;

drop policy if exists "mp public read" on storage.objects;
create policy "mp public read" on storage.objects
  for select using (bucket_id = 'member-photos');

drop policy if exists "mp admin insert" on storage.objects;
create policy "mp admin insert" on storage.objects
  for insert with check (bucket_id = 'member-photos' and public.is_admin());

drop policy if exists "mp admin update" on storage.objects;
create policy "mp admin update" on storage.objects
  for update using (bucket_id = 'member-photos' and public.is_admin());

drop policy if exists "mp admin delete" on storage.objects;
create policy "mp admin delete" on storage.objects
  for delete using (bucket_id = 'member-photos' and public.is_admin());
