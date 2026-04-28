# Vibe Storefront

[![vercel deploy](https://img.shields.io/website?url=https%3A%2F%2Fvibe-storefront.com&label=vercel%20deploy&up_message=online&down_message=offline&logo=vercel)](https://vibe-storefront.com)
[![verify](https://github.com/JessePeplinski/vibe-storefront/actions/workflows/verify.yml/badge.svg?branch=main)](https://github.com/JessePeplinski/vibe-storefront/actions/workflows/verify.yml)
[![coverage](https://img.shields.io/codecov/c/github/JessePeplinski/vibe-storefront?label=coverage&logo=codecov)](https://codecov.io/gh/JessePeplinski/vibe-storefront)
[![license](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

Vibe Storefront is a Next.js prototype that turns a plain-English product idea into a shareable storefront concept. It generates structured storefront copy with the OpenAI Codex SDK, creates product imagery with the OpenAI Image API, saves the result to Supabase, and publishes a public share page.

Demo: https://vibe-storefront.com

## Stack

- Next.js 16 App Router, React, TypeScript, Tailwind CSS
- Clerk for authentication
- Supabase Postgres, Row Level Security, and Storage
- `@openai/codex-sdk`, `@openai/codex`, and the OpenAI Image API
- Vitest, Testing Library, and Playwright

## Quick Start

Use Node.js 24.x. If you use `nvm`, run `nvm use` from the repo root.

Copy the local environment template and fill in development keys:

```bash
cp .env.example .env.local
```

Install dependencies, start the local Supabase stack, and run the app:

```bash
npm install
npx -y supabase start
npm run dev
```

Open `http://localhost:3000`.

Local Supabase requires a Docker-compatible container runtime such as Docker Desktop, OrbStack, Rancher Desktop, or Podman. Use Clerk development keys locally. See [`docs/local-development.md`](docs/local-development.md) for the full local setup and manual smoke-test flow.

## Project Deck

The Reveal.js project deck is available at `http://localhost:3000/deck` in local development and `/deck` in deployed environments. Press `S` while viewing the deck to open Reveal.js speaker view with notes for the current slide.

Export the deck and speaker notes to PDF:

```bash
npm run deck:pdf
```

The generated PDF is written to `deck-export/vibe-storefront-codex-deck.pdf`. Open `http://localhost:3000/deck?print-pdf` for manual browser printing.

## Verification

Run the consolidated check before publishing changes:

```bash
npm run verify
```

`npm run verify` runs typecheck, lint, unit tests, production build, and the Playwright browser smoke test sequentially.

## Project Docs

- [`docs/local-development.md`](docs/local-development.md) - local environment setup, Supabase, Clerk, and smoke testing.
- [`docs/project-context.md`](docs/project-context.md) - runtime architecture, persistence boundaries, guest storefront behavior, and image backfill notes.
- [`docs/deployment-checklist.md`](docs/deployment-checklist.md) - production environment, migrations, Vercel, and deployment verification.

## License

Open source under the [MIT License](LICENSE). You can use, copy, modify, merge, publish, distribute, sublicense, and sell copies of this project, provided the copyright and license notice stay with the software.
