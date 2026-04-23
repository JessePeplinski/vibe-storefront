import { Show, SignInButton, SignUpButton } from "@clerk/nextjs";
import { LockKeyhole, Sparkles } from "lucide-react";
import { StorefrontRenderer } from "@/components/storefront-renderer";
import { StorefrontStudio } from "@/components/storefront-studio";
import { sampleStorefrontContent } from "@/lib/storefront-schema";

export default function HomePage() {
  return (
    <main>
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Show when="signed-in">
          <div className="mb-8 grid gap-5 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 border border-black/10 bg-white px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-slate-600">
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                Codex-powered storefronts
              </div>
              <h1 className="max-w-2xl text-4xl font-black leading-[0.96] text-slate-950 sm:text-5xl lg:text-6xl">
                Turn a product idea into a sellable-looking page.
              </h1>
            </div>
            <p className="max-w-2xl text-base leading-7 text-slate-600 sm:text-lg lg:pb-3">
              Vibe Storefront uses a server-side Codex SDK call to generate
              brand copy, product positioning, palette, calls to action, and
              fictional reviews, then saves each page as a public share URL.
            </p>
          </div>
          <StorefrontStudio />
        </Show>

        <Show when="signed-out">
          <div className="grid gap-8 lg:grid-cols-[520px_minmax(0,1fr)] lg:items-start">
            <div className="space-y-6">
              <div>
                <div className="mb-5 inline-flex items-center gap-2 border border-black/10 bg-white px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-slate-600">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden />
                  Codex-powered storefronts
                </div>
                <h1 className="max-w-xl text-4xl font-black leading-[0.98] text-slate-950 sm:text-5xl lg:text-[3.75rem]">
                  Turn a product idea into a sellable-looking page.
                </h1>
                <p className="mt-5 text-base leading-7 text-slate-600 sm:text-lg">
                  Vibe Storefront uses a server-side Codex SDK call to generate
                  brand copy, product positioning, palette, calls to action, and
                  fictional reviews, then saves each page as a public share URL.
                </p>
              </div>
              <section className="border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center bg-slate-950 text-white">
                    <LockKeyhole className="h-5 w-5" aria-hidden />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-950">
                      Sign in to generate
                    </h2>
                    <p className="text-sm leading-5 text-slate-500">
                      Saved storefronts are tied to your Clerk user.
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <SignInButton mode="modal">
                    <button className="inline-flex items-center justify-center gap-2 bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800">
                      Sign in
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button className="border border-slate-300 px-4 py-3 text-sm font-bold text-slate-800 transition hover:border-slate-950">
                      Create account
                    </button>
                  </SignUpButton>
                </div>
              </section>
            </div>
            <StorefrontRenderer
              compact
              content={sampleStorefrontContent}
              idea="small-batch hot sauce from Brooklyn"
            />
          </div>
        </Show>
      </section>
    </main>
  );
}
