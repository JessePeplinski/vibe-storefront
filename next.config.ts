import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/storefronts": [
      "./node_modules/@openai/codex-linux-x64/vendor/**/*",
      "./node_modules/@openai/codex-linux-arm64/vendor/**/*"
    ]
  }
};

export default nextConfig;
