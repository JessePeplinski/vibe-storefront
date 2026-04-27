# AGENTS.md

Instructions for AI coding agents working in this repository.

## Project Overview

Vibe Storefront is a Next.js App Router prototype for turning product ideas into shareable storefront concepts. A visitor enters a plain-English product idea, the server calls the Codex SDK for structured storefront content, saves it to Supabase, generates product imagery, and exposes a public share URL.

## Source Docs

- `README.md` is the public-facing project overview. Keep it concise and avoid moving internal operations back into it.
- `docs/local-development.md` is the local setup and smoke-test guide. Check it before changing local environment, Clerk, Supabase, or verification instructions.
- `docs/project-context.md` is the maintainer context for runtime behavior, persistence boundaries, guest storefront behavior, product image storage, and image backfill.
- `docs/deployment-checklist.md` is the production deployment source of truth. Check it before changing Vercel, production environment variables, production Supabase migrations, Google sign-in, or deployment verification.

## Codex Runbook

- Start every task with `git status --short --branch` and confirm the active branch before editing.
- Use Node.js 24.x for repo commands; `.nvmrc` and `package.json` engines are the source of truth.
- Keep README changes public-facing. Move local setup, runtime notes, deployment details, and maintainer-only context into the matching `docs/` file.
- For docs-only changes, run `git diff --check` before finishing.
- For code, config, schema, or behavior changes, run `npm run verify` before finishing or publishing.
- For local generate/save/share testing, use the local Supabase stack only; do not write test data to production Supabase.
- If the user says "all set", treat it as approval to publish through the documented branch flow after verification.

## Development Workflow

- Work from a feature branch. Do not commit directly to `main`.
- Keep changes focused on the requested task and avoid unrelated refactors.
- Treat "all set" as approval to publish the completed work: commit the feature branch, merge it into `dev`, merge `dev` into `main`, then push the updated branches.
- Before merging, run:

```bash
npm run verify
```

`npm run verify` runs typecheck, lint, unit tests, production build, and browser smoke sequentially so `next build` and `tsc` do not compete over `.next` artifacts. The browser smoke command starts the built app on `http://127.0.0.1:3100`, runs the Playwright smoke test, and stops the server afterward. Override the smoke port with `SMOKE_PORT` or the tested URL with `PLAYWRIGHT_BASE_URL` only when needed.

## Environment Rules

- Do not commit secrets.
- `.env.local` is for local development and must stay gitignored.
- `.env.prod` is an ignored local reference file for production/demo keys.
- Keep environment setup details in `docs/local-development.md`; keep production-only setup in `docs/deployment-checklist.md`.
- Use Clerk development keys locally.
- Local Supabase requires a Docker-compatible container runtime such as Docker Desktop, OrbStack, Rancher Desktop, or Podman; start it before running the Supabase CLI.
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
- Product image generation/storage and backfill behavior are documented in `docs/project-context.md`.

## Repo Map

- Dashboard UI lives in `components/storefront-studio.tsx`.
- Homepage UI lives in `app/(app)/page.tsx`; its generation form is wrapped by `components/landing-idea-teaser.tsx`.
- All storefronts gallery lives in `app/(app)/storefronts/page.tsx`.
- Public share pages render through `components/storefront-renderer.tsx`.
- `components/storefront-generation-form.tsx` is shared by homepage and dashboard; visible label/copy/layout changes there can affect both surfaces.

## Local Testing Notes

- `npm run smoke:browser` expects `npm run build` to have already created `.next`.
- If Playwright cannot find Chromium, run `npx playwright install chromium`.
- Failed Playwright runs can create `test-results/`; remove it before committing.
- Local generate/save/share testing must use the local Supabase stack, not production Supabase.

## Testing Notes

- Browser end-to-end testing should use a Clerk development user.
- Local generate/save/share testing should write only to local Supabase.
- If generation fails with quota errors, check the OpenAI project tied to `CODEX_API_KEY` rather than changing persistence code.
