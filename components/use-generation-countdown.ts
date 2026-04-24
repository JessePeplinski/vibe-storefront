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

type GenerationProgress = {
  currentPhaseIndex: number;
  elapsedText: string | null;
  estimateText: string;
  phases: GenerationPhase[];
  resetProgress: () => void;
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
      elapsedText: null,
      estimateText: STOREFRONT_GENERATION_ESTIMATE_LABEL,
      phases: GENERATION_PHASES,
      resetProgress
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
    elapsedText: formatElapsedTime(elapsedSeconds),
    estimateText: STOREFRONT_GENERATION_ESTIMATE_LABEL,
    phases: GENERATION_PHASES,
    resetProgress
  };
}
