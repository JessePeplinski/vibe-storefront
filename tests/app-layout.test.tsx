import { fireEvent, render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  openUserProfile: vi.fn(),
  openSignIn: vi.fn(),
  signOut: vi.fn(),
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
  useClerk: () => ({
    openSignIn: mocks.openSignIn,
    openUserProfile: mocks.openUserProfile,
    signOut: mocks.signOut
  }),
  useUser: () => ({
    user: {
      fullName: "Test User",
      imageUrl: "",
      primaryEmailAddress: {
        emailAddress: "test@example.com"
      },
      username: "test-user"
    }
  })
}));

describe("app layout", () => {
  beforeEach(() => {
    mocks.openSignIn.mockReset();
    mocks.openUserProfile.mockReset();
    mocks.signOut.mockReset();
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

  it("toggles the signed-in mobile menu", async () => {
    const Layout = (await import("@/app/(app)/layout")).default;

    render(
      <Layout>
        <main>Dashboard content</main>
      </Layout>
    );

    const menuButton = screen.getByRole("button", { name: "Open menu" });

    expect(screen.queryByRole("dialog", { name: "Navigation" }))
      .not.toBeInTheDocument();

    fireEvent.click(menuButton);

    expect(menuButton).toHaveAttribute("aria-expanded", "true");
    let menu = screen.getByRole("dialog", { name: "Navigation" });
    const dashboardLink = within(menu).getByRole("link", {
      name: "Your storefronts"
    });

    expect(dashboardLink).toHaveAttribute(
      "href",
      "/dashboard#your-storefronts"
    );
    expect(
      within(menu).getByRole("link", {
        name: "All storefronts"
      })
    ).toHaveAttribute("href", "/storefronts");
    expect(
      within(menu).getByRole("button", {
        name: "Manage account"
      })
    ).toBeInTheDocument();
    expect(within(menu).getByRole("button", { name: "Sign out" }))
      .toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Escape" });

    expect(screen.getByRole("button", { name: "Open menu" })).toHaveAttribute(
      "aria-expanded",
      "false"
    );
    expect(screen.queryByRole("dialog", { name: "Navigation" }))
      .not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    menu = screen.getByRole("dialog", { name: "Navigation" });
    fireEvent.click(within(menu).getByRole("button", { name: "Close" }));

    expect(screen.queryByRole("dialog", { name: "Navigation" }))
      .not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    menu = screen.getByRole("dialog", { name: "Navigation" });
    fireEvent.click(
      within(menu).getByRole("button", {
        name: "Manage account"
      })
    );

    expect(mocks.openUserProfile).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog", { name: "Navigation" }))
      .not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    menu = screen.getByRole("dialog", { name: "Navigation" });
    fireEvent.click(within(menu).getByRole("button", { name: "Sign out" }));

    expect(mocks.signOut).toHaveBeenCalledWith({ redirectUrl: "/" });
    expect(screen.queryByRole("dialog", { name: "Navigation" }))
      .not.toBeInTheDocument();
  });

  it("keeps the signed-out header focused on sign in", async () => {
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
    expect(within(nav).queryByRole("link", { name: "All storefronts" }))
      .not.toBeInTheDocument();
    expect(within(nav).queryByRole("link", { name: "GitHub" }))
      .not.toBeInTheDocument();
    expect(within(nav).getByRole("button", { name: "Sign in" }))
      .toBeInTheDocument();
  });
});
