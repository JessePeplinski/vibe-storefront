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
        name: "Ideas need something concrete."
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "One sentence becomes a storefront."
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Scope one complete loop."
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Use Codex in scoped slices."
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Next\.js 16 App Router, React, TypeScript/)
    ).toBeInTheDocument();
    expect(screen.getByText(/shadcn\/ui patterns/)).toBeInTheDocument();
    expect(screen.getByText(/OpenAI Codex SDK/)).toBeInTheDocument();
    expect(screen.getByText("OpenAI Image API")).toBeInTheDocument();
    expect(
      screen.getByAltText(
        /Image API generated diagram showing the Vibe Storefront stack/
      )
    ).toHaveAttribute(
      "src",
      expect.stringContaining("stack-architecture-gpt-image-2")
    );
    expect(screen.getByText("Zod contract")).toBeInTheDocument();
    expect(
      screen.getByAltText(
        "Vibe Storefront MVP snapshot after the first working build"
      )
    ).toHaveAttribute("src", expect.stringContaining("vibe-storefront"));
    expect(
      screen.getByText(
        /Vibe Storefront turns a product idea into a shareable storefront concept./
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /narrow the loop, hand it concrete slices, review what it returns/
      )
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", {
        level: 2,
        name: "Make localhost assumptions fail safely."
      })
    ).not.toBeInTheDocument();

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
