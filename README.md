# Vibe Storefront

Vibe Storefront is a Next.js App Router demo for the Codex Solutions Architect take-home. A signed-in user enters a plain-English product idea, the server calls the OpenAI Codex SDK for structured storefront content, saves it to Supabase, and returns a public share URL.

## Live Test URL

- Production: https://vibe-storefront-two.vercel.app

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

Supabase schema lives in `supabase/migrations`. The applied schema creates `public.storefronts`, enables RLS, allows public reads only for published storefronts, and keeps writes behind Clerk-authenticated server routes using the service role key. Local generate/save/share testing should use the local Supabase stack.

## Development

```bash
npm install
npx -y supabase start
npm run dev
```

Open `http://localhost:3000`. Local Supabase Studio runs at `http://127.0.0.1:54323`.

## Local Smoke Test

After the dev server is running:

1. Sign in with a Clerk development user.
2. Generate a storefront from a product idea.
3. Confirm the success state shows a share URL.
4. Open the share URL and reload it.
5. Sign out or use a private browser window and confirm the public share page still renders.
6. Open `/dashboard` while signed in and confirm the saved storefront appears.

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
- Production URL: https://vibe-storefront-two.vercel.app
- Production branch: `main`
- Node.js runtime in Vercel: 24.x
- Deployment checklist: [`docs/deployment-checklist.md`](docs/deployment-checklist.md)

Production deploys should come from `main`. Set `NEXT_PUBLIC_APP_URL` to the production URL in Vercel so generated share links use the stable live host.
