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
        backgroundTransition: "fade",
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
        transition: "fade",
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
          <section className="deck-slide deck-title-slide" data-background-color="#08251d">
            <div className="deck-kicker">Codex-powered storefronts</div>
            <h1>Vibe Storefront</h1>
            <p className="deck-lede">
              Turning a raw ecommerce idea into a shareable storefront with
              Codex in the product loop.
            </p>
            <div className="deck-title-meta">
              <span>Jesse Peplinski</span>
              <span>Product concept to working demo</span>
            </div>
            <aside className="notes">
              <p>
                This is the support deck for the second half of the walkthrough.
                I am keeping the visible slides light and using speaker notes as
                the leave-behind context.
              </p>
              <p>
                The core framing is simple: this is not just an app Codex helped
                build. Codex is also inside the app as the main generation path.
              </p>
            </aside>
          </section>

          <section className="deck-slide">
            <div className="deck-kicker">Project goals</div>
            <h2>Ship one complete product loop.</h2>
            <div className="deck-rubric-grid" aria-label="Project goals">
              <div>
                <strong>Working product</strong>
                <span>Minimal features, fully baked UX.</span>
              </div>
              <div>
                <strong>Immediate payoff</strong>
                <span>A hackathon demo with a visible wow moment.</span>
              </div>
              <div>
                <strong>Readable code</strong>
                <span>Readable enough to open source.</span>
              </div>
              <div>
                <strong>Clear walkthrough</strong>
                <span>Explain the build, not just the result.</span>
              </div>
            </div>
            <p className="deck-footnote">
              Core ingredients: auth, persistence, meaningful tests, and Codex
              at runtime.
            </p>
            <aside className="notes">
              <p>
                I treated this as a product and solutions exercise, not just a
                coding exercise. The app had to work, but the communication and
                tradeoff story mattered too.
              </p>
              <p>
                The most important requirement was programmatic Codex usage. It
                could not be only a project built with Codex. Codex needed to be
                part of the runtime product behavior.
              </p>
            </aside>
          </section>

          <section className="deck-slide deck-dark-slide" data-background-color="#08251d">
            <div className="deck-kicker">Product bet</div>
            <h2>One sentence should become a real storefront.</h2>
            <div className="deck-flow-line">
              <span>Idea</span>
              <span>Codex</span>
              <span>Storefront</span>
              <span>Share URL</span>
            </div>
            <p className="deck-lede">
              The wow moment is watching a product page materialize from a
              plain-English prompt.
            </p>
            <aside className="notes">
              <p>
                I picked this concept because it maps directly to the ecommerce
                hackathon framing and keeps the core loop obvious in a short
                video.
              </p>
              <p>
                The user does not need to understand the implementation to see
                the value. They type a product idea and get something that feels
                like a market-facing artifact.
              </p>
            </aside>
          </section>

          <section className="deck-slide">
            <div className="deck-kicker">Why this demo fits</div>
            <h2>A hackathon demo should be fast to grasp.</h2>
            <div className="deck-split">
              <div>
                <p className="deck-large-callout">
                  Sign in, generate, save, share.
                </p>
              </div>
              <ul className="deck-check-list">
                <li>Strong ecommerce framing</li>
                <li>Immediate visitor payoff</li>
                <li>Runtime Codex call is the product</li>
                <li>Public URL makes the output portable</li>
              </ul>
            </div>
            <aside className="notes">
              <p>
                I wanted the first visitor experience to show value before the
                code tour. That is why the public homepage allows one real guest
                generation before sign-in.
              </p>
              <p>
                Requiring sign-in first would reduce abuse risk, but it hides
                the central thing I built. The guest flow keeps the demo
                immediate while still giving signed-in users ownership and
                history.
              </p>
            </aside>
          </section>

          <section className="deck-slide">
            <div className="deck-kicker">Planning with Codex</div>
            <h2>Scope the smallest impressive app.</h2>
            <div className="deck-stack">
              <p>
                I mapped the prompt to four product moves: auth, generate, save,
                and share.
              </p>
              <p>
                Then I used Codex for planning, implementation, tests,
                production fixes, and final submission polish.
              </p>
            </div>
            <aside className="notes">
              <p>
                The planning constraint was the useful part. I did not want five
                partial features. I wanted one loop that was credible end to
                end.
              </p>
              <p>
                Codex helped move quickly, but I kept the product decision
                narrow: the app should demonstrate Codex as a product primitive,
                not just generate a pile of UI.
              </p>
            </aside>
          </section>

          <section className="deck-slide">
            <div className="deck-kicker">Architecture</div>
            <h2>Simple stack, real integration surface.</h2>
            <div className="deck-architecture" aria-label="Architecture">
              <span>Next.js App Router</span>
              <span>Clerk auth</span>
              <span>Supabase Postgres</span>
              <span>Codex SDK</span>
              <span>Vercel</span>
            </div>
            <p className="deck-footnote">
              Generation runs server-side. Public storefronts read through RLS.
            </p>
            <aside className="notes">
              <p>
                The implementation is intentionally boring around the model:
                Next.js for the app, Clerk for auth, Supabase for persistence,
                and Vercel for hosting.
              </p>
              <p>
                The interesting part is where Codex sits. The server route calls
                Codex, validates structured output, saves the storefront, and
                returns the share URL.
              </p>
            </aside>
          </section>

          <section className="deck-slide deck-dark-slide" data-background-color="#08251d">
            <div className="deck-kicker">Runtime flow</div>
            <h2>Constrain the model, then trust the app.</h2>
            <ol className="deck-number-flow">
              <li>Receive product idea</li>
              <li>Call Codex with schema-bound instructions</li>
              <li>Validate with Zod</li>
              <li>Persist to Supabase</li>
              <li>Publish the share page</li>
            </ol>
            <aside className="notes">
              <p>
                The server does not blindly trust model text. It asks Codex for
                structured content, validates the shape with Zod, and only then
                saves the storefront.
              </p>
              <p>
                That makes the demo more than prompt engineering. It is a
                standard product pattern around an AI call: constrain, validate,
                persist, and render.
              </p>
            </aside>
          </section>

          <section className="deck-slide">
            <div className="deck-kicker">Quality gates</div>
            <h2>The demo path still has guardrails.</h2>
            <div className="deck-rubric-grid deck-rubric-grid-tight">
              <div>
                <strong>Server secrets</strong>
                <span>No service keys in the browser.</span>
              </div>
              <div>
                <strong>RLS reads</strong>
                <span>Public pages use anon-safe access.</span>
              </div>
              <div>
                <strong>Zod contract</strong>
                <span>Model output is checked before save.</span>
              </div>
              <div>
                <strong>Guest limit</strong>
                <span>Cookie plus database uniqueness.</span>
              </div>
            </div>
            <aside className="notes">
              <p>
                These details matter because they are the difference between a
                flashy demo and something I would be comfortable showing a real
                customer.
              </p>
              <p>
                The app uses service-role writes only from the server route.
                Published storefronts can be read publicly, but write access
                stays behind the server boundary.
              </p>
            </aside>
          </section>

          <section className="deck-slide">
            <div className="deck-kicker">Velocity</div>
            <h2>From MVP to production-shaped.</h2>
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
            <p className="deck-footnote">
              First working app: auth, persistence, tests, and Codex at runtime.
            </p>
            <aside className="notes">
              <p>
                The first shippable MVP took roughly two and a half to three
                hours. I kept the early branch and commit snapshot as evidence
                of velocity.
              </p>
              <p>
                The later work was integration quality: image generation,
                production auth, Vercel configuration, DNS, browser verification,
                and UI polish.
              </p>
            </aside>
          </section>

          <section className="deck-slide">
            <div className="deck-kicker">Production integration</div>
            <h2>The slow work was the real work.</h2>
            <div className="deck-stack deck-stack-compact">
              <p>Clerk production auth</p>
              <p>Supabase keys and storage</p>
              <p>Vercel environment variables</p>
              <p>DNS and domain verification</p>
              <p>Codex CLI packaging fix</p>
            </div>
            <aside className="notes">
              <p>
                A lot of the time went into work that looks less magical but is
                very relevant to this role: making the app work outside localhost.
              </p>
              <p>
                I used platform APIs and verification loops where they helped,
                including Vercel, browser checks, Supabase, Clerk, and DNS
                validation.
              </p>
            </aside>
          </section>

          <section className="deck-slide deck-title-slide" data-background-color="#08251d">
            <div className="deck-kicker">What I learned</div>
            <h2>Codex is strongest when the work is shaped well.</h2>
            <ul className="deck-final-list">
              <li>Plan harder before implementation.</li>
              <li>Keep the product loop narrow.</li>
              <li>Validate model output like any external dependency.</li>
              <li>Use faster modes more during iteration.</li>
            </ul>
            <aside className="notes">
              <p>
                The biggest lesson is that speed does not come from asking the
                model to do everything. It comes from narrowing the problem,
                giving strong context, and verifying each layer.
              </p>
              <p>
                If I had more time, I would add analytics around generated share
                pages and a stronger admin cleanup path for production smoke
                data. The core loop is already the right shape.
              </p>
            </aside>
          </section>
        </div>
      </div>
    </main>
  );
}
