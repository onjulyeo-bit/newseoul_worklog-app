-- 0013. 배경 보관함을 Storage 버킷으로.
--   대시보드 Storage에서 여러 장 미리 드래그 업로드 → 앱에서 바로 불러쓰기.
--   공개 읽기(public), 추가·삭제는 관리자(is_admin)만. (대시보드 업로드는 권한과 무관하게 됨)

insert into storage.buckets (id, name, public)
values ('backgrounds', 'backgrounds', true)
on conflict (id) do nothing;

drop policy if exists "bg public read" on storage.objects;
create policy "bg public read" on storage.objects
  for select using (bucket_id = 'backgrounds');

drop policy if exists "bg admin insert" on storage.objects;
create policy "bg admin insert" on storage.objects
  for insert with check (bucket_id = 'backgrounds' and public.is_admin());

drop policy if exists "bg admin delete" on storage.objects;
create policy "bg admin delete" on storage.objects
  for delete using (bucket_id = 'backgrounds' and public.is_admin());
