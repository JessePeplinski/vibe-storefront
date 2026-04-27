"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { useGenerationProgress } from "@/components/use-generation-countdown";
import type { StorefrontRecord } from "@/lib/storefront-schema";

export type StorefrontGenerationMode = "guest" | "signed-in";

export type StorefrontGenerationStatus =
  | "created"
  | "existing_guest_storefront"
  | "existing_prompt_storefront";

export type StorefrontGenerationResult = {
  finishedInText: string;
  shareUrl: string;
  status?: StorefrontGenerationStatus;
  storefront: StorefrontRecord;
  warning?: string;
};

type CreateStorefrontResponse = {
  storefront: StorefrontRecord;
  shareUrl: string;
  status?: StorefrontGenerationStatus;
  warning?: string;
};

type CreateStorefrontErrorResponse = {
  error: string;
  storefront?: StorefrontRecord;
  shareUrl?: string;
  status?: "existing_guest_storefront";
};

type UseStorefrontGenerationParams = {
  disableAfterResult?: boolean;
  mode?: StorefrontGenerationMode;
  onStorefrontReady?: (result: StorefrontGenerationResult) => void;
};

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

function buildFinishedResult(
  payload: CreateStorefrontResponse,
  startedAtMs: number
): StorefrontGenerationResult {
  return {
    ...payload,
    finishedInText: formatDuration(
      Math.max(0, Math.floor((Date.now() - startedAtMs) / 1000))
    )
  };
}

export function useStorefrontGeneration({
  disableAfterResult = false,
  mode = "signed-in",
  onStorefrontReady
}: UseStorefrontGenerationParams = {}) {
  const [idea, setIdea] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<StorefrontGenerationResult | null>(null);
  const [guestGenerationUsed, setGuestGenerationUsed] = useState(false);
  const progress = useGenerationProgress(isGenerating);
  const { resetProgress } = progress;
  const isGuestMode = mode === "guest";
  const generationDisabled =
    isGenerating ||
    (isGuestMode && guestGenerationUsed) ||
    (disableAfterResult && Boolean(result));

  function showResult(nextResult: StorefrontGenerationResult) {
    setResult(nextResult);
    onStorefrontReady?.(nextResult);
  }

  async function generateFromIdea(nextIdea = idea) {
    const trimmedIdea = nextIdea.trim();

    if (
      trimmedIdea.length < 6 ||
      isGenerating ||
      (isGuestMode && guestGenerationUsed) ||
      (disableAfterResult && result)
    ) {
      return;
    }

    const startedAtMs = Date.now();

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
          showResult(
            buildFinishedResult(
              {
                storefront: payload.storefront,
                shareUrl: payload.shareUrl,
                status: payload.status
              },
              startedAtMs
            )
          );
          setError(payload.error);
          return;
        }

        throw new Error("error" in payload ? payload.error : "Generation failed");
      }

      const nextResult = buildFinishedResult(
        payload as CreateStorefrontResponse,
        startedAtMs
      );

      showResult(nextResult);

      if (isGuestMode) {
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
    void generateFromIdea();
  }

  return {
    clearResult: () => setResult(null),
    error,
    generateFromIdea,
    generationDisabled,
    guestGenerationUsed,
    handleSubmit,
    idea,
    isGenerating,
    progress,
    result,
    setIdea
  };
}
