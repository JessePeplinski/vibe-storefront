import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  defaultStorefrontThemeAppearance,
  sampleStorefrontContent,
  type StorefrontContent,
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

const generatedStorefrontContent = {
  ...sampleStorefrontContent,
  name: sampleStorefrontContent.product.name
} satisfies StorefrontContent;

describe("generateStorefront", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.CODEX_MODEL;
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
      finalResponse: JSON.stringify(generatedStorefrontContent),
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
      content: generatedStorefrontContent,
      model: "gpt-5.5",
      usage: {
        cached_input_tokens: 20,
        input_tokens: 100,
        output_tokens: 50
      }
    });
    expect(mocks.Codex).toHaveBeenCalledWith(
      expect.objectContaining({
        codexPathOverride: "/tmp/test-codex",
        config: expect.objectContaining({
          model: "gpt-5.5",
          model_reasoning_effort: "low"
        })
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
      'Set presentationVersion to exactly "2.0".'
    );
    expect(prompt).toContain(
      "Set the top-level name to exactly the same string as product.name."
    );
    expect(prompt).toContain(
      "Do not shorten, rebrand, or create a separate brand-style name for the top-level name."
    );
    expect(prompt).toContain(
      "Choose theme.appearance from the allowed enum values based on the product idea."
    );
    expect(prompt).toContain(
      "Do not include Tailwind classes, CSS, layout instructions, or arbitrary style strings."
    );
    expect(prompt).toContain(
      "The palette background and text colors must never be identical or near-identical."
    );
    expect(prompt).toContain(
      "For dark backgrounds, choose a light text color. For light backgrounds, choose a dark text color."
    );
    const outputSchema = __testables.storefrontJsonSchema as {
      properties: {
        presentationVersion?: unknown;
        product: {
          properties: {
            image?: unknown;
          };
        };
        theme: {
          properties: {
            appearance?: unknown;
          };
        };
      };
    };

    expect(outputSchema.properties.presentationVersion).toBeDefined();
    expect(JSON.stringify(outputSchema.properties.presentationVersion)).toContain(
      "2.0"
    );
    expect(outputSchema.properties.theme.properties.appearance).toBeDefined();
    expect(outputSchema.properties.product.properties.image).toBeUndefined();
  });

  it("rejects underspecified ideas before calling Codex", async () => {
    const { generateStorefront } = await import("@/lib/codex-storefront");

    await expect(generateStorefront("sauce")).rejects.toThrow(
      "Enter a more specific product idea."
    );
    expect(mocks.run).not.toHaveBeenCalled();
  });

  it("rejects generated content with a different top-level and product name", async () => {
    const { __testables } = await import("@/lib/codex-storefront");

    expect(() =>
      __testables.parseCodexResponse(JSON.stringify(sampleStorefrontContent))
    ).toThrow("Generated storefront name must match product name.");
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

  it("defaults legacy persisted storefront content to v1 presentation metadata", () => {
    const contentWithoutVersion: Partial<typeof sampleStorefrontContent> = {
      ...sampleStorefrontContent
    };
    const themeWithoutAppearance: Partial<typeof sampleStorefrontContent.theme> =
      {
        ...sampleStorefrontContent.theme
      };

    delete contentWithoutVersion.presentationVersion;
    delete themeWithoutAppearance.appearance;

    const legacyContent = {
      ...contentWithoutVersion,
      theme: themeWithoutAppearance
    };

    expect(storefrontContentSchema.parse(legacyContent)).toEqual({
      ...legacyContent,
      presentationVersion: "1.0",
      theme: {
        ...themeWithoutAppearance,
        appearance: defaultStorefrontThemeAppearance
      }
    });
  });
});
