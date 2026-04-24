"use client";

import { FormEvent, useEffect, useState } from "react";
import { useClerk } from "@clerk/nextjs";
import Link from "next/link";
import {
  ExternalLink,
  Loader2,
  LogIn,
  Send
} from "lucide-react";
import { GenerationProgress } from "@/components/generation-progress";
import { StorefrontCard } from "@/components/storefront-card";
import { useGenerationProgress } from "@/components/use-generation-countdown";
import { DRAFT_IDEA_STORAGE_KEY } from "@/lib/studio-ideas";
import type { StorefrontRecord } from "@/lib/storefront-schema";

type CreateStorefrontResponse = {
  storefront: StorefrontRecord;
  shareUrl: string;
  status?: "created" | "existing_guest_storefront" | "existing_prompt_storefront";
};

type CreateStorefrontErrorResponse = {
  error: string;
  storefront?: StorefrontRecord;
  shareUrl?: string;
  status?: "existing_guest_storefront";
};

type StorefrontStudioProps = {
  initialStorefronts?: StorefrontRecord[];
  mode?: "signed-in" | "guest";
};

export function StorefrontStudio({
  initialStorefronts = [],
  mode = "signed-in"
}: StorefrontStudioProps) {
  const { openSignIn } = useClerk();
  const [idea, setIdea] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CreateStorefrontResponse | null>(null);
  const [guestGenerationUsed, setGuestGenerationUsed] = useState(false);
  const [recentStorefronts, setRecentStorefronts] =
    useState(initialStorefronts);
  const {
    currentPhaseIndex,
    elapsedText,
    estimateText,
    phases,
    resetProgress
  } = useGenerationProgress(isGenerating);

  useEffect(() => {
    const draftIdea = window.localStorage
      .getItem(DRAFT_IDEA_STORAGE_KEY)
      ?.trim();

    if (draftIdea && draftIdea.length >= 6) {
      const timeoutId = window.setTimeout(() => setIdea(draftIdea), 0);
      window.localStorage.removeItem(DRAFT_IDEA_STORAGE_KEY);

      return () => window.clearTimeout(timeoutId);
    }
  }, []);

  function showCreatedStorefront(created: CreateStorefrontResponse) {
    setResult(created);
    setRecentStorefronts((currentStorefronts) => [
      created.storefront,
      ...currentStorefronts.filter(
        (storefront) => storefront.id !== created.storefront.id
      )
    ]);
  }

  async function generateFromIdea(nextIdea: string) {
    const trimmedIdea = nextIdea.trim();

    if (
      trimmedIdea.length < 6 ||
      isGenerating ||
      (mode === "guest" && guestGenerationUsed)
    ) {
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
          "storefront" in payload &&
          payload.storefront &&
          "shareUrl" in payload &&
          payload.shareUrl
        ) {
          setGuestGenerationUsed(true);
          showCreatedStorefront({
            storefront: payload.storefront,
            shareUrl: payload.shareUrl,
            status: payload.status
          });
          setError(payload.error);
          return;
        }

        throw new Error("error" in payload ? payload.error : "Generation failed");
      }

      const created = payload as CreateStorefrontResponse;
      showCreatedStorefront(created);

      if (mode === "guest") {
        setGuestGenerationUsed(true);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Generation failed");
    } finally {
      setIsGenerating(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void generateFromIdea(idea);
  }

  const isGuestMode = mode === "guest";
  const generationDisabled =
    isGenerating || (isGuestMode && guestGenerationUsed);
  const resultStatusText = isGuestMode
    ? result?.status === "existing_guest_storefront"
      ? `${result.storefront.content.name} is already ready.`
      : "Guest storefront ready."
    : result?.status === "existing_prompt_storefront"
      ? `You already generated this idea. ${result.storefront.content.name} is ready.`
      : "Storefront saved.";
  const recentStorefrontsTitle = isGuestMode
    ? "Guest storefront"
    : "Your storefronts";

  return (
    <div className="mx-auto grid max-w-5xl gap-8">
      <section
        aria-labelledby="generate-title"
        className="mx-auto w-full max-w-3xl pt-2"
        id="generate"
      >
        <div className="text-center">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
            Generate
          </p>
          <h1
            className="mt-3 text-3xl font-black leading-tight text-slate-950 sm:text-4xl"
            id="generate-title"
          >
            What storefront should we test?
          </h1>
        </div>

        <form
          className="mt-6 border border-white/20 bg-white p-3 text-slate-950 shadow-sm sm:p-5"
          onSubmit={handleSubmit}
        >
          <label className="block">
            <span className="text-xl font-black text-slate-950">
              Generate your storefront
            </span>
            <textarea
              className="mt-2 min-h-24 w-full resize-none border-slate-300 bg-slate-50 text-base text-slate-950 shadow-sm placeholder:text-slate-400 focus:border-emerald-700 focus:ring-emerald-700 sm:min-h-28"
              id="studio-product-idea"
              maxLength={220}
              minLength={6}
              name="idea"
              onChange={(event) => setIdea(event.target.value)}
              placeholder="Refillable shampoo bars for busy travelers, modular desk lamp kits for tiny apartments, or plant-based trail snacks for weekend hikers."
              required
              value={idea}
            />
          </label>
          <div className="mt-3 flex justify-end">
            <button
              className="inline-flex min-h-11 items-center justify-center gap-2 bg-slate-950 px-4 py-3 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              disabled={generationDisabled}
              type="submit"
            >
              <span>
                {isGenerating ? "Generating storefront" : "Generate storefront"}
              </span>
              {isGenerating && elapsedText && (
                <span
                  aria-live="polite"
                  className="min-w-10 whitespace-nowrap text-center font-black tabular-nums text-white/80"
                >
                  {elapsedText}
                </span>
              )}
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Send className="h-4 w-4" aria-hidden />
              )}
            </button>
          </div>
        </form>

        {isGenerating && elapsedText && (
          <div className="mx-auto mt-4 max-w-xl border border-black/10 bg-white p-4">
            <GenerationProgress
              currentPhaseIndex={currentPhaseIndex}
              elapsedText={elapsedText}
              estimateText={estimateText}
              phases={phases}
            />
          </div>
        )}

        {(result || error) && !isGenerating && (
          <div className="mx-auto mt-4 max-w-xl">
            {error && (
              <p
                className="border border-red-200 bg-red-50 p-3 text-sm font-bold leading-5 text-red-700"
                role="alert"
              >
                {error}
              </p>
            )}
            {result && (
              <div className="mt-3 border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-950 first:mt-0">
                <p className="font-black">{resultStatusText}</p>
                <Link
                  className="mt-3 inline-flex min-h-10 items-center justify-center gap-2 bg-emerald-700 px-3 py-2 text-sm font-black text-white transition hover:bg-emerald-800"
                  href={`/s/${result.storefront.slug}`}
                  rel="noreferrer"
                  target="_blank"
                >
                  Open share URL
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                </Link>
                {isGuestMode && guestGenerationUsed && (
                  <div className="mt-3">
                    <button
                      className="inline-flex min-h-10 items-center justify-center gap-2 border border-emerald-300 bg-white px-3 py-2 text-sm font-bold text-emerald-950 transition hover:border-emerald-900"
                      onClick={() => openSignIn()}
                      type="button"
                    >
                      <LogIn className="h-4 w-4" aria-hidden />
                      Sign in for more
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </section>

      <div className="mx-auto w-full max-w-5xl">
        <section
          aria-labelledby="your-storefronts-title"
          className="min-w-0"
          id="your-storefronts"
        >
          <div className="mb-3 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                Library
              </p>
              <h2
                className="mt-1 text-2xl font-black leading-tight text-slate-950"
                id="your-storefronts-title"
              >
                {recentStorefrontsTitle}
              </h2>
            </div>
            <p className="text-sm font-bold text-slate-500">
              {recentStorefronts.length} saved
            </p>
          </div>
          {recentStorefronts.length > 0 ? (
            <div className="grid gap-2">
              {recentStorefronts.slice(0, 4).map((storefront) => (
                <StorefrontCard
                  key={storefront.id}
                  storefront={storefront}
                />
              ))}
            </div>
          ) : (
            <p className="border border-dashed border-slate-300 bg-white p-5 text-sm leading-6 text-slate-600">
              {isGuestMode
                ? "Your guest storefront will appear here."
                : "Saved storefronts will appear here."}
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
