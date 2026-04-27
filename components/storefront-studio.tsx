"use client";

import { useEffect, useState } from "react";
import { useClerk } from "@clerk/nextjs";
import Link from "next/link";
import {
  CheckCircle2,
  ExternalLink,
  Loader2,
  LogIn,
  X
} from "lucide-react";
import { StorefrontCard } from "@/components/storefront-card";
import { StorefrontGenerationForm } from "@/components/storefront-generation-form";
import {
  useStorefrontGeneration,
  type StorefrontGenerationResult
} from "@/components/use-storefront-generation";
import { DRAFT_IDEA_STORAGE_KEY } from "@/lib/studio-ideas";
import type { StorefrontRecord } from "@/lib/storefront-schema";
import { formatUsageUsd } from "@/lib/usage-format";

type DeleteStorefrontResponse = {
  deletedStorefrontId?: string;
  error?: string;
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
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteToast, setDeleteToast] = useState<string | null>(null);
  const [deletingStorefrontId, setDeletingStorefrontId] = useState<
    string | null
  >(null);
  const [storefrontPendingDelete, setStorefrontPendingDelete] =
    useState<StorefrontRecord | null>(null);
  const [recentStorefronts, setRecentStorefronts] =
    useState(initialStorefronts);
  const {
    clearResult,
    error,
    generationDisabled,
    guestGenerationUsed,
    handleSubmit,
    idea,
    isGenerating,
    progress: generationProgress,
    result,
    setIdea
  } = useStorefrontGeneration({
    mode,
    onStorefrontReady: showCreatedStorefront
  });

  useEffect(() => {
    const draftIdea = window.localStorage
      .getItem(DRAFT_IDEA_STORAGE_KEY)
      ?.trim();

    if (draftIdea && draftIdea.length >= 6) {
      const timeoutId = window.setTimeout(() => setIdea(draftIdea), 0);
      window.localStorage.removeItem(DRAFT_IDEA_STORAGE_KEY);

      return () => window.clearTimeout(timeoutId);
    }
  }, [setIdea]);

  function showCreatedStorefront(created: StorefrontGenerationResult) {
    setDeleteError(null);
    setDeleteToast(null);
    setRecentStorefronts((currentStorefronts) => [
      created.storefront,
      ...currentStorefronts.filter(
        (storefront) => storefront.id !== created.storefront.id
      )
    ]);
  }

  function requestDeleteStorefront(storefront: StorefrontRecord) {
    if (deletingStorefrontId) {
      return;
    }

    setDeleteError(null);
    setDeleteToast(null);
    setStorefrontPendingDelete(storefront);
  }

  async function deleteStorefront() {
    const storefront = storefrontPendingDelete;

    if (!storefront) {
      return;
    }

    if (deletingStorefrontId) {
      return;
    }

    setDeleteError(null);
    setDeleteToast(null);
    setDeletingStorefrontId(storefront.id);

    try {
      const response = await fetch(`/api/storefronts/${storefront.id}`, {
        method: "DELETE"
      });
      const payload = (await response
        .json()
        .catch(() => ({}))) as DeleteStorefrontResponse;

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to delete storefront.");
      }

      setRecentStorefronts((currentStorefronts) =>
        currentStorefronts.filter(
          (currentStorefront) => currentStorefront.id !== storefront.id
        )
      );
      if (result?.storefront.id === storefront.id) {
        clearResult();
      }
      setStorefrontPendingDelete(null);
      setDeleteToast(`${storefront.content.name} was deleted.`);
    } catch (caught) {
      setDeleteError(
        caught instanceof Error ? caught.message : "Unable to delete storefront."
      );
    } finally {
      setDeletingStorefrontId(null);
    }
  }

  const isGuestMode = mode === "guest";
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
  const isDeletingPendingStorefront =
    deletingStorefrontId === storefrontPendingDelete?.id;
  const generationFeedback =
    (result || error) && !isGenerating ? (
      <div className="space-y-3">
        {error && (
          <p
            className="border border-red-200 bg-red-50 p-3 text-sm font-bold leading-5 text-red-700"
            role="alert"
          >
            {error}
          </p>
        )}
        {result && (
          <div className="border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-950">
            <p className="font-black">{resultStatusText}</p>
            <p className="mt-1 font-bold text-emerald-800">
              Finished in {result.finishedInText}
            </p>
            {result.usageCost ? (
              <p className="mt-1 font-bold text-emerald-800">
                This request cost about{" "}
                {formatUsageUsd(result.usageCost.totalUsd)}.
              </p>
            ) : result.status?.startsWith("existing_") ? (
              <p className="mt-1 font-bold text-emerald-800">
                No new API spend.
              </p>
            ) : null}
            {result.warning && (
              <p
                className="mt-3 border border-amber-200 bg-amber-50 p-3 text-sm font-bold leading-5 text-amber-800"
                role="status"
              >
                {result.warning}
              </p>
            )}
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
    ) : null;

  return (
    <div className="mx-auto grid max-w-5xl gap-8">
      {deleteToast && (
        <div
          className="fixed bottom-4 left-1/2 z-40 flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 items-start gap-3 border border-emerald-200 bg-white p-4 text-sm font-bold text-emerald-950 shadow-lg"
          role="status"
        >
          <CheckCircle2
            className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700"
            aria-hidden
          />
          <p className="min-w-0 flex-1 leading-5">{deleteToast}</p>
          <button
            aria-label="Dismiss delete confirmation"
            className="-mr-1 -mt-1 inline-flex h-7 w-7 shrink-0 items-center justify-center text-emerald-900 transition hover:bg-emerald-50"
            onClick={() => setDeleteToast(null)}
            type="button"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
      )}

      {storefrontPendingDelete && (
        <div
          aria-labelledby="delete-storefront-title"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6"
          role="dialog"
        >
          <div className="w-full max-w-md border border-black/10 bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">
                  Delete
                </p>
                <h2
                  className="mt-2 text-2xl font-black leading-tight text-slate-950"
                  id="delete-storefront-title"
                >
                  Delete storefront?
                </h2>
              </div>
              <button
                aria-label="Cancel delete"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center border border-black/10 text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-300"
                disabled={isDeletingPendingStorefront}
                onClick={() => setStorefrontPendingDelete(null)}
                type="button"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              Are you sure you want to delete{" "}
              <span className="font-black text-slate-950">
                {storefrontPendingDelete.content.name}
              </span>
              ? This permanently removes it from your profile and public
              storefronts.
            </p>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                className="inline-flex min-h-10 items-center justify-center border border-black/10 bg-white px-4 py-2 text-sm font-black text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-300"
                disabled={isDeletingPendingStorefront}
                onClick={() => setStorefrontPendingDelete(null)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="inline-flex min-h-10 items-center justify-center gap-2 bg-red-700 px-4 py-2 text-sm font-black text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-red-300"
                disabled={isDeletingPendingStorefront}
                onClick={() => void deleteStorefront()}
                type="button"
              >
                {isDeletingPendingStorefront && (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                )}
                Delete storefront
              </button>
            </div>
          </div>
        </div>
      )}

      <section
        aria-labelledby="generate-title"
        className="mx-auto w-full max-w-3xl pt-2"
        id="generate"
      >
        <div className="text-center">
          <h1
            className="text-3xl font-black leading-tight text-slate-950 sm:text-4xl"
            id="generate-title"
          >
            Generate a storefront
          </h1>
        </div>

        <StorefrontGenerationForm
          className="mt-6"
          feedback={generationFeedback}
          generationDisabled={generationDisabled}
          idea={idea}
          isGenerating={isGenerating}
          onIdeaChange={setIdea}
          onSubmit={handleSubmit}
          progress={generationProgress}
          secondaryAction={{
            href: "/storefronts",
            label: "See all storefronts"
          }}
          showLabel={false}
          textareaId="studio-product-idea"
        />
      </section>

      <div className="mx-auto w-full max-w-5xl">
        <section
          aria-labelledby="your-storefronts-title"
          className="min-w-0"
          id="your-storefronts"
        >
          <div className="mb-3 flex items-end justify-between gap-4">
            <div>
              <h2
                className="text-2xl font-black leading-tight text-slate-950"
                id="your-storefronts-title"
              >
                {recentStorefrontsTitle}
              </h2>
            </div>
            <p className="text-sm font-bold text-slate-500">
              {recentStorefronts.length} saved
            </p>
          </div>
          {deleteError && (
            <p
              className="mb-3 border border-red-200 bg-red-50 p-3 text-sm font-bold leading-5 text-red-700"
              role="alert"
            >
              {deleteError}
            </p>
          )}
          {recentStorefronts.length > 0 ? (
            <div className="grid gap-2">
              {recentStorefronts.map((storefront) => (
                <StorefrontCard
                  deleteDisabled={Boolean(deletingStorefrontId)}
                  isDeleting={deletingStorefrontId === storefront.id}
                  key={storefront.id}
                  onDelete={isGuestMode ? undefined : requestDeleteStorefront}
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
