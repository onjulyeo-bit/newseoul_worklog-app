-- 0012. 포스터 배경 보관함
--   마음에 든 배경(Pixabay·AI·직접업로드)을 저장해두고 재사용.
--   이미지는 data URL(base64)로 테이블에 바로 저장 — 스토리지 설정/CORS 없이 간단하게.
--   관리자만 보고/추가/삭제(is_admin).

create table if not exists public.poster_backgrounds (
  id          uuid primary key default gen_random_uuid(),
  chapter_id  text not null default '새서울' references public.chapters (chapter_id),
  label       text,
  image       text not null,           -- data:image/...;base64,...
  created_at  timestamptz not null default now()
);

alter table public.poster_backgrounds enable row level security;

drop policy if exists pbg_admin on public.poster_backgrounds;
create policy pbg_admin on public.poster_backgrounds
  for all using (public.is_admin()) with check (public.is_admin());
