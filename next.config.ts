import type { NextConfig } from "next";

type RemotePattern = NonNullable<
  NonNullable<NextConfig["images"]>["remotePatterns"]
>[number];

type SupabaseImageConfig = {
  allowLocalIp: boolean;
  remotePattern: RemotePattern;
};

const PRODUCT_IMAGE_PATH =
  "/storage/v1/object/public/storefront-product-images/**";
const LOCAL_SUPABASE_HOSTS = new Set(["127.0.0.1", "localhost", "[::1]"]);

function buildSupabaseImageConfig(): SupabaseImageConfig | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl) {
    return null;
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(supabaseUrl);
  } catch {
    return null;
  }

  const protocol =
    parsedUrl.protocol === "https:"
      ? "https"
      : parsedUrl.protocol === "http:"
        ? "http"
        : null;

  if (!protocol) {
    return null;
  }

  return {
    allowLocalIp:
      protocol === "http" && LOCAL_SUPABASE_HOSTS.has(parsedUrl.hostname),
    remotePattern: {
      protocol,
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      pathname: PRODUCT_IMAGE_PATH,
      search: ""
    }
  };
}

const supabaseImageConfig = buildSupabaseImageConfig();

const nextConfig: NextConfig = {
  images: {
    ...(supabaseImageConfig?.allowLocalIp
      ? { dangerouslyAllowLocalIP: true }
      : {}),
    remotePatterns: supabaseImageConfig
      ? [supabaseImageConfig.remotePattern]
      : []
  },
  outputFileTracingIncludes: {
    "/api/storefronts": [
      "./node_modules/@openai/codex-linux-x64/vendor/**/*",
      "./node_modules/@openai/codex-linux-arm64/vendor/**/*"
    ]
  }
};

export default nextConfig;
