# Vibe Storefront

Vibe Storefront is a Next.js App Router demo for the Codex Solutions Architect take-home. A signed-in user enters a plain-English product idea, the server calls the OpenAI Codex SDK for structured storefront content, saves it to Supabase, and returns a public share URL.

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
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
CODEX_API_KEY=
CODEX_MODEL=gpt-5.3-codex
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Supabase schema lives in `supabase/migrations`. The applied schema creates `public.storefronts`, enables RLS, allows public reads only for published storefronts, and keeps writes behind Clerk-authenticated server routes using the service role key.

## Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Verification

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

The Codex SDK route runs in the Node.js runtime because the SDK spawns the local Codex CLI. Set `CODEX_API_KEY` in Vercel before testing generation in a deployed environment.

## Deployment

- Deployment checklist: [`docs/deployment-checklist.md`](docs/deployment-checklist.md)
