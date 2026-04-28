import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StorefrontStudio } from "@/components/storefront-studio";
import { Toaster } from "@/components/ui/sonner";
import { DRAFT_IDEA_STORAGE_KEY, STARTER_IDEAS } from "@/lib/studio-ideas";
import { sampleStorefrontContent } from "@/lib/storefront-schema";
import type { StorefrontRecord } from "@/lib/storefront-schema";

const clerkMocks = vi.hoisted(() => ({
  openSignIn: vi.fn()
}));

const clipboardWriteTextMock = vi.fn();
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

vi.mock("@clerk/nextjs", () => ({
  useClerk: () => clerkMocks
}));

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
    clerkMocks.openSignIn.mockReset();
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
      expect(screen.getByLabelText("Storefront idea")).toHaveValue(
        "solar-powered picnic coolers for city parks"
      );
    });
    expect(screen.queryByText(/preview/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Generated from:/i)).not.toBeInTheDocument();
    expect(window.localStorage.getItem(DRAFT_IDEA_STORAGE_KEY)).toBeNull();
  });

  it("starts with an empty product idea prompt", () => {
    render(<StorefrontStudio />);

    expect(screen.getByLabelText("Storefront idea")).toHaveValue("");
    expect(screen.getByLabelText("Storefront idea")).toHaveAttribute(
      "placeholder",
      "Refillable shampoo bars for busy travelers, modular desk lamp kits for tiny apartments, or plant-based trail snacks for weekend hikers."
    );
    expect(
      screen.getByRole("button", { name: "Generate storefront" })
    ).not.toBeDisabled();
    expect(screen.queryByText(/Model:/)).not.toBeInTheDocument();
    expect(screen.queryByRole("group", { name: "Example product ideas" }))
      .not.toBeInTheDocument();
  });

  it("renders initial storefronts with copy and live actions", async () => {
    const newestStorefront = storefront({
      id: "desk-bloom-id",
      slug: "desk-bloom-abc123",
      idea: "modular desk planters for office workers",
      content: storefrontContent(
        "Desk Bloom",
        "Modular desk planters for brighter workdays."
      ),
      generation_cost: usageCost
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
      <>
        <StorefrontStudio
          initialStorefronts={[newestStorefront, olderStorefront]}
        />
        <Toaster />
      </>
    );

    const recentStorefronts = screen.getByRole("region", {
      name: "Your storefronts"
    });

    expect(screen.queryByText("Latest preview")).not.toBeInTheDocument();
    expect(within(recentStorefronts).queryByRole("button", { name: /Preview/ }))
      .not.toBeInTheDocument();
    expect(within(recentStorefronts).getByText("Desk Bloom"))
      .toBeInTheDocument();
    expect(within(recentStorefronts).getByText("Lamp Loom"))
      .toBeInTheDocument();
    expect(
      within(recentStorefronts).getAllByText("Created Apr 23, 2026")
    ).toHaveLength(2);
    expect(within(recentStorefronts).getByText("Estimated cost $0.06"))
      .toBeInTheDocument();
    expect(
      within(recentStorefronts).getByText("Estimated cost not recorded")
    ).toBeInTheDocument();
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

    expect(
      within(recentStorefronts).getByRole("link", {
        name: "Open live storefront for Lamp Loom"
      })
    ).toHaveAttribute("href", "/s/lamp-loom-def456");
  });

  it("renders every saved storefront in the library", () => {
    const savedStorefronts = Array.from({ length: 5 }, (_, index) =>
      storefront({
        id: `storefront-${index}`,
        slug: `saved-storefront-${index}`,
        idea: `saved product idea ${index}`,
        content: storefrontContent(
          `Saved Storefront ${index + 1}`,
          `Saved storefront ${index + 1} tagline.`
        )
      })
    );

    render(<StorefrontStudio initialStorefronts={savedStorefronts} />);

    const recentStorefronts = screen.getByRole("region", {
      name: "Your storefronts"
    });

    expect(screen.getByText("5 saved")).toBeInTheDocument();
    for (const savedStorefront of savedStorefronts) {
      expect(within(recentStorefronts).getByText(savedStorefront.content.name))
        .toBeInTheDocument();
    }
  });

  it("deletes a signed-in storefront after confirmation", async () => {
    const newestStorefront = storefront({
      id: "00000000-0000-4000-8000-000000000001",
      slug: "desk-bloom-abc123",
      idea: "modular desk planters for office workers",
      content: storefrontContent(
        "Desk Bloom",
        "Modular desk planters for brighter workdays."
      )
    });
    const olderStorefront = storefront({
      id: "00000000-0000-4000-8000-000000000002",
      slug: "lamp-loom-def456",
      idea: "tiny lamp kits for renters",
      content: storefrontContent(
        "Lamp Loom",
        "Small lighting kits that make rentals feel intentional."
      )
    });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        deletedStorefrontId: newestStorefront.id
      })
    });

    vi.stubGlobal("fetch", fetchMock);

    render(
      <StorefrontStudio
        initialStorefronts={[newestStorefront, olderStorefront]}
      />
    );

    const recentStorefronts = screen.getByRole("region", {
      name: "Your storefronts"
    });

    fireEvent.click(
      within(recentStorefronts).getByRole("button", {
        name: "Delete storefront Desk Bloom"
      })
    );

    const dialog = screen.getByRole("alertdialog", {
      name: "Delete storefront?"
    });

    expect(dialog).toHaveTextContent(
      "Are you sure you want to delete Desk Bloom?"
    );
    expect(dialog).toHaveTextContent(
      "This permanently removes it from your profile and public storefronts."
    );
    expect(fetchMock).not.toHaveBeenCalledWith(
      "/api/storefronts/00000000-0000-4000-8000-000000000001",
      { method: "DELETE" }
    );

    fireEvent.click(
      within(dialog).getByRole("button", { name: "Delete storefront" })
    );
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/storefronts/00000000-0000-4000-8000-000000000001",
        { method: "DELETE" }
      );
    });
    await waitFor(() => {
      expect(within(recentStorefronts).queryByText("Desk Bloom"))
        .not.toBeInTheDocument();
    });
    expect(within(recentStorefronts).getByText("Lamp Loom")).toBeInTheDocument();
    expect(screen.getByText("1 saved")).toBeInTheDocument();
    expect(await screen.findByText("Desk Bloom was deleted."))
      .toBeInTheDocument();
    expect(screen.queryByRole("alertdialog", { name: "Delete storefront?" }))
      .not.toBeInTheDocument();
  });

  it("does not show delete actions for guest storefronts", () => {
    const guestStorefront = storefront({
      id: "guest-storefront-id",
      owner_clerk_user_id: null,
      anonymous_session_id: "00000000-0000-4000-8000-000000000001"
    });

    render(
      <StorefrontStudio
        initialStorefronts={[guestStorefront]}
        mode="guest"
      />
    );

    const guestStorefronts = screen.getByRole("region", {
      name: "Guest storefront"
    });

    expect(within(guestStorefronts).queryByRole("button", { name: /Delete/ }))
      .not.toBeInTheDocument();
  });

  it("submits an idea and adds the saved storefront to recent results", async () => {
    const selectedIdea = STARTER_IDEAS[1];
    const createdStorefront = storefront({
      id: "lamp-kit-id",
      slug: "tiny-lamp-labs-abc123",
      idea: selectedIdea,
      generation_cost: usageCost
    });
    let resolveFetch!: (response: {
      ok: boolean;
      json: () => Promise<{
        storefront: StorefrontRecord;
        shareUrl: string;
        usageCost?: typeof usageCost;
        warning?: string;
      }>;
    }) => void;
    const fetchPromise = new Promise<{
      ok: boolean;
      json: () => Promise<{
        storefront: StorefrontRecord;
        shareUrl: string;
        usageCost?: typeof usageCost;
        warning?: string;
      }>;
    }>((resolve) => {
      resolveFetch = resolve;
    });
    const fetchMock = vi.fn().mockReturnValue(fetchPromise);
    vi.stubGlobal("fetch", fetchMock);

    render(<StorefrontStudio />);
    fireEvent.change(screen.getByLabelText("Storefront idea"), {
      target: { value: selectedIdea }
    });
    fireEvent.click(screen.getByRole("button", { name: "Generate storefront" }));

    expect(screen.getByLabelText("Storefront idea")).toHaveValue(
      selectedIdea
    );
    const generatingButton = await screen.findByRole("button", {
      name: /generating storefront/i
    });
    expect(generatingButton).toBeDisabled();
    expect(within(generatingButton).queryByText("0:00"))
      .not.toBeInTheDocument();

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
    expect(generationProgress).not.toHaveTextContent(
      "Usually takes 1-3 minutes"
    );
    expect(screen.queryByText(/Estimated completion/i)).not.toBeInTheDocument();
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/storefronts",
        expect.objectContaining({
          body: JSON.stringify({ idea: selectedIdea }),
          method: "POST"
        })
      );
    });

    await act(async () => {
      resolveFetch({
        ok: true,
        json: async () => ({
          storefront: createdStorefront,
          shareUrl: "https://vibe.example/s/tiny-lamp-labs-abc123",
          usageCost,
          warning: productImageWarning
        })
      });
      await fetchPromise;
    });

    expect(await screen.findByText("Storefront saved.")).toBeInTheDocument();
    expect(screen.getByText(/Finished in \d+:\d{2}/)).toBeInTheDocument();
    expect(screen.getByText("This request cost about $0.06."))
      .toBeInTheDocument();
    expect(screen.getByText("Estimated cost $0.06")).toBeInTheDocument();
    expect(screen.getByText(productImageWarning)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /open share url/i })
    ).toHaveAttribute("href", "/s/tiny-lamp-labs-abc123");
    expect(
      screen.getByRole("link", { name: /open share url/i })
    ).toHaveAttribute("target", "_blank");

    const recentStorefronts = screen.getByRole("region", {
      name: "Your storefronts"
    });
    expect(within(recentStorefronts).queryByRole("button", { name: /Preview/ }))
      .not.toBeInTheDocument();
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
    expect(within(recentStorefronts).getByText("Brooklyn Ember Co."))
      .toBeInTheDocument();
  });

  it("shows the blocked-content error without showing a result", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: vi.fn().mockResolvedValue({
        error: "Content cannot be generated."
      })
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<StorefrontStudio />);
    fireEvent.change(screen.getByLabelText("Storefront idea"), {
      target: { value: "nsfw poster subscription boxes" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Generate storefront" }));

    expect(
      await screen.findByText("Content cannot be generated.")
    ).toBeInTheDocument();
    expect(screen.queryByText("Storefront saved.")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /open share url/i }))
      .not.toBeInTheDocument();
  });

  it("frames repeated signed-in prompts as reusing the existing storefront", async () => {
    const selectedIdea = STARTER_IDEAS[0];
    const existingStorefront = storefront({
      slug: "carryclean-co-abc123",
      idea: selectedIdea
    });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        storefront: existingStorefront,
        shareUrl: "https://vibe.example/s/carryclean-co-abc123",
        status: "existing_prompt_storefront"
      })
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<StorefrontStudio />);
    fireEvent.change(screen.getByLabelText("Storefront idea"), {
      target: { value: selectedIdea }
    });
    fireEvent.click(screen.getByRole("button", { name: "Generate storefront" }));

    expect(
      await screen.findByText(
        "You already generated this idea. Brooklyn Ember Co. is ready."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /open share url/i })
    ).toHaveAttribute("href", "/s/carryclean-co-abc123");
    expect(screen.getByText("No new API spend.")).toBeInTheDocument();
    expect(screen.getByText("Brooklyn Ember Co.")).toBeInTheDocument();
  });

  it("lets a guest generate one storefront and then disables more generation", async () => {
    const selectedIdea = STARTER_IDEAS[0];
    const createdStorefront = storefront({
      id: "guest-storefront-id",
      owner_clerk_user_id: null,
      anonymous_session_id: "00000000-0000-4000-8000-000000000001",
      slug: "guest-hot-sauce-abc123",
      idea: selectedIdea
    });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        storefront: createdStorefront,
        shareUrl: "https://vibe.example/s/guest-hot-sauce-abc123",
        usageCost
      })
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<StorefrontStudio mode="guest" />);
    fireEvent.change(screen.getByLabelText("Storefront idea"), {
      target: { value: selectedIdea }
    });
    fireEvent.click(screen.getByRole("button", { name: "Generate storefront" }));

    expect(
      await screen.findByText("Guest storefront ready.")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /open share url/i })
    ).toHaveAttribute("href", "/s/guest-hot-sauce-abc123");
    expect(screen.getByText("This request cost about $0.06."))
      .toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Sign in for more" })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Create account" })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Generate storefront" })
    ).toBeDisabled();

    const guestStorefront = screen.getByRole("region", {
      name: "Guest storefront"
    });
    expect(within(guestStorefront).queryByRole("button", { name: /Preview/ }))
      .not.toBeInTheDocument();
    expect(within(guestStorefront).getByText("Brooklyn Ember Co."))
      .toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Sign in for more" }));

    expect(clerkMocks.openSignIn).toHaveBeenCalledTimes(1);
  });

  it("shows the existing storefront when a guest has already generated one", async () => {
    const existingStorefront = storefront({
      id: "guest-storefront-id",
      owner_clerk_user_id: null,
      anonymous_session_id: "00000000-0000-4000-8000-000000000001",
      slug: "guest-hot-sauce-abc123"
    });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: vi.fn().mockResolvedValue({
        error:
          "This browser already generated Brooklyn Ember Co.; open it below or sign in to create more storefronts.",
        storefront: existingStorefront,
        shareUrl: "https://vibe.example/s/guest-hot-sauce-abc123",
        status: "existing_guest_storefront"
      })
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<StorefrontStudio mode="guest" />);
    fireEvent.change(screen.getByLabelText("Storefront idea"), {
      target: { value: STARTER_IDEAS[0] }
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
      screen.getByRole("link", { name: /open share url/i })
    ).toHaveAttribute("href", "/s/guest-hot-sauce-abc123");
    expect(screen.getByText("No new API spend.")).toBeInTheDocument();
    expect(screen.getByText("Brooklyn Ember Co.")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Generate storefront" })
    ).toBeDisabled();
  });
});
