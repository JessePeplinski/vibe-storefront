"use client";

import { FormEvent, useState } from "react";
import { useClerk } from "@clerk/nextjs";
import Link from "next/link";
import {
  ArrowRight,
  ExternalLink,
  Loader2
} from "lucide-react";
import { GenerationProgress } from "@/components/generation-progress";
import { useGenerationProgress } from "@/components/use-generation-countdown";
import type { StorefrontRecord } from "@/lib/storefront-schema";

type CreateStorefrontResponse = {
  storefront: StorefrontRecord;
  shareUrl: string;
  status?: "created" | "existing_guest_storefront" | "existing_prompt_storefront";
  warning?: string;
};

type CreateStorefrontErrorResponse = {
  error: string;
  storefront?: StorefrontRecord;
  shareUrl?: string;
  status?: "existing_guest_storefront";
};

export function LandingIdeaTeaser() {
  const { openSignIn } = useClerk();
  const [idea, setIdea] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CreateStorefrontResponse | null>(null);
  const [existingGuestStorefront, setExistingGuestStorefront] = useState(false);
  const {
    currentPhaseIndex,
    elapsedText,
    estimateText,
    phases,
    resetProgress
  } = useGenerationProgress(isGenerating);

  async function generateFromIdea(nextIdea = idea) {
    const trimmedIdea = nextIdea.trim();

    if (isGenerating || result || trimmedIdea.length < 6) {
      return;
    }

    setError(null);
    resetProgress();
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
    <section className="border border-white/20 bg-white p-3 text-slate-950 shadow-2xl sm:p-5">
      <form className="space-y-3" onSubmit={handleSubmit}>
        <label className="block">
          <span className="text-xl font-black text-slate-950">
            Generate your storefront
          </span>
          <textarea
            className="mt-2 min-h-24 w-full resize-none border-slate-300 bg-slate-50 text-base text-slate-950 shadow-sm placeholder:text-slate-400 focus:border-emerald-700 focus:ring-emerald-700 sm:min-h-28"
            id="landing-product-idea"
            maxLength={220}
            minLength={6}
            name="idea"
            onChange={(event) => setIdea(event.target.value)}
            placeholder="Refillable shampoo bars for busy travelers, modular desk lamp kits for tiny apartments, or plant-based trail snacks for weekend hikers."
            required
            value={idea}
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            className="inline-flex w-full items-center justify-center gap-2 bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            disabled={generationDisabled}
            type="submit"
          >
            <span>
              {isGenerating ? "Building storefront" : "Generate storefront"}
            </span>
            {isGenerating && elapsedText && (
              <span
                aria-live="polite"
                className="min-w-10 whitespace-nowrap text-center font-black tabular-nums text-white/90"
              >
                {elapsedText}
              </span>
            )}
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <ArrowRight className="h-4 w-4" aria-hidden />
            )}
          </button>
          <Link
            className="inline-flex w-full items-center justify-center gap-2 border border-slate-300 px-4 py-3 text-sm font-bold text-slate-800 transition hover:border-slate-950 hover:bg-slate-50"
            href="/storefronts"
          >
            See all storefronts
            <ExternalLink className="h-4 w-4" aria-hidden />
          </Link>
        </div>
        {isGenerating && elapsedText && (
          <GenerationProgress
            currentPhaseIndex={currentPhaseIndex}
            elapsedText={elapsedText}
            estimateText={estimateText}
            phases={phases}
          />
        )}
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
          {result?.warning && (
            <p
              className="mt-3 border border-amber-200 bg-amber-50 p-3 text-sm font-bold leading-5 text-amber-800"
              role="status"
            >
              {result.warning}
            </p>
          )}
          <Link
            className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 bg-emerald-700 px-4 py-3 text-sm font-black text-white transition hover:bg-emerald-800"
            href={createdStorefrontPath}
          >
            {resultLinkText}
            <ExternalLink className="h-4 w-4" aria-hidden />
          </Link>
          <div className="mt-3">
            <button
              className="w-full border border-emerald-300 px-3 py-2 text-sm font-bold text-emerald-950 transition hover:border-emerald-900"
              onClick={() => openSignIn()}
              type="button"
            >
              Sign in for more
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
