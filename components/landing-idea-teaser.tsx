"use client";

import { useClerk } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowRight, ExternalLink, LogIn, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SIGNED_IN_STOREFRONT_GENERATION_LIMIT } from "@/lib/generation-quota";

const buildPostUrl =
  "https://jessepeplinski.com/blog/how-i-used-codex-to-build-vibe-storefront/";

export function LandingIdeaTeaser() {
  const { openSignIn } = useClerk();

  function handleSignIn() {
    openSignIn();
  }

  return (
    <Card className="gap-0 border-white/14 bg-white/94 p-4 text-slate-950 shadow-xl shadow-black/20 backdrop-blur sm:p-6">
      <div className="flex flex-col gap-5">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 rounded-md bg-primary/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] text-primary">
            <ShieldCheck className="h-4 w-4" aria-hidden />
            Account required
          </div>
          <h2 className="mt-4 text-2xl font-black leading-tight text-slate-950 sm:text-3xl">
            Sign in to generate storefronts
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">
            Generation requires an account so usage stays controlled. Sign in to
            create up to {SIGNED_IN_STOREFRONT_GENERATION_LIMIT} storefront
            concepts and share the public URLs.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button onClick={handleSignIn} size="lg" type="button">
            Sign in to generate
            <LogIn className="h-4 w-4" aria-hidden />
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/storefronts">
              Browse examples
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
        </div>
      </div>

      <div className="mt-5 border-t border-slate-200 pt-4">
        <a
          className="inline-flex min-h-10 items-center gap-2 text-sm font-bold text-slate-500 underline-offset-4 transition-colors hover:text-slate-950 hover:underline focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          href={buildPostUrl}
          rel="noreferrer"
          target="_blank"
        >
          Why generation requires sign-in
          <ExternalLink className="h-4 w-4" aria-hidden />
        </a>
      </div>
    </Card>
  );
}
