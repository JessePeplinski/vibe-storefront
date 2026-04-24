import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { STARTER_IDEAS } from "@/lib/studio-ideas";
import { sampleStorefrontContent } from "@/lib/storefront-schema";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  openSignIn: vi.fn(),
  openSignUp: vi.fn()
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mocks.auth
}));

vi.mock("@clerk/nextjs", () => ({
  useClerk: () => ({
    openSignIn: mocks.openSignIn,
    openSignUp: mocks.openSignUp
  })
}));

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
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: createStorageMock()
    });
  });

  it("lets signed-out visitors generate from the hero and view the created storefront", async () => {
    const createdStorefront = {
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
      }>;
    }) => void;
    const fetchPromise = new Promise<{
      ok: boolean;
      json: () => Promise<{
        storefront: typeof createdStorefront;
        shareUrl: string;
        status: "created";
      }>;
    }>((resolve) => {
      resolveFetch = resolve;
    });
    const fetchMock = vi.fn().mockReturnValue(fetchPromise);
    vi.stubGlobal("fetch", fetchMock);
    const Page = (await import("@/app/(app)/page")).default;

    render(await Page());

    expect(
      screen.getByRole("heading", { name: "Generate a storefront" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /see all storefronts/i })
    ).toHaveAttribute(
      "href",
      "/storefronts"
    );
    expect(
      screen.queryByRole("link", { name: /see example/i })
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Storefront canvas")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Product idea")).toHaveValue("");
    expect(screen.getByLabelText("Product idea")).toHaveAttribute(
      "placeholder",
      "Enter your product idea"
    );
    expect(
      screen.getByRole("button", { name: /generate with codex/i })
    ).not.toBeDisabled();
    expect(screen.getByText("Model: gpt-5.3-codex")).toBeInTheDocument();

    const exampleIdeas = screen.getByRole("group", {
      name: "Example product ideas"
    });
    expect(within(exampleIdeas).getAllByRole("button")).toHaveLength(
      STARTER_IDEAS.length
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: `Generate storefront for ${STARTER_IDEAS[0]}`
      })
    );

    expect(screen.getByLabelText("Product idea")).toHaveValue("");
    const generatingButton = await screen.findByRole("button", {
      name: /generating with codex/i
    });
    expect(generatingButton).toBeDisabled();
    expect(within(generatingButton).getByText("0:00")).toBeInTheDocument();
    expect(
      screen.getByRole("status", { name: "Generation progress" })
    ).toHaveTextContent("Estimated step 1 of 4");
    expect(
      screen.getByRole("status", { name: "Generation progress" })
    ).toHaveTextContent("Usually takes 1-3 minutes");
    expect(screen.queryByText(/Estimated completion/i)).not.toBeInTheDocument();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/storefronts",
      expect.objectContaining({
        body: JSON.stringify({ idea: STARTER_IDEAS[0] }),
        method: "POST"
      })
    );

    await act(async () => {
      resolveFetch({
        ok: true,
        json: async () => ({
          storefront: createdStorefront,
          shareUrl: "https://vibe.example/s/guest-hot-sauce-abc123",
          status: "created"
        })
      });
      await fetchPromise;
    });

    expect(
      await screen.findByRole("link", { name: /view your storefront/i })
    ).toHaveAttribute("href", "/s/guest-hot-sauce-abc123");
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
      screen.getByRole("link", { name: /open existing storefront/i })
    ).toHaveAttribute("href", "/s/guest-hot-sauce-abc123");
  });
});
