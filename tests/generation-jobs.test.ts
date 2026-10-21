import { beforeEach, describe, expect, it, vi } from "vitest";
import { sampleStorefrontContent } from "@/lib/storefront-schema";

const mocks = vi.hoisted(() => ({
  from: vi.fn(), select: vi.fn(), insert: vi.fn(), update: vi.fn(),
  eq: vi.fn(), in: vi.fn(), order: vi.fn(), limit: vi.fn(),
  maybeSingle: vi.fn(), single: vi.fn(),
  getStorefrontByOwnerAndIdea: vi.fn(), releaseStorefrontGenerationSlot: vi.fn(), completeStorefrontGenerationSlot: vi.fn()
}));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServiceClient: () => ({ from: mocks.from }) }));
vi.mock("@/lib/storefronts", () => ({
  getStorefrontByOwnerAndIdea: mocks.getStorefrontByOwnerAndIdea,
  releaseStorefrontGenerationSlot: mocks.releaseStorefrontGenerationSlot,
  completeStorefrontGenerationSlot: mocks.completeStorefrontGenerationSlot
}));

const row = {
  id: "job-id", owner_clerk_user_id: "user_123", idea: "travel cable organizer", status: "running",
  reservation_id: "quota-slot", storefront_id: null, warning: null, error: null,
  created_at: "2026-10-21T00:00:00Z", finished_at: null, expires_at: "2099-01-01T00:00:00Z"
};
const storefront = {
  id: "store-id", owner_clerk_user_id: "user_123", slug: "cable-cove", idea: row.idea,
  anonymous_session_id: null, content: sampleStorefrontContent, published: true,
  created_at: "2026-10-21T00:01:00Z", updated_at: "2026-10-21T00:01:00Z"
};

describe("persisted generation jobs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_APP_URL = "https://vibe.example";
    for (const method of ["from", "select", "insert", "update", "eq", "order", "limit"] as const) mocks[method].mockReturnValue(mocks);
    mocks.in.mockResolvedValue({ error: null });
    mocks.maybeSingle.mockResolvedValue({ data: row, error: null });
    mocks.getStorefrontByOwnerAndIdea.mockResolvedValue(null);
    mocks.releaseStorefrontGenerationSlot.mockResolvedValue(undefined);
    mocks.completeStorefrontGenerationSlot.mockResolvedValue(undefined);
  });

  it("scopes job reads to the owner and omits internal owner/quota fields", async () => {
    const { getLatestGenerationJob } = await import("@/lib/generation-jobs");
    const job = await getLatestGenerationJob("user_123");
    expect(mocks.eq).toHaveBeenCalledWith("owner_clerk_user_id", "user_123");
    expect(job).toMatchObject({ id: "job-id", status: "running" });
    expect(job).not.toHaveProperty("owner_clerk_user_id");
    expect(job).not.toHaveProperty("reservation_id");
  });

  it("turns expired jobs into retryable failures and releases unused quota", async () => {
    mocks.maybeSingle.mockResolvedValue({ data: { ...row, expires_at: "2000-01-01" }, error: null });
    const { getLatestGenerationJob } = await import("@/lib/generation-jobs");
    const job = await getLatestGenerationJob("user_123");
    expect(job).toMatchObject({ status: "failed", error: "Generation timed out. Please try again." });
    expect(mocks.releaseStorefrontGenerationSlot).toHaveBeenCalledWith("quota-slot");
    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({ status: "failed" }));
  });

  it("recovers a storefront saved before worker termination and completes its quota slot", async () => {
    mocks.maybeSingle.mockResolvedValue({ data: { ...row, expires_at: "2000-01-01" }, error: null });
    mocks.getStorefrontByOwnerAndIdea.mockResolvedValue(storefront);
    const { getLatestGenerationJob } = await import("@/lib/generation-jobs");
    const job = await getLatestGenerationJob("user_123");
    expect(job).toMatchObject({ status: "completed", result: { storefront, shareUrl: "https://vibe.example/s/cable-cove" } });
    expect(mocks.completeStorefrontGenerationSlot).toHaveBeenCalledWith({ reservationId: "quota-slot", storefrontId: "store-id" });
    expect(mocks.releaseStorefrontGenerationSlot).not.toHaveBeenCalled();
  });

  it("does not restore a deleted storefront from completed job history", async () => {
    mocks.maybeSingle.mockResolvedValue({ data: { ...row, status: "completed", storefront_id: null }, error: null });
    const { getLatestGenerationJob } = await import("@/lib/generation-jobs");
    expect(await getLatestGenerationJob("user_123")).toBeNull();
  });

  it("does not mistake a replacement storefront with the same idea for a deleted result", async () => {
    mocks.maybeSingle.mockResolvedValue({ data: { ...row, status: "completed", storefront_id: "deleted-id" }, error: null });
    mocks.getStorefrontByOwnerAndIdea.mockResolvedValue(storefront);
    const { getLatestGenerationJob } = await import("@/lib/generation-jobs");
    expect(await getLatestGenerationJob("user_123")).toBeNull();
  });

  it("claims only queued jobs and refuses a second worker", async () => {
    mocks.maybeSingle.mockResolvedValueOnce({ data: { id: "job-id" }, error: null }).mockResolvedValueOnce({ data: null, error: null });
    const { claimGenerationJob } = await import("@/lib/generation-jobs");
    expect(await claimGenerationJob("job-id", "quota-slot")).toBe(true);
    expect(await claimGenerationJob("job-id", "quota-slot")).toBe(false);
    expect(mocks.eq).toHaveBeenCalledWith("status", "queued");
  });
});
