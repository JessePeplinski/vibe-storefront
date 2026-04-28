import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const destroy = vi.fn();
  const initialize = vi.fn().mockResolvedValue(undefined);

  return {
    destroy,
    initialize,
    revealConstructor: vi.fn(function RevealMock() {
      return {
        destroy,
        initialize
      };
    }),
    revealNotes: vi.fn(() => ({ id: "notes" }))
  };
});

vi.mock("reveal.js", () => ({
  default: mocks.revealConstructor
}));

vi.mock("reveal.js/plugin/notes", () => ({
  default: mocks.revealNotes
}));

describe("deck page", () => {
  it("renders the Reveal.js deck with speaker notes", async () => {
    const Page = (await import("@/app/deck/page")).default;

    render(<Page />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Vibe Storefront" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Ship one complete product loop."
      })
    ).toBeInTheDocument();
    expect(screen.getByText("Next.js App Router")).toBeInTheDocument();
    expect(screen.getByText("Codex SDK")).toBeInTheDocument();
    expect(screen.getByText("Zod contract")).toBeInTheDocument();
    expect(
      screen.getByAltText(
        "Vibe Storefront MVP snapshot after the first working build"
      )
    ).toHaveAttribute("src", expect.stringContaining("vibe-storefront"));
    expect(
      screen.getByText(
        /This is the support deck for the second half of the walkthrough./
      )
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(mocks.revealConstructor).toHaveBeenCalledWith(
        expect.any(HTMLDivElement),
        expect.objectContaining({
          plugins: [mocks.revealNotes],
          showNotes: false
        })
      );
    });
    expect(mocks.initialize).toHaveBeenCalledTimes(1);
  });
});
