"use client";

import { useCallback, useEffect, useState } from "react";
import { CODEX_GENERATION_ESTIMATE_SECONDS } from "@/lib/codex-config";

const MILLIS_PER_SECOND = 1000;

function formatCountdown(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

type GenerationCountdown = {
  countdownText: string | null;
  resetCountdown: () => void;
};

export function useGenerationCountdown(
  isActive: boolean
): GenerationCountdown {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const resetCountdown = useCallback(() => setElapsedSeconds(0), []);

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
      countdownText: null,
      resetCountdown
    };
  }

  const remainingSeconds = Math.max(
    CODEX_GENERATION_ESTIMATE_SECONDS - elapsedSeconds,
    0
  );

  if (remainingSeconds === 0) {
    return {
      countdownText: "Finishing up...",
      resetCountdown
    };
  }

  return {
    countdownText: formatCountdown(remainingSeconds),
    resetCountdown
  };
}
