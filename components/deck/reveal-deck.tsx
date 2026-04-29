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
                For part two, I am going to walk through how I planned and
                executed Vibe Storefront using Codex. The focus is the build
                process: how I narrowed the scope, how I split the work into
                scoped slices, where I reviewed the output, and how I verified
                the app as it moved from local demo to production-shaped build.
              </p>
              <p>
                The app itself is simple on purpose. A visitor enters a
                plain-English product idea, Codex generates structured
                storefront content at runtime, and the app turns that output
                into a public page. I used Codex both as a build partner and as
                the runtime engine behind the product.
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
                The problem I chose was intentionally small. People have rough
                product ideas all the time, but those ideas are hard to judge
                while they only exist as a sentence. You need something concrete
                to react to.
              </p>
              <p>
                That made it a good Codex build target. The app did not need to
                become a full commerce platform. It needed to turn a vague idea
                into a visible artifact quickly enough that someone could
                inspect it, share it, and decide whether the direction was worth
                more work.
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
                The solution was to make the first artifact immediate. A user
                types a product idea, Codex turns that idea into structured
                storefront content, and the app renders a public concept page
                that is real enough to review.
              </p>
              <p>
                I kept the framing practical rather than startup-pitchy. The
                important signal for this walkthrough is that I picked a product
                loop where Codex could clearly accelerate both the engineering
                work and the runtime user experience.
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
                My first planning move with Codex was narrowing the build. I
                kept pushing the scope back to one complete product loop: auth,
                generate, save, and share. That gave Codex a clear shape to work
                inside, and it kept me from spending time on nice-to-have
                features before the core path worked.
              </p>
              <p>
                I also made one product decision deliberately: the homepage lets
                a visitor run one guest generation before sign-in. Requiring
                sign-in first would hide the payoff. I kept the first run
                immediate, then used sign-in for ownership, history, and repeat
                usage.
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
                This was the operating model for the build. I did not ask Codex
                to magically build a startup. I used it to plan the sequence,
                then gave it smaller implementation slices: route behavior,
                component work, schema validation, tests, production fixes, and
                UI polish.
              </p>
              <p>
                The important part is that I stayed in the loop. Codex
                accelerated the work, but I still reviewed the output, checked
                whether it matched the product goal, ran the verification suite,
                and used the browser when the user-facing path needed visual
                confirmation.
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
                generated storefronts and images, and Vercel hosts it. I did not
                want the surrounding stack to be the interesting or fragile
                part.
              </p>
              <p>
                The interesting part is where Codex sits in the loop. The server
                route takes the idea, calls Codex, validates the response,
                persists the storefront, and returns a share URL. Public pages
                read through the anon-safe path, while privileged writes stay
                server-side.
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
                This is a deliberately light follow-up to the stack list. I
                generated the visual with the OpenAI Image API using
                gpt-image-2, then committed it as a static deck asset so the
                presentation does not depend on a live image call.
              </p>
              <p>
                I would skim this slide quickly. The point is not that the model
                drew perfect system architecture. The point is that I can use
                the same image-generation path from the app to produce a
                presentation-ready visual artifact.
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
                The runtime Codex call needed a real contract. The app receives
                the product idea, calls Codex with schema-bound instructions,
                validates the response with Zod, persists it in Supabase, and
                then renders the public page from trusted structured data.
              </p>
              <p>
                That was a deliberate engineering choice. Prompt quality
                matters, but it is not enough. I treated model output like any
                other external dependency: constrain it, validate it, handle
                failure, and only let the renderer trust data after it has
                passed the app contract.
              </p>
            </aside>
          </section>

          <section className="deck-slide">
            <div className="deck-kicker">Guardrails + verification</div>
            <h2>Verify the path, not the promise.</h2>
            <p className="deck-lead">
              Secrets, RLS, Zod, guest limit, tests, smoke checks.
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
                <span>Typecheck, lint, unit tests, build, browser smoke.</span>
              </li>
            </ul>
            <aside className="notes">
              <p>
                I wanted the demo path to be open, but not sloppy. Server
                secrets stay on the server. Public pages read through anon-safe
                access and RLS. Model output has to pass the Zod contract before
                save. The guest limit uses a cookie plus database uniqueness to
                keep the first-run experience simple.
              </p>
              <p>
                Verification was part of the workflow, not a final cleanup step.
                I used tests and type checks for code confidence, browser smoke
                for the real user path, and production checks when the problem
                involved auth, environment variables, storage, or deployment.
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
                This screenshot is from the first working MVP. I got to that
                point in roughly two and a half to three hours. At that point,
                the app already had the core loop: auth, persistence, tests, and
                Codex running at runtime.
              </p>
              <p>
                That is the best evidence for how I used Codex. The early speed
                came from narrow scope and scoped implementation asks. The work
                after that was not feature sprawl. It was production hardening:
                generated product images, UI polish, auth and environment fixes,
                deployment details, and repeated browser verification.
              </p>
            </aside>
          </section>

          <section className="deck-slide">
            <div className="deck-kicker">Production hardening</div>
            <h2>Make localhost assumptions fail safely.</h2>
            <p className="deck-lead">
              Auth, storage, env vars, domain, AI runtime.
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
                This is the part that looks less flashy in a demo, but it is
                where a lot of real engineering judgment mattered. Localhost is
                forgiving. Production forces the assumptions to become explicit.
              </p>
              <p>
                I had to deal with Clerk production auth, Supabase keys and
                storage, Vercel environment variables, DNS, domain verification,
                and a Codex CLI packaging issue. Codex helped with a lot of that
                debugging, but I still had to verify each layer instead of
                assuming the first answer was right. That is the pattern I want
                to emphasize: Codex accelerated the work, and verification made
                it reliable.
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
                data. But the core loop is the right shape, and the build
                process is the important takeaway: plan with Codex, execute in
                scoped slices, review the output, and verify the user path
                before calling the work done.
              </p>
            </aside>
          </section>
        </div>
      </div>
    </main>
  );
}
