"use client";

import { useCallback, useEffect, useState } from "react";
import {
  STOREFRONT_GENERATION_ESTIMATE_LABEL,
  STOREFRONT_GENERATION_ESTIMATE_SECONDS
} from "@/lib/codex-config";

const MILLIS_PER_SECOND = 1000;

export type GenerationPhase = {
  label: string;
  startsAtSecond: number;
};

export type GenerationStepStatus = "active" | "complete" | "pending";

export type GenerationProgressStep = GenerationPhase & {
  elapsedText: string | null;
  status: GenerationStepStatus;
};

export const GENERATION_PHASES: GenerationPhase[] = [
  {
    label: "Write storefront copy",
    startsAtSecond: 0
  },
  {
    label: "Create product image",
    startsAtSecond: 30
  },
  {
    label: "Upload image",
    startsAtSecond: 110
  },
  {
    label: "Save share page",
    startsAtSecond: 125
  }
];

function formatElapsedTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

function buildGenerationSteps(
  elapsedSeconds: number,
  currentPhaseIndex: number,
  isActive: boolean
): GenerationProgressStep[] {
  return GENERATION_PHASES.map((phase, index) => {
    if (!isActive) {
      return {
        ...phase,
        elapsedText: null,
        status: "pending"
      };
    }

    if (index < currentPhaseIndex) {
      const nextPhaseStart =
        GENERATION_PHASES[index + 1]?.startsAtSecond ??
        STOREFRONT_GENERATION_ESTIMATE_SECONDS;

      return {
        ...phase,
        elapsedText: formatElapsedTime(nextPhaseStart - phase.startsAtSecond),
        status: "complete"
      };
    }

    if (index === currentPhaseIndex) {
      return {
        ...phase,
        elapsedText: formatElapsedTime(
          Math.max(0, elapsedSeconds - phase.startsAtSecond)
        ),
        status: "active"
      };
    }

    return {
      ...phase,
      elapsedText: null,
      status: "pending"
    };
  });
}

type GenerationProgress = {
  currentPhaseIndex: number;
  elapsedSeconds: number;
  elapsedText: string | null;
  estimateText: string;
  phases: GenerationPhase[];
  progressPercent: number;
  resetProgress: () => void;
  steps: GenerationProgressStep[];
};

export function useGenerationProgress(
  isActive: boolean
): GenerationProgress {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const resetProgress = useCallback(() => setElapsedSeconds(0), []);

  useEffect(() => {
    if (!isActive) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setElapsedSeconds((currentSeconds) => currentSeconds + 1);
    }, MILLIS_PER_SECOND);

    return () => window.clearInterval(intervalId);
  }, [isActive]);

  if (!isActive) {
    return {
      currentPhaseIndex: 0,
      elapsedSeconds: 0,
      elapsedText: null,
      estimateText: STOREFRONT_GENERATION_ESTIMATE_LABEL,
      phases: GENERATION_PHASES,
      progressPercent: 0,
      resetProgress,
      steps: buildGenerationSteps(0, 0, false)
    };
  }

  const cappedElapsedSeconds = Math.min(
    elapsedSeconds,
    STOREFRONT_GENERATION_ESTIMATE_SECONDS
  );
  const currentPhaseIndex = GENERATION_PHASES.reduce(
    (activeIndex, phase, index) =>
      cappedElapsedSeconds >= phase.startsAtSecond ? index : activeIndex,
    0
  );

  return {
    currentPhaseIndex,
    elapsedSeconds,
    elapsedText: formatElapsedTime(elapsedSeconds),
    estimateText: STOREFRONT_GENERATION_ESTIMATE_LABEL,
    phases: GENERATION_PHASES,
    progressPercent:
      (cappedElapsedSeconds / STOREFRONT_GENERATION_ESTIMATE_SECONDS) * 100,
    resetProgress,
    steps: buildGenerationSteps(elapsedSeconds, currentPhaseIndex, true)
  };
}
