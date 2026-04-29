create table if not exists public.storefront_generation_slots (
  id uuid primary key default gen_random_uuid(),
  owner_clerk_user_id text not null,
  storefront_id uuid references public.storefronts(id) on delete set null,
  status text not null default 'pending'
    check (status in ('pending', 'created')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists storefront_generation_slots_owner_unique_idx
  on public.storefront_generation_slots (owner_clerk_user_id);

create index if not exists storefront_generation_slots_storefront_idx
  on public.storefront_generation_slots (storefront_id)
  where storefront_id is not null;

drop trigger if exists storefront_generation_slots_set_updated_at
  on public.storefront_generation_slots;
create trigger storefront_generation_slots_set_updated_at
before update on public.storefront_generation_slots
for each row
execute function public.set_updated_at();

alter table public.storefront_generation_slots enable row level security;

insert into public.storefront_generation_slots (
  owner_clerk_user_id,
  storefront_id,
  status
)
select distinct on (owner_clerk_user_id)
  owner_clerk_user_id,
  id,
  'created'
from public.storefronts
where owner_clerk_user_id is not null
order by owner_clerk_user_id, created_at asc
on conflict (owner_clerk_user_id) do nothing;

