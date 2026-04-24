"use client";

import { FormEvent, useState } from "react";
import { useClerk } from "@clerk/nextjs";
import Link from "next/link";
import {
  ArrowRight,
  ExternalLink,
  Loader2,
  Sparkles,
  WandSparkles
} from "lucide-react";
import { useGenerationCountdown } from "@/components/use-generation-countdown";
import { STARTER_IDEAS } from "@/lib/studio-ideas";
import type { StorefrontRecord } from "@/lib/storefront-schema";

type CreateStorefrontResponse = {
  storefront: StorefrontRecord;
  shareUrl: string;
  status?: "created" | "existing_guest_storefront";
};

type CreateStorefrontErrorResponse = {
  error: string;
  storefront?: StorefrontRecord;
  shareUrl?: string;
  status?: "existing_guest_storefront";
};

export function LandingIdeaTeaser() {
  const { openSignIn, openSignUp } = useClerk();
  const [idea, setIdea] = useState("");
  const [generatingStarterIdea, setGeneratingStarterIdea] = useState<
    string | null
  >(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CreateStorefrontResponse | null>(null);
  const [existingGuestStorefront, setExistingGuestStorefront] = useState(false);
  const { countdownText, resetCountdown } = useGenerationCountdown(isGenerating);

  async function generateFromIdea(nextIdea = idea, starterIdea?: string) {
    const trimmedIdea = nextIdea.trim();

    if (isGenerating || result || trimmedIdea.length < 6) {
      return;
    }

    setError(null);
    setGeneratingStarterIdea(starterIdea ?? null);
    resetCountdown();
    setIsGenerating(true);

    try {
      const response = await fetch("/api/storefronts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ idea: trimmedIdea })
      });
      const payload = (await response.json()) as
        | CreateStorefrontResponse
        | CreateStorefrontErrorResponse;

      if (!response.ok) {
        if (
          response.status === 409 &&
          "error" in payload &&
          payload.storefront &&
          payload.shareUrl
        ) {
          setResult({
            storefront: payload.storefront,
            shareUrl: payload.shareUrl,
            status: payload.status
          });
          setExistingGuestStorefront(true);
          setError(payload.error);
          return;
        }

        throw new Error("error" in payload ? payload.error : "Generation failed");
      }

      setResult(payload as CreateStorefrontResponse);
      setExistingGuestStorefront(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Generation failed");
    } finally {
      setGeneratingStarterIdea(null);
      setIsGenerating(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void generateFromIdea();
  }

  const createdStorefrontPath = result
    ? `/s/${result.storefront.slug}`
    : undefined;
  const generationDisabled = isGenerating || Boolean(result);
  const resultHeading = existingGuestStorefront
    ? `${result?.storefront.content.name} is already ready.`
    : "Storefront ready.";
  const resultLinkText = existingGuestStorefront
    ? "Open existing storefront"
    : "View your storefront";

  return (
    <section className="border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center bg-slate-950 text-white">
          <Sparkles className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <h2 className="text-lg font-black text-slate-950">
            Generate a storefront
          </h2>
          <p className="text-sm leading-5 text-slate-500">
            Try one guest generation, then open the live URL.
          </p>
        </div>
      </div>

      <form className="space-y-3" onSubmit={handleSubmit}>
        <label className="block">
          <span className="text-sm font-bold text-slate-700">
            Product idea
          </span>
          <textarea
            className="mt-2 min-h-28 w-full resize-none border-slate-300 text-base text-slate-950 shadow-sm focus:border-slate-950 focus:ring-slate-950"
            id="landing-product-idea"
            maxLength={220}
            minLength={6}
            name="idea"
            onChange={(event) => setIdea(event.target.value)}
            placeholder="Enter your product idea"
            required
            value={idea}
          />
        </label>
        <div
          aria-label="Example product ideas"
          className="flex flex-wrap gap-2"
          role="group"
        >
          {STARTER_IDEAS.map((starterIdea) => (
            <button
              aria-label={`Generate storefront for ${starterIdea}`}
              aria-busy={generatingStarterIdea === starterIdea}
              className="inline-flex min-h-9 items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-left text-xs font-bold leading-5 text-slate-700 transition hover:border-slate-950 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={generationDisabled}
              key={starterIdea}
              onClick={() => void generateFromIdea(starterIdea, starterIdea)}
              type="button"
            >
              {generatingStarterIdea === starterIdea ? (
                <Loader2
                  className="h-3.5 w-3.5 shrink-0 animate-spin text-slate-500"
                  aria-hidden
                />
              ) : (
                <WandSparkles
                  className="h-3.5 w-3.5 shrink-0 text-slate-500"
                  aria-hidden
                />
              )}
              <span>{starterIdea}</span>
            </button>
          ))}
        </div>
        <button
          className="inline-flex w-full items-center justify-center gap-2 bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          disabled={generationDisabled}
          type="submit"
        >
          <span>
            {isGenerating ? "Generating with Codex" : "Generate with Codex"}
          </span>
          {isGenerating && countdownText && (
            <span
              aria-live="polite"
              className="min-w-10 whitespace-nowrap text-center font-black tabular-nums text-white/90"
            >
              {countdownText}
            </span>
          )}
          {isGenerating ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <ArrowRight className="h-4 w-4" aria-hidden />
          )}
        </button>
      </form>

      {error && (
        <p className="mt-3 border border-red-200 bg-red-50 p-3 text-sm font-bold leading-5 text-red-700">
          {error}
        </p>
      )}

      {createdStorefrontPath && (
        <div className="mt-4 border border-emerald-200 bg-emerald-50 p-3">
          <p className="text-sm font-black text-emerald-950">
            {resultHeading}
          </p>
          <Link
            className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 bg-emerald-700 px-4 py-3 text-sm font-black text-white transition hover:bg-emerald-800"
            href={createdStorefrontPath}
          >
            {resultLinkText}
            <ExternalLink className="h-4 w-4" aria-hidden />
          </Link>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <button
              className="border border-emerald-300 px-3 py-2 text-sm font-bold text-emerald-950 transition hover:border-emerald-900"
              onClick={() => openSignIn()}
              type="button"
            >
              Sign in for more
            </button>
            <button
              className="border border-emerald-300 px-3 py-2 text-sm font-bold text-emerald-950 transition hover:border-emerald-900"
              onClick={() => openSignUp()}
              type="button"
            >
              Create account
            </button>
          </div>
        </div>
      )}

      <Link
        className="mt-3 inline-flex w-full items-center justify-center gap-2 border border-slate-300 px-4 py-3 text-sm font-bold text-slate-800 transition hover:border-slate-950"
        href="/storefronts"
      >
        See all storefronts
        <ExternalLink className="h-4 w-4" aria-hidden />
      </Link>
    </section>
  );
}
