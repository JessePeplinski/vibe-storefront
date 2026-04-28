"use client";

import { useClerk } from "@clerk/nextjs";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { StorefrontGenerationForm } from "@/components/storefront-generation-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useStorefrontGeneration } from "@/components/use-storefront-generation";
import { formatUsageUsd } from "@/lib/usage-format";

export function LandingIdeaTeaser() {
  const { openSignIn } = useClerk();
  const {
    error,
    generationDisabled,
    handleSubmit,
    idea,
    isGenerating,
    progress: generationProgress,
    result,
    setIdea
  } = useStorefrontGeneration({
    disableAfterResult: true,
    mode: "guest"
  });

  const createdStorefrontPath = result
    ? `/s/${result.storefront.slug}`
    : undefined;
  const existingGuestStorefront =
    result?.status === "existing_guest_storefront";
  const resultHeading = existingGuestStorefront
    ? `${result?.storefront.content.name} is already ready.`
    : "Storefront ready.";
  const resultLinkText = existingGuestStorefront
    ? "Open existing storefront"
    : "View your storefront";
  const generationFeedback =
    error || createdStorefrontPath ? (
      <div className="space-y-3">
        {error && (
          <Alert variant="destructive">
            <AlertDescription className="font-bold text-destructive">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {createdStorefrontPath && (
          <Alert role="status" variant="success">
            <AlertTitle>{resultHeading}</AlertTitle>
            <AlertDescription className="font-bold text-emerald-800">
            {result && (
              <p className="mt-1">
                Finished in {result.finishedInText}
              </p>
            )}
            {result?.usageCost ? (
              <p className="mt-1">
                This request cost about{" "}
                {formatUsageUsd(result.usageCost.totalUsd)}.
              </p>
            ) : result?.status?.startsWith("existing_") ? (
              <p className="mt-1">
                No new API spend.
              </p>
            ) : null}
            {result?.warning && (
              <Alert className="mt-3" role="status" variant="warning">
                <AlertDescription className="font-bold text-amber-800">
                  {result.warning}
                </AlertDescription>
              </Alert>
            )}
            <Button asChild className="mt-3 w-full" size="lg" variant="success">
              <Link href={createdStorefrontPath}>
                {resultLinkText}
                <ExternalLink className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
            <div className="mt-3">
              <Button
                className="w-full border-emerald-300 text-emerald-950 hover:border-emerald-900"
                onClick={() => openSignIn()}
                type="button"
                variant="outline"
              >
                Sign in for more
              </Button>
            </div>
            </AlertDescription>
          </Alert>
        )}
      </div>
    ) : null;

  return (
    <StorefrontGenerationForm
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
      textareaId="landing-product-idea"
    />
  );
}
