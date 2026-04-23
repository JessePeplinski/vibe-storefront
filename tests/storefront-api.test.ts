import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { sampleStorefrontContent } from "@/lib/storefront-schema";

const mocks = vi.hoisted(() => {
  return {
    auth: vi.fn(),
    createStorefront: vi.fn(),
    generateStorefront: vi.fn(),
    listStorefrontsForOwner: vi.fn()
  };
});

vi.mock("@clerk/nextjs/server", () => ({
  auth: mocks.auth
}));

vi.mock("@/lib/codex-storefront", () => ({
  generateStorefront: mocks.generateStorefront
}));

vi.mock("@/lib/storefronts", () => ({
  createStorefront: mocks.createStorefront,
  listStorefrontsForOwner: mocks.listStorefrontsForOwner
}));

describe("storefront API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_APP_URL = "https://vibe.example";
  });

  it("rejects unauthenticated create requests", async () => {
    mocks.auth.mockResolvedValue({ userId: null });
    const { POST } = await import("@/app/api/storefronts/route");
    const request = new NextRequest("https://vibe.example/api/storefronts", {
      method: "POST",
      body: JSON.stringify({ idea: "small-batch hot sauce from Brooklyn" })
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload).toEqual({ error: "Unauthorized" });
    expect(mocks.generateStorefront).not.toHaveBeenCalled();
  });

  it("generates and persists a storefront for the Clerk user", async () => {
    mocks.auth.mockResolvedValue({ userId: "user_123" });
    mocks.generateStorefront.mockResolvedValue(sampleStorefrontContent);
    mocks.createStorefront.mockResolvedValue({
      id: "storefront-id",
      owner_clerk_user_id: "user_123",
      slug: "brooklyn-ember-co-abc123",
      idea: "small-batch hot sauce from Brooklyn",
      content: sampleStorefrontContent,
      published: true,
      created_at: "2026-04-23T00:00:00.000Z",
      updated_at: "2026-04-23T00:00:00.000Z"
    });
    const { POST } = await import("@/app/api/storefronts/route");
    const request = new NextRequest("https://vibe.example/api/storefronts", {
      method: "POST",
      body: JSON.stringify({ idea: "small-batch hot sauce from Brooklyn" })
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(mocks.generateStorefront).toHaveBeenCalledWith(
      "small-batch hot sauce from Brooklyn"
    );
    expect(mocks.createStorefront).toHaveBeenCalledWith({
      ownerClerkUserId: "user_123",
      idea: "small-batch hot sauce from Brooklyn",
      content: sampleStorefrontContent
    });
    expect(payload.shareUrl).toBe(
      "https://vibe.example/s/brooklyn-ember-co-abc123"
    );
  });
});
