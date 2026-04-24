"use client";

import { FormEvent, useEffect, useState } from "react";
import { useClerk } from "@clerk/nextjs";
import Link from "next/link";
import {
  Bot,
  Check,
  Copy,
  ExternalLink,
  Loader2,
  LogIn,
  Send,
  Sparkles,
  UserPlus,
  WandSparkles
} from "lucide-react";
import { StorefrontCard } from "@/components/storefront-card";
import { StorefrontRenderer } from "@/components/storefront-renderer";
import { DRAFT_IDEA_STORAGE_KEY, STARTER_IDEAS } from "@/lib/studio-ideas";
import type { StorefrontRecord } from "@/lib/storefront-schema";
import { sampleStorefrontContent } from "@/lib/storefront-schema";

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

type StorefrontStudioProps = {
  initialStorefronts?: StorefrontRecord[];
  mode?: "signed-in" | "guest";
};

export function StorefrontStudio({
  initialStorefronts = [],
  mode = "signed-in"
}: StorefrontStudioProps) {
  const { openSignIn, openSignUp } = useClerk();
  const [idea, setIdea] = useState<string>(STARTER_IDEAS[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CreateStorefrontResponse | null>(null);
  const [guestGenerationUsed, setGuestGenerationUsed] = useState(false);
  const [recentStorefronts, setRecentStorefronts] =
    useState(initialStorefronts);
  const [selectedStorefront, setSelectedStorefront] =
    useState<StorefrontRecord | null>(() => initialStorefronts[0] ?? null);
  const [copiedPreviewHref, setCopiedPreviewHref] = useState<string | null>(
    null
  );

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
    setSelectedStorefront(created.storefront);
  }

  async function generateFromIdea(nextIdea: string) {
    const trimmedIdea = nextIdea.trim();

    if (
      !trimmedIdea ||
      isGenerating ||
      (mode === "guest" && guestGenerationUsed)
    ) {
      return;
    }

    setIdea(trimmedIdea);
    setError(null);
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

  const previewContent =
    selectedStorefront?.content ?? sampleStorefrontContent;
  const previewIdea = selectedStorefront?.idea;
  const previewHref = selectedStorefront
    ? `/s/${selectedStorefront.slug}`
    : undefined;
  const selectedStorefrontName =
    selectedStorefront?.content.name ?? "selected storefront";
  const hasCopiedPreviewHref = copiedPreviewHref === previewHref;
  const isGuestMode = mode === "guest";
  const generationDisabled =
    isGenerating || (isGuestMode && guestGenerationUsed);
  const studioTitle = isGuestMode
    ? "Generate a guest storefront"
    : "Build the next storefront";
  const resultStatusText = isGuestMode
    ? result?.status === "existing_guest_storefront"
      ? `${result.storefront.content.name} is already ready.`
      : "Guest storefront ready."
    : "Storefront saved.";
  const recentStorefrontsTitle = isGuestMode
    ? "Guest storefront"
    : "Recent storefronts";

  async function handleCopyPreviewLink() {
    if (!previewHref) {
      return;
    }

    await window.navigator.clipboard.writeText(
      `${window.location.origin}${previewHref}`
    );
    setCopiedPreviewHref(previewHref);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[410px_minmax(0,1fr)]">
      <section className="min-w-0 border border-white/10 bg-[#211f1c] p-4 text-stone-50 shadow-2xl sm:p-5">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-teal-200">
              Studio
            </p>
            <h1 className="mt-2 text-3xl font-black leading-tight text-white">
              {studioTitle}
            </h1>
          </div>
          <div className="flex h-11 w-11 shrink-0 items-center justify-center bg-teal-300 text-slate-950">
            <Sparkles className="h-5 w-5" aria-hidden />
          </div>
        </div>

        <div
          aria-label="Studio conversation"
          className="mb-5 grid gap-3"
          role="log"
        >
          <div className="flex gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center bg-white text-slate-950">
              <Bot className="h-4 w-4" aria-hidden />
              <span className="sr-only">Studio</span>
            </div>
            <div className="min-w-0 flex-1 border border-white/10 bg-white/[0.08] p-3">
              <p className="text-sm font-bold text-white">
                What should Studio build next?
              </p>
              <div className="mt-3 grid gap-2">
                {STARTER_IDEAS.map((starterIdea) => (
                  <button
                    aria-label={`Generate storefront for ${starterIdea}`}
                    className="inline-flex min-h-12 items-center gap-2 border border-white/10 bg-[#2b2925] px-3 py-2 text-left text-sm font-bold leading-5 text-stone-100 transition hover:border-teal-200 hover:bg-[#35322d] disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={generationDisabled}
                    key={starterIdea}
                    onClick={() => void generateFromIdea(starterIdea)}
                    type="button"
                  >
                    <WandSparkles
                      className="h-4 w-4 shrink-0 text-orange-300"
                      aria-hidden
                    />
                    <span>{starterIdea}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {(isGenerating || result || error) && (
            <div className="ml-12 border border-white/10 bg-black/25 p-3 text-sm">
              {isGenerating && (
                <p className="inline-flex items-center gap-2 font-bold text-teal-100">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Codex is building the storefront
                </p>
              )}
              {error && <p className="font-bold text-red-200">{error}</p>}
              {result && !isGenerating && (
                <div className="text-emerald-100">
                  <p className="font-bold">{resultStatusText}</p>
                  <Link
                    className="mt-2 inline-flex items-center gap-1 font-bold underline"
                    href={`/s/${result.storefront.slug}`}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Open share URL
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                  </Link>
                  {isGuestMode && guestGenerationUsed && (
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                      <button
                        className="inline-flex items-center justify-center gap-2 bg-white px-3 py-2 text-sm font-bold text-slate-950 transition hover:bg-stone-100"
                        onClick={() => openSignIn()}
                        type="button"
                      >
                        <LogIn className="h-4 w-4" aria-hidden />
                        Sign in for more
                      </button>
                      <button
                        className="inline-flex items-center justify-center gap-2 border border-white/20 px-3 py-2 text-sm font-bold text-white transition hover:bg-white/10"
                        onClick={() => openSignUp()}
                        type="button"
                      >
                        <UserPlus className="h-4 w-4" aria-hidden />
                        Create account
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-sm font-bold text-stone-200">
              Product idea
            </span>
            <textarea
              className="mt-2 min-h-32 w-full resize-none border-white/10 bg-[#151311] text-base text-white shadow-sm placeholder:text-stone-500 focus:border-teal-200 focus:ring-teal-200"
              id="studio-product-idea"
              maxLength={220}
              minLength={6}
              name="idea"
              onChange={(event) => setIdea(event.target.value)}
              placeholder="small-batch hot sauce from Brooklyn"
              required
              value={idea}
            />
          </label>

          <button
            className="inline-flex w-full items-center justify-center gap-2 bg-teal-300 px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-teal-200 disabled:cursor-not-allowed disabled:bg-stone-500 disabled:text-stone-200"
            disabled={generationDisabled}
            type="submit"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Send className="h-4 w-4" aria-hidden />
            )}
            {isGenerating ? "Generating with Codex" : "Generate storefront"}
          </button>
        </form>

        <section
          aria-labelledby="recent-storefronts-title"
          className="mt-8"
        >
          <h2
            className="text-xs font-black uppercase tracking-[0.18em] text-stone-400"
            id="recent-storefronts-title"
          >
            {recentStorefrontsTitle}
          </h2>
          {recentStorefronts.length > 0 ? (
            <div className="mt-3 grid gap-3">
              {recentStorefronts.slice(0, 4).map((storefront) => (
                <StorefrontCard
                  isSelected={selectedStorefront?.id === storefront.id}
                  key={storefront.id}
                  onPreview={setSelectedStorefront}
                  storefront={storefront}
                />
              ))}
            </div>
          ) : (
            <p className="mt-3 border border-dashed border-white/15 p-4 text-sm leading-6 text-stone-300">
              {isGuestMode
                ? "Your guest storefront will appear here."
                : "Saved storefronts will appear here."}
            </p>
          )}
        </section>
      </section>

      <section className="min-w-0">
        <div className="mb-3 flex flex-col gap-3 text-stone-200 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-200">
              {selectedStorefront ? "Selected preview" : "Example storefront"}
            </p>
            <h2 className="mt-1 text-xl font-black text-white">
              {selectedStorefront?.content.name ?? "Storefront canvas"}
            </h2>
          </div>
          {previewHref && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                aria-label={`Copy selected live link for ${selectedStorefrontName}`}
                className="inline-flex min-h-10 items-center gap-2 border border-white/10 bg-[#211f1c] px-3 py-2 text-sm font-bold text-white transition hover:bg-[#2b2925]"
                onClick={() => void handleCopyPreviewLink()}
                type="button"
              >
                {hasCopiedPreviewHref ? (
                  <Check className="h-4 w-4" aria-hidden />
                ) : (
                  <Copy className="h-4 w-4" aria-hidden />
                )}
                {hasCopiedPreviewHref ? "Copied" : "Copy link"}
              </button>
              <Link
                className="inline-flex min-h-10 items-center gap-2 bg-white px-3 py-2 text-sm font-bold text-slate-950 transition hover:bg-stone-100"
                href={previewHref}
                rel="noreferrer"
                target="_blank"
              >
                Open live
                <ExternalLink className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          )}
        </div>
        <StorefrontRenderer
          content={previewContent}
          idea={previewIdea}
          variant="landing"
        />
      </section>
    </div>
  );
}
