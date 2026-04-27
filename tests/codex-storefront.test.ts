import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  sampleStorefrontContent,
  storefrontContentSchema
} from "@/lib/storefront-schema";

const mocks = vi.hoisted(() => {
  return {
    Codex: vi.fn(),
    run: vi.fn(),
    startThread: vi.fn()
  };
});

vi.mock("@openai/codex-sdk", () => {
  return {
    Codex: mocks.Codex
  };
});

describe("generateStorefront", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CODEX_PATH_OVERRIDE = "/tmp/test-codex";
    process.env.CODEX_API_KEY = "test-codex-key";
    mocks.Codex.mockImplementation(function MockCodex() {
      return {
        startThread: mocks.startThread
      };
    });
    mocks.startThread.mockReturnValue({
      run: mocks.run
    });
    mocks.run.mockResolvedValue({
      finalResponse: JSON.stringify(sampleStorefrontContent),
      usage: {
        cached_input_tokens: 20,
        input_tokens: 100,
        output_tokens: 50
      }
    });
  });

  it("calls Codex with the user idea and a structured output schema", async () => {
    const { __testables, generateStorefront } = await import(
      "@/lib/codex-storefront"
    );

    const storefront = await generateStorefront(
      "small-batch hot sauce from Brooklyn"
    );

    expect(storefront).toEqual({
      content: sampleStorefrontContent,
      model: "gpt-5.3-codex",
      usage: {
        cached_input_tokens: 20,
        input_tokens: 100,
        output_tokens: 50
      }
    });
    expect(mocks.Codex).toHaveBeenCalledWith(
      expect.objectContaining({
        codexPathOverride: "/tmp/test-codex"
      })
    );
    expect(mocks.startThread).toHaveBeenCalledWith({
      workingDirectory: "/tmp",
      skipGitRepoCheck: true
    });
    expect(mocks.run).toHaveBeenCalledWith(
      expect.stringContaining("small-batch hot sauce from Brooklyn"),
      expect.objectContaining({
        outputSchema: expect.objectContaining({
          type: "object"
        })
      })
    );
    const prompt = __testables.buildPrompt("small-batch hot sauce from Brooklyn");

    expect(prompt).toContain(
      "The palette background and text colors must never be identical or near-identical."
    );
    expect(prompt).toContain(
      "For dark backgrounds, choose a light text color. For light backgrounds, choose a dark text color."
    );
    const outputSchema = __testables.storefrontJsonSchema as {
      properties: {
        product: {
          properties: {
            image?: unknown;
          };
        };
      };
    };

    expect(outputSchema.properties.product.properties.image).toBeUndefined();
  });

  it("rejects underspecified ideas before calling Codex", async () => {
    const { generateStorefront } = await import("@/lib/codex-storefront");

    await expect(generateStorefront("sauce")).rejects.toThrow(
      "Enter a more specific product idea."
    );
    expect(mocks.run).not.toHaveBeenCalled();
  });

  it("accepts persisted storefront content with or without product image metadata", () => {
    expect(storefrontContentSchema.parse(sampleStorefrontContent)).toEqual(
      sampleStorefrontContent
    );

    const image = {
      alt: "The Borough Blend product image for Brooklyn Ember Co.",
      generatedAt: "2026-04-24T00:00:00.000Z",
      model: "gpt-image-2",
      storagePath: "storefronts/brooklyn-ember-co-abc123/product.webp",
      url: "https://supabase.example/storage/v1/object/public/storefront-product-images/storefronts/brooklyn-ember-co-abc123/product.webp"
    };
    const contentWithImage = {
      ...sampleStorefrontContent,
      product: {
        ...sampleStorefrontContent.product,
        image
      }
    };

    expect(storefrontContentSchema.parse(contentWithImage)).toEqual(
      contentWithImage
    );
  });
});
