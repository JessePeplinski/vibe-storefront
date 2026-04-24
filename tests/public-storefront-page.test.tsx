import { fireEvent, render, screen, within } from "@testing-library/react";
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
    expect(
      screen.getByRole("link", { name: "Built with vibe-storefront.com" })
    ).toHaveAttribute("href", "https://vibe-storefront.com");
    expect(screen.getByText("Source prompt: small-batch hot sauce from Brooklyn")).toBeInTheDocument();
    expect(screen.queryByText("background")).not.toBeInTheDocument();
    expect(screen.queryByText("#f7efe5")).not.toBeInTheDocument();
  });

  it("opens a mock checkout modal from the landing page CTA", async () => {
    const Page = (await import("@/app/s/[slug]/page")).default;

    render(
      await Page({
        params: Promise.resolve({ slug: "brooklyn-ember-co-abc123" })
      })
    );

    fireEvent.click(screen.getByRole("button", { name: /reserve a bottle/i }));

    const checkout = screen.getByRole("dialog", { name: "Checkout preview" });
    expect(checkout).toBeInTheDocument();
    expect(within(checkout).getByText("The Borough Blend")).toBeInTheDocument();
    expect(within(checkout).getByText("$14")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Close checkout" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("uses storefront content for public share metadata", async () => {
    const { generateMetadata } = await import("@/app/s/[slug]/page");

    await expect(
      generateMetadata({
        params: Promise.resolve({ slug: "brooklyn-ember-co-abc123" })
      })
    ).resolves.toMatchObject({
      title: "Brooklyn Ember Co. | Vibe Storefront",
      description: sampleStorefrontContent.tagline,
      openGraph: {
        title: "Brooklyn Ember Co.",
        description: sampleStorefrontContent.tagline,
        siteName: "Vibe Storefront",
        type: "website",
        url: "https://vibe.example/s/brooklyn-ember-co-abc123"
      },
      twitter: {
        card: "summary",
        title: "Brooklyn Ember Co.",
        description: sampleStorefrontContent.tagline
      }
    });
  });
});
