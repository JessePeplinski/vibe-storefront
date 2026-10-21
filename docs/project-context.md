# Project Context

This document keeps implementation context that is useful for maintainers but too detailed for the public README.

## Runtime Architecture

Vibe Storefront uses Next.js App Router. A visitor submits a product idea, the server generates structured storefront content with the OpenAI Codex SDK, validates the response with the Zod schema in `lib/storefront-schema.ts`, saves it to Supabase, and returns a public share URL.

The Codex generation route must run in the Node.js runtime because the Codex SDK spawns the Codex CLI. In deployed Vercel environments, the route uses `/tmp` for Codex runtime state and resolves the packaged platform Codex binary when available.

If generation fails with quota errors, check the OpenAI project tied to `CODEX_API_KEY` and `OPENAI_API_KEY` before changing persistence code.

## Generation Navigation

The dashboard submits `POST /api/storefronts` with `background: true`. The server authenticates the owner, checks content safety, deduplication, quota and rate limits, creates a private `storefront_generation_jobs` row, reserves quota for non-admin users, and returns HTTP 202. Next.js `after()` runs generation after the response so client disconnects do not cancel the work. The legacy synchronous request format remains supported.

`GET /api/storefront-jobs` returns only the signed-in owner's latest job with `Cache-Control: no-store`. The client checks it on sign-in/page load and polls every two seconds while pending. Refreshing or closing the tab loses no server job state; reopening while signed in restores the idea, elapsed time and skeleton, or the saved result. An active-job unique index and an atomic queued-to-running claim prevent duplicate workers across tabs or repeated submissions. Changing the signed-in user resets client state.

This uses the existing 180-second function runtime, not an unbounded queue or automatic model retries. Jobs still pending after four minutes are reconciled on status reads: an already saved storefront is recovered as completed; otherwise the job is marked failed and its reserved quota released. A timeout or host failure requires an explicit retry rather than silently incurring more model spend. Completed jobs resolve their saved storefront from the database; deleted storefronts are not restored from job history. Model failure details are not exposed in job responses.

When an observed pending job completes while another page is open, the shared navigation shows a bell with an unread badge. Its panel names the storefront and links directly to the share page. Viewing the dashboard/result or dismissing the notification clears it. Notifications are session-local; restoring an already completed historical job on sign-in does not produce a new alert.

## Data And Access Boundaries

Supabase schema lives in `supabase/migrations`. The applied schema creates `public.storefronts`, enables Row Level Security, allows public reads only for published storefronts, and keeps writes behind server routes using the service role key.

Supabase service-role writes should stay server-side only. Public storefront reads should continue to use the public/anon Supabase client and RLS.

Storefront generation requires Clerk sign-in. Signed-out visitors can browse public storefronts and share pages, but `/api/storefronts` rejects generation requests before any Codex or image model calls.

Regular signed-in accounts are limited to five storefronts per Clerk user. The server-only `ADMIN_EMAIL` setting grants unlimited storefront generations when it matches the authenticated Clerk user's verified primary email. Admin requests skip the account cap and slot reservation; short-term rate limiting still applies. The `public.storefront_generation_slots` table reserves one of the user's numbered generation slots before expensive model calls, so repeated or concurrent requests fail closed instead of generating past the account cap. Before reserving a new slot, the app releases stale pending slots older than ten minutes with no attached storefront, which prevents killed serverless requests from permanently consuming quota.

## Future Feature Notes

- Add a maintainer-only admin cleanup path for production smoke storefronts. It should delete both the storefront row and any associated product image through a guarded server-side flow, so production smoke records can be removed without direct Supabase edits.

## Product Images

Generated product images are uploaded server-side to the public Supabase Storage bucket `storefront-product-images`. Each storefront stores the durable public image URL in `content.product.image`.

Product image generation is part of the server-side storefront generation worker (or the legacy synchronous request path). The app waits for the OpenAI image request and does not impose an additional image deadline beyond the hosting platform's function runtime limit. If all image attempts fail, the storefront is still saved without an image so the generated copy is not lost.

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
