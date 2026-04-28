import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  sampleStorefrontContent,
  type StorefrontContent
} from "@/lib/storefront-schema";

const mocks = vi.hoisted(() => ({
  getPublicStorefrontBySlug: vi.fn()
}));

vi.mock("@/lib/storefronts", () => ({
  getPublicStorefrontBySlug: mocks.getPublicStorefrontBySlug
}));

const productImage = {
  alt: "The Borough Blend product image for Brooklyn Ember Co.",
  generatedAt: "2026-04-24T00:00:00.000Z",
  model: "gpt-image-2",
  storagePath: "storefronts/brooklyn-ember-co-abc123/product.webp",
  url: "https://supabase.example/storage/v1/object/public/storefront-product-images/storefronts/brooklyn-ember-co-abc123/product.webp"
};

const sampleStorefrontContentWithImage = {
  ...sampleStorefrontContent,
  product: {
    ...sampleStorefrontContent.product,
    image: productImage
  }
};

const darkUnreadableStorefrontContent: StorefrontContent = {
  ...sampleStorefrontContent,
  name: "Rewind Relics",
  tagline: "Movie and game memories you can hold onto.",
  hero: {
    ...sampleStorefrontContent.hero,
    body: "Shop curated memorabilia, display-ready collectibles, and gift-worthy throwbacks inspired by the films, arcades, and console legends Gen X grew up with."
  },
  theme: {
    mood: "Cinematic retro with arcade energy",
    appearance: {
      radius: "sharp",
      surface: "outlined",
      treatment: "bold"
    },
    palette: {
      background: "#111827",
      surface: "#F9FAFB",
      primary: "#B91C1C",
      secondary: "#1D4ED8",
      accent: "#F59E0B",
      text: "#111827"
    }
  }
};

describe("public storefront page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_APP_URL = "https://vibe.example";
    mocks.getPublicStorefrontBySlug.mockResolvedValue({
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
  });

  it("renders a saved generated product image on the public storefront", async () => {
    mocks.getPublicStorefrontBySlug.mockResolvedValueOnce({
      id: "storefront-id",
      owner_clerk_user_id: "user_123",
      anonymous_session_id: null,
      slug: "brooklyn-ember-co-abc123",
      idea: "small-batch hot sauce from Brooklyn",
      content: sampleStorefrontContentWithImage,
      published: true,
      created_at: "2026-04-23T00:00:00.000Z",
      updated_at: "2026-04-23T00:00:00.000Z"
    });
    const Page = (await import("@/app/s/[slug]/page")).default;

    render(
      await Page({
        params: Promise.resolve({ slug: "brooklyn-ember-co-abc123" })
      })
    );

    expect(
      screen.getByRole("img", { name: productImage.alt })
    ).toBeInTheDocument();
  });

  it("renders saved public storefront content", async () => {
    const Page = (await import("@/app/s/[slug]/page")).default;

    render(
      await Page({
        params: Promise.resolve({ slug: "brooklyn-ember-co-abc123" })
      })
    );

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: sampleStorefrontContent.product.name
      })
    ).toBeInTheDocument();
    expect(screen.getByText(sampleStorefrontContent.hero.body)).toBeInTheDocument();
    expect(screen.getByText("Reserve a bottle")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Built with vibe-storefront.com" })
    ).toHaveAttribute("href", "https://vibe-storefront.com");
    expect(screen.getByText("Source prompt: small-batch hot sauce from Brooklyn")).toBeInTheDocument();
    expect(screen.queryByText(/vibe storefront v2/i)).not.toBeInTheDocument();
    expect(screen.queryByText("background")).not.toBeInTheDocument();
    expect(screen.queryByText("#f7efe5")).not.toBeInTheDocument();
  });

  it("renders product navigation with a Buy now checkout trigger", async () => {
    const Page = (await import("@/app/s/[slug]/page")).default;

    render(
      await Page({
        params: Promise.resolve({ slug: "brooklyn-ember-co-abc123" })
      })
    );

    const nav = screen.getByRole("navigation");

    expect(
      within(nav).getByText(sampleStorefrontContent.product.name)
    ).toBeInTheDocument();
    expect(
      within(nav).getByRole("button", { name: /buy now/i })
    ).toBeInTheDocument();
  });

  it("normalizes unreadable dark palettes on public storefronts", async () => {
    mocks.getPublicStorefrontBySlug.mockResolvedValueOnce({
      id: "storefront-id",
      owner_clerk_user_id: "user_123",
      anonymous_session_id: null,
      slug: "rewind-relics-ppapx8",
      idea: "nostalgic memorabilia gifts",
      content: darkUnreadableStorefrontContent,
      published: true,
      created_at: "2026-04-27T00:00:00.000Z",
      updated_at: "2026-04-27T00:00:00.000Z"
    });
    const Page = (await import("@/app/s/[slug]/page")).default;

    render(
      await Page({
        params: Promise.resolve({ slug: "rewind-relics-ppapx8" })
      })
    );

    const article = screen.getByRole("article");

    expect(article.style.getPropertyValue("--sf-bg")).toBe("#111827");
    expect(article.style.getPropertyValue("--sf-text")).toBe("#f8fafc");
    expect(article.style.getPropertyValue("--sf-muted")).not.toBe("#111827");
    expect(article.style.getPropertyValue("--sf-support")).toBe("#F59E0B");
    expect(
      screen.getByText(darkUnreadableStorefrontContent.hero.body)
    ).toHaveClass("text-[var(--sf-muted)]");
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

  it("opens the same mock checkout modal from the Buy now nav CTA", async () => {
    const Page = (await import("@/app/s/[slug]/page")).default;

    render(
      await Page({
        params: Promise.resolve({ slug: "brooklyn-ember-co-abc123" })
      })
    );

    fireEvent.click(
      within(screen.getByRole("navigation")).getByRole("button", {
        name: /buy now/i
      })
    );

    const checkout = screen.getByRole("dialog", { name: "Checkout preview" });
    expect(checkout).toBeInTheDocument();
    expect(within(checkout).getByText("The Borough Blend")).toBeInTheDocument();
    expect(within(checkout).getByText("$14")).toBeInTheDocument();
  });

  it("uses storefront content for public share metadata", async () => {
    const { generateMetadata } = await import("@/app/s/[slug]/page");

    await expect(
      generateMetadata({
        params: Promise.resolve({ slug: "brooklyn-ember-co-abc123" })
      })
    ).resolves.toMatchObject({
      title: "The Borough Blend | Vibe Storefront",
      description: sampleStorefrontContent.tagline,
      openGraph: {
        title: "The Borough Blend",
        description: sampleStorefrontContent.tagline,
        siteName: "Vibe Storefront",
        type: "website",
        url: "https://vibe.example/s/brooklyn-ember-co-abc123"
      },
      twitter: {
        card: "summary",
        title: "The Borough Blend",
        description: sampleStorefrontContent.tagline
      }
    });
  });

  it("uses generated product images for public share metadata", async () => {
    mocks.getPublicStorefrontBySlug.mockResolvedValueOnce({
      id: "storefront-id",
      owner_clerk_user_id: "user_123",
      anonymous_session_id: null,
      slug: "brooklyn-ember-co-abc123",
      idea: "small-batch hot sauce from Brooklyn",
      content: sampleStorefrontContentWithImage,
      published: true,
      created_at: "2026-04-23T00:00:00.000Z",
      updated_at: "2026-04-23T00:00:00.000Z"
    });
    const { generateMetadata } = await import("@/app/s/[slug]/page");

    await expect(
      generateMetadata({
        params: Promise.resolve({ slug: "brooklyn-ember-co-abc123" })
      })
    ).resolves.toMatchObject({
      openGraph: {
        images: [
          {
            alt: productImage.alt,
            url: productImage.url
          }
        ]
      },
      twitter: {
        card: "summary_large_image",
        images: [productImage.url]
      }
    });
  });
});
