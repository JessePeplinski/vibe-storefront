# AGENTS.md

Instructions for AI coding agents working in this repository.

## Project Overview

Vibe Storefront is a Next.js App Router prototype for turning product ideas into shareable storefront concepts. A signed-in user enters a product idea, the server calls the Codex SDK for structured storefront content, saves it to Supabase, and exposes a public share URL.

## Development Workflow

- Work from a feature branch. Do not commit directly to `main`.
- Keep changes focused on the requested task and avoid unrelated refactors.
- Treat "all set" as approval to publish the completed work: commit the feature branch, merge it into `dev`, merge `dev` into `main`, then push the updated branches.
- Before merging, run:

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm start -- -p 3100
npm run smoke:browser
```

Run the checks sequentially so `next build` and `tsc` do not compete over `.next` artifacts. For the browser smoke test, run `npm start -- -p 3100` in one terminal, run the smoke command against that server, then stop the server after it passes. The smoke test defaults to `http://127.0.0.1:3100`; override with `PLAYWRIGHT_BASE_URL` only when using a different port.

## Environment Rules

- Do not commit secrets.
- `.env.local` is for local development and must stay gitignored.
- `.env.prod` is an ignored local reference file for production/demo keys.
- Use Clerk development keys locally.
- Use the local Supabase stack for local testing:

```bash
npx -y supabase start
```

- Local Supabase Studio runs at `http://127.0.0.1:54323`.
- Local app URL is `http://localhost:3000`.
- Production secrets belong in Vercel environment variables only.

## Runtime Notes

- The Codex generation route must run in the Node.js runtime because the Codex SDK spawns the Codex CLI.
- The app validates Codex output with the Zod schema in `lib/storefront-schema.ts`.
- Supabase service-role writes should stay server-side only.
- Public storefront reads should continue to use the public/anon Supabase client and RLS.

## Testing Notes

- Browser end-to-end testing should use a Clerk development user.
- Local generate/save/share testing should write only to local Supabase.
- If generation fails with quota errors, check the OpenAI project tied to `CODEX_API_KEY` rather than changing persistence code.
