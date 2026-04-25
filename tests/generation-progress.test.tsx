import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GenerationProgress } from "@/components/generation-progress";
import { useGenerationProgress } from "@/components/use-generation-countdown";

function ProgressHarness() {
  const progress = useGenerationProgress(true);

  if (!progress.elapsedText) {
    return null;
  }

  return (
    <GenerationProgress
      currentPhaseIndex={progress.currentPhaseIndex}
      elapsedText={progress.elapsedText}
      estimateText={progress.estimateText}
      progressPercent={progress.progressPercent}
      steps={progress.steps}
    />
  );
}

describe("GenerationProgress", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows total elapsed time and per-step elapsed estimates", () => {
    vi.useFakeTimers();

    render(<ProgressHarness />);

    let generationProgress = screen.getByRole("status", {
      name: "Generation progress"
    });

    expect(generationProgress).toHaveTextContent("Step 1 of 4");
    expect(generationProgress).toHaveTextContent("Total 0:00");
    expect(generationProgress).toHaveTextContent("Write storefront copy");
    expect(generationProgress).toHaveTextContent("Elapsed 0:00");
    expect(generationProgress).toHaveTextContent("Create product image");
    expect(generationProgress).toHaveTextContent("Waiting");

    act(() => {
      vi.advanceTimersByTime(31_000);
    });

    generationProgress = screen.getByRole("status", {
      name: "Generation progress"
    });

    expect(generationProgress).toHaveTextContent("Step 2 of 4");
    expect(generationProgress).toHaveTextContent("Total 0:31");
    expect(generationProgress).toHaveTextContent("Write storefront copy");
    expect(generationProgress).toHaveTextContent("Elapsed 0:30");
    expect(generationProgress).toHaveTextContent("Create product image");
    expect(generationProgress).toHaveTextContent("Elapsed 0:01");
  });
});
