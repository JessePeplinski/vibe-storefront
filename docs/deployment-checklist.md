# Vibe Storefront Deployment Checklist

Use this checklist to configure the real provider keys without pasting secrets into Codex.

## 1. Local Environment

Create `.env.local` from `.env.example` and fill every value:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

CODEX_API_KEY=
CODEX_MODEL=gpt-5.3-codex
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Do not commit `.env.local`; it is gitignored.

## 2. Generate Provider Keys

Clerk:

- Open the Clerk Dashboard for the app.
- Use development keys locally: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...` and `CLERK_SECRET_KEY=sk_test_...`.
- Use production keys in Vercel: `pk_live_...` and `sk_live_...`.
- Keep the sign-in/sign-up URLs set to `/sign-in` and `/sign-up`.
- For production Google sign-in, configure a Google SSO connection in Clerk with custom OAuth credentials using Clerk's [Google social connection guide](https://clerk.com/docs/authentication/social-connections/google):
  - In Clerk, open SSO connections, add or edit Google for all users, and enable sign-up/sign-in plus custom credentials.
  - In Google Cloud Console, create a Web application OAuth client.
  - Add `https://vibe-storefront-two.vercel.app` and any custom production domain as authorized JavaScript origins.
  - Paste Clerk's exact Authorized Redirect URI into Google's Authorized Redirect URIs.
  - Save the Google Client ID and Client Secret in Clerk only; do not add them to Vercel env vars or commit them.
  - Before public testing, confirm the Google OAuth app is published for the intended audience, not limited to test users.

Supabase:

- Open the Supabase project dashboard.
- Copy the Project URL into `NEXT_PUBLIC_SUPABASE_URL`.
- Copy the anon or publishable public API key into `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Copy the service role key into `SUPABASE_SERVICE_ROLE_KEY`.
- Never expose the service role key in browser code.

OpenAI:

- Open the OpenAI Platform project API keys page.
- Create a secret API key with access to the Codex model used by this app.
- Store it as `CODEX_API_KEY`.
- Leave `CODEX_MODEL=gpt-5.3-codex` unless the app is intentionally retargeted.

## 3. Local Verification

Start Docker Desktop or another Docker-compatible container runtime before starting the local Supabase stack.

Run:

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run dev
```

Then verify:

- Open `http://localhost:3000`.
- Create or use a disposable Clerk test user.
- Generate a storefront from a product idea.
- Confirm the success state shows a share URL.
- Open the share URL and reload it.
- Sign out or open a private browser window and confirm the public share page still renders.
- Open `/dashboard` while signed in and confirm the saved storefront appears.

## 4. Production Deployment

Promote the verified branch to `main`, because production deploys should only come from `main`:

```bash
git checkout main
git merge --no-ff feat/guest-storefront-demo
git push -u origin main
```

Apply Supabase migrations to the production database before or immediately after the Vercel deploy. Production does not automatically receive local migrations just because the app is deployed.

Recommended CLI flow:

```bash
npx -y supabase login
npx -y supabase link --project-ref <production-project-ref>
npx -y supabase migration list --linked
npx -y supabase db push
npx -y supabase migration list --linked
```

For this feature, production must include `20260424020403_add_guest_storefronts.sql` for guest generation and `20260424120000_remove_homepage_example_storefront.sql` for the public storefront gallery cleanup. If using the Supabase SQL Editor instead of the CLI, run those migration SQL files once against the production project and confirm the migration history/schema afterward.

Create a new Vercel project connected to `JessePeplinski/vibe-storefront`.

Vercel settings:

- Framework preset: Next.js.
- Production branch: `main`.
- Root directory: repository root.
- Build command: `npm run build`.
- Install command: `npm install`.

Add the same environment variables in Vercel Production, with these differences:

- Use live Clerk keys.
- Set `NEXT_PUBLIC_APP_URL` to the final Vercel production URL.

Redeploy production after `NEXT_PUBLIC_APP_URL` is set.

## 5. Production Verification

Verify on the deployed URL:

- Signed-out homepage renders.
- Clerk sign-in/sign-up works, including Google sign-in from `/sign-in`.
- Signed-in generation succeeds.
- Dashboard lists the saved storefront.
- Public share URL works while signed out.
- Vercel logs show no runtime errors for `/api/storefronts` or `/s/[slug]`.
