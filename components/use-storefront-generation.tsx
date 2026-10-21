"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useGenerationProgress } from "@/components/use-generation-countdown";
import { isPendingGenerationJob, type GenerationJob } from "@/lib/generation-job";
import type { StorefrontRecord } from "@/lib/storefront-schema";

export type StorefrontGenerationMode = "guest" | "signed-in";

export type StorefrontGenerationStatus =
  | "created"
  | "existing_guest_storefront"
  | "existing_prompt_storefront"
  | "generation_quota_exceeded";

export type ApiUsageCost = {
  currency: "USD";
  imageUsd: number | null;
  isEstimate: true;
  textUsd: number | null;
  totalUsd: number;
  unavailableLineItems: string[];
};

export type StorefrontGenerationResult = {
  finishedInText: string;
  shareUrl: string;
  status?: StorefrontGenerationStatus;
  storefront: StorefrontRecord;
  usageCost?: ApiUsageCost | null;
  warning?: string;
};

type CreateStorefrontResponse = {
  storefront: StorefrontRecord;
  shareUrl: string;
  status?: StorefrontGenerationStatus;
  usageCost?: ApiUsageCost | null;
  warning?: string;
};

type CreateStorefrontErrorResponse = {
  error: string;
  storefront?: StorefrontRecord;
  shareUrl?: string;
  status?: "existing_guest_storefront";
};

type UseStorefrontGenerationParams = {
  recoverOnMount?: boolean;
  disableAfterResult?: boolean;
  mode?: StorefrontGenerationMode;
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
  recoverOnMount = false,
  mode = "signed-in"
}: UseStorefrontGenerationParams = {}) {
  const [idea, setIdea] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<StorefrontGenerationResult | null>(null);
  const [guestGenerationUsed, setGuestGenerationUsed] = useState(false);
  const [job, setJob] = useState<GenerationJob | null>(null);
  const pendingJobSeen = useRef<string | null>(null);
  const [completionNotice, setCompletionNotice] = useState<{
    id: string;
    name: string;
    href: string;
  } | null>(null);
  const dismissCompletionNotice = useCallback(() => setCompletionNotice(null), []);
  const [isRecovering, setIsRecovering] = useState(recoverOnMount);
  const [statusUnavailable, setStatusUnavailable] = useState(false);
  const progress = useGenerationProgress(isGenerating);
  const { resetProgress } = progress;
  const isGuestMode = mode === "guest";
  const generationDisabled =
    isGenerating || isRecovering ||
    (isGuestMode && guestGenerationUsed) ||
    (disableAfterResult && Boolean(result));

  const applyJob = useCallback((nextJob: GenerationJob) => {
    setJob(nextJob);
    setIdea(nextJob.idea);
    resetProgress(Date.parse(nextJob.createdAt));
    setIsGenerating(isPendingGenerationJob(nextJob));
    setStatusUnavailable(false);
    if (isPendingGenerationJob(nextJob)) pendingJobSeen.current = nextJob.id;
    if (nextJob.result) {
      if (pendingJobSeen.current === nextJob.id) {
        setCompletionNotice({
          id: nextJob.result.storefront.id,
          name: nextJob.result.storefront.content.name,
          href: `/s/${nextJob.result.storefront.slug}`
        });
        pendingJobSeen.current = null;
      }
      const endedAt = Date.parse(nextJob.finishedAt ?? nextJob.createdAt);
      setResult({ ...nextJob.result, finishedInText: formatDuration(Math.max(0, Math.floor((endedAt - Date.parse(nextJob.createdAt)) / 1000))) });
      setError(null);
    } else if (nextJob.status === "failed") {
      pendingJobSeen.current = null;
      setError(nextJob.error ?? "Generation failed. Please try again.");
    }
  }, [resetProgress]);

  useEffect(() => {
    if (!recoverOnMount) return;
    const controller = new AbortController();
    void (async () => {
      try {
        const response = await fetch("/api/storefront-jobs", { cache: "no-store", signal: controller.signal });
        if (!response.ok) throw new Error("Unable to check generation status. Please try again.");
        const payload = await response.json() as { job: GenerationJob | null };
        if (!controller.signal.aborted && payload.job) applyJob(payload.job);
      } catch {
        if (!controller.signal.aborted) setError("Unable to check generation status. Please try again.");
      } finally {
        if (!controller.signal.aborted) setIsRecovering(false);
      }
    })();
    return () => controller.abort();
  }, [recoverOnMount, applyJob]);

  const pendingJobId = job && isPendingGenerationJob(job) ? job.id : null;
  useEffect(() => {
    if (!pendingJobId) return;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    async function poll() {
      try {
        const response = await fetch("/api/storefront-jobs", { cache: "no-store", signal: controller.signal });
        if (!response.ok) throw new Error("Status unavailable");
        const payload = await response.json() as { job: GenerationJob | null };
        if (controller.signal.aborted) return;
        if (!payload.job) throw new Error("Status unavailable");
        applyJob(payload.job);
        if (!isPendingGenerationJob(payload.job)) return;
      } catch {
        if (controller.signal.aborted) return;
        // A temporary connection loss must not cancel the server job or start another one.
        setStatusUnavailable(true);
      }
      timer = setTimeout(() => void poll(), 2000);
    }
    void poll();
    return () => { controller.abort(); clearTimeout(timer); };
  }, [pendingJobId, applyJob]);

  function showResult(nextResult: StorefrontGenerationResult) {
    setResult(nextResult);
  }

  async function generateFromIdea(nextIdea = idea) {
    const trimmedIdea = nextIdea.trim();

    if (
      trimmedIdea.length < 6 ||
      isGenerating || isRecovering ||
      (isGuestMode && guestGenerationUsed) ||
      (disableAfterResult && result)
    ) {
      return;
    }

    const startedAtMs = Date.now();
    let acceptedJob = false;
    setJob(null);
    setCompletionNotice(null);
    setStatusUnavailable(false);
    setError(null);
    resetProgress();
    setIsGenerating(true);

    try {
      const response = await fetch("/api/storefronts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ idea: trimmedIdea, background: true })
      });
      const payload = (await response.json()) as
        | CreateStorefrontResponse
        | CreateStorefrontErrorResponse
        | { job: GenerationJob };

      if (!response.ok) {
        if (
          (response.status === 409 || response.status === 429) &&
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

      if ("job" in payload) {
        acceptedJob = true;
        applyJob(payload.job);
        return;
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
      if (!acceptedJob) setIsGenerating(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void generateFromIdea();
  }

  return {
    clearResult: () => { setResult(null); setCompletionNotice(null); },
    completionNotice,
    dismissCompletionNotice,
    error,
    generateFromIdea,
    generationDisabled,
    guestGenerationUsed,
    handleSubmit,
    idea,
    isGenerating,
    isRecovering,
    statusUnavailable,
    progress,
    result,
    setIdea
  };
}

const GenerationContext = createContext<ReturnType<typeof useStorefrontGeneration> | null>(null);

export function useGenerationSession() {
  return useContext(GenerationContext);
}

export function StorefrontGenerationProvider({
  children,
  mode = "signed-in",
  recoverOnMount = false
}: {
  children: ReactNode;
  mode?: StorefrontGenerationMode;
  recoverOnMount?: boolean;
}) {
  const generation = useStorefrontGeneration({ mode, recoverOnMount });

  return (
    <GenerationContext.Provider value={generation}>
      {children}
    </GenerationContext.Provider>
  );
}
