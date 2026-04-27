import { describe, expect, it } from "vitest";
import {
  estimateCodexCost,
  estimateImageCost,
  estimateStorefrontGenerationCost
} from "@/lib/usage-costs";
import { formatUsageUsd } from "@/lib/usage-format";

describe("usage cost estimates", () => {
  it("prices Codex usage with cached input tokens", () => {
    expect(
      estimateCodexCost({
        model: "gpt-5.3-codex",
        usage: {
          cached_input_tokens: 100,
          input_tokens: 1_000,
          output_tokens: 500
        }
      })
    ).toBe(0.008593);
  });

  it("prices image generation usage from text input and image output tokens", () => {
    expect(
      estimateImageCost({
        model: "gpt-image-2",
        usage: {
          input_tokens: 200,
          input_tokens_details: {
            text_tokens: 200
          },
          output_tokens: 1_000,
          output_tokens_details: {
            image_tokens: 1_000
          }
        }
      })
    ).toBe(0.031);
  });

  it("keeps unavailable model pricing out of the total", () => {
    expect(
      estimateStorefrontGenerationCost({
        imageModel: "unknown-image-model",
        imageUsage: {
          input_tokens: 200,
          output_tokens: 1_000
        },
        textModel: "unknown-text-model",
        textUsage: {
          cached_input_tokens: 0,
          input_tokens: 1_000,
          output_tokens: 500
        }
      })
    ).toMatchObject({
      imageUsd: null,
      textUsd: null,
      totalUsd: 0,
      unavailableLineItems: ["storefront copy", "product image"]
    });
  });

  it("formats sub-cent and cent-level costs for display", () => {
    expect(formatUsageUsd(0.004321)).toBe("$0.0043");
    expect(formatUsageUsd(0.056)).toBe("$0.06");
  });
});
