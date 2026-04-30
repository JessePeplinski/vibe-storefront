alter table public.storefront_generation_slots
add column if not exists slot_number integer;

update public.storefront_generation_slots
set slot_number = 1
where slot_number is null;

alter table public.storefront_generation_slots
alter column slot_number set default 1,
alter column slot_number set not null;

alter table public.storefront_generation_slots
drop constraint if exists storefront_generation_slots_slot_number_check;

alter table public.storefront_generation_slots
add constraint storefront_generation_slots_slot_number_check
check (slot_number between 1 and 3);

drop index if exists public.storefront_generation_slots_owner_unique_idx;

create unique index if not exists storefront_generation_slots_owner_slot_unique_idx
  on public.storefront_generation_slots (owner_clerk_user_id, slot_number);

insert into public.storefront_generation_slots (
  owner_clerk_user_id,
  storefront_id,
  status,
  slot_number
)
select
  owner_clerk_user_id,
  id,
  'created',
  slot_number
from (
  select
    owner_clerk_user_id,
    id,
    row_number() over (
      partition by owner_clerk_user_id
      order by created_at asc
    ) as slot_number
  from public.storefronts
  where owner_clerk_user_id is not null
) ranked_storefronts
where slot_number between 1 and 3
on conflict (owner_clerk_user_id, slot_number) do nothing;
