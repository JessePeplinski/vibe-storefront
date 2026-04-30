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
      elapsedSeconds={progress.elapsedSeconds}
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

  it("shows a thinking panel with elapsed time and deterministic feed lines", () => {
    vi.useFakeTimers();

    const { container } = render(<ProgressHarness />);

    let generationProgress = screen.getByRole("status", {
      name: "Generation progress"
    });

    expect(generationProgress).toHaveTextContent("Thinking");
    expect(generationProgress).toHaveTextContent("0:00");
    expect(generationProgress).toHaveTextContent("Draft storefront copy");
    expect(generationProgress).toHaveTextContent(
      "Reading the product idea and shaping a storefront brief."
    );
    expect(generationProgress).not.toHaveTextContent("Step 1 of 4");
    expect(
      container.querySelectorAll("[data-generation-connector='true']")
    ).toHaveLength(0);

    act(() => {
      vi.advanceTimersByTime(31_000);
    });

    generationProgress = screen.getByRole("status", {
      name: "Generation progress"
    });

    expect(generationProgress).toHaveTextContent("0:31");
    expect(generationProgress).toHaveTextContent("Generate product image");
    expect(generationProgress).toHaveTextContent(
      "Generating product image direction from the concept."
    );
    expect(generationProgress).toHaveTextContent(
      "Writing launch copy with a clear ecommerce structure."
    );
  });
});
