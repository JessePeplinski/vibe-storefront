alter table public.storefronts
  drop constraint if exists storefronts_idea_check;

alter table public.storefronts
  add constraint storefronts_idea_check
  check (char_length(idea) >= 6);
