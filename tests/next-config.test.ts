import { afterEach, describe, expect, it, vi } from "vitest";

const originalSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

async function loadNextConfig(supabaseUrl: string | null) {
  vi.resetModules();

  if (supabaseUrl === null) {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  } else {
    process.env.NEXT_PUBLIC_SUPABASE_URL = supabaseUrl;
  }

  const { default: nextConfig } = await import("../next.config");

  return nextConfig;
}

describe("next config", () => {
  afterEach(() => {
    vi.resetModules();

    if (originalSupabaseUrl === undefined) {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    } else {
      process.env.NEXT_PUBLIC_SUPABASE_URL = originalSupabaseUrl;
    }
  });

  it("allows optimized product images from the configured Supabase project", async () => {
    const nextConfig = await loadNextConfig(
      "https://zmpfgyfjoxtyrzuaalxo.supabase.co"
    );

    expect(nextConfig.images?.remotePatterns).toEqual([
      {
        protocol: "https",
        hostname: "zmpfgyfjoxtyrzuaalxo.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/storefront-product-images/**",
        search: ""
      }
    ]);
    expect(nextConfig.images?.dangerouslyAllowLocalIP).toBeUndefined();
  });

  it("allows local Supabase image optimization only for the local stack", async () => {
    const nextConfig = await loadNextConfig("http://127.0.0.1:54321");

    expect(nextConfig.images?.remotePatterns).toEqual([
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "54321",
        pathname: "/storage/v1/object/public/storefront-product-images/**",
        search: ""
      }
    ]);
    expect(nextConfig.images?.dangerouslyAllowLocalIP).toBe(true);
  });

  it("does not add a broad image proxy pattern without a Supabase URL", async () => {
    const nextConfig = await loadNextConfig(null);

    expect(nextConfig.images?.remotePatterns).toEqual([]);
    expect(nextConfig.images?.dangerouslyAllowLocalIP).toBeUndefined();
  });
});
