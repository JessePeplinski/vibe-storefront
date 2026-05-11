import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sampleStorefrontContent } from "@/lib/storefront-schema";

const mocks = vi.hoisted(() => ({
  createSupabaseServiceClient: vi.fn(),
  deleteRows: vi.fn(),
  deleteEq: vi.fn(),
  deleteIs: vi.fn(),
  deleteLt: vi.fn(),
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
      delete: mocks.deleteRows,
      insert: mocks.insert
    });
    mocks.deleteRows.mockReturnValue({
      eq: mocks.deleteEq
    });
    mocks.deleteEq.mockReturnValue({
      eq: mocks.deleteEq,
      is: mocks.deleteIs
    });
    mocks.deleteIs.mockReturnValue({
      lt: mocks.deleteLt
    });
    mocks.deleteLt.mockResolvedValue({ error: null });
    mocks.insert.mockReturnValue({
      select: mocks.select
    });
    mocks.select.mockReturnValue({
      single: mocks.single
    });
  });

  afterEach(() => {
    vi.useRealTimers();
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

  it("releases stale pending signed-in generation slots before reserving", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-11T15:15:00.000Z"));
    mocks.single.mockResolvedValue({
      data: { id: "generation-slot-1" },
      error: null
    });

    const { reserveStorefrontGenerationSlot } = await import("@/lib/storefronts");
    const reservation = await reserveStorefrontGenerationSlot("user_123");

    expect(reservation).toEqual({ id: "generation-slot-1" });
    expect(mocks.deleteEq).toHaveBeenNthCalledWith(
      1,
      "owner_clerk_user_id",
      "user_123"
    );
    expect(mocks.deleteEq).toHaveBeenNthCalledWith(2, "status", "pending");
    expect(mocks.deleteIs).toHaveBeenCalledWith("storefront_id", null);
    expect(mocks.deleteLt).toHaveBeenCalledWith(
      "created_at",
      "2026-05-11T15:05:00.000Z"
    );
    expect(mocks.deleteRows.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.insert.mock.invocationCallOrder[0]
    );
  });

  it("does not reserve a slot if stale slot cleanup fails", async () => {
    mocks.deleteLt.mockResolvedValue({
      data: null,
      error: { message: "database unavailable" }
    });

    const { reserveStorefrontGenerationSlot } = await import("@/lib/storefronts");

    await expect(
      reserveStorefrontGenerationSlot("user_123")
    ).rejects.toThrow("Unable to release stale generation slots");
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("falls back when the remote slot constraint still allows only three slots", async () => {
    mocks.single
      .mockResolvedValueOnce({
        data: null,
        error: {
          code: "23505",
          message: "duplicate key value violates unique constraint"
        }
      })
      .mockResolvedValueOnce({
        data: null,
        error: {
          code: "23505",
          message: "duplicate key value violates unique constraint"
        }
      })
      .mockResolvedValueOnce({
        data: null,
        error: {
          code: "23505",
          message: "duplicate key value violates unique constraint"
        }
      })
      .mockResolvedValueOnce({
        data: null,
        error: {
          code: "23514",
          message:
            'new row for relation "storefront_generation_slots" violates check constraint "storefront_generation_slots_slot_number_check"'
        }
      });

    const {
      LEGACY_GENERATION_SLOT_RESERVATION_ID,
      reserveStorefrontGenerationSlot
    } = await import("@/lib/storefronts");
    const reservation = await reserveStorefrontGenerationSlot("user_123");

    expect(reservation).toEqual({
      id: LEGACY_GENERATION_SLOT_RESERVATION_ID
    });
    expect(mocks.insert).toHaveBeenCalledTimes(4);
    expect(mocks.insert).toHaveBeenNthCalledWith(
      4,
      expect.objectContaining({
        owner_clerk_user_id: "user_123",
        slot_number: 4
      })
    );
  });

  it("does not write slot state for legacy schema reservations", async () => {
    const {
      completeStorefrontGenerationSlot,
      LEGACY_GENERATION_SLOT_RESERVATION_ID,
      releaseStorefrontGenerationSlot
    } = await import("@/lib/storefronts");

    await completeStorefrontGenerationSlot({
      reservationId: LEGACY_GENERATION_SLOT_RESERVATION_ID,
      storefrontId: "storefront-id"
    });
    await releaseStorefrontGenerationSlot(LEGACY_GENERATION_SLOT_RESERVATION_ID);

    expect(mocks.from).not.toHaveBeenCalled();
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
    expect(mocks.insert).toHaveBeenCalledTimes(5);
    expect(mocks.insert).toHaveBeenNthCalledWith(
      5,
      expect.objectContaining({
        owner_clerk_user_id: "user_123",
        slot_number: 5
      })
    );
  });
});
