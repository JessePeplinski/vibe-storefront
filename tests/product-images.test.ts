import { describe, expect, it } from "vitest";
import { __testables } from "@/lib/product-images";
import { sampleStorefrontContent } from "@/lib/storefront-schema";

describe("product image helpers", () => {
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
});
