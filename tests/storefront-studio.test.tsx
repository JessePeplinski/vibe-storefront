import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StorefrontStudio } from "@/components/storefront-studio";
import { DRAFT_IDEA_STORAGE_KEY, STARTER_IDEAS } from "@/lib/studio-ideas";
import { sampleStorefrontContent } from "@/lib/storefront-schema";
import type { StorefrontRecord } from "@/lib/storefront-schema";

const clipboardWriteTextMock = vi.fn();

function storefrontContent(
  name: string,
  tagline: string
): StorefrontRecord["content"] {
  return {
    ...sampleStorefrontContent,
    name,
    tagline
  };
}

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
    clipboardWriteTextMock.mockReset();
    clipboardWriteTextMock.mockResolvedValue(undefined);
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: createStorageMock()
    });
    Object.defineProperty(window.navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: clipboardWriteTextMock
      }
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
    expect(screen.getByText("Example storefront")).toBeInTheDocument();
    expect(screen.queryByText(/Generated from:/i)).not.toBeInTheDocument();
    expect(window.localStorage.getItem(DRAFT_IDEA_STORAGE_KEY)).toBeNull();
  });

  it("previews the newest initial recent storefront and lets another item take over the canvas", async () => {
    const newestStorefront = storefront({
      id: "desk-bloom-id",
      slug: "desk-bloom-abc123",
      idea: "modular desk planters for office workers",
      content: storefrontContent(
        "Desk Bloom",
        "Modular desk planters for brighter workdays."
      )
    });
    const olderStorefront = storefront({
      id: "lamp-loom-id",
      slug: "lamp-loom-def456",
      idea: "tiny lamp kits for renters",
      content: storefrontContent(
        "Lamp Loom",
        "Small lighting kits that make rentals feel intentional."
      )
    });

    render(
      <StorefrontStudio
        initialStorefronts={[newestStorefront, olderStorefront]}
      />
    );

    const recentStorefronts = screen.getByRole("region", {
      name: "Recent storefronts"
    });
    const newestPreviewButton = within(recentStorefronts).getByRole("button", {
      name: "Preview Desk Bloom"
    });
    const olderPreviewButton = within(recentStorefronts).getByRole("button", {
      name: "Preview Lamp Loom"
    });

    expect(screen.getByText("Selected preview")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "Desk Bloom" })
    ).toBeInTheDocument();
    expect(screen.queryByText("background")).not.toBeInTheDocument();
    expect(screen.getByText("Built with vibe-storefront.com")).toBeInTheDocument();
    expect(
      screen.getByText("Source prompt: modular desk planters for office workers")
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open live" })).toHaveAttribute(
      "href",
      "/s/desk-bloom-abc123"
    );
    expect(screen.getByRole("link", { name: "Open live" })).toHaveAttribute(
      "target",
      "_blank"
    );
    expect(newestPreviewButton).toHaveAttribute("aria-pressed", "true");
    expect(olderPreviewButton).toHaveAttribute("aria-pressed", "false");
    expect(
      within(recentStorefronts).getAllByText("Created Apr 23, 2026")
    ).toHaveLength(2);
    expect(
      within(recentStorefronts).getByText(
        "From: modular desk planters for office workers"
      )
    ).toBeInTheDocument();
    expect(
      within(recentStorefronts).getByRole("link", {
        name: "Open live storefront for Desk Bloom"
      })
    ).toHaveAttribute("href", "/s/desk-bloom-abc123");
    expect(
      within(recentStorefronts).getByRole("link", {
        name: "Open live storefront for Desk Bloom"
      })
    ).toHaveAttribute("target", "_blank");
    expect(
      within(recentStorefronts).getByRole("button", {
        name: "Edit Desk Bloom"
      })
    ).toBeDisabled();
    expect(
      within(recentStorefronts).getByRole("button", {
        name: "Edit Desk Bloom"
      })
    ).toHaveAttribute("title", "Editing coming soon");

    fireEvent.click(
      within(recentStorefronts).getByRole("button", {
        name: "Copy live link for Desk Bloom"
      })
    );
    expect(clipboardWriteTextMock).toHaveBeenCalledWith(
      `${window.location.origin}/s/desk-bloom-abc123`
    );
    await waitFor(() => {
      expect(
        within(recentStorefronts).getByRole("button", {
          name: "Copy live link for Desk Bloom"
        })
      ).toHaveTextContent("Copied");
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "Copy selected live link for Desk Bloom"
      })
    );
    expect(clipboardWriteTextMock).toHaveBeenCalledWith(
      `${window.location.origin}/s/desk-bloom-abc123`
    );
    await waitFor(() => {
      expect(
        screen.getByRole("button", {
          name: "Copy selected live link for Desk Bloom"
        })
      ).toHaveTextContent("Copied");
    });

    fireEvent.click(olderPreviewButton);

    expect(
      screen.getByRole("heading", { level: 2, name: "Lamp Loom" })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open live" })).toHaveAttribute(
      "href",
      "/s/lamp-loom-def456"
    );
    expect(newestPreviewButton).toHaveAttribute("aria-pressed", "false");
    expect(olderPreviewButton).toHaveAttribute("aria-pressed", "true");
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
    expect(
      screen.getByRole("link", { name: /open share url/i })
    ).toHaveAttribute("target", "_blank");

    const recentStorefronts = screen.getByRole("region", {
      name: "Recent storefronts"
    });
    expect(
      within(recentStorefronts).getByRole("button", {
        name: "Preview Brooklyn Ember Co."
      })
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      within(recentStorefronts).getByRole("link", {
        name: "Open live storefront for Brooklyn Ember Co."
      })
    ).toHaveAttribute("href", "/s/tiny-lamp-labs-abc123");
    expect(
      within(recentStorefronts).getByRole("button", {
        name: "Copy live link for Brooklyn Ember Co."
      })
    ).toBeInTheDocument();
    expect(
      within(recentStorefronts).getByRole("button", {
        name: "Edit Brooklyn Ember Co."
      })
    ).toBeDisabled();
    expect(
      screen.getByRole("heading", { level: 2, name: "Brooklyn Ember Co." })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open live" })).toHaveAttribute(
      "href",
      "/s/tiny-lamp-labs-abc123"
    );
  });
});
