import {
  fireEvent,
  render,
  screen
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  sampleStorefrontContent,
  type StorefrontRecord
} from "@/lib/storefront-schema";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  listPublishedStorefronts: vi.fn(),
  openSignIn: vi.fn()
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mocks.auth
}));

vi.mock("@clerk/nextjs", () => ({
  useClerk: () => ({
    openSignIn: mocks.openSignIn
  })
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

function exampleStorefront(
  overrides: Partial<StorefrontRecord> = {}
): StorefrontRecord {
  return {
    id: "example-storefront-id",
    owner_clerk_user_id: null,
    anonymous_session_id: "00000000-0000-4000-8000-000000000001",
    slug: "ember-table-abc123",
    idea: "tableside coffee heaters",
    content: {
      ...sampleStorefrontContent,
      name: "Ember Table",
      product: {
        ...sampleStorefrontContent.product,
        image: productImage
      },
      tagline: "Generated commerce pages that make product ideas feel real."
    },
    published: true,
    created_at: "2026-04-23T00:00:00.000Z",
    updated_at: "2026-04-23T00:00:00.000Z",
    ...overrides
  };
}

const latestStorefronts = [
  exampleStorefront(),
  exampleStorefront({
    id: "example-storefront-id-2",
    idea: "modular desk planters",
    slug: "desk-bloom-def456",
    content: {
      ...sampleStorefrontContent,
      name: "Desk Bloom",
      tagline: "Tiny green spaces for focused workdays."
    }
  }),
  exampleStorefront({
    id: "example-storefront-id-3",
    idea: "plant-based trail snacks",
    slug: "trail-crave-ghi789",
    content: {
      ...sampleStorefrontContent,
      name: "Trail Crave",
      tagline: "Plant-powered snack packs for weekend hikers."
    }
  })
];

const typedIdea = "insulated lunch bowls for hybrid workers";
const ideaPlaceholder =
  "Refillable shampoo bars for busy travelers, modular desk lamp kits for tiny apartments, or plant-based trail snacks for weekend hikers.";
const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL;

function createStorageMock(): Storage {
  const store = new Map<string, string>();

  return {
    get length() {
      return store.size;
    },
    clear: vi.fn(() => store.clear()),
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    key: vi.fn((index: number) => Array.from(store.keys())[index] ?? null),
    removeItem: vi.fn((key: string) => {
      store.delete(key);
    }),
    setItem: vi.fn((key: string, value: string) => {
      store.set(key, value);
    })
  } as Storage;
}

describe("home page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_APP_URL = "https://vibe.example";
    mocks.auth.mockResolvedValue({ userId: null });
    mocks.listPublishedStorefronts.mockResolvedValue(latestStorefronts);
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: createStorageMock()
    });
  });

  afterEach(() => {
    if (originalAppUrl) {
      process.env.NEXT_PUBLIC_APP_URL = originalAppUrl;
    } else {
      delete process.env.NEXT_PUBLIC_APP_URL;
    }
    vi.unstubAllGlobals();
  });

  it("routes signed-out generation intent through sign-in", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const homePageModule = await import("@/app/(app)/page");
    const Page = homePageModule.default;

    expect(homePageModule.metadata).toMatchObject({
      alternates: {
        canonical: "https://vibe.example/"
      },
      openGraph: {
        images: [
          expect.objectContaining({
            height: 630,
            url: "https://vibe.example/opengraph-image",
            width: 1200
          })
        ]
      },
      twitter: {
        card: "summary_large_image",
        images: [
          expect.objectContaining({
            url: "https://vibe.example/opengraph-image"
          })
        ]
      }
    });

    render(await Page());

    expect(mocks.listPublishedStorefronts).toHaveBeenCalledWith(3);
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Validate product ideas with a storefront."
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Turn a raw product concept into a basic landing page. Powered by GPT-5.5 and GPT Image 2."
      )
    ).toBeInTheDocument();
    expect(screen.queryByText(/Models:/)).not.toBeInTheDocument();
    expect(
      screen.getByText("Generate your storefront")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /see all storefronts/i })
    ).toHaveAttribute("href", "/storefronts");
    expect(
      screen.getByRole("link", { name: /browse gallery/i })
    ).toHaveAttribute("href", "/storefronts");
    expect(
      screen.getAllByRole("link", { name: "Open storefront" }).map((link) =>
        link.getAttribute("href")
      )
    ).toEqual([
      "/s/ember-table-abc123",
      "/s/desk-bloom-def456",
      "/s/trail-crave-ghi789"
    ]);
    expect(screen.getByText("Ember Table")).toBeInTheDocument();
    expect(screen.getByText("Desk Bloom")).toBeInTheDocument();
    expect(screen.getByText("Trail Crave")).toBeInTheDocument();
    expect(screen.queryByText("Generated example")).not.toBeInTheDocument();
    expect(screen.queryByText("Storefront canvas")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Generate your storefront")).toHaveValue("");
    expect(screen.getByLabelText("Generate your storefront")).toHaveAttribute(
      "placeholder",
      ideaPlaceholder
    );
    expect(
      screen.getByRole("button", { name: "Sign in to generate" })
    ).not.toBeDisabled();
    expect(screen.getByText("Sign-in required")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Public generation is temporarily locked down. Sign in to generate up to 3 storefronts."
      )
    ).toBeInTheDocument();
    const jsonLd = JSON.parse(
      document.querySelector('script[type="application/ld+json"]')?.textContent ??
        "{}"
    );

    expect(jsonLd["@graph"]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ "@type": "WebSite" }),
        expect.objectContaining({ "@type": "WebApplication" }),
        expect.objectContaining({ "@type": "WebPage" })
      ])
    );

    fireEvent.change(screen.getByLabelText("Generate your storefront"), {
      target: { value: typedIdea }
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign in to generate" }));

    expect(mocks.openSignIn).toHaveBeenCalledTimes(1);
    expect(window.localStorage.setItem).toHaveBeenCalledWith(
      "vibe-storefront:draft-idea",
      typedIdea
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
