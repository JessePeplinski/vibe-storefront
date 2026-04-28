"use client";

import { useEffect, useState } from "react";
import { useClerk } from "@clerk/nextjs";
import Link from "next/link";
import {
  ExternalLink,
  Loader2,
  LogIn,
} from "lucide-react";
import { toast } from "sonner";
import { StorefrontCard } from "@/components/storefront-card";
import { StorefrontGenerationForm } from "@/components/storefront-generation-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
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
  const [deleteStatusMessage, setDeleteStatusMessage] = useState<string | null>(
    null
  );
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
    setDeleteStatusMessage(null);
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
    setDeleteStatusMessage(null);
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
    setDeleteStatusMessage(null);
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
      const deletedMessage = `${storefront.content.name} was deleted.`;
      setDeleteStatusMessage(deletedMessage);
      toast.success(deletedMessage);
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
          <Alert variant="destructive">
            <AlertDescription className="font-bold text-destructive">
              {error}
            </AlertDescription>
          </Alert>
        )}
        {result && (
          <Alert role="status" variant="success">
            <AlertTitle>{resultStatusText}</AlertTitle>
            <AlertDescription className="font-bold text-primary">
              <p className="mt-1">Finished in {result.finishedInText}</p>
            {result.usageCost ? (
              <p className="mt-1">
                This request cost about{" "}
                {formatUsageUsd(result.usageCost.totalUsd)}.
              </p>
            ) : result.status?.startsWith("existing_") ? (
              <p className="mt-1">
                No new API spend.
              </p>
            ) : null}
            {result.warning && (
              <Alert className="mt-3" role="status" variant="warning">
                <AlertDescription className="font-bold text-amber-800">
                  {result.warning}
                </AlertDescription>
              </Alert>
            )}
            <Button asChild className="mt-3" variant="success">
              <Link
                href={`/s/${result.storefront.slug}`}
                rel="noreferrer"
                target="_blank"
              >
                Open share URL
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </Button>
            {isGuestMode && guestGenerationUsed && (
              <div className="mt-3">
                <Button
                  className="border-primary/30 text-foreground hover:border-primary hover:bg-accent hover:text-accent-foreground"
                  onClick={() => openSignIn()}
                  type="button"
                  variant="outline"
                >
                  <LogIn className="h-4 w-4" aria-hidden />
                  Sign in for more
                </Button>
              </div>
            )}
            </AlertDescription>
          </Alert>
        )}
      </div>
    ) : null;

  return (
    <div className="mx-auto grid max-w-5xl gap-8">
      {deleteStatusMessage && (
        <p className="sr-only" role="status">
          {deleteStatusMessage}
        </p>
      )}

      <AlertDialog
        open={Boolean(storefrontPendingDelete)}
        onOpenChange={(open) => {
          if (!open && !isDeletingPendingStorefront) {
            setStorefrontPendingDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">
              Delete
            </p>
            <AlertDialogTitle className="text-2xl">
              Delete storefront?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-black text-slate-950">
                {storefrontPendingDelete?.content.name}
              </span>
              ? This permanently removes it from your profile and public
              storefronts.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingPendingStorefront}>
              Cancel
            </AlertDialogCancel>
            <Button
              disabled={isDeletingPendingStorefront}
              onClick={() => void deleteStorefront()}
              type="button"
              variant="destructive"
            >
              {isDeletingPendingStorefront && (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              )}
              Delete storefront
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
          showOverallEstimate={false}
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
            <Alert className="mb-3" variant="destructive">
              <AlertDescription className="font-bold text-destructive">
                {deleteError}
              </AlertDescription>
            </Alert>
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
            <p className="rounded-lg border border-dashed bg-card p-5 text-sm leading-6 text-muted-foreground">
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
