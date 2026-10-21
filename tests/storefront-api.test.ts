import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sampleStorefrontContent } from "@/lib/storefront-schema";

const mocks = vi.hoisted(() => {
  return {
    after: vi.fn(),
    getLatestGenerationJob: vi.fn(),
    createGenerationJob: vi.fn(),
    claimGenerationJob: vi.fn(),
    finishGenerationJob: vi.fn(),
    isCurrentUserAdmin: vi.fn(),
  auth: vi.fn(),
    buildStorefrontSlug: vi.fn(),
    checkStorefrontGenerationRateLimit: vi.fn(),
    completeStorefrontGenerationSlot: vi.fn(),
    createStorefront: vi.fn(),
    deleteStorefrontForOwner: vi.fn(),
    deleteProductImage: vi.fn(),
    generateProductImage: vi.fn(),
    generateStorefront: vi.fn(),
    getStorefrontByOwnerAndIdea: vi.fn(),
    listStorefrontsForOwner: vi.fn(),
    releaseStorefrontGenerationSlot: vi.fn(),
    reserveStorefrontGenerationSlot: vi.fn()
  };
});

vi.mock("next/server", async (importOriginal) => ({
  ...await importOriginal<typeof import("next/server")>(),
  after: mocks.after
}));

vi.mock("@/lib/generation-jobs", () => ({
  getLatestGenerationJob: mocks.getLatestGenerationJob,
  createGenerationJob: mocks.createGenerationJob,
  claimGenerationJob: mocks.claimGenerationJob,
  finishGenerationJob: mocks.finishGenerationJob
}));

vi.mock("@/lib/admin", () => ({
  isCurrentUserAdmin: mocks.isCurrentUserAdmin
}));

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

vi.mock("@/lib/generation-rate-limit", () => ({
  checkStorefrontGenerationRateLimit: mocks.checkStorefrontGenerationRateLimit
}));

vi.mock("@/lib/storefronts", () => ({
  completeStorefrontGenerationSlot: mocks.completeStorefrontGenerationSlot,
  createStorefront: mocks.createStorefront,
  deleteStorefrontForOwner: mocks.deleteStorefrontForOwner,
  getStorefrontByOwnerAndIdea: mocks.getStorefrontByOwnerAndIdea,
  listStorefrontsForOwner: mocks.listStorefrontsForOwner,
  releaseStorefrontGenerationSlot: mocks.releaseStorefrontGenerationSlot,
  reserveStorefrontGenerationSlot: mocks.reserveStorefrontGenerationSlot
}));

const productImage = {
  alt: "The Borough Blend product image for Brooklyn Ember Co.",
  generatedAt: "2026-04-24T00:00:00.000Z",
  model: "gpt-image-2",
  storagePath: "storefronts/brooklyn-ember-co-image123/product.webp",
  url: "https://supabase.example/storage/v1/object/public/storefront-product-images/storefronts/brooklyn-ember-co-image123/product.webp"
};

const codexUsage = {
  cached_input_tokens: 100,
  input_tokens: 1_000,
  output_tokens: 500
};

const imageUsage = {
  input_tokens: 200,
  input_tokens_details: {
    text_tokens: 200
  },
  output_tokens: 1_000,
  output_tokens_details: {
    image_tokens: 1_000
  },
  total_tokens: 1_200
};

const generatedProductImage = {
  image: productImage,
  model: "gpt-image-2",
  usage: imageUsage
};

const productImageWarning =
  "Storefront created, but the product image could not be generated.";
const contentCannotBeGenerated = "Content cannot be generated.";

const sampleStorefrontContentWithImage = {
  ...sampleStorefrontContent,
  product: {
    ...sampleStorefrontContent.product,
    image: productImage
  }
};

function generatedStorefront(content = sampleStorefrontContent) {
  return {
    content,
    model: "gpt-5.5",
    usage: codexUsage
  };
}

const pendingJob = {
  id: "job-id", idea: "small-batch hot sauce from Brooklyn", status: "queued",
  createdAt: "2026-10-21T00:00:00Z", finishedAt: null, error: null, result: null
};

describe("storefront API", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    mocks.isCurrentUserAdmin.mockResolvedValue(false);
    mocks.getLatestGenerationJob.mockResolvedValue(null);
    mocks.createGenerationJob.mockResolvedValue({ job: pendingJob, created: true });
    mocks.claimGenerationJob.mockResolvedValue(true);
    mocks.finishGenerationJob.mockResolvedValue(undefined);
    process.env.NEXT_PUBLIC_APP_URL = "https://vibe.example";
    mocks.buildStorefrontSlug.mockReturnValue("brooklyn-ember-co-image123");
    mocks.checkStorefrontGenerationRateLimit.mockReturnValue({
      allowed: true
    });
    mocks.completeStorefrontGenerationSlot.mockResolvedValue(undefined);
    mocks.deleteProductImage.mockResolvedValue(undefined);
    mocks.deleteStorefrontForOwner.mockResolvedValue(null);
    mocks.generateProductImage.mockResolvedValue(generatedProductImage);
    mocks.generateStorefront.mockResolvedValue(generatedStorefront());
    mocks.getStorefrontByOwnerAndIdea.mockResolvedValue(null);
    mocks.listStorefrontsForOwner.mockResolvedValue([]);
    mocks.releaseStorefrontGenerationSlot.mockResolvedValue(undefined);
    mocks.reserveStorefrontGenerationSlot.mockResolvedValue({
      id: "generation-slot-id"
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("rejects unauthenticated list requests", async () => {
    mocks.auth.mockResolvedValue({ userId: null });
    const { GET } = await import("@/app/api/storefronts/route");

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload).toEqual({ error: "Unauthorized" });
  });

  it("accepts a background job before running generation and completes it after the response", async () => {
    mocks.auth.mockResolvedValue({ userId: "user_123" });
    mocks.createStorefront.mockResolvedValue({ id: "new-storefront", slug: "new-storefront", content: sampleStorefrontContent });
    const { POST } = await import("@/app/api/storefronts/route");
    const response = await POST(new NextRequest("https://vibe.example/api/storefronts", {
      method: "POST", body: JSON.stringify({ idea: pendingJob.idea, background: true })
    }));
    expect(response.status).toBe(202);
    expect((await response.json()).job).toMatchObject({ id: "job-id", status: "running" });
    expect(mocks.generateStorefront).not.toHaveBeenCalled();
    expect(mocks.claimGenerationJob).toHaveBeenCalledWith("job-id", "generation-slot-id");
    expect(mocks.after).toHaveBeenCalledTimes(1);
    // No browser/client is involved once the response has been sent.
    await mocks.after.mock.calls[0][0]();
    expect(mocks.generateStorefront).toHaveBeenCalledTimes(1);
    expect(mocks.finishGenerationJob).toHaveBeenCalledWith("job-id", { storefrontId: "new-storefront", warning: undefined });
  });

  it("reuses an active job across retries and tabs without another model call or quota reservation", async () => {
    mocks.auth.mockResolvedValue({ userId: "user_123" });
    mocks.getLatestGenerationJob.mockResolvedValue({ ...pendingJob, status: "running" });
    const { POST } = await import("@/app/api/storefronts/route");
    const response = await POST(new NextRequest("https://vibe.example/api/storefronts", {
      method: "POST", body: JSON.stringify({ idea: pendingJob.idea, background: true })
    }));
    expect(response.status).toBe(202);
    expect(mocks.after).not.toHaveBeenCalled();
    expect(mocks.createGenerationJob).not.toHaveBeenCalled();
    expect(mocks.generateStorefront).not.toHaveBeenCalled();
    expect(mocks.reserveStorefrontGenerationSlot).not.toHaveBeenCalled();
  });

  it("does not run another worker when simultaneous requests race to create an active job", async () => {
    mocks.auth.mockResolvedValue({ userId: "user_123" });
    mocks.createGenerationJob.mockResolvedValue({ job: pendingJob, created: false });
    const { POST } = await import("@/app/api/storefronts/route");
    const response = await POST(new NextRequest("https://vibe.example/api/storefronts", {
      method: "POST", body: JSON.stringify({ idea: pendingJob.idea, background: true })
    }));
    expect(response.status).toBe(202);
    expect(mocks.after).not.toHaveBeenCalled();
    expect(mocks.reserveStorefrontGenerationSlot).not.toHaveBeenCalled();
  });

  it("records background failures without returning provider error details", async () => {
    mocks.auth.mockResolvedValue({ userId: "user_123" });
    mocks.generateStorefront.mockRejectedValue(new Error("private provider diagnostics"));
    const { POST } = await import("@/app/api/storefronts/route");
    await POST(new NextRequest("https://vibe.example/api/storefronts", {
      method: "POST", body: JSON.stringify({ idea: pendingJob.idea, background: true })
    }));
    await mocks.after.mock.calls[0][0]();
    expect(mocks.releaseStorefrontGenerationSlot).toHaveBeenCalledWith("generation-slot-id");
    expect(mocks.finishGenerationJob).toHaveBeenCalledWith("job-id", { error: "Unable to generate this storefront. Please try again." });
  });

  it("reads status only for the authenticated owner and does not cache it", async () => {
    mocks.auth.mockResolvedValue({ userId: "user_123" });
    mocks.getLatestGenerationJob.mockResolvedValue(pendingJob);
    const { GET } = await import("@/app/api/storefront-jobs/route");
    const response = await GET();
    expect(mocks.getLatestGenerationJob).toHaveBeenCalledWith("user_123");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.json()).toEqual({ job: pendingJob });
  });

  it("rejects unauthenticated job recovery", async () => {
    mocks.auth.mockResolvedValue({ userId: null });
    const { GET } = await import("@/app/api/storefront-jobs/route");
    expect((await GET()).status).toBe(401);
    expect(mocks.getLatestGenerationJob).not.toHaveBeenCalled();
  });

  it("generates and persists a storefront for the Clerk user", async () => {
    mocks.auth.mockResolvedValue({ userId: "user_123" });
    mocks.generateStorefront.mockResolvedValue(generatedStorefront());
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
    expect(mocks.listStorefrontsForOwner).toHaveBeenCalledWith("user_123");
    expect(mocks.checkStorefrontGenerationRateLimit).toHaveBeenCalledWith(
      "user_123"
    );
    expect(mocks.reserveStorefrontGenerationSlot).toHaveBeenCalledWith(
      "user_123"
    );
    expect(mocks.buildStorefrontSlug).toHaveBeenCalledWith("Brooklyn Ember Co.");
    expect(mocks.generateProductImage).toHaveBeenCalledWith(
      {
        content: sampleStorefrontContent,
        idea: "small-batch hot sauce from Brooklyn",
        slug: "brooklyn-ember-co-image123"
      }
    );
    expect(mocks.createStorefront).toHaveBeenCalledWith({
      ownerClerkUserId: "user_123",
      idea: "small-batch hot sauce from Brooklyn",
      content: sampleStorefrontContentWithImage,
      generationCost: expect.objectContaining({
        currency: "USD",
        totalUsd: expect.any(Number)
      }),
      slug: "brooklyn-ember-co-image123"
    });
    expect(payload.shareUrl).toBe(
      "https://vibe.example/s/brooklyn-ember-co-image123"
    );
    expect(payload).not.toHaveProperty("usageBudget");
    expect(payload.usageCost).toMatchObject({
      currency: "USD",
      imageUsd: expect.any(Number),
      isEstimate: true,
      textUsd: expect.any(Number),
      totalUsd: expect.any(Number)
    });
    expect(payload.storefront.generation_cost).toMatchObject(
      payload.usageCost
    );
    expect(mocks.completeStorefrontGenerationSlot).toHaveBeenCalledWith({
      reservationId: "generation-slot-id",
      storefrontId: "storefront-id"
    });
    expect(mocks.releaseStorefrontGenerationSlot).not.toHaveBeenCalled();
  });

  it("accepts product idea prompts longer than the previous 220 character cap", async () => {
    const longIdea = [
      "A modular launch kit for indie founders that turns messy notes, customer interview clips, competitor research, pricing guesses, and half-written product positioning into a clean storefront concept.",
      "It should preserve the founder's raw language, surface assumptions, and make the first offer feel concrete enough to share."
    ].join(" ");

    mocks.auth.mockResolvedValue({ userId: "user_123" });
    mocks.createStorefront.mockResolvedValue({
      id: "storefront-id",
      owner_clerk_user_id: "user_123",
      anonymous_session_id: null,
      slug: "brooklyn-ember-co-image123",
      idea: longIdea,
      content: sampleStorefrontContentWithImage,
      published: true,
      created_at: "2026-04-23T00:00:00.000Z",
      updated_at: "2026-04-23T00:00:00.000Z"
    });
    const { POST } = await import("@/app/api/storefronts/route");
    const request = new NextRequest("https://vibe.example/api/storefronts", {
      method: "POST",
      body: JSON.stringify({ idea: longIdea })
    });

    const response = await POST(request);

    expect(response.status).toBe(201);
    expect(longIdea.length).toBeGreaterThan(220);
    expect(mocks.generateStorefront).toHaveBeenCalledWith(longIdea);
    expect(mocks.createStorefront).toHaveBeenCalledWith(
      expect.objectContaining({
        idea: longIdea
      })
    );
  });

  it("rejects blocked Clerk user prompts before generation", async () => {
    mocks.auth.mockResolvedValue({ userId: "user_123" });
    const { POST } = await import("@/app/api/storefronts/route");
    const request = new NextRequest("https://vibe.example/api/storefronts", {
      method: "POST",
      body: JSON.stringify({ idea: "Pornhub traffic analytics dashboard" })
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload).toEqual({ error: contentCannotBeGenerated });
    expect(mocks.getStorefrontByOwnerAndIdea).not.toHaveBeenCalled();
    expect(mocks.listStorefrontsForOwner).not.toHaveBeenCalled();
    expect(mocks.reserveStorefrontGenerationSlot).not.toHaveBeenCalled();
    expect(mocks.generateStorefront).not.toHaveBeenCalled();
    expect(mocks.generateProductImage).not.toHaveBeenCalled();
    expect(mocks.createStorefront).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated generation before creating work", async () => {
    mocks.auth.mockResolvedValue({ userId: null });
    const { POST } = await import("@/app/api/storefronts/route");
    const request = new NextRequest("https://vibe.example/api/storefronts", {
      method: "POST",
      body: JSON.stringify({ idea: "small-batch hot sauce from Brooklyn" })
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload).toEqual({ error: "Sign in to generate a storefront." });
    expect(mocks.getStorefrontByOwnerAndIdea).not.toHaveBeenCalled();
    expect(mocks.listStorefrontsForOwner).not.toHaveBeenCalled();
    expect(mocks.reserveStorefrontGenerationSlot).not.toHaveBeenCalled();
    expect(mocks.generateStorefront).not.toHaveBeenCalled();
    expect(mocks.generateProductImage).not.toHaveBeenCalled();
    expect(mocks.createStorefront).not.toHaveBeenCalled();
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("rejects blocked generated content before image generation or save", async () => {
    mocks.auth.mockResolvedValue({ userId: "user_123" });
    mocks.generateStorefront.mockResolvedValue(
      generatedStorefront({
        ...sampleStorefrontContent,
        tagline: "N S F W poster drops for collectors."
      })
    );
    const { POST } = await import("@/app/api/storefronts/route");
    const request = new NextRequest("https://vibe.example/api/storefronts", {
      method: "POST",
      body: JSON.stringify({ idea: "limited-run poster subscription boxes" })
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload).toEqual({ error: contentCannotBeGenerated });
    expect(mocks.reserveStorefrontGenerationSlot).toHaveBeenCalledWith(
      "user_123"
    );
    expect(mocks.generateStorefront).toHaveBeenCalledWith(
      "limited-run poster subscription boxes"
    );
    expect(mocks.buildStorefrontSlug).not.toHaveBeenCalled();
    expect(mocks.generateProductImage).not.toHaveBeenCalled();
    expect(mocks.createStorefront).not.toHaveBeenCalled();
    expect(mocks.releaseStorefrontGenerationSlot).toHaveBeenCalledWith(
      "generation-slot-id"
    );
    expect(mocks.completeStorefrontGenerationSlot).not.toHaveBeenCalled();
  });

  it("retries product image generation and saves the storefront when a retry succeeds", async () => {
    mocks.auth.mockResolvedValue({ userId: "user_123" });
    mocks.generateStorefront.mockResolvedValue(generatedStorefront());
    mocks.generateProductImage
      .mockRejectedValueOnce(
        new Error("Unable to generate product image: upstream timeout")
      )
      .mockRejectedValueOnce(
        new Error("Unable to generate product image: upstream timeout")
      )
      .mockResolvedValueOnce(generatedProductImage);
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
      generationCost: expect.objectContaining({
        currency: "USD",
        totalUsd: expect.any(Number)
      }),
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
    expect(mocks.listStorefrontsForOwner).not.toHaveBeenCalled();
    expect(mocks.reserveStorefrontGenerationSlot).not.toHaveBeenCalled();
    expect(mocks.generateStorefront).not.toHaveBeenCalled();
    expect(mocks.generateProductImage).not.toHaveBeenCalled();
    expect(mocks.createStorefront).not.toHaveBeenCalled();
    expect(payload).toMatchObject({
      storefront: existingStorefront,
      shareUrl: "https://vibe.example/s/brooklyn-ember-co-abc123",
      status: "existing_prompt_storefront"
    });
  });

  it("allows admins past the account cap without consuming generation slots", async () => {
    mocks.auth.mockResolvedValue({ userId: "admin_user" });
    mocks.isCurrentUserAdmin.mockResolvedValue(true);
    mocks.listStorefrontsForOwner.mockResolvedValue(Array(6).fill({ id: "existing" }));
    mocks.reserveStorefrontGenerationSlot.mockResolvedValue(null);
    mocks.createStorefront.mockResolvedValue({
      id: "admin-storefront", slug: "admin-storefront", content: sampleStorefrontContent
    });
    const { POST } = await import("@/app/api/storefronts/route");
    const response = await POST(new NextRequest("https://vibe.example/api/storefronts", {
      method: "POST",
      body: JSON.stringify({ idea: "tiny lamp kits for renters" })
    }));

    expect(response.status).toBe(201);
    expect(mocks.createStorefront).toHaveBeenCalledWith(expect.objectContaining({
      ownerClerkUserId: "admin_user"
    }));
    expect(mocks.reserveStorefrontGenerationSlot).not.toHaveBeenCalled();
    expect(mocks.completeStorefrontGenerationSlot).not.toHaveBeenCalled();
    expect(mocks.checkStorefrontGenerationRateLimit).toHaveBeenCalledWith("admin_user");
  });

  it("blocks a sixth different storefront for the same Clerk user", async () => {
    const existingStorefront = {
      id: "storefront-id",
      owner_clerk_user_id: "user_123",
      anonymous_session_id: null,
      slug: "guest-hot-sauce-abc123",
      idea: "small-batch hot sauce from Brooklyn",
      content: sampleStorefrontContent,
      published: true,
      created_at: "2026-04-23T00:00:00.000Z",
      updated_at: "2026-04-23T00:00:00.000Z"
    };

    mocks.auth.mockResolvedValue({ userId: "user_123" });
    mocks.listStorefrontsForOwner.mockResolvedValue([
      existingStorefront,
      {
        ...existingStorefront,
        id: "storefront-id-2",
        slug: "desk-lamp-kits-def456"
      },
      {
        ...existingStorefront,
        id: "storefront-id-3",
        slug: "trail-snacks-ghi789"
      },
      {
        ...existingStorefront,
        id: "storefront-id-4",
        slug: "carryall-jkl012"
      },
      {
        ...existingStorefront,
        id: "storefront-id-5",
        slug: "starter-kit-mno345"
      }
    ]);
    const { POST } = await import("@/app/api/storefronts/route");
    const request = new NextRequest("https://vibe.example/api/storefronts", {
      method: "POST",
      body: JSON.stringify({ idea: "tiny lamp kits for renters" })
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(429);
    expect(payload).toMatchObject({
      error: "Generation is currently limited to 5 storefronts per account.",
      storefront: existingStorefront,
      shareUrl: "https://vibe.example/s/guest-hot-sauce-abc123",
      status: "generation_quota_exceeded"
    });
    expect(mocks.getStorefrontByOwnerAndIdea).toHaveBeenCalledWith({
      ownerClerkUserId: "user_123",
      idea: "tiny lamp kits for renters"
    });
    expect(mocks.listStorefrontsForOwner).toHaveBeenCalledWith("user_123");
    expect(mocks.checkStorefrontGenerationRateLimit).not.toHaveBeenCalled();
    expect(mocks.reserveStorefrontGenerationSlot).not.toHaveBeenCalled();
    expect(mocks.generateStorefront).not.toHaveBeenCalled();
    expect(mocks.generateProductImage).not.toHaveBeenCalled();
    expect(mocks.createStorefront).not.toHaveBeenCalled();
  });

  it("rate limits signed-in generation before reserving a slot", async () => {
    mocks.auth.mockResolvedValue({ userId: "user_123" });
    mocks.checkStorefrontGenerationRateLimit.mockReturnValue({
      allowed: false,
      retryAfterSeconds: 120
    });
    const { POST } = await import("@/app/api/storefronts/route");
    const request = new NextRequest("https://vibe.example/api/storefronts", {
      method: "POST",
      body: JSON.stringify({ idea: "tiny lamp kits for renters" })
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("120");
    expect(payload).toEqual({
      error: "Too many generation attempts. Try again shortly."
    });
    expect(mocks.reserveStorefrontGenerationSlot).not.toHaveBeenCalled();
    expect(mocks.generateStorefront).not.toHaveBeenCalled();
    expect(mocks.generateProductImage).not.toHaveBeenCalled();
    expect(mocks.createStorefront).not.toHaveBeenCalled();
  });

  it("blocks generation when a durable slot already exists", async () => {
    mocks.auth.mockResolvedValue({ userId: "user_123" });
    mocks.reserveStorefrontGenerationSlot.mockResolvedValue(null);
    const { POST } = await import("@/app/api/storefronts/route");
    const request = new NextRequest("https://vibe.example/api/storefronts", {
      method: "POST",
      body: JSON.stringify({ idea: "tiny lamp kits for renters" })
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(429);
    expect(payload).toEqual({
      error: "Generation is currently limited to 5 storefronts per account.",
      status: "generation_quota_exceeded"
    });
    expect(mocks.reserveStorefrontGenerationSlot).toHaveBeenCalledWith(
      "user_123"
    );
    expect(mocks.generateStorefront).not.toHaveBeenCalled();
    expect(mocks.generateProductImage).not.toHaveBeenCalled();
    expect(mocks.createStorefront).not.toHaveBeenCalled();
  });

  it("saves the storefront without an image when product image retries are exhausted", async () => {
    mocks.auth.mockResolvedValue({ userId: "user_123" });
    mocks.generateStorefront.mockResolvedValue(generatedStorefront());
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
      generationCost: expect.objectContaining({
        currency: "USD",
        totalUsd: expect.any(Number)
      }),
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
    expect(mocks.completeStorefrontGenerationSlot).toHaveBeenCalledWith({
      reservationId: "generation-slot-id",
      storefrontId: "storefront-id"
    });
  });

  it("deletes an uploaded product image if the database insert fails", async () => {
    mocks.auth.mockResolvedValue({ userId: "user_123" });
    mocks.generateStorefront.mockResolvedValue(generatedStorefront());
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
    expect(mocks.releaseStorefrontGenerationSlot).toHaveBeenCalledWith(
      "generation-slot-id"
    );
    expect(mocks.completeStorefrontGenerationSlot).not.toHaveBeenCalled();
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
