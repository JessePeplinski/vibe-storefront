# Local Development

Use this guide for local setup, local-only provider keys, and manual smoke testing.

## Environment

Use Node.js 24.x for local development. If you use `nvm`, run:

```bash
nvm use
```

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in these values:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

CODEX_API_KEY=
CODEX_MODEL=gpt-5.5
OPENAI_API_KEY=
OPENAI_IMAGE_MODEL=gpt-image-2

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Use Clerk development keys locally. `OPENAI_API_KEY` is optional when it points to the same OpenAI project as `CODEX_API_KEY`; the app falls back to `CODEX_API_KEY` for image generation.

Do not commit `.env.local`. Production/demo keys belong only in Vercel environment variables or an ignored local reference file such as `.env.prod`.

## Supabase

Local Supabase requires a Docker-compatible container runtime such as Docker Desktop, OrbStack, Rancher Desktop, or Podman. Start the container runtime before running the Supabase CLI.

Start the local Supabase stack:

```bash
npx -y supabase start
```

Local Supabase Studio runs at `http://127.0.0.1:54323`.

Supabase schema lives in `supabase/migrations`. Local generate/save/share testing should use the local Supabase stack, not production Supabase.

## App Server

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Authentication

The app uses Clerk's prebuilt sign-in component at `/sign-in`; account creation is handled from the same Clerk flow. Local development should use a Clerk development instance.

Google sign-in can use Clerk's shared OAuth credentials in development. Production Google sign-in requires custom Google OAuth credentials configured in Clerk; see [`deployment-checklist.md`](deployment-checklist.md).

## Local Smoke Test

After the dev server is running:

1. Sign in with a Clerk development user.
2. Open the signed-out homepage in a private browser window.
3. Confirm `See all storefronts` opens the public storefront gallery.
4. Confirm the signed-out homepage prompts for sign-in instead of submitting public generation.
5. Sign in with a Clerk development user, open `/dashboard`, and confirm signed-in generation creates saved storefronts.
6. Try to generate a fourth different storefront from the same signed-in account and confirm the three-storefront limit blocks it without another generation.
7. Open the generated share URL in a signed-out browser and confirm the public share page renders.

To reset a local Clerk development user while testing, remove that user's local generation slots and storefront rows from Supabase Studio or the local SQL editor:

```sql
delete from public.storefront_generation_slots
where owner_clerk_user_id = '<clerk user id>';

delete from public.storefronts
where owner_clerk_user_id = '<clerk user id>';
```

## Automated Verification

```bash
npm run verify
```

`npm run verify` runs typecheck, lint, unit tests, production build, and the Playwright browser smoke test sequentially. The smoke test starts the built app, verifies the homepage and all-storefronts page in Chromium, verifies the first public share page when public storefront data exists, and stops the temporary server afterward.

`npm run smoke:production` runs the same Playwright smoke test against `https://vibe-storefront.com` without starting a local server. Set `PLAYWRIGHT_BASE_URL` to test another deployed URL.

`npm run smoke:browser` expects `npm run build` to have already created `.next`. If Playwright cannot find Chromium, run:

```bash
npx playwright install chromium
```
