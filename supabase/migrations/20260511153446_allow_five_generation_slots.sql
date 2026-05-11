alter table public.storefront_generation_slots
drop constraint if exists storefront_generation_slots_slot_number_check;

alter table public.storefront_generation_slots
add constraint storefront_generation_slots_slot_number_check
check (slot_number between 1 and 5);
