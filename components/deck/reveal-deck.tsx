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
    const hiddenPrintSlides = document.querySelectorAll<HTMLElement>(
      ".pdf-page section[hidden]"
    );

    if (hiddenPrintSlides.length === 0 && attempt < 80) {
      exposePrintSlideContent(attempt + 1);

      return;
    }

    document
      .querySelectorAll<HTMLElement>(".pdf-page section[hidden]")
      .forEach((slide) => {
        slide.removeAttribute("hidden");
        slide.setAttribute("aria-hidden", "false");
      });
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
              Validate product ideas with a storefront.
            </p>
            <p className="deck-title-meta">Created by Jesse Peplinski</p>
            <aside className="notes">
              <p>
                For part two, I am going to walk through how I built this app
                using Codex. The focus here is the build process: how I scoped
                it, what I asked Codex to do, where I kept control, and how I
                got from a rough product idea to a working demo.
              </p>
              <p>
                The app is Vibe Storefront. You give it a plain-English product
                idea, and it turns that into a shareable storefront concept. The
                important detail is that Codex was part of both sides of the
                work: I used it to build the app, and the app uses Codex at
                runtime to generate the storefront content.
              </p>
              <p>
                I also used Codex to generate this PDF deck. That is the bigger
                point for me: I am not treating Codex as a one-off prompt box. I
                use it as a work tool for almost everything now, closer to an
                integrated agent, assistant, and operating layer than a chat
                window on the side.
              </p>
            </aside>
          </section>

          <section className="deck-slide">
            <div className="deck-kicker">Project goals</div>
            <h2>Ship one complete product loop.</h2>
            <p className="deck-lead">
              Auth, persistence, tests, and runtime Codex.
            </p>
            <ul aria-label="Project goals" className="deck-bullet-list">
              <li>
                <strong>Working product</strong>
                <span>Minimal features, fully baked UX.</span>
              </li>
              <li>
                <strong>Immediate payoff</strong>
                <span>Visible wow moment for the demo.</span>
              </li>
              <li>
                <strong>Readable code</strong>
                <span>Readable enough to open source.</span>
              </li>
              <li>
                <strong>Clear walkthrough</strong>
                <span>Explain the build, not just the result.</span>
              </li>
            </ul>
            <aside className="notes">
              <p>
                I started by forcing the scope down to one complete product
                loop. I did not want a pile of half-finished features. I wanted
                someone to land on the app, type an idea, get a result, save it,
                and share it.
              </p>
              <p>
                That meant the app still needed real product plumbing: auth,
                persistence, tests, and a runtime Codex call. My bar was that it
                should feel small, but not fake. If I was going to show it as a
                working demo, the core path needed to actually hold together.
              </p>
            </aside>
          </section>

          <section className="deck-slide deck-dark-slide">
            <div className="deck-kicker">Product bet</div>
            <h2>One sentence should become a real storefront.</h2>
            <p className="deck-lead">
              A product page materializes from a plain-English prompt.
            </p>
            <ol aria-label="Product flow" className="deck-bullet-list">
              <li>
                <strong>Input</strong>
                <span>Idea</span>
              </li>
              <li>
                <strong>Generation</strong>
                <span>Codex</span>
              </li>
              <li>
                <strong>Output</strong>
                <span>Storefront</span>
              </li>
              <li>
                <strong>Distribution</strong>
                <span>Share URL</span>
              </li>
            </ol>
            <aside className="notes">
              <p>
                The product bet was simple: one sentence should be enough to get
                a useful storefront draft. Not a final business, not a full
                Shopify replacement, but something that feels like a real first
                pass at a market-facing page.
              </p>
              <p>
                I liked this because the value is obvious without explaining the
                implementation. The user types an idea. Codex turns that into a
                storefront structure. The app renders it and gives them a public
                URL they can open or share.
              </p>
            </aside>
          </section>

          <section className="deck-slide">
            <div className="deck-kicker">Why this demo fits</div>
            <h2>A hackathon demo should be fast to grasp.</h2>
            <p className="deck-lead">Sign in, generate, save, share.</p>
            <ul className="deck-bullet-list">
              <li>Strong ecommerce framing</li>
              <li>Immediate visitor payoff</li>
              <li>Runtime Codex call is the product</li>
              <li>Public URL makes the output portable</li>
            </ul>
            <aside className="notes">
              <p>
                I wanted the demo to be fast to understand. The flow is sign in,
                generate, save, share. Even if someone only watches for a few
                seconds, they can see what the app is supposed to do.
              </p>
              <p>
                I also made one product decision very intentionally: the public
                homepage lets a visitor do one guest generation before sign-in.
                Requiring sign-in first would be safer from an abuse standpoint,
                but it would hide the actual wow moment. So I kept the first run
                immediate, and then made sign-in the path for ownership and
                history.
              </p>
            </aside>
          </section>

          <section className="deck-slide">
            <div className="deck-kicker">Planning with Codex</div>
            <h2>Scope the smallest impressive app.</h2>
            <p className="deck-lead">
              Four moves: auth, generate, save, share.
            </p>
            <ul className="deck-bullet-list">
              <li>
                Used Codex across planning, build, tests, fixes, and polish.
              </li>
            </ul>
            <aside className="notes">
              <p>
                The planning work with Codex was mostly about narrowing. I used
                it to pressure-test the scope, but I kept coming back to the
                same four moves: auth, generate, save, and share.
              </p>
              <p>
                After that, I used Codex across the actual implementation. It
                helped with route structure, component work, tests, production
                fixes, and polish. But I tried not to hand it a vague request
                like &quot;build me a startup.&quot; I gave it smaller
                slices and kept the product shape in my head.
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
                The architecture is intentionally boring around the AI part.
                Next.js is the app, Clerk handles auth, Supabase stores the
                generated storefronts, and Vercel hosts it. I did not want the
                surrounding stack to be the interesting or fragile part.
              </p>
              <p>
                The interesting part is where Codex sits in the loop. The server
                route takes the idea, calls Codex, validates the response,
                persists the storefront, and returns a share URL. Public pages
                read through the anon-safe path, while the privileged writes
                stay server-side.
              </p>
            </aside>
          </section>

          <section className="deck-slide deck-dark-slide">
            <div className="deck-kicker">Runtime flow</div>
            <h2>Constrain the model, then trust the app.</h2>
            <p className="deck-lead">
              Constrain, validate, persist, render.
            </p>
            <ol aria-label="Runtime flow" className="deck-bullet-list">
              <li>
                <strong>Step 1</strong>
                <span>Receive product idea</span>
              </li>
              <li>
                <strong>Step 2</strong>
                <span>Call Codex with schema guardrails</span>
              </li>
              <li>
                <strong>Step 3</strong>
                <span>Validate with Zod</span>
              </li>
              <li>
                <strong>Step 4</strong>
                <span>Persist in Supabase</span>
              </li>
              <li>
                <strong>Step 5</strong>
                <span>Publish share page</span>
              </li>
            </ol>
            <aside className="notes">
              <p>
                The runtime flow is where I was careful not to treat model text
                as automatically trustworthy. The app receives the product idea,
                calls Codex with schema-bound instructions, and then validates
                the output with Zod before anything gets saved.
              </p>
              <p>
                That pattern matters. For this kind of product, prompt quality
                is only part of it. The app still needs a contract around the AI
                call. My mental model was: constrain the model, validate the
                response, persist the result, then trust the app renderer.
              </p>
            </aside>
          </section>

          <section className="deck-slide">
            <div className="deck-kicker">Quality gates</div>
            <h2>The demo path still has guardrails.</h2>
            <p className="deck-lead">
              Secrets, public reads, model output, guest access.
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
            </ul>
            <aside className="notes">
              <p>
                These are the guardrails I cared about for the demo path. Server
                secrets stay on the server. Public storefront reads use anon
                access and RLS. Model output has to pass the Zod contract before
                save.
              </p>
              <p>
                The guest limit is also intentionally simple. It uses a cookie
                plus a database uniqueness check. That is not a perfect abuse
                system, but it is enough for this prototype, and it keeps the
                demo path open without pretending there is a full enterprise
                rate-limit system behind it.
              </p>
            </aside>
          </section>

          <section className="deck-slide">
            <div className="deck-kicker">Velocity</div>
            <h2>From MVP to production-shaped.</h2>
            <p className="deck-lead">
              Auth, persistence, tests, and runtime Codex in the first build.
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
                This screenshot is from the first working MVP. I got to that
                point in roughly two and a half to three hours. At that point,
                the app already had the core loop: auth, persistence, tests, and
                Codex running at runtime.
              </p>
              <p>
                The rest of the time was not about inventing more features. It
                was integration quality. I added product image generation,
                tightened the UI, fixed production auth and environment issues,
                worked through the deployment details, and kept verifying the
                real user path in the browser.
              </p>
            </aside>
          </section>

          <section className="deck-slide">
            <div className="deck-kicker">Production integration</div>
            <h2>The slow work was the real work.</h2>
            <p className="deck-lead">
              Production work means making localhost assumptions fail safely.
            </p>
            <ul className="deck-bullet-list">
              <li>
                <strong>Authentication</strong>
                <span>Clerk production auth.</span>
              </li>
              <li>
                <strong>Data and storage</strong>
                <span>Supabase keys and storage buckets.</span>
              </li>
              <li>
                <strong>Environment</strong>
                <span>Vercel environment variables.</span>
              </li>
              <li>
                <strong>Domain</strong>
                <span>DNS and verification.</span>
              </li>
              <li>
                <strong>AI runtime</strong>
                <span>Codex CLI packaging fix.</span>
              </li>
            </ul>
            <aside className="notes">
              <p>
                This is the part that always looks less flashy in a demo, but it
                is where a lot of real work happened. Localhost is one thing.
                Making the app behave correctly in production is a different
                level of detail.
              </p>
              <p>
                I had to deal with Clerk production auth, Supabase keys and
                storage, Vercel environment variables, DNS, domain verification,
                and a Codex CLI packaging issue. Codex helped with a lot of that
                debugging, but I still had to verify each layer instead of
                assuming the first answer was right.
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
              <li>Plan harder before implementation.</li>
              <li>Keep the product loop narrow.</li>
              <li>Validate model output like any external dependency.</li>
              <li>Use faster modes more during iteration.</li>
            </ul>
            <aside className="notes">
              <p>
                The main thing I learned is that Codex is strongest when the
                work is shaped well. The speed did not come from asking it to do
                everything at once. It came from narrowing the problem, giving it
                good context, and checking the result as I went.
              </p>
              <p>
                If I kept going, I would add analytics around generated share
                pages and a stronger admin cleanup path for production smoke
                data. But the core loop is the right shape: a simple product
                idea goes in, Codex generates a structured storefront, and the
                app turns it into something real enough to share.
              </p>
            </aside>
          </section>
        </div>
      </div>
    </main>
  );
}
