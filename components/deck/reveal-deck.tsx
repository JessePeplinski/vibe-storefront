"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import type { RevealApi } from "reveal.js";

function shouldShowPrintNotes() {
  if (typeof window === "undefined") {
    return false;
  }

  const searchParams = new URLSearchParams(window.location.search);

  return searchParams.has("print-pdf");
}

function exposePrintSlideContent(attempt = 0) {
  window.setTimeout(() => {
    const printPages = document.querySelectorAll(".pdf-page");
    const hiddenPrintSlides = document.querySelectorAll<HTMLElement>(
      ".pdf-page section[hidden]"
    );

    hiddenPrintSlides.forEach((slide) => {
      slide.removeAttribute("hidden");
      slide.setAttribute("aria-hidden", "false");
    });

    if (
      (printPages.length === 0 || hiddenPrintSlides.length > 0) &&
      attempt < 600
    ) {
      exposePrintSlideContent(attempt + 1);
    }
  }, 50);
}

export function RevealDeck() {
  const deckRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    let deck: RevealApi | null = null;

    async function initializeDeck() {
      const [{ default: Reveal }, { default: RevealNotes }] =
        await Promise.all([
          import("reveal.js"),
          import("reveal.js/plugin/notes")
        ]);

      if (!deckRef.current || cancelled) {
        return;
      }

      const showNotes = (
        shouldShowPrintNotes() ? "separate-page" : false
      ) as unknown as boolean;

      deck = new Reveal(deckRef.current, {
        backgroundTransition: "none",
        center: false,
        controls: true,
        hash: true,
        height: 720,
        margin: 0.045,
        minScale: 0.2,
        maxScale: 1.35,
        pdfMaxPagesPerSlide: 1,
        pdfSeparateFragments: false,
        plugins: [RevealNotes],
        progress: true,
        showNotes,
        showSlideNumber: "all",
        slideNumber: "c/t",
        transition: "none",
        width: 1280
      });

      await deck.initialize();

      if (shouldShowPrintNotes()) {
        exposePrintSlideContent();
      }
    }

    void initializeDeck();

    return () => {
      cancelled = true;
      deck?.destroy();
    };
  }, []);

  return (
    <main className="deck-page" data-testid="reveal-deck-page">
      <div className="reveal deck-reveal" ref={deckRef}>
        <div className="slides">
          <section className="deck-slide deck-title-slide">
            <div className="deck-kicker">Codex-powered storefronts</div>
            <h1>Vibe Storefront</h1>
            <p className="deck-lede">
              How I planned and executed a Codex-built app.
            </p>
            <p className="deck-title-meta">Created by Jesse Peplinski</p>
            <aside className="notes">
              <p>
                Vibe Storefront turns a product idea into a shareable
                storefront concept. I am going to focus less on pitching the
                product and more on the build: how I scoped the loop, used
                Codex in slices, reviewed the output, and verified the path. I
                used Codex throughout the project: planning, implementation,
                debugging, tests, polish, and the runtime generation itself. I
                see Codex as a core layer of my engineering workflow, not a
                separate tool I occasionally reach for.
              </p>
            </aside>
          </section>

          <section className="deck-slide">
            <div className="deck-kicker">Problem</div>
            <h2>Ideas need something concrete.</h2>
            <p className="deck-lead">
              A rough product idea is hard to judge while it stays text.
            </p>
            <ul aria-label="Problem framing" className="deck-bullet-list">
              <li>
                <strong>Too abstract</strong>
                <span>Text alone hides what the product might feel like.</span>
              </li>
              <li>
                <strong>Slow feedback</strong>
                <span>People need an artifact they can inspect and react to.</span>
              </li>
              <li>
                <strong>Hard to share</strong>
                <span>A prompt is not as useful as a visible concept.</span>
              </li>
              <li>
                <strong>Good Codex target</strong>
                <span>Structured generation can create the first artifact fast.</span>
              </li>
            </ul>
            <aside className="notes">
              <p>
                Text ideas are hard to judge. I wanted Codex to turn a rough
                prompt into something concrete enough to inspect, share, and
                react to without building a full commerce platform.
              </p>
            </aside>
          </section>

          <section className="deck-slide deck-dark-slide">
            <div className="deck-kicker">Solution</div>
            <h2>One sentence becomes a storefront.</h2>
            <p className="deck-lead">
              Codex generates the concept; the app makes it shareable.
            </p>
            <ol aria-label="Product flow" className="deck-bullet-list">
              <li>
                <strong>Input</strong>
                <span>Plain-English product idea</span>
              </li>
              <li>
                <strong>Generation</strong>
                <span>Structured storefront content from Codex</span>
              </li>
              <li>
                <strong>Output</strong>
                <span>Rendered product page with generated imagery</span>
              </li>
              <li>
                <strong>Distribution</strong>
                <span>Public URL for review and feedback</span>
              </li>
            </ol>
            <aside className="notes">
              <p>
                The loop is simple: enter an idea, generate structured
                storefront content, render it with product imagery, and return a
                public URL. The first run stays immediate; sign-in adds
                ownership and history after the payoff.
              </p>
            </aside>
          </section>

          <section className="deck-slide">
            <div className="deck-kicker">Build strategy</div>
            <h2>Scope one complete loop.</h2>
            <p className="deck-lead">
              Four moves: auth, generate, save, share.
            </p>
            <ul aria-label="Build strategy" className="deck-bullet-list">
              <li>
                <strong>Auth</strong>
                <span>Ownership and history after the first interaction.</span>
              </li>
              <li>
                <strong>Generate</strong>
                <span>The wow moment stays on the critical path.</span>
              </li>
              <li>
                <strong>Save</strong>
                <span>The output persists instead of disappearing after demo.</span>
              </li>
              <li>
                <strong>Share</strong>
                <span>The result becomes portable and reviewable.</span>
              </li>
            </ul>
            <aside className="notes">
              <p>
                I kept the build to one complete loop: auth, generate, save,
                and share. That gave Codex a clear boundary and kept me from
                drifting into nice-to-have features before the core path worked.
              </p>
            </aside>
          </section>

          <section className="deck-slide">
            <div className="deck-kicker">Codex operating model</div>
            <h2>Use Codex in scoped slices.</h2>
            <p className="deck-lead">
              Plan, implement, debug, verify, polish.
            </p>
            <ul aria-label="Codex operating model" className="deck-bullet-list">
              <li>
                <strong>Plan</strong>
                <span>Use Codex to pressure-test scope and sequence.</span>
              </li>
              <li>
                <strong>Implement</strong>
                <span>Hand it concrete routes, components, and tests.</span>
              </li>
              <li>
                <strong>Review</strong>
                <span>Keep product judgment and code review with me.</span>
              </li>
              <li>
                <strong>Verify</strong>
                <span>Run local checks, browser smoke, and production checks.</span>
              </li>
            </ul>
            <aside className="notes">
              <p>
                My pattern was plan, implement, review, verify. I used Codex for
                concrete slices like routes, components, schema validation,
                tests, deployment fixes, and UI polish, while keeping product
                judgment and code review with me.
              </p>
            </aside>
          </section>

          <section className="deck-slide">
            <div className="deck-kicker">Architecture</div>
            <h2>Simple stack, real integration surface.</h2>
            <p className="deck-lead">
              App, UI, auth, data, AI, validation, and deployment.
            </p>
            <ul
              aria-label="Architecture"
              className="deck-bullet-list deck-architecture"
            >
              <li>
                <strong>App framework</strong>
                <span>Next.js 16 App Router, React, TypeScript</span>
              </li>
              <li>
                <strong>UI system</strong>
                <span>shadcn/ui patterns, Radix UI, Tailwind CSS</span>
              </li>
              <li>
                <strong>Authentication</strong>
                <span>Clerk</span>
              </li>
              <li>
                <strong>Database</strong>
                <span>Supabase Postgres with Row Level Security</span>
              </li>
              <li>
                <strong>Storage</strong>
                <span>Supabase Storage for generated product images</span>
              </li>
              <li>
                <strong>Storefront AI</strong>
                <span>OpenAI Codex SDK and packaged Codex CLI</span>
              </li>
              <li>
                <strong>Image generation</strong>
                <span>OpenAI Image API</span>
              </li>
              <li>
                <strong>Schema contract</strong>
                <span>Zod and zod-to-json-schema</span>
              </li>
              <li>
                <strong>Deployment</strong>
                <span>Vercel on Node.js 24</span>
              </li>
              <li>
                <strong>Verification</strong>
                <span>Vitest, Testing Library, Playwright</span>
              </li>
            </ul>
            <aside className="notes">
              <p>
                Stack in one sentence: Next.js, Clerk, Supabase, the Codex SDK,
                the OpenAI Image API, Zod, Vercel, and Playwright. The important
                surface is the server route: generate, validate, persist, and
                return the share URL.
              </p>
            </aside>
          </section>

          <section className="deck-slide deck-generated-architecture-slide">
            <div className="deck-image-stage deck-generated-image-stage">
              <Image
                alt="Image API generated diagram showing the Vibe Storefront stack from product idea through web app, Codex generation, validation, storage, deployment, and browser verification"
                height={941}
                priority
                sizes="100vw"
                src="/deck-assets/stack-architecture-gpt-image-2-clean.png"
                width={1672}
              />
            </div>
            <aside className="notes">
              <p>
                Pause for three seconds with no narration, then move on.
              </p>
            </aside>
          </section>

          <section className="deck-slide deck-dark-slide">
            <div className="deck-kicker">Runtime AI contract</div>
            <h2>Constrain, validate, persist.</h2>
            <p className="deck-lead">
              Treat the model like an external dependency.
            </p>
            <ol aria-label="Runtime AI contract" className="deck-bullet-list">
              <li>
                <strong>Request</strong>
                <span>Receive product idea</span>
              </li>
              <li>
                <strong>Generation</strong>
                <span>Call Codex with schema guardrails</span>
              </li>
              <li>
                <strong>Contract</strong>
                <span>Validate with Zod</span>
              </li>
              <li>
                <strong>Persistence</strong>
                <span>Persist in Supabase</span>
              </li>
              <li>
                <strong>Rendering</strong>
                <span>Publish share page</span>
              </li>
            </ol>
            <aside className="notes">
              <p>
                I treated model output like an external dependency. Codex could
                generate the storefront, but the app still constrained the
                request, validated the response with Zod, saved only trusted
                data, and rendered from that contract.
              </p>
            </aside>
          </section>

          <section className="deck-slide">
            <div className="deck-kicker">Guardrails + verification</div>
            <h2>Verify the path, not the promise.</h2>
            <p className="deck-lead">
              Secrets, RLS, Zod, guest limit, local and production checks.
            </p>
            <ul className="deck-bullet-list">
              <li>
                <strong>Server secrets</strong>
                <span>No service keys in the browser.</span>
              </li>
              <li>
                <strong>RLS reads</strong>
                <span>Public pages use anon-safe access.</span>
              </li>
              <li>
                <strong>Zod contract</strong>
                <span>Model output is checked before save.</span>
              </li>
              <li>
                <strong>Guest limit</strong>
                <span>Cookie plus database uniqueness.</span>
              </li>
              <li>
                <strong>Checks</strong>
                <span>Typecheck, lint, tests, build, browser and prod smoke.</span>
              </li>
            </ul>
            <aside className="notes">
              <p>
                This is where the app became production-shaped. Secrets stay
                server-side, public reads use RLS, guest runs are limited, and
                verification covers code checks, browser smoke, and production
                smoke for auth, storage, env vars, and deployment assumptions.
              </p>
            </aside>
          </section>

          <section className="deck-slide">
            <div className="deck-kicker">Velocity evidence</div>
            <h2>From MVP to production-shaped.</h2>
            <p className="deck-lead">
              MVP in 2.5-3 hours; hardening after that.
            </p>
            <div className="deck-image-stage">
              <Image
                alt="Vibe Storefront MVP snapshot after the first working build"
                height={1000}
                priority
                sizes="(min-width: 1024px) 1100px, 90vw"
                src="/deck-assets/vibe-storefront-mvp-2-3-hour-snapshot.png"
                width={1440}
              />
            </div>
            <aside className="notes">
              <p>
                This screenshot is from the first working MVP, roughly two and
                a half to three hours in. After that, the work was hardening,
                not feature sprawl: generated images, UI polish, auth and
                environment fixes, deployment details, and browser verification.
              </p>
            </aside>
          </section>

          <section className="deck-slide deck-title-slide">
            <div className="deck-kicker">What I learned</div>
            <h2>Codex is strongest when the work is shaped well.</h2>
            <p className="deck-lead">
              Speed came from narrow scope, strong context, and verification.
            </p>
            <ul className="deck-bullet-list">
              <li>Narrow the product loop first.</li>
              <li>Give Codex concrete implementation slices.</li>
              <li>Validate model output before trusting it.</li>
              <li>Verify the user path before calling it done.</li>
            </ul>
            <aside className="notes">
              <p>
                The takeaway is that Codex is strongest when the work is shaped
                well: narrow the loop, hand it concrete slices, review what it
                returns, and verify the user path before calling the work done.
              </p>
            </aside>
          </section>
        </div>
      </div>
    </main>
  );
}
