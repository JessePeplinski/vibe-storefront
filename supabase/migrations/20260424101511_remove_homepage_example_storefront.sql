delete from public.storefronts
where system_key = 'homepage-example'
  or slug = 'example-brooklyn-ember-co';

drop index if exists public.storefronts_system_key_unique_idx;

alter table public.storefronts
  drop constraint if exists storefronts_single_owner_chk;

alter table public.storefronts
  drop column if exists system_key;

alter table public.storefronts
  add constraint storefronts_single_owner_chk
  check (
    num_nonnulls(owner_clerk_user_id, anonymous_session_id) = 1
  );

create index if not exists storefronts_published_created_idx
  on public.storefronts (created_at desc)
  where published = true;
