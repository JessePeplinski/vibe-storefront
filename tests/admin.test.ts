import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isCurrentUserAdmin } from "@/lib/admin";

const { currentUser } = vi.hoisted(() => ({ currentUser: vi.fn() }));
vi.mock("@clerk/nextjs/server", () => ({ currentUser }));

describe("admin access", () => {
  beforeEach(() => {
    vi.stubEnv("ADMIN_EMAIL", "admin@example.com");
    currentUser.mockReset();
  });
  afterEach(() => vi.unstubAllEnvs());

  it("accepts a verified primary email with normalized casing", async () => {
    currentUser.mockResolvedValue({ primaryEmailAddress: {
      emailAddress: "Admin@Example.com", verification: { status: "verified" }
    } });
    expect(await isCurrentUserAdmin()).toBe(true);
  });

  it.each([
    null,
    { primaryEmailAddress: null },
    { primaryEmailAddress: { emailAddress: "admin@example.com", verification: { status: "unverified" } } },
    { primaryEmailAddress: { emailAddress: "other@example.com", verification: { status: "verified" } } }
  ])("denies missing, unverified, or non-admin identity: %j", async (user) => {
    currentUser.mockResolvedValue(user);
    expect(await isCurrentUserAdmin()).toBe(false);
  });

  it("denies access when no admin email is configured", async () => {
    vi.stubEnv("ADMIN_EMAIL", "");
    expect(await isCurrentUserAdmin()).toBe(false);
    expect(currentUser).not.toHaveBeenCalled();
  });
});
