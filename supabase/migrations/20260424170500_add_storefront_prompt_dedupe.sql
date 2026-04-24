create or replace function public.normalize_storefront_idea(input text)
returns text
language sql
immutable
set search_path = public
as $$
  select lower(regexp_replace(btrim(input), '\s+', ' ', 'g'));
$$;

create unique index if not exists storefronts_owner_normalized_idea_unique_idx
  on public.storefronts (
    owner_clerk_user_id,
    public.normalize_storefront_idea(idea)
  )
  where owner_clerk_user_id is not null;

create unique index if not exists storefronts_anonymous_normalized_idea_unique_idx
  on public.storefronts (
    anonymous_session_id,
    public.normalize_storefront_idea(idea)
  )
  where anonymous_session_id is not null;
