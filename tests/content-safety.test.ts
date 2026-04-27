import { describe, expect, it } from "vitest";
import {
  containsBlockedNsfwTerm,
  storefrontContentContainsBlockedTerms
} from "@/lib/content-safety";
import { sampleStorefrontContent } from "@/lib/storefront-schema";

describe("content safety", () => {
  it("detects direct NSFW terms and phrases", () => {
    expect(containsBlockedNsfwTerm("subscription boxes for porn collectors"))
      .toBe(true);
    expect(containsBlockedNsfwTerm("adult-toy display shelves")).toBe(true);
  });

  it("detects basic case, punctuation, and spacing obfuscation", () => {
    expect(containsBlockedNsfwTerm("P.0.R.N poster kits")).toBe(true);
    expect(containsBlockedNsfwTerm("N S F W novelty packaging")).toBe(true);
  });

  it("does not match blocked terms inside larger safe words", () => {
    expect(
      containsBlockedNsfwTerm("Essex market gift baskets and unisex travel kits")
    ).toBe(false);
  });

  it("scans generated storefront content fields", () => {
    expect(storefrontContentContainsBlockedTerms(sampleStorefrontContent)).toBe(
      false
    );
    expect(
      storefrontContentContainsBlockedTerms({
        ...sampleStorefrontContent,
        tagline: "N S F W poster drops for collectors."
      })
    ).toBe(true);
  });
});
