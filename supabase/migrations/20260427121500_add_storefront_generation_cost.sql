alter table public.storefronts
  add column if not exists generation_cost jsonb;
