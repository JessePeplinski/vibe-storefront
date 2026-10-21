import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { sampleStorefrontContent } from "@/lib/storefront-schema";
import type { StorefrontRecord } from "@/lib/storefront-schema";

const mocks = vi.hoisted(() => ({
  isCurrentUserAdmin: vi.fn(),
  auth: vi.fn(),
  listStorefrontsForOwner: vi.fn()
}));

vi.mock("@/lib/admin", () => ({
  isCurrentUserAdmin: mocks.isCurrentUserAdmin
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mocks.auth
}));

vi.mock("@/lib/storefronts", () => ({
  listStorefrontsForOwner: mocks.listStorefrontsForOwner
}));

vi.mock("@/components/storefront-studio", () => ({
  StorefrontStudio: ({
    initialStorefronts,
    isAdmin
  }: {
    initialStorefronts: StorefrontRecord[];
    isAdmin: boolean;
  }) => (
    <div data-testid="storefront-studio">
      Studio storefronts: {initialStorefronts.length}
      {isAdmin && " Admin enabled"}
    </div>
  )
}));

function storefront(): StorefrontRecord {
  return {
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
}

describe("dashboard page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isCurrentUserAdmin.mockResolvedValue(false);
  });

  it("renders the studio directly for signed-in users", async () => {
    mocks.auth.mockResolvedValue({ userId: "user_123" });
    mocks.listStorefrontsForOwner.mockResolvedValue([storefront()]);
    const Page = (await import("@/app/(app)/dashboard/page")).default;

    render(await Page());

    expect(mocks.listStorefrontsForOwner).toHaveBeenCalledWith("user_123");
    expect(
      screen.queryByRole("heading", {
        level: 1,
        name: "Build and share product storefronts."
      })
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Dashboard" }))
      .not.toBeInTheDocument();
    expect(screen.getByTestId("storefront-studio")).toHaveTextContent(
      "Studio storefronts: 1"
    );
  });

  it("passes server-resolved admin access to the studio", async () => {
    mocks.auth.mockResolvedValue({ userId: "admin_user" });
    mocks.isCurrentUserAdmin.mockResolvedValue(true);
    mocks.listStorefrontsForOwner.mockResolvedValue([]);
    const Page = (await import("@/app/(app)/dashboard/page")).default;

    render(await Page());
    expect(screen.getByTestId("storefront-studio")).toHaveTextContent("Admin enabled");
  });

  it("does not fetch storefronts when signed out", async () => {
    mocks.auth.mockResolvedValue({ userId: null });
    const Page = (await import("@/app/(app)/dashboard/page")).default;

    render(await Page());

    expect(mocks.listStorefrontsForOwner).not.toHaveBeenCalled();
    expect(screen.queryByRole("main")).not.toBeInTheDocument();
  });
});
