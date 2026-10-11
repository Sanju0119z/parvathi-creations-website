-- Run this once in Supabase Dashboard > SQL Editor for the Parvathi Creations project.
-- Stores up to six photo URLs per design; image_url remains the cover for compatibility.
alter table public.designs
  add column if not exists image_urls jsonb not null default '[]'::jsonb;

update public.designs
set image_urls = jsonb_build_array(image_url)
where image_url is not null
  and image_url <> ''
  and (image_urls is null or image_urls = '[]'::jsonb);
