-- Parvathi Creations: customer-interest analytics
-- Run once in Supabase Dashboard -> SQL Editor -> New query.
-- Stores only design interaction events; no customer names, phone numbers, or messages.

create table if not exists public.design_interactions (
  id bigint generated always as identity primary key,
  event_type text not null check (event_type in ('view', 'like', 'unlike', 'enquiry')),
  design_id text not null,
  design_code text,
  design_name text not null default 'Design',
  created_at timestamptz not null default now()
);

create index if not exists design_interactions_created_at_idx
  on public.design_interactions (created_at desc);

create index if not exists design_interactions_design_id_idx
  on public.design_interactions (design_id);

alter table public.design_interactions enable row level security;

-- Anonymous visitors may submit interaction fields only. They cannot choose IDs or timestamps.
revoke insert on public.design_interactions from anon, authenticated;
grant insert (event_type, design_id, design_code, design_name)
  on public.design_interactions to anon, authenticated;
grant select on public.design_interactions to authenticated;

drop policy if exists "Allow public design interaction inserts" on public.design_interactions;
create policy "Allow public design interaction inserts"
  on public.design_interactions
  for insert
  to anon, authenticated
  with check (
    event_type in ('view', 'like', 'unlike', 'enquiry')
    and char_length(design_id) between 1 and 200
    and (design_code is null or char_length(design_code) <= 80)
    and char_length(design_name) between 1 and 160
  );

drop policy if exists "Authenticated admins can read design interactions" on public.design_interactions;
create policy "Authenticated admins can read design interactions"
  on public.design_interactions
  for select
  to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
