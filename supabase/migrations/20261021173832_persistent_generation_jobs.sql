create table public.storefront_generation_jobs (
  id uuid primary key default gen_random_uuid(),
  owner_clerk_user_id text not null,
  idea text not null check (char_length(idea) >= 6),
  status text not null default 'queued' check (status in ('queued', 'running', 'completed', 'failed')),
  reservation_id text,
  storefront_id uuid references public.storefronts(id) on delete set null,
  warning text,
  error text,
  created_at timestamptz not null default now(),
  finished_at timestamptz,
  expires_at timestamptz not null default (now() + interval '4 minutes')
);

create unique index storefront_generation_jobs_active_owner_idx
  on public.storefront_generation_jobs (owner_clerk_user_id)
  where status in ('queued', 'running');
create index storefront_generation_jobs_owner_created_idx
  on public.storefront_generation_jobs (owner_clerk_user_id, created_at desc);

alter table public.storefront_generation_jobs enable row level security;
revoke all on public.storefront_generation_jobs from anon, authenticated;
grant all on public.storefront_generation_jobs to service_role;
