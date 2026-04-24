import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { sampleStorefrontContent } from "@/lib/storefront-schema";
import type { StorefrontRecord } from "@/lib/storefront-schema";

const mocks = vi.hoisted(() => ({
  clerkClient: vi.fn(),
  getUserList: vi.fn(),
  listPublishedStorefronts: vi.fn()
}));

vi.mock("@clerk/nextjs/server", () => ({
  clerkClient: mocks.clerkClient
}));

vi.mock("@/lib/storefronts", () => ({
  listPublishedStorefronts: mocks.listPublishedStorefronts
}));

const productImage = {
  alt: "Ember Table product image for Ember Table",
  generatedAt: "2026-04-24T00:00:00.000Z",
  model: "gpt-image-2",
  storagePath: "storefronts/ember-table-abc123/product.webp",
  url: "https://supabase.example/storage/v1/object/public/storefront-product-images/storefronts/ember-table-abc123/product.webp"
};

function storefront(
  overrides: Partial<StorefrontRecord> = {}
): StorefrontRecord {
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

function storefrontContent(
  name: string,
  image?: StorefrontRecord["content"]["product"]["image"]
): StorefrontRecord["content"] {
  return {
    ...sampleStorefrontContent,
    name,
    product: {
      ...sampleStorefrontContent.product,
      image
    },
    tagline: `${name} makes generated commerce pages feel real.`
  };
}

describe("all storefronts page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.clerkClient.mockResolvedValue({
      users: {
        getUserList: mocks.getUserList
      }
    });
    mocks.getUserList.mockResolvedValue({
      data: [
        { id: "user_full", firstName: "Maya", lastName: "Chen" },
        { id: "user_partial", firstName: "Ava", lastName: null },
        { id: "user_blank", firstName: null, lastName: null }
      ]
    });
  });

  it("renders published storefronts with creator labels and creation dates", async () => {
    mocks.listPublishedStorefronts.mockResolvedValue([
      storefront({
        id: "full-name-id",
        owner_clerk_user_id: "user_full",
        slug: "ember-table-abc123",
        idea: "tableside coffee heaters",
        content: storefrontContent("Ember Table", productImage)
      }),
      storefront({
        id: "partial-name-id",
        owner_clerk_user_id: "user_partial",
        slug: "desk-bloom-def456",
        idea: "modular desk planters",
        content: storefrontContent("Desk Bloom"),
        created_at: "2026-04-22T00:00:00.000Z"
      }),
      storefront({
        id: "blank-name-id",
        owner_clerk_user_id: "user_blank",
        slug: "lamp-loom-ghi789",
        idea: "tiny lamp kits for renters",
        content: storefrontContent("Lamp Loom")
      }),
      storefront({
        id: "guest-id",
        owner_clerk_user_id: null,
        anonymous_session_id: "00000000-0000-4000-8000-000000000001",
        slug: "guest-sauce-jkl012",
        idea: "small-batch hot sauce from Brooklyn",
        content: storefrontContent("Guest Sauce")
      })
    ]);
    const Page = (await import("@/app/(app)/storefronts/page")).default;

    render(await Page());

    expect(
      screen.getByRole("heading", { level: 1, name: "All storefronts" })
    ).toBeInTheDocument();
    expect(mocks.getUserList).toHaveBeenCalledWith({
      limit: 3,
      userId: ["user_full", "user_partial", "user_blank"]
    });
    expect(screen.getByText("By Maya Chen")).toBeInTheDocument();
    expect(screen.getByText("By Ava")).toBeInTheDocument();
    expect(screen.getByText("By Signed-in user")).toBeInTheDocument();
    expect(screen.getByText("By guest")).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: productImage.alt })
    ).toBeInTheDocument();
    expect(screen.getAllByText("Created Apr 23, 2026")).toHaveLength(3);
    expect(screen.getByText("Created Apr 22, 2026")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Generate storefront" })
    ).toHaveAttribute("href", "/");
    expect(
      screen.getAllByRole("link", { name: "Open storefront" }).map((link) =>
        link.getAttribute("href")
      )
    ).toEqual([
      "/s/ember-table-abc123",
      "/s/desk-bloom-def456",
      "/s/lamp-loom-ghi789",
      "/s/guest-sauce-jkl012"
    ]);
  });

  it("renders an empty state without calling Clerk when there are no storefronts", async () => {
    mocks.listPublishedStorefronts.mockResolvedValue([]);
    const Page = (await import("@/app/(app)/storefronts/page")).default;

    render(await Page());

    expect(screen.getByText("No storefronts yet.")).toBeInTheDocument();
    expect(mocks.clerkClient).not.toHaveBeenCalled();
  });
});
