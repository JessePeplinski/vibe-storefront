# Vibe Storefront

Vibe Storefront is a Next.js App Router demo for the Codex Solutions Architect take-home. A visitor enters a plain-English product idea, the server calls the OpenAI Codex SDK for structured storefront content, saves it to Supabase, and returns a public share URL. Signed-out visitors can generate one guest storefront before signing in.

## Live Test URL

- Production: https://vibe-storefront.com
- Vercel fallback: https://vibe-storefront-two.vercel.app

Use the production URL for deployed smoke testing. Generation requires the Vercel Production environment to have valid Clerk, Supabase, and `CODEX_API_KEY` values.

## Stack

- Next.js 16, TypeScript, Tailwind CSS
- Clerk for auth
- Supabase Postgres with RLS
- `@openai/codex-sdk` and `@openai/codex` for runtime generation
- Vitest and Testing Library

## Environment

Copy `.env.example` to `.env.local` and fill in:

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

Use Clerk development keys locally. Production/demo keys belong only in Vercel environment variables or an ignored local reference file such as `.env.prod`.

Supabase schema lives in `supabase/migrations`. The applied schema creates `public.storefronts`, enables RLS, allows public reads only for published storefronts, and keeps writes behind server routes using the service role key. Clerk users can create repeat storefronts; signed-out visitors are limited to one guest storefront by an HttpOnly cookie and database uniqueness constraint. Local generate/save/share testing should use the local Supabase stack.

## Authentication

The app uses Clerk's prebuilt sign-in and sign-up components at `/sign-in` and `/sign-up`. Local development should use a Clerk development instance. Production should use a Clerk production instance with live Clerk environment variables set in Vercel.

Google sign-in is configured in Clerk as a Google SSO connection. Development instances can use Clerk's shared OAuth credentials, but production Google sign-in requires custom Google OAuth credentials from Google Cloud. Store those OAuth credentials in Clerk only; do not add them to Vercel environment variables, `.env.local`, `.env.prod`, or source control.

Production Google OAuth setup:

1. In Clerk, open the production app's Google SSO connection and enable sign-up/sign-in with custom credentials.
2. In Google Cloud Console, create an OAuth client for a Web application.
3. Add the production domains as authorized JavaScript origins:
   - `https://vibe-storefront.com`
   - `https://vibe-storefront-two.vercel.app`
4. Add Clerk's exact Authorized Redirect URI as the Google authorized redirect URI. For the current production Clerk domain, this is `https://clerk.vibe-storefront.com/v1/oauth_callback`.
5. Paste the Google OAuth client values into Clerk and save the SSO connection.
6. On the Google OAuth consent screen, make sure the app is available to the intended audience. If the app remains in testing mode, add the Google accounts that should be allowed to sign in as test users.

After setup, verify Google sign-in from `https://vibe-storefront.com/sign-in`. Reaching Google's account chooser confirms the Clerk-to-Google OAuth handoff is configured.

## Development

Local Supabase requires a Docker-compatible container runtime such as Docker Desktop, OrbStack, Rancher Desktop, or Podman. Start the container runtime before running the Supabase CLI.

```bash
npm install
npx -y supabase start
npm run dev
```

Open `http://localhost:3000`. Local Supabase Studio runs at `http://127.0.0.1:54323`.

## Local Smoke Test

After the dev server is running:

1. Sign in with a Clerk development user.
2. Open the signed-out homepage in a private browser window.
3. Confirm `See example` opens the seeded public storefront.
4. Generate one guest storefront from the homepage input and confirm the success state links to the new share URL.
5. Reload the homepage, submit again as the same guest, and confirm the existing share URL is returned without another generation.
6. Sign in with a Clerk development user, open `/dashboard`, and confirm signed-in generation still creates saved storefronts.
7. Open a generated share URL in a signed-out browser and confirm the public share page renders.

## Verification

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

The Codex SDK route runs in the Node.js runtime because the SDK spawns the local Codex CLI. In deployed Vercel environments, the route uses `/tmp` for Codex runtime state and resolves the packaged platform Codex binary when available. If generation fails with quota errors, check the OpenAI project tied to `CODEX_API_KEY` before changing persistence code.

## Deployment

- Vercel project: `vibe-storefront`
- Production URL: https://vibe-storefront.com
- Vercel fallback URL: https://vibe-storefront-two.vercel.app
- Production branch: `main`
- Node.js runtime in Vercel: 24.x
- Deployment checklist: [`docs/deployment-checklist.md`](docs/deployment-checklist.md)

Production deploys should come from `main`. Set `NEXT_PUBLIC_APP_URL` to the production URL in Vercel so generated share links use the stable live host.

Run new Supabase migrations against the production database as a separate deployment step; Vercel deploys app code only and does not apply database migrations.
