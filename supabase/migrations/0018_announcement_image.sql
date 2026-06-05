-- 0018. 공지에 포스터 이미지 첨부 + 포스터 저장 버킷
--   콘텐츠 생성에서 만든 포스터(PNG)를 공지에 함께 올리기.

alter table public.announcements add column if not exists image_url text;

insert into storage.buckets (id, name, public)
values ('posters', 'posters', true)
on conflict (id) do nothing;

drop policy if exists "posters read" on storage.objects;
create policy "posters read" on storage.objects
  for select using (bucket_id = 'posters');

drop policy if exists "posters admin insert" on storage.objects;
create policy "posters admin insert" on storage.objects
  for insert with check (bucket_id = 'posters' and public.is_admin());
