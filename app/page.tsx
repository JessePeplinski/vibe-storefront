import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";
import { LandingIdeaTeaser } from "@/components/landing-idea-teaser";
import { StorefrontRenderer } from "@/components/storefront-renderer";
import { sampleStorefrontContent } from "@/lib/storefront-schema";

export default async function HomePage() {
  const { userId } = await auth();

  if (userId) {
    redirect("/dashboard");
  }

  return (
    <main>
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
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
            <LandingIdeaTeaser />
          </div>
          <StorefrontRenderer
            compact
            content={sampleStorefrontContent}
            idea="small-batch hot sauce from Brooklyn"
          />
        </div>
      </section>
    </main>
  );
}
