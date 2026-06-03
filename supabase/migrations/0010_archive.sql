-- 0010. 히스토리 아카이브(archive) + 사진 저장공간(Storage 'archive' 버킷)
--   회원도 열람, 임원만 추가/삭제. 사진은 공개 버킷에 저장.

create table if not exists public.archive (
  id         uuid primary key default gen_random_uuid(),
  chapter_id text not null default '새서울' references public.chapters (chapter_id),
  category   text,           -- 연혁/역대회장/사진/문서/기타
  title      text not null,
  event_date date,
  content    text,
  image_url  text,
  link       text,
  created_at timestamptz not null default now()
);

alter table public.archive enable row level security;

drop policy if exists archive_read on public.archive;
create policy archive_read on public.archive for select using (auth.uid() is not null);

drop policy if exists archive_write on public.archive;
create policy archive_write on public.archive for all using (public.is_admin()) with check (public.is_admin());

-- 사진 저장공간(공개 버킷)
insert into storage.buckets (id, name, public)
values ('archive', 'archive', true)
on conflict (id) do nothing;

-- 누구나(공개) 사진 보기, 업로드·삭제는 임원만
drop policy if exists "archive storage read" on storage.objects;
create policy "archive storage read" on storage.objects
  for select using (bucket_id = 'archive');

drop policy if exists "archive storage insert" on storage.objects;
create policy "archive storage insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'archive' and public.is_admin());

drop policy if exists "archive storage delete" on storage.objects;
create policy "archive storage delete" on storage.objects
  for delete to authenticated using (bucket_id = 'archive' and public.is_admin());
