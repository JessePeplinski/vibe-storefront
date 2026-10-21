import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GenerationNavigationStatus } from "@/components/generation-navigation-status";
import { StorefrontGenerationProvider, useGenerationSession } from "@/components/use-storefront-generation";
import { sampleStorefrontContent } from "@/lib/storefront-schema";
import type { GenerationJob } from "@/lib/generation-job";

const navigation = vi.hoisted(() => ({ pathname: "/storefronts", push: vi.fn(), toastSuccess: vi.fn() }));
vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
  useRouter: () => ({ push: navigation.push })
}));
vi.mock("sonner", () => ({ toast: { success: navigation.toastSuccess } }));

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
    <GenerationNavigationStatus />
    <StartGeneration />
  </StorefrontGenerationProvider>;
}

async function completeGeneration() {
  fireEvent.click(screen.getByRole("button", { name: "Start generation" }));
  await waitFor(() => expect(navigation.toastSuccess).toHaveBeenCalledOnce());
}

describe("generation navigation status", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigation.pathname = "/storefronts";
    vi.stubGlobal("fetch", vi.fn().mockImplementation(async (_url, options) => ({
      ok: true, json: async () => ({ job: options?.method === "POST" ? pendingJob : completedJob })
    })));
  });
  afterEach(() => vi.unstubAllGlobals());

  it("shows running progress from another page", async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => ({ job: pendingJob }) } as Response);
    render(<View />);
    expect(screen.queryByRole("button", { name: "View generation progress" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Start generation" }));
    fireEvent.click(await screen.findByRole("button", { name: "View generation progress" }));
    const panel = screen.getByRole("dialog", { name: "Generating storefront" });
    expect(within(panel).getByText(pendingJob.idea)).toBeInTheDocument();
    expect(within(panel).getByRole("status", { name: "Generation progress" })).toHaveTextContent("Total");
    expect(within(panel).getByText("Steps and progress are estimated.")).toBeInTheDocument();
    expect(within(panel).getByRole("link", { name: "Your storefronts" })).toHaveAttribute("href", "/dashboard#your-storefronts");
  });

  it("restores the indicator for a pending job recovered on page load", async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => ({ job: pendingJob }) } as Response);
    render(<View recoverOnMount />);
    expect(await screen.findByRole("button", { name: "View generation progress" })).toBeInTheDocument();
    expect(navigation.toastSuccess).not.toHaveBeenCalled();
  });

  it("toasts a fresh completion and opens the saved storefront from its action", async () => {
    render(<View />);
    await completeGeneration();
    expect(navigation.toastSuccess).toHaveBeenCalledWith("Storefront ready", expect.objectContaining({
      id: "storefront-ready-store-id", description: sampleStorefrontContent.name, duration: 10000,
      action: { label: "Open storefront", onClick: expect.any(Function) }
    }));
    navigation.toastSuccess.mock.calls[0][1].action.onClick();
    expect(navigation.push).toHaveBeenCalledWith("/s/new-storefront");
    expect(screen.queryByRole("button", { name: "View generation progress" })).not.toBeInTheDocument();
  });

  it("does not repeat a completion toast across navigation", async () => {
    const { rerender } = render(<View />);
    await completeGeneration();
    navigation.pathname = "/dashboard";
    rerender(<View />);
    navigation.pathname = "/storefronts";
    rerender(<View />);
    expect(navigation.toastSuccess).toHaveBeenCalledOnce();
  });

  it.each(["/dashboard", "/s/new-storefront"])("does not toast when already viewing %s", async (pathname) => {
    navigation.pathname = pathname;
    const { rerender } = render(<View />);
    fireEvent.click(screen.getByRole("button", { name: "Start generation" }));
    await waitFor(() => expect(fetch).toHaveBeenCalledWith("/api/storefront-jobs", expect.anything()));
    await act(async () => {});
    navigation.pathname = "/storefronts";
    rerender(<View />);
    expect(navigation.toastSuccess).not.toHaveBeenCalled();
  });

  it("does not announce historical completed jobs recovered on sign-in", async () => {
    render(<View recoverOnMount />);
    await waitFor(() => expect(fetch).toHaveBeenCalledWith("/api/storefront-jobs", expect.anything()));
    await act(async () => {});
    expect(navigation.toastSuccess).not.toHaveBeenCalled();
  });

  it("removes the indicator without a ready toast when generation fails", async () => {
    vi.mocked(fetch).mockImplementation(async (_url, options) => ({
      ok: true, json: async () => ({ job: options?.method === "POST" ? pendingJob : { ...pendingJob, status: "failed", error: "Generation failed." } })
    } as Response));
    render(<View />);
    fireEvent.click(screen.getByRole("button", { name: "Start generation" }));
    await waitFor(() => expect(fetch).toHaveBeenCalledWith("/api/storefront-jobs", expect.anything()));
    await act(async () => {});
    expect(navigation.toastSuccess).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "View generation progress" })).not.toBeInTheDocument();
  });
});
