import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { sampleStorefrontContent } from "@/lib/storefront-schema";

const mocks = vi.hoisted(() => ({
  getPublicStorefrontBySlug: vi.fn()
}));

vi.mock("@/lib/storefronts", () => ({
  getPublicStorefrontBySlug: mocks.getPublicStorefrontBySlug
}));

describe("public storefront page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_APP_URL = "https://vibe.example";
    mocks.getPublicStorefrontBySlug.mockResolvedValue({
      id: "storefront-id",
      owner_clerk_user_id: "user_123",
      slug: "brooklyn-ember-co-abc123",
      idea: "small-batch hot sauce from Brooklyn",
      content: sampleStorefrontContent,
      published: true,
      created_at: "2026-04-23T00:00:00.000Z",
      updated_at: "2026-04-23T00:00:00.000Z"
    });
  });

  it("renders saved public storefront content", async () => {
    const Page = (await import("@/app/s/[slug]/page")).default;

    render(
      await Page({
        params: Promise.resolve({ slug: "brooklyn-ember-co-abc123" })
      })
    );

    expect(
      screen.getByRole("heading", { name: "Brooklyn Ember Co." })
    ).toBeInTheDocument();
    expect(screen.getByText(sampleStorefrontContent.hero.body)).toBeInTheDocument();
    expect(screen.getByText("Reserve a bottle")).toBeInTheDocument();
    expect(screen.getByText("Generated from: small-batch hot sauce from Brooklyn")).toBeInTheDocument();
  });
});
