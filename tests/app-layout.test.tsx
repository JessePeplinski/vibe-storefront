import { render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  openSignIn: vi.fn(),
  signedIn: true
}));

vi.mock("@clerk/nextjs", () => ({
  Show: ({
    children,
    when
  }: {
    children: ReactNode;
    when: "signed-in" | "signed-out";
  }) => {
    const shouldShow =
      (when === "signed-in" && mocks.signedIn) ||
      (when === "signed-out" && !mocks.signedIn);

    return shouldShow ? <>{children}</> : null;
  },
  UserButton: () => <button aria-label="User menu" type="button" />,
  useClerk: () => ({ openSignIn: mocks.openSignIn })
}));

describe("app layout", () => {
  beforeEach(() => {
    mocks.openSignIn.mockReset();
    mocks.signedIn = true;
  });

  it("shows dashboard and gallery links for signed-in users", async () => {
    const Layout = (await import("@/app/(app)/layout")).default;

    render(
      <Layout>
        <main>Dashboard content</main>
      </Layout>
    );

    const nav = screen.getByRole("navigation");
    expect(within(nav).queryByRole("link", { name: "Generate" }))
      .not.toBeInTheDocument();
    expect(
      within(nav).getByRole("link", { name: "Your storefronts" })
    ).toHaveAttribute("href", "/dashboard#your-storefronts");
    expect(
      within(nav).getByRole("link", { name: "All storefronts" })
    ).toHaveAttribute("href", "/storefronts");
    expect(within(nav).getByRole("button", { name: "User menu" }))
      .toBeInTheDocument();
  });

  it("keeps only public gallery navigation when signed out", async () => {
    mocks.signedIn = false;
    const Layout = (await import("@/app/(app)/layout")).default;

    render(
      <Layout>
        <main>Landing content</main>
      </Layout>
    );

    const nav = screen.getByRole("navigation");
    expect(within(nav).queryByRole("link", { name: "Generate" }))
      .not.toBeInTheDocument();
    expect(within(nav).queryByRole("link", { name: "Your storefronts" }))
      .not.toBeInTheDocument();
    expect(
      within(nav).getByRole("link", { name: "All storefronts" })
    ).toHaveAttribute("href", "/storefronts");
    expect(within(nav).getByRole("button", { name: "Sign in" }))
      .toBeInTheDocument();
  });
});
