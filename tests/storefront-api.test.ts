import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { sampleStorefrontContent } from "@/lib/storefront-schema";

const mocks = vi.hoisted(() => {
  return {
    auth: vi.fn(),
    createStorefront: vi.fn(),
    generateStorefront: vi.fn(),
    getStorefrontByAnonymousSession: vi.fn(),
    getStorefrontByOwnerAndIdea: vi.fn(),
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
  getStorefrontByAnonymousSession: mocks.getStorefrontByAnonymousSession,
  getStorefrontByOwnerAndIdea: mocks.getStorefrontByOwnerAndIdea,
  listStorefrontsForOwner: mocks.listStorefrontsForOwner
}));

describe("storefront API", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_APP_URL = "https://vibe.example";
    mocks.getStorefrontByOwnerAndIdea.mockResolvedValue(null);
  });

  it("rejects unauthenticated list requests", async () => {
    mocks.auth.mockResolvedValue({ userId: null });
    const { GET } = await import("@/app/api/storefronts/route");

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload).toEqual({ error: "Unauthorized" });
  });

  it("generates and persists a storefront for the Clerk user", async () => {
    mocks.auth.mockResolvedValue({ userId: "user_123" });
    mocks.generateStorefront.mockResolvedValue(sampleStorefrontContent);
    mocks.createStorefront.mockResolvedValue({
      id: "storefront-id",
      owner_clerk_user_id: "user_123",
      anonymous_session_id: null,
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
    expect(mocks.getStorefrontByOwnerAndIdea).toHaveBeenCalledWith({
      ownerClerkUserId: "user_123",
      idea: "small-batch hot sauce from Brooklyn"
    });
    expect(mocks.createStorefront).toHaveBeenCalledWith({
      ownerClerkUserId: "user_123",
      idea: "small-batch hot sauce from Brooklyn",
      content: sampleStorefrontContent
    });
    expect(payload.shareUrl).toBe(
      "https://vibe.example/s/brooklyn-ember-co-abc123"
    );
  });

  it("returns an existing storefront for a repeated Clerk user prompt", async () => {
    const existingStorefront = {
      id: "storefront-id",
      owner_clerk_user_id: "user_123",
      anonymous_session_id: null,
      slug: "brooklyn-ember-co-abc123",
      idea: "small-batch hot sauce from Brooklyn",
      content: sampleStorefrontContent,
      published: true,
      created_at: "2026-04-23T00:00:00.000Z",
      updated_at: "2026-04-23T00:00:00.000Z"
    };

    mocks.auth.mockResolvedValue({ userId: "user_123" });
    mocks.getStorefrontByOwnerAndIdea.mockResolvedValue(existingStorefront);
    const { POST } = await import("@/app/api/storefronts/route");
    const request = new NextRequest("https://vibe.example/api/storefronts", {
      method: "POST",
      body: JSON.stringify({ idea: "  small-batch   hot sauce from Brooklyn  " })
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(mocks.getStorefrontByOwnerAndIdea).toHaveBeenCalledWith({
      ownerClerkUserId: "user_123",
      idea: "small-batch   hot sauce from Brooklyn"
    });
    expect(mocks.generateStorefront).not.toHaveBeenCalled();
    expect(mocks.createStorefront).not.toHaveBeenCalled();
    expect(payload).toMatchObject({
      storefront: existingStorefront,
      shareUrl: "https://vibe.example/s/brooklyn-ember-co-abc123",
      status: "existing_prompt_storefront"
    });
  });

  it("generates one storefront for an anonymous guest and sets a session cookie", async () => {
    const guestSessionId = "00000000-0000-4000-8000-000000000001";

    vi.spyOn(crypto, "randomUUID").mockReturnValue(guestSessionId);
    mocks.auth.mockResolvedValue({ userId: null });
    mocks.getStorefrontByAnonymousSession.mockResolvedValue(null);
    mocks.generateStorefront.mockResolvedValue(sampleStorefrontContent);
    mocks.createStorefront.mockResolvedValue({
      id: "guest-storefront-id",
      owner_clerk_user_id: null,
      anonymous_session_id: guestSessionId,
      slug: "guest-hot-sauce-abc123",
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
    expect(mocks.getStorefrontByAnonymousSession).toHaveBeenCalledWith(
      guestSessionId
    );
    expect(mocks.generateStorefront).toHaveBeenCalledWith(
      "small-batch hot sauce from Brooklyn"
    );
    expect(mocks.createStorefront).toHaveBeenCalledWith({
      anonymousSessionId: guestSessionId,
      idea: "small-batch hot sauce from Brooklyn",
      content: sampleStorefrontContent
    });
    expect(payload.shareUrl).toBe(
      "https://vibe.example/s/guest-hot-sauce-abc123"
    );
    expect(response.headers.get("set-cookie")).toContain(
      `vibe_storefront_guest_id=${guestSessionId}`
    );
  });

  it("returns the existing anonymous storefront without generating again", async () => {
    const guestSessionId = "00000000-0000-4000-8000-000000000001";
    const existingStorefront = {
      id: "guest-storefront-id",
      owner_clerk_user_id: null,
      anonymous_session_id: guestSessionId,
      slug: "guest-hot-sauce-abc123",
      idea: "small-batch hot sauce from Brooklyn",
      content: sampleStorefrontContent,
      published: true,
      created_at: "2026-04-23T00:00:00.000Z",
      updated_at: "2026-04-23T00:00:00.000Z"
    };

    mocks.auth.mockResolvedValue({ userId: null });
    mocks.getStorefrontByAnonymousSession.mockResolvedValue(existingStorefront);
    const { POST } = await import("@/app/api/storefronts/route");
    const request = new NextRequest("https://vibe.example/api/storefronts", {
      method: "POST",
      headers: {
        cookie: `vibe_storefront_guest_id=${guestSessionId}`
      },
      body: JSON.stringify({ idea: "tiny lamp kits for renters" })
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(409);
    expect(payload).toMatchObject({
      error:
        "This browser already generated Brooklyn Ember Co.; open it below or sign in to create more storefronts.",
      storefront: existingStorefront,
      shareUrl: "https://vibe.example/s/guest-hot-sauce-abc123",
      status: "existing_guest_storefront"
    });
    expect(mocks.generateStorefront).not.toHaveBeenCalled();
    expect(mocks.createStorefront).not.toHaveBeenCalled();
    expect(response.headers.get("set-cookie")).toContain(
      `vibe_storefront_guest_id=${guestSessionId}`
    );
  });
});
