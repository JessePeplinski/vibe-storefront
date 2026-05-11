import { afterEach, describe, expect, it, vi } from "vitest";
import { __testables, generateProductImage } from "@/lib/product-images";
import { sampleStorefrontContent } from "@/lib/storefront-schema";

describe("product image helpers", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("builds deterministic public storage paths from storefront slugs", () => {
    expect(
      __testables.buildProductImageStoragePath(
        "Brooklyn Ember Co. ABC123",
        new Date("2026-04-24T01:02:03.000Z")
      )
    ).toBe("storefronts/brooklyn-ember-co-abc123/product-20260424010203.webp");
  });

  it("builds image prompts from the original idea and generated storefront content", () => {
    const prompt = __testables.buildProductImagePrompt({
      content: sampleStorefrontContent,
      idea: "small-batch hot sauce from Brooklyn"
    });

    expect(prompt).toContain("small-batch hot sauce from Brooklyn");
    expect(prompt).toContain("Brooklyn Ember Co.");
    expect(prompt).toContain("The Borough Blend");
    expect(prompt).toContain("Do not include readable text");
  });

  it("builds concise product image alt text", () => {
    expect(__testables.buildProductImageAlt(sampleStorefrontContent)).toBe(
      "The Borough Blend product image for Brooklyn Ember Co."
    );
  });

  it("passes abort signals to OpenAI image requests", async () => {
    const originalCodexApiKey = process.env.CODEX_API_KEY;
    process.env.CODEX_API_KEY = "test-key";
    const abortController = new AbortController();
    const fetchMock = vi.fn().mockRejectedValue(
      new DOMException("The operation was aborted.", "AbortError")
    );
    vi.stubGlobal("fetch", fetchMock);

    try {
      await expect(
        generateProductImage({
          content: sampleStorefrontContent,
          idea: "small-batch hot sauce from Brooklyn",
          signal: abortController.signal,
          slug: "brooklyn-ember-co-abc123"
        })
      ).rejects.toThrow("Unable to generate product image: timed out.");
    } finally {
      if (originalCodexApiKey === undefined) {
        delete process.env.CODEX_API_KEY;
      } else {
        process.env.CODEX_API_KEY = originalCodexApiKey;
      }
    }

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        signal: abortController.signal
      })
    );
  });
});
