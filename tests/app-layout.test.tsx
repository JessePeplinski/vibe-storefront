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
    const menu = document.getElementById("signed-in-navigation-menu");

    expect(menu).toHaveClass("hidden");

    fireEvent.click(menuButton);

    expect(
      screen.getByRole("button", { name: "Close menu" })
    ).toHaveAttribute("aria-expanded", "true");
    expect(menu).toHaveClass("flex");
    expect(menu).not.toHaveClass("hidden");
    const dashboardLink = within(menu as HTMLElement).getByRole("link", {
      name: "Your storefronts"
    });

    expect(dashboardLink).toHaveAttribute(
      "href",
      "/dashboard#your-storefronts"
    );
    expect(
      within(menu as HTMLElement).getByRole("link", {
        name: "All storefronts"
      })
    ).toHaveAttribute("href", "/storefronts");
    expect(
      within(menu as HTMLElement).getByRole("button", {
        name: "Manage account"
      })
    ).toBeInTheDocument();
    expect(within(menu as HTMLElement).getByRole("button", { name: "Sign out" }))
      .toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Escape" });

    expect(screen.getByRole("button", { name: "Open menu" })).toHaveAttribute(
      "aria-expanded",
      "false"
    );
    expect(menu).toHaveClass("hidden");

    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    dashboardLink.addEventListener("click", (event) => event.preventDefault());
    fireEvent.click(dashboardLink);

    expect(menu).toHaveClass("hidden");

    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    fireEvent.click(
      within(menu as HTMLElement).getByRole("button", {
        name: "Manage account"
      })
    );

    expect(mocks.openUserProfile).toHaveBeenCalledTimes(1);
    expect(menu).toHaveClass("hidden");

    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    fireEvent.click(within(menu as HTMLElement).getByRole("button", { name: "Sign out" }));

    expect(mocks.signOut).toHaveBeenCalledWith({ redirectUrl: "/" });
    expect(menu).toHaveClass("hidden");
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
