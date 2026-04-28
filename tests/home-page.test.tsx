import {
  act,
  fireEvent,
  render,
  screen,
  waitFor
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
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

const productImageWarning =
  "Storefront created, but the product image could not be generated.";
const usageCost = {
  currency: "USD" as const,
  imageUsd: 0.05,
  isEstimate: true as const,
  textUsd: 0.006,
  totalUsd: 0.056,
  unavailableLineItems: []
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
    mocks.auth.mockResolvedValue({ userId: null });
    mocks.listPublishedStorefronts.mockResolvedValue(latestStorefronts);
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: createStorageMock()
    });
  });

  it("lets signed-out visitors generate from the hero and view the created storefront", async () => {
    const createdStorefront: StorefrontRecord = {
      id: "guest-storefront-id",
      owner_clerk_user_id: null,
      anonymous_session_id: "00000000-0000-4000-8000-000000000001",
      slug: "guest-hot-sauce-abc123",
      idea: "small-batch hot sauce from Brooklyn",
      content: sampleStorefrontContent,
      published: true,
      created_at: "2026-04-23T00:00:00.000Z",
      updated_at: "2026-04-23T00:00:00.000Z"
    };
    let resolveFetch!: (response: {
      ok: boolean;
      json: () => Promise<{
        storefront: typeof createdStorefront;
        shareUrl: string;
        status: "created";
        usageCost?: typeof usageCost;
        warning?: string;
      }>;
    }) => void;
    const fetchPromise = new Promise<{
      ok: boolean;
      json: () => Promise<{
        storefront: typeof createdStorefront;
        shareUrl: string;
        status: "created";
        usageCost?: typeof usageCost;
        warning?: string;
      }>;
    }>((resolve) => {
      resolveFetch = resolve;
    });
    const fetchMock = vi.fn().mockReturnValue(fetchPromise);
    vi.stubGlobal("fetch", fetchMock);
    const Page = (await import("@/app/(app)/page")).default;

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
      screen.getByRole("button", { name: "Generate storefront" })
    ).not.toBeDisabled();

    fireEvent.change(screen.getByLabelText("Generate your storefront"), {
      target: { value: typedIdea }
    });
    fireEvent.click(screen.getByRole("button", { name: "Generate storefront" }));

    expect(screen.queryByRole("group", { name: "Example product ideas" }))
      .not.toBeInTheDocument();
    expect(screen.getByLabelText("Generate your storefront")).toHaveValue(
      typedIdea
    );
    const generatingButton = await screen.findByRole("button", {
      name: /generating storefront/i
    });
    expect(generatingButton).toBeDisabled();
    expect(generatingButton).not.toHaveTextContent("0:00");

    const generationProgress = screen.getByRole("status", {
      name: "Generation progress"
    });
    expect(
      screen.getAllByRole("status", { name: "Generation progress" })
    ).toHaveLength(1);
    expect(generationProgress).toHaveTextContent("Step 1 of 4");
    expect(generationProgress).toHaveTextContent("Total 0:00");
    expect(generationProgress).toHaveTextContent("Draft storefront copy");
    expect(generationProgress).toHaveTextContent("Elapsed 0:00");
    expect(generationProgress).toHaveTextContent("Estimated 0:30-1:50");
    expect(generationProgress).toHaveTextContent("Usually takes 1-3 minutes");
    expect(screen.queryByText(/Estimated completion/i)).not.toBeInTheDocument();
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/storefronts",
        expect.objectContaining({
          body: JSON.stringify({ idea: typedIdea }),
          method: "POST"
        })
      );
    });

    await act(async () => {
      resolveFetch({
        ok: true,
        json: async () => ({
          storefront: createdStorefront,
          shareUrl: "https://vibe.example/s/guest-hot-sauce-abc123",
          status: "created",
          usageCost,
          warning: productImageWarning
        })
      });
      await fetchPromise;
    });

    expect(
      await screen.findByRole("link", { name: /view your storefront/i })
    ).toHaveAttribute("href", "/s/guest-hot-sauce-abc123");
    expect(screen.getByText(/Finished in \d+:\d{2}/)).toBeInTheDocument();
    expect(screen.getByText("This request cost about $0.06."))
      .toBeInTheDocument();
    expect(screen.getByText(productImageWarning)).toBeInTheDocument();
  });

  it("makes the existing guest storefront state explicit", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: vi.fn().mockResolvedValue({
        error:
          "This browser already generated Brooklyn Ember Co.; open it below or sign in to create more storefronts.",
        storefront: {
          id: "guest-storefront-id",
          owner_clerk_user_id: null,
          anonymous_session_id: "00000000-0000-4000-8000-000000000001",
          slug: "guest-hot-sauce-abc123",
          idea: "small-batch hot sauce from Brooklyn",
          content: sampleStorefrontContent,
          published: true,
          created_at: "2026-04-23T00:00:00.000Z",
          updated_at: "2026-04-23T00:00:00.000Z"
        },
        shareUrl: "https://vibe.example/s/guest-hot-sauce-abc123",
        status: "existing_guest_storefront"
      })
    });
    vi.stubGlobal("fetch", fetchMock);
    const Page = (await import("@/app/(app)/page")).default;

    render(await Page());
    fireEvent.change(screen.getByLabelText("Generate your storefront"), {
      target: { value: typedIdea }
    });
    fireEvent.click(screen.getByRole("button", { name: "Generate storefront" }));

    expect(
      await screen.findByText(
        "This browser already generated Brooklyn Ember Co.; open it below or sign in to create more storefronts."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText("Brooklyn Ember Co. is already ready.")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /open existing storefront/i })
    ).toHaveAttribute("href", "/s/guest-hot-sauce-abc123");
    expect(screen.getByText("No new API spend.")).toBeInTheDocument();
  });
});
