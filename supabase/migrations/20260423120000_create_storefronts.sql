create extension if not exists pgcrypto;

create table if not exists public.storefronts (
  id uuid primary key default gen_random_uuid(),
  owner_clerk_user_id text not null,
  slug text not null unique,
  idea text not null check (char_length(idea) between 6 and 220),
  content jsonb not null,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists storefronts_owner_created_idx
  on public.storefronts (owner_clerk_user_id, created_at desc);

create index if not exists storefronts_published_slug_idx
  on public.storefronts (slug)
  where published = true;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists storefronts_set_updated_at on public.storefronts;
create trigger storefronts_set_updated_at
before update on public.storefronts
for each row
execute function public.set_updated_at();

alter table public.storefronts enable row level security;

drop policy if exists "Published storefronts are public" on public.storefronts;
create policy "Published storefronts are public"
on public.storefronts
for select
to anon, authenticated
using (published = true);

grant select on public.storefronts to anon, authenticated;
