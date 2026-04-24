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
import { DRAFT_IDEA_STORAGE_KEY, STARTER_IDEAS } from "@/lib/studio-ideas";
import { sampleStorefrontContent } from "@/lib/storefront-schema";
import type { StorefrontRecord } from "@/lib/storefront-schema";

const clerkMocks = vi.hoisted(() => ({
  openSignIn: vi.fn(),
  openSignUp: vi.fn()
}));

const clipboardWriteTextMock = vi.fn();

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
    clerkMocks.openSignUp.mockReset();
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

  it("starts with an empty product idea prompt", () => {
    render(<StorefrontStudio />);

    expect(screen.getByLabelText("Product idea")).toHaveValue("");
    expect(screen.getByLabelText("Product idea")).toHaveAttribute(
      "placeholder",
      "Enter your product idea"
    );
    expect(
      screen.getByRole("button", { name: "Generate with Codex" })
    ).not.toBeDisabled();
    expect(screen.getByText("Model: gpt-5.3-codex")).toBeInTheDocument();
    expect(
      within(
        screen.getByRole("group", { name: "Example product ideas" })
      ).getAllByRole("button")
    ).toHaveLength(STARTER_IDEAS.length);

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
    let resolveFetch!: (response: {
      ok: boolean;
      json: () => Promise<{
        storefront: StorefrontRecord;
        shareUrl: string;
      }>;
    }) => void;
    const fetchPromise = new Promise<{
      ok: boolean;
      json: () => Promise<{
        storefront: StorefrontRecord;
        shareUrl: string;
      }>;
    }>((resolve) => {
      resolveFetch = resolve;
    });
    const fetchMock = vi.fn().mockReturnValue(fetchPromise);
    vi.stubGlobal("fetch", fetchMock);

    render(<StorefrontStudio />);
    const starterButton = screen.getByRole("button", {
      name: `Generate storefront for ${selectedIdea}`
    });

    fireEvent.click(starterButton);

    expect(screen.getByLabelText("Product idea")).toHaveValue("");
    expect(starterButton).toHaveAttribute("aria-busy", "true");
    const generatingButton = await screen.findByRole("button", {
      name: /generating with codex/i
    });
    expect(generatingButton).toBeDisabled();
    expect(within(generatingButton).getByText("0:15")).toBeInTheDocument();
    expect(screen.queryByText(/Estimated completion/i)).not.toBeInTheDocument();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/storefronts",
      expect.objectContaining({
        body: JSON.stringify({ idea: selectedIdea }),
        method: "POST"
      })
    );

    await act(async () => {
      resolveFetch({
        ok: true,
        json: async () => ({
          storefront: createdStorefront,
          shareUrl: "https://vibe.example/s/tiny-lamp-labs-abc123"
        })
      });
      await fetchPromise;
    });

    expect(await screen.findByText("Storefront saved.")).toBeInTheDocument();
    expect(starterButton).toHaveAttribute("aria-busy", "false");
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
        shareUrl: "https://vibe.example/s/guest-hot-sauce-abc123"
      })
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<StorefrontStudio mode="guest" />);
    fireEvent.click(
      screen.getByRole("button", {
        name: `Generate storefront for ${selectedIdea}`
      })
    );

    expect(
      await screen.findByText("Guest storefront ready.")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /open share url/i })
    ).toHaveAttribute("href", "/s/guest-hot-sauce-abc123");
    expect(
      screen.getByRole("button", { name: "Sign in for more" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Create account" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Generate with Codex" })
    ).toBeDisabled();

    const guestStorefront = screen.getByRole("region", {
      name: "Guest storefront"
    });
    expect(
      within(guestStorefront).getByRole("button", {
        name: "Preview Brooklyn Ember Co."
      })
    ).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(screen.getByRole("button", { name: "Sign in for more" }));
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    expect(clerkMocks.openSignIn).toHaveBeenCalledTimes(1);
    expect(clerkMocks.openSignUp).toHaveBeenCalledTimes(1);
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
    fireEvent.click(
      screen.getByRole("button", {
        name: `Generate storefront for ${STARTER_IDEAS[0]}`
      })
    );

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
    expect(
      screen.getByRole("heading", { level: 2, name: "Brooklyn Ember Co." })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Generate with Codex" })
    ).toBeDisabled();
  });
});
