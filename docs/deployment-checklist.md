# Deployment Checklist

Use this checklist to configure production providers, apply migrations, and verify the deployed app without putting secrets in source control.

## Production Targets

- Vercel project: `vibe-storefront`
- Production URL: https://vibe-storefront.com
- Vercel fallback URL: https://vibe-storefront-two.vercel.app
- Production branch: `main`
- Node.js runtime in Vercel: 24.x

Production deploys should come from `main`. Run `npm run verify` before publishing changes, then follow the repo workflow for promoting a feature branch through `dev` and `main`.

## Provider Keys

Clerk:

- Use production Clerk keys in Vercel: `pk_live_...` and `sk_live_...`.
- Keep the sign-in URL set to `/sign-in`; Clerk handles account creation from the same flow.
- Store Clerk values only in Vercel environment variables or Clerk itself.

Supabase:

- Copy the production Project URL into `NEXT_PUBLIC_SUPABASE_URL`.
- Copy the anon or publishable public API key into `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Copy the service role key into `SUPABASE_SERVICE_ROLE_KEY`.
- Never expose the service role key in browser code.

OpenAI:

- Create a secret API key with access to the Codex model used by this app.
- Store it as `CODEX_API_KEY`.
- Use the same key for image generation, or create a separate key and store it as `OPENAI_API_KEY`.
- Leave `CODEX_MODEL=gpt-5.3-codex` unless the app is intentionally retargeted.
- Leave `OPENAI_IMAGE_MODEL=gpt-image-2` unless product image generation is intentionally retargeted.

App:

- Set `NEXT_PUBLIC_APP_URL` to `https://vibe-storefront.com` so generated share links use the stable live host.

## Google Sign-In

Production Google sign-in requires custom Google OAuth credentials from Google Cloud. Store those OAuth credentials in Clerk only; do not add them to Vercel environment variables, `.env.local`, `.env.prod`, or source control.

Setup:

1. In Clerk, open the production app's Google SSO connection and enable sign-in and account creation with custom credentials.
2. In Google Cloud Console, create an OAuth client for a Web application.
3. Add the production domains as authorized JavaScript origins:
   - `https://vibe-storefront.com`
   - `https://vibe-storefront-two.vercel.app`
4. Add Clerk's exact Authorized Redirect URI as the Google authorized redirect URI. For the current production Clerk domain, this is `https://clerk.vibe-storefront.com/v1/oauth_callback`.
5. Paste the Google OAuth client values into Clerk and save the SSO connection.
6. On the Google OAuth consent screen, make sure the app is available to the intended audience. If the app remains in testing mode, add the Google accounts that should be allowed to sign in as test users.

After setup, verify Google sign-in from `https://vibe-storefront.com/sign-in`. Reaching Google's account chooser confirms the Clerk-to-Google OAuth handoff is configured.

## Supabase Migrations

Run new Supabase migrations against the production database as a separate deployment step. Vercel deploys app code only and does not apply database migrations.

Recommended CLI flow:

```bash
npx -y supabase login
npx -y supabase link --project-ref <production-project-ref>
npx -y supabase migration list --linked
npx -y supabase db push
npx -y supabase migration list --linked
```

If using the Supabase SQL Editor instead of the CLI, run pending migration SQL files from `supabase/migrations` once against the production project and confirm the migration history/schema afterward.

## Vercel

Vercel settings:

- Framework preset: Next.js.
- Production branch: `main`.
- Root directory: repository root.
- Build command: `npm run build`.
- Install command: `npm install`.

Add production environment variables in Vercel:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

CODEX_API_KEY=
CODEX_MODEL=gpt-5.3-codex
OPENAI_API_KEY=
OPENAI_IMAGE_MODEL=gpt-image-2

NEXT_PUBLIC_APP_URL=https://vibe-storefront.com
```

Redeploy production after `NEXT_PUBLIC_APP_URL` is set.

## Product Image Backfill

After the storage migration and deployment, backfill existing production storefronts if needed:

```bash
npm run backfill:product-images -- --env .env.prod
npm run backfill:product-images -- --env .env.prod --write --confirm-production
```

## Production Verification

Verify on `https://vibe-storefront.com`:

- Signed-out homepage renders.
- Clerk sign-in works, including account creation and Google sign-in from `/sign-in`.
- Signed-in generation succeeds.
- Dashboard lists the saved storefront.
- Public share URL works while signed out.
- Product images appear on newly generated and backfilled storefronts.
- Vercel logs show no runtime errors for `/api/storefronts` or `/s/[slug]`.
