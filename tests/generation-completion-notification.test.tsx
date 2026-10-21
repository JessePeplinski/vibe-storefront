import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GenerationCompletionNotification } from "@/components/generation-completion-notification";
import { StorefrontGenerationProvider, useGenerationSession } from "@/components/use-storefront-generation";
import { sampleStorefrontContent } from "@/lib/storefront-schema";
import type { GenerationJob } from "@/lib/generation-job";

const navigation = vi.hoisted(() => ({ pathname: "/storefronts" }));
vi.mock("next/navigation", () => ({ usePathname: () => navigation.pathname }));

const pendingJob: GenerationJob = {
  id: "job-id", idea: "compact travel desk organizer", status: "running",
  createdAt: "2026-10-21T00:00:00Z", finishedAt: null, error: null, result: null
};
const completedJob: GenerationJob = {
  ...pendingJob, status: "completed", finishedAt: "2026-10-21T00:01:00Z",
  result: {
    status: "created", shareUrl: "https://vibe.example/s/new-storefront",
    storefront: {
      id: "store-id", owner_clerk_user_id: "user_123", anonymous_session_id: null,
      idea: pendingJob.idea, slug: "new-storefront", content: sampleStorefrontContent,
      published: true, created_at: "2026-10-21T00:01:00Z", updated_at: "2026-10-21T00:01:00Z"
    }
  }
};

function StartGeneration() {
  const generation = useGenerationSession()!;
  return <button onClick={() => void generation.generateFromIdea(pendingJob.idea)}>Start generation</button>;
}
function View({ recoverOnMount = false }: { recoverOnMount?: boolean }) {
  return <StorefrontGenerationProvider recoverOnMount={recoverOnMount}>
    <GenerationCompletionNotification />
    <StartGeneration />
  </StorefrontGenerationProvider>;
}

async function completeGeneration() {
  fireEvent.click(screen.getByRole("button", { name: "Start generation" }));
  return screen.findByRole("button", { name: "Notifications: storefront ready" });
}

describe("generation completion navigation notification", () => {
  beforeEach(() => {
    navigation.pathname = "/storefronts";
    vi.stubGlobal("fetch", vi.fn().mockImplementation(async (_url, options) => ({
      ok: true, json: async () => ({ job: options?.method === "POST" ? pendingJob : completedJob })
    })));
  });
  afterEach(() => vi.unstubAllGlobals());

  it("announces a fresh completion on another page and links to the saved storefront", async () => {
    render(<View />);
    expect(screen.queryByRole("button", { name: "Notifications: storefront ready" })).not.toBeInTheDocument();
    const bell = await completeGeneration();
    expect(screen.getByRole("status")).toHaveTextContent(`${sampleStorefrontContent.name} is ready`);
    fireEvent.click(bell);
    const panel = screen.getByRole("dialog", { name: "Storefront ready" });
    expect(within(panel).getByText(sampleStorefrontContent.name)).toBeInTheDocument();
    expect(within(panel).getByRole("link", { name: "Open storefront" })).toHaveAttribute("href", "/s/new-storefront");
  });

  it("lets the user dismiss the unread notification", async () => {
    render(<View />);
    fireEvent.click(await completeGeneration());
    fireEvent.click(screen.getByRole("button", { name: "Dismiss notification" }));
    expect(screen.queryByRole("button", { name: "Notifications: storefront ready" })).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "Storefront ready" })).not.toBeInTheDocument();
  });

  it("does not notify again after completion is seen on the dashboard", async () => {
    navigation.pathname = "/dashboard";
    const { rerender } = render(<View />);
    fireEvent.click(screen.getByRole("button", { name: "Start generation" }));
    await waitFor(() => expect(fetch).toHaveBeenCalledWith("/api/storefront-jobs", expect.anything()));
    await act(async () => {});
    navigation.pathname = "/storefronts";
    rerender(<View />);
    expect(screen.queryByRole("button", { name: "Notifications: storefront ready" })).not.toBeInTheDocument();
  });

  it("clears an unread completion when the dashboard is visited", async () => {
    const { rerender } = render(<View />);
    await completeGeneration();
    navigation.pathname = "/dashboard";
    rerender(<View />);
    navigation.pathname = "/storefronts";
    rerender(<View />);
    expect(screen.queryByRole("button", { name: "Notifications: storefront ready" })).not.toBeInTheDocument();
  });

  it("does not announce historical completed jobs recovered on sign-in", async () => {
    render(<View recoverOnMount />);
    await waitFor(() => expect(fetch).toHaveBeenCalledWith("/api/storefront-jobs", expect.anything()));
    await act(async () => {});
    expect(screen.queryByRole("button", { name: "Notifications: storefront ready" })).not.toBeInTheDocument();
  });

  it("does not announce a failed generation as ready", async () => {
    vi.mocked(fetch).mockImplementation(async (_url, options) => ({
      ok: true, json: async () => ({ job: options?.method === "POST" ? pendingJob : { ...pendingJob, status: "failed", error: "Generation failed." } })
    } as Response));
    render(<View />);
    fireEvent.click(screen.getByRole("button", { name: "Start generation" }));
    await waitFor(() => expect(fetch).toHaveBeenCalledWith("/api/storefront-jobs", expect.anything()));
    await act(async () => {});
    expect(screen.queryByRole("button", { name: "Notifications: storefront ready" })).not.toBeInTheDocument();
  });
});
