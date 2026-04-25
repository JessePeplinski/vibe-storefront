import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { sampleStorefrontContent } from "@/lib/storefront-schema";

const mocks = vi.hoisted(() => {
  return {
    auth: vi.fn(),
    buildStorefrontSlug: vi.fn(),
    createStorefront: vi.fn(),
    deleteStorefrontForOwner: vi.fn(),
    deleteProductImage: vi.fn(),
    generateProductImage: vi.fn(),
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

vi.mock("@/lib/product-images", () => ({
  deleteProductImage: mocks.deleteProductImage,
  generateProductImage: mocks.generateProductImage
}));

vi.mock("@/lib/slug", () => ({
  buildStorefrontSlug: mocks.buildStorefrontSlug
}));

vi.mock("@/lib/storefronts", () => ({
  createStorefront: mocks.createStorefront,
  deleteStorefrontForOwner: mocks.deleteStorefrontForOwner,
  getStorefrontByAnonymousSession: mocks.getStorefrontByAnonymousSession,
  getStorefrontByOwnerAndIdea: mocks.getStorefrontByOwnerAndIdea,
  listStorefrontsForOwner: mocks.listStorefrontsForOwner
}));

const productImage = {
  alt: "The Borough Blend product image for Brooklyn Ember Co.",
  generatedAt: "2026-04-24T00:00:00.000Z",
  model: "gpt-image-2",
  storagePath: "storefronts/brooklyn-ember-co-image123/product.webp",
  url: "https://supabase.example/storage/v1/object/public/storefront-product-images/storefronts/brooklyn-ember-co-image123/product.webp"
};

const productImageWarning =
  "Storefront created, but the product image could not be generated.";

const sampleStorefrontContentWithImage = {
  ...sampleStorefrontContent,
  product: {
    ...sampleStorefrontContent.product,
    image: productImage
  }
};

describe("storefront API", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_APP_URL = "https://vibe.example";
    mocks.buildStorefrontSlug.mockReturnValue("brooklyn-ember-co-image123");
    mocks.deleteProductImage.mockResolvedValue(undefined);
    mocks.deleteStorefrontForOwner.mockResolvedValue(null);
    mocks.generateProductImage.mockResolvedValue(productImage);
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
      slug: "brooklyn-ember-co-image123",
      idea: "small-batch hot sauce from Brooklyn",
      content: sampleStorefrontContentWithImage,
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
    expect(mocks.buildStorefrontSlug).toHaveBeenCalledWith("Brooklyn Ember Co.");
    expect(mocks.generateProductImage).toHaveBeenCalledWith({
      content: sampleStorefrontContent,
      idea: "small-batch hot sauce from Brooklyn",
      slug: "brooklyn-ember-co-image123"
    });
    expect(mocks.createStorefront).toHaveBeenCalledWith({
      ownerClerkUserId: "user_123",
      idea: "small-batch hot sauce from Brooklyn",
      content: sampleStorefrontContentWithImage,
      slug: "brooklyn-ember-co-image123"
    });
    expect(payload.shareUrl).toBe(
      "https://vibe.example/s/brooklyn-ember-co-image123"
    );
  });

  it("retries product image generation and saves the storefront when a retry succeeds", async () => {
    mocks.auth.mockResolvedValue({ userId: "user_123" });
    mocks.generateStorefront.mockResolvedValue(sampleStorefrontContent);
    mocks.generateProductImage
      .mockRejectedValueOnce(
        new Error("Unable to generate product image: upstream timeout")
      )
      .mockRejectedValueOnce(
        new Error("Unable to generate product image: upstream timeout")
      )
      .mockResolvedValueOnce(productImage);
    mocks.createStorefront.mockResolvedValue({
      id: "storefront-id",
      owner_clerk_user_id: "user_123",
      anonymous_session_id: null,
      slug: "brooklyn-ember-co-image123",
      idea: "small-batch hot sauce from Brooklyn",
      content: sampleStorefrontContentWithImage,
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
    expect(mocks.generateProductImage).toHaveBeenCalledTimes(3);
    expect(mocks.createStorefront).toHaveBeenCalledWith({
      ownerClerkUserId: "user_123",
      idea: "small-batch hot sauce from Brooklyn",
      content: sampleStorefrontContentWithImage,
      slug: "brooklyn-ember-co-image123"
    });
    expect(payload).not.toHaveProperty("warning");
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
    expect(mocks.generateProductImage).not.toHaveBeenCalled();
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
      slug: "brooklyn-ember-co-image123",
      idea: "small-batch hot sauce from Brooklyn",
      content: sampleStorefrontContentWithImage,
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
    expect(mocks.generateProductImage).toHaveBeenCalledWith({
      content: sampleStorefrontContent,
      idea: "small-batch hot sauce from Brooklyn",
      slug: "brooklyn-ember-co-image123"
    });
    expect(mocks.createStorefront).toHaveBeenCalledWith({
      anonymousSessionId: guestSessionId,
      idea: "small-batch hot sauce from Brooklyn",
      content: sampleStorefrontContentWithImage,
      slug: "brooklyn-ember-co-image123"
    });
    expect(payload.shareUrl).toBe(
      "https://vibe.example/s/brooklyn-ember-co-image123"
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
    expect(mocks.generateProductImage).not.toHaveBeenCalled();
    expect(mocks.createStorefront).not.toHaveBeenCalled();
    expect(response.headers.get("set-cookie")).toContain(
      `vibe_storefront_guest_id=${guestSessionId}`
    );
  });

  it("saves the storefront without an image when product image retries are exhausted", async () => {
    mocks.auth.mockResolvedValue({ userId: "user_123" });
    mocks.generateStorefront.mockResolvedValue(sampleStorefrontContent);
    mocks.generateProductImage.mockRejectedValue(
      new Error("Unable to generate product image: quota exceeded")
    );
    mocks.createStorefront.mockResolvedValue({
      id: "storefront-id",
      owner_clerk_user_id: "user_123",
      anonymous_session_id: null,
      slug: "brooklyn-ember-co-image123",
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
    expect(mocks.generateProductImage).toHaveBeenCalledTimes(3);
    expect(mocks.createStorefront).toHaveBeenCalledWith({
      ownerClerkUserId: "user_123",
      idea: "small-batch hot sauce from Brooklyn",
      content: sampleStorefrontContent,
      slug: "brooklyn-ember-co-image123"
    });
    expect(mocks.deleteProductImage).not.toHaveBeenCalled();
    expect(payload).toMatchObject({
      storefront: {
        content: sampleStorefrontContent,
        slug: "brooklyn-ember-co-image123"
      },
      shareUrl: "https://vibe.example/s/brooklyn-ember-co-image123",
      status: "created",
      warning: productImageWarning
    });
    expect(payload.storefront.content.product.image).toBeUndefined();
  });

  it("deletes an uploaded product image if the database insert fails", async () => {
    mocks.auth.mockResolvedValue({ userId: "user_123" });
    mocks.generateStorefront.mockResolvedValue(sampleStorefrontContent);
    mocks.createStorefront.mockRejectedValue(
      new Error("Unable to save storefront: duplicate slug")
    );
    const { POST } = await import("@/app/api/storefronts/route");
    const request = new NextRequest("https://vibe.example/api/storefronts", {
      method: "POST",
      body: JSON.stringify({ idea: "small-batch hot sauce from Brooklyn" })
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload).toEqual({
      error: "Unable to save storefront: duplicate slug"
    });
    expect(mocks.deleteProductImage).toHaveBeenCalledWith(productImage.storagePath);
  });

  it("rejects unauthenticated delete requests", async () => {
    mocks.auth.mockResolvedValue({ userId: null });
    const { DELETE } = await import("@/app/api/storefronts/[id]/route");
    const request = new NextRequest(
      "https://vibe.example/api/storefronts/00000000-0000-4000-8000-000000000001",
      { method: "DELETE" }
    );

    const response = await DELETE(request, {
      params: Promise.resolve({ id: "00000000-0000-4000-8000-000000000001" })
    });
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload).toEqual({ error: "Unauthorized" });
    expect(mocks.deleteStorefrontForOwner).not.toHaveBeenCalled();
  });

  it("rejects invalid storefront ids on delete", async () => {
    mocks.auth.mockResolvedValue({ userId: "user_123" });
    const { DELETE } = await import("@/app/api/storefronts/[id]/route");
    const request = new NextRequest(
      "https://vibe.example/api/storefronts/not-a-uuid",
      { method: "DELETE" }
    );

    const response = await DELETE(request, {
      params: Promise.resolve({ id: "not-a-uuid" })
    });
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload).toEqual({ error: "Invalid storefront id." });
    expect(mocks.deleteStorefrontForOwner).not.toHaveBeenCalled();
  });

  it("returns not found when deleting a missing or unowned storefront", async () => {
    mocks.auth.mockResolvedValue({ userId: "user_123" });
    mocks.deleteStorefrontForOwner.mockResolvedValue(null);
    const { DELETE } = await import("@/app/api/storefronts/[id]/route");
    const request = new NextRequest(
      "https://vibe.example/api/storefronts/00000000-0000-4000-8000-000000000001",
      { method: "DELETE" }
    );

    const response = await DELETE(request, {
      params: Promise.resolve({ id: "00000000-0000-4000-8000-000000000001" })
    });
    const payload = await response.json();

    expect(response.status).toBe(404);
    expect(mocks.deleteStorefrontForOwner).toHaveBeenCalledWith({
      ownerClerkUserId: "user_123",
      storefrontId: "00000000-0000-4000-8000-000000000001"
    });
    expect(payload).toEqual({ error: "Storefront not found." });
    expect(mocks.deleteProductImage).not.toHaveBeenCalled();
  });

  it("deletes an owned storefront and cleans up its product image", async () => {
    const storefrontId = "00000000-0000-4000-8000-000000000001";

    mocks.auth.mockResolvedValue({ userId: "user_123" });
    mocks.deleteStorefrontForOwner.mockResolvedValue({
      id: storefrontId,
      owner_clerk_user_id: "user_123",
      anonymous_session_id: null,
      slug: "brooklyn-ember-co-image123",
      idea: "small-batch hot sauce from Brooklyn",
      content: sampleStorefrontContentWithImage,
      published: true,
      created_at: "2026-04-23T00:00:00.000Z",
      updated_at: "2026-04-23T00:00:00.000Z"
    });
    const { DELETE } = await import("@/app/api/storefronts/[id]/route");
    const request = new NextRequest(
      `https://vibe.example/api/storefronts/${storefrontId}`,
      { method: "DELETE" }
    );

    const response = await DELETE(request, {
      params: Promise.resolve({ id: storefrontId })
    });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(mocks.deleteStorefrontForOwner).toHaveBeenCalledWith({
      ownerClerkUserId: "user_123",
      storefrontId
    });
    expect(mocks.deleteProductImage).toHaveBeenCalledWith(productImage.storagePath);
    expect(payload).toEqual({ deletedStorefrontId: storefrontId });
  });

  it("keeps a deleted storefront deleted when product image cleanup fails", async () => {
    const storefrontId = "00000000-0000-4000-8000-000000000001";

    mocks.auth.mockResolvedValue({ userId: "user_123" });
    mocks.deleteProductImage.mockRejectedValue(new Error("storage unavailable"));
    mocks.deleteStorefrontForOwner.mockResolvedValue({
      id: storefrontId,
      owner_clerk_user_id: "user_123",
      anonymous_session_id: null,
      slug: "brooklyn-ember-co-image123",
      idea: "small-batch hot sauce from Brooklyn",
      content: sampleStorefrontContentWithImage,
      published: true,
      created_at: "2026-04-23T00:00:00.000Z",
      updated_at: "2026-04-23T00:00:00.000Z"
    });
    const { DELETE } = await import("@/app/api/storefronts/[id]/route");
    const request = new NextRequest(
      `https://vibe.example/api/storefronts/${storefrontId}`,
      { method: "DELETE" }
    );

    const response = await DELETE(request, {
      params: Promise.resolve({ id: storefrontId })
    });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(mocks.deleteProductImage).toHaveBeenCalledWith(productImage.storagePath);
    expect(payload).toEqual({ deletedStorefrontId: storefrontId });
  });
});
