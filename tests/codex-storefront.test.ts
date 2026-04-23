import { beforeEach, describe, expect, it, vi } from "vitest";
import { sampleStorefrontContent } from "@/lib/storefront-schema";

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
      finalResponse: JSON.stringify(sampleStorefrontContent)
    });
  });

  it("calls Codex with the user idea and a structured output schema", async () => {
    const { generateStorefront } = await import("@/lib/codex-storefront");

    const storefront = await generateStorefront(
      "small-batch hot sauce from Brooklyn"
    );

    expect(storefront).toEqual(sampleStorefrontContent);
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
  });

  it("rejects underspecified ideas before calling Codex", async () => {
    const { generateStorefront } = await import("@/lib/codex-storefront");

    await expect(generateStorefront("sauce")).rejects.toThrow(
      "Enter a more specific product idea."
    );
    expect(mocks.run).not.toHaveBeenCalled();
  });
});
