import { beforeEach, describe, expect, it, vi } from "vitest";
import { sampleStorefrontContent } from "@/lib/storefront-schema";

const mocks = vi.hoisted(() => ({
  createSupabaseServiceClient: vi.fn(),
  from: vi.fn(),
  single: vi.fn(),
  insert: vi.fn(),
  select: vi.fn()
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServiceClient: mocks.createSupabaseServiceClient
}));

describe("storefront persistence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createSupabaseServiceClient.mockReturnValue({
      from: mocks.from
    });
    mocks.from.mockReturnValue({
      insert: mocks.insert
    });
    mocks.insert.mockReturnValue({
      select: mocks.select
    });
    mocks.select.mockReturnValue({
      single: mocks.single
    });
  });

  it("retries without generation cost when Supabase has stale schema cache", async () => {
    const row = {
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

    mocks.single
      .mockResolvedValueOnce({
        data: null,
        error: {
          message:
            "Could not find the 'generation_cost' column of 'storefronts' in the schema cache"
        }
      })
      .mockResolvedValueOnce({ data: row, error: null });

    const { createStorefront } = await import("@/lib/storefronts");
    const storefront = await createStorefront({
      ownerClerkUserId: "user_123",
      idea: "small-batch hot sauce from Brooklyn",
      content: sampleStorefrontContent,
      generationCost: {
        currency: "USD",
        imageUsd: 0.031,
        isEstimate: true,
        textUsd: 0.008593,
        totalUsd: 0.039593,
        unavailableLineItems: []
      },
      slug: "brooklyn-ember-co-abc123"
    });

    expect(storefront).toEqual({
      ...row,
      generation_cost: null
    });
    expect(mocks.insert).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        generation_cost: expect.objectContaining({
          totalUsd: 0.039593
        })
      })
    );
    expect(mocks.insert).toHaveBeenNthCalledWith(
      2,
      expect.not.objectContaining({
        generation_cost: expect.anything()
      })
    );
  });

  it("reserves the first available signed-in generation slot", async () => {
    mocks.single
      .mockResolvedValueOnce({
        data: null,
        error: {
          code: "23505",
          message: "duplicate key value violates unique constraint"
        }
      })
      .mockResolvedValueOnce({
        data: { id: "generation-slot-2" },
        error: null
      });

    const { reserveStorefrontGenerationSlot } = await import("@/lib/storefronts");
    const reservation = await reserveStorefrontGenerationSlot("user_123");

    expect(reservation).toEqual({ id: "generation-slot-2" });
    expect(mocks.insert).toHaveBeenNthCalledWith(1, {
      owner_clerk_user_id: "user_123",
      slot_number: 1,
      status: "pending"
    });
    expect(mocks.insert).toHaveBeenNthCalledWith(2, {
      owner_clerk_user_id: "user_123",
      slot_number: 2,
      status: "pending"
    });
  });

  it("returns null when every signed-in generation slot is already reserved", async () => {
    mocks.single.mockResolvedValue({
      data: null,
      error: {
        code: "23505",
        message: "duplicate key value violates unique constraint"
      }
    });

    const { reserveStorefrontGenerationSlot } = await import("@/lib/storefronts");
    const reservation = await reserveStorefrontGenerationSlot("user_123");

    expect(reservation).toBeNull();
    expect(mocks.insert).toHaveBeenCalledTimes(3);
    expect(mocks.insert).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        owner_clerk_user_id: "user_123",
        slot_number: 3
      })
    );
  });
});
