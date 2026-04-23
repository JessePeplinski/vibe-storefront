# Vibe Storefront Video Script Notes

## Demo Flow

1. Start on the production app and sign in.
2. Explain the core workflow: enter a product idea, generate structured storefront content with the Codex SDK, save it to Supabase, and get a public share URL.
3. Generate a storefront live with a new product idea.
4. Open the share URL, reload it, and show that it works as a public page.
5. Open the dashboard and show that the saved storefront appears for the signed-in user.

## Architecture Beat

Vibe Storefront is a Next.js App Router app with Clerk for auth, Supabase Postgres for persistence and public reads, and a Node.js API route that invokes the OpenAI Codex SDK. The route validates Codex output with Zod before saving it, so the generated page content has a predictable shape instead of being treated as arbitrary text.

## Integration Friction Beat

The most time-consuming part was not the app code. It was getting the provider configuration right: Clerk auth, Supabase keys, Vercel env vars, and especially the OpenAI project-scoped API key and credit balance. After that, production exposed one runtime packaging fix for the Codex CLI on Vercel and one Supabase URL correction. That is the kind of integration work I would expect in a real deployment, and I wanted the demo to reflect that rather than only showing the happy path.

## Production Notes

- Local verification used the local Supabase stack and a Clerk development user.
- Production verification confirmed the generated storefront saved to hosted Supabase and rendered at a public share URL.
- The Codex route must run in the Node.js runtime because the SDK spawns the Codex CLI.
- Vercel needs production env vars for Clerk, Supabase, OpenAI, and `NEXT_PUBLIC_APP_URL`.
- Clerk should be promoted to live production keys before a polished external demo.
