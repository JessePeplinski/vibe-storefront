import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StorefrontStudio } from "@/components/storefront-studio";
import { DRAFT_IDEA_STORAGE_KEY, STARTER_IDEAS } from "@/lib/studio-ideas";
import { sampleStorefrontContent } from "@/lib/storefront-schema";
import type { StorefrontRecord } from "@/lib/storefront-schema";

function storefront(overrides: Partial<StorefrontRecord> = {}): StorefrontRecord {
  return {
    id: "storefront-id",
    owner_clerk_user_id: "user_123",
    slug: "brooklyn-ember-co-abc123",
    idea: "small-batch hot sauce from Brooklyn",
    content: sampleStorefrontContent,
    published: true,
    created_at: "2026-04-23T00:00:00.000Z",
    updated_at: "2026-04-23T00:00:00.000Z",
    ...overrides
  };
}

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

describe("StorefrontStudio", () => {
  beforeEach(() => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: createStorageMock()
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("prefills a stored landing draft once", async () => {
    window.localStorage.setItem(
      DRAFT_IDEA_STORAGE_KEY,
      "solar-powered picnic coolers for city parks"
    );

    render(<StorefrontStudio />);

    await waitFor(() => {
      expect(screen.getByLabelText("Product idea")).toHaveValue(
        "solar-powered picnic coolers for city parks"
      );
    });
    expect(screen.getByText("Sample preview")).toBeInTheDocument();
    expect(screen.queryByText(/Generated from:/i)).not.toBeInTheDocument();
    expect(window.localStorage.getItem(DRAFT_IDEA_STORAGE_KEY)).toBeNull();
  });

  it("submits a starter idea and adds the saved storefront to recent results", async () => {
    const selectedIdea = STARTER_IDEAS[1];
    const createdStorefront = storefront({
      id: "lamp-kit-id",
      slug: "tiny-lamp-labs-abc123",
      idea: selectedIdea
    });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        storefront: createdStorefront,
        shareUrl: "https://vibe.example/s/tiny-lamp-labs-abc123"
      })
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<StorefrontStudio />);
    fireEvent.click(
      screen.getByRole("button", {
        name: `Generate storefront for ${selectedIdea}`
      })
    );

    await waitFor(() => {
      expect(screen.getByLabelText("Product idea")).toHaveValue(selectedIdea);
    });
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/storefronts",
      expect.objectContaining({
        body: JSON.stringify({ idea: selectedIdea }),
        method: "POST"
      })
    );

    expect(await screen.findByText("Storefront saved.")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /open share url/i })
    ).toHaveAttribute("href", "/s/tiny-lamp-labs-abc123");

    const recentStorefronts = screen.getByRole("region", {
      name: "Recent storefronts"
    });
    expect(
      within(recentStorefronts).getByRole("link", {
        name: /Brooklyn Ember Co\./i
      })
    ).toHaveAttribute("href", "/s/tiny-lamp-labs-abc123");
  });
});
