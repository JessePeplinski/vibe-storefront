import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  sampleStorefrontContent,
  type StorefrontRecord
} from "@/lib/storefront-schema";

const mocks = vi.hoisted(() => ({
  listPublishedStorefronts: vi.fn()
}));

vi.mock("@/lib/storefronts", () => ({
  listPublishedStorefronts: mocks.listPublishedStorefronts
}));

const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL;

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
    updated_at: "2026-04-24T00:00:00.000Z",
    ...overrides
  };
}

describe("metadata routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_APP_URL = "https://vibe.example";
  });

  afterEach(() => {
    if (originalAppUrl) {
      process.env.NEXT_PUBLIC_APP_URL = originalAppUrl;
    } else {
      delete process.env.NEXT_PUBLIC_APP_URL;
    }
  });

  it("generates robots.txt rules for public pages and private surfaces", async () => {
    const robots = (await import("@/app/robots")).default;

    expect(robots()).toEqual({
      host: "https://vibe.example",
      rules: {
        allow: "/",
        disallow: ["/api/", "/dashboard", "/dashboard/", "/sign-in", "/sign-in/"],
        userAgent: "*"
      },
      sitemap: "https://vibe.example/sitemap.xml"
    });
  });

  it("generates a sitemap for static public pages and published storefronts", async () => {
    mocks.listPublishedStorefronts.mockResolvedValue([
      storefront(),
      storefront({
        id: "second-storefront-id",
        slug: "desk-bloom-def456",
        updated_at: "2026-04-25T00:00:00.000Z"
      })
    ]);
    const sitemap = (await import("@/app/sitemap")).default;

    await expect(sitemap()).resolves.toEqual([
      {
        changeFrequency: "weekly",
        images: ["https://vibe.example/opengraph-image"],
        priority: 1,
        url: "https://vibe.example/"
      },
      {
        changeFrequency: "daily",
        images: ["https://vibe.example/opengraph-image"],
        priority: 0.8,
        url: "https://vibe.example/storefronts"
      },
      {
        changeFrequency: "weekly",
        images: [
          "https://vibe.example/s/brooklyn-ember-co-abc123/opengraph-image"
        ],
        lastModified: "2026-04-24T00:00:00.000Z",
        priority: 0.7,
        url: "https://vibe.example/s/brooklyn-ember-co-abc123"
      },
      {
        changeFrequency: "weekly",
        images: ["https://vibe.example/s/desk-bloom-def456/opengraph-image"],
        lastModified: "2026-04-25T00:00:00.000Z",
        priority: 0.7,
        url: "https://vibe.example/s/desk-bloom-def456"
      }
    ]);
  });
});
