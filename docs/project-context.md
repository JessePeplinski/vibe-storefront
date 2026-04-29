# Project Context

This document keeps implementation context that is useful for maintainers but too detailed for the public README.

## Runtime Architecture

Vibe Storefront uses Next.js App Router. A visitor submits a product idea, the server generates structured storefront content with the OpenAI Codex SDK, validates the response with the Zod schema in `lib/storefront-schema.ts`, saves it to Supabase, and returns a public share URL.

The Codex generation route must run in the Node.js runtime because the Codex SDK spawns the Codex CLI. In deployed Vercel environments, the route uses `/tmp` for Codex runtime state and resolves the packaged platform Codex binary when available.

If generation fails with quota errors, check the OpenAI project tied to `CODEX_API_KEY` and `OPENAI_API_KEY` before changing persistence code.

## Data And Access Boundaries

Supabase schema lives in `supabase/migrations`. The applied schema creates `public.storefronts`, enables Row Level Security, allows public reads only for published storefronts, and keeps writes behind server routes using the service role key.

Supabase service-role writes should stay server-side only. Public storefront reads should continue to use the public/anon Supabase client and RLS.

Storefront generation requires Clerk sign-in. Signed-out visitors can browse public storefronts and share pages, but `/api/storefronts` rejects generation requests before any Codex or image model calls.

Signed-in generation is currently limited to one storefront per Clerk user. The `public.storefront_generation_slots` table reserves the user's single generation slot before expensive model calls, so repeated or concurrent requests fail closed instead of generating more storefronts.

## Future Feature Notes

- Add a maintainer-only admin cleanup path for production smoke storefronts. It should delete both the storefront row and any associated product image through a guarded server-side flow, so production smoke records can be removed without direct Supabase edits.

## Product Images

Generated product images are uploaded server-side to the public Supabase Storage bucket `storefront-product-images`. Each storefront stores the durable public image URL in `content.product.image`.

Existing storefronts can be backfilled after the storage migration is applied:

```bash
npm run backfill:product-images -- --env .env.local
npm run backfill:product-images -- --env .env.local --write
```

For production, use the ignored production env reference and pass the explicit confirmation flag:

```bash
npm run backfill:product-images -- --env .env.prod
npm run backfill:product-images -- --env .env.prod --write --confirm-production
```

The command skips storefronts that already have `content.product.image`.
