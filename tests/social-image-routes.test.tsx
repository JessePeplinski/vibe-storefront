// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  sampleStorefrontContent,
  type StorefrontRecord
} from "@/lib/storefront-schema";

const mocks = vi.hoisted(() => ({
  getPublicStorefrontBySlug: vi.fn()
}));

vi.mock("@/lib/storefronts", () => ({
  getPublicStorefrontBySlug: mocks.getPublicStorefrontBySlug
}));

function storefront(overrides: Partial<StorefrontRecord> = {}): StorefrontRecord {
  return {
    id: "storefront-id",
    owner_clerk_user_id: "user_123",
    anonymous_session_id: null,
    slug: "brooklyn-ember-co-abc123",
    idea: "small-batch hot sauce from Brooklyn",
    content: sampleStorefrontContent,
    published: true,
    created_at: "2026-04-23T00:00:00.000Z",
    updated_at: "2026-04-23T00:00:00.000Z",
    ...overrides
  };
}

async function expectPngUnderTwitterLimit(response: Response) {
  expect(response.headers.get("content-type")).toBe("image/png");

  const bytes = await response.arrayBuffer();
  expect(bytes.byteLength).toBeGreaterThan(0);
  expect(bytes.byteLength).toBeLessThan(5 * 1024 * 1024);
}

describe("social image routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("generates a default site social image", async () => {
    const Image = (await import("@/app/opengraph-image")).default;

    await expectPngUnderTwitterLimit(Image());
  });

  it("generates a storefront-specific social image", async () => {
    mocks.getPublicStorefrontBySlug.mockResolvedValue(storefront());
    const Image = (await import("@/app/s/[slug]/opengraph-image")).default;

    await expectPngUnderTwitterLimit(
      await Image({
        params: Promise.resolve({ slug: "brooklyn-ember-co-abc123" })
      })
    );
    expect(mocks.getPublicStorefrontBySlug).toHaveBeenCalledWith(
      "brooklyn-ember-co-abc123"
    );
  });
});
