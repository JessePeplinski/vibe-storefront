insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'storefront-product-images',
  'storefront-product-images',
  true,
  5242880,
  array['image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Storefront product images are public" on storage.objects;
create policy "Storefront product images are public"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'storefront-product-images');
