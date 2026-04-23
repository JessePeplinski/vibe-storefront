import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { Codex } from "@openai/codex-sdk";
import { zodToJsonSchema } from "zod-to-json-schema";
import { requireEnv } from "@/lib/env";
import {
  type StorefrontContent,
  storefrontContentSchema
} from "@/lib/storefront-schema";

const storefrontJsonSchema = zodToJsonSchema(storefrontContentSchema, {
  $refStrategy: "none",
  target: "openAi"
});

function resolveCodexBinaryPath(): string | undefined {
  if (process.env.CODEX_PATH_OVERRIDE) {
    return process.env.CODEX_PATH_OVERRIDE;
  }

  if (process.platform !== "darwin" || process.arch !== "arm64") {
    return undefined;
  }

  const binaryPath = join(
    process.cwd(),
    "node_modules",
    "@openai",
    "codex-darwin-arm64",
    "vendor",
    "aarch64-apple-darwin",
    "codex",
    "codex"
  );

  return existsSync(binaryPath) ? binaryPath : undefined;
}

function buildPrompt(idea: string): string {
  return [
    "You are Vibe Storefront, a concise brand strategist and landing page copywriter.",
    "Generate one polished ecommerce storefront concept from the user's plain-English product idea.",
    "Return only JSON that matches the provided schema. Do not include markdown.",
    "The page should feel specific, demo-ready, and plausible. Testimonials must be fictional.",
    "Use accessible color contrast. Use hex colors only.",
    "",
    `Product idea: ${idea}`
  ].join("\n");
}

function parseCodexResponse(finalResponse: string): StorefrontContent {
  const parsed = JSON.parse(finalResponse);
  return storefrontContentSchema.parse(parsed);
}

export async function generateStorefront(
  idea: string
): Promise<StorefrontContent> {
  const trimmedIdea = idea.trim();

  if (trimmedIdea.length < 6) {
    throw new Error("Enter a more specific product idea.");
  }

  const codexHome = join("/tmp", "vibe-storefront-codex");
  await mkdir(codexHome, { recursive: true });

  const codex = new Codex({
    codexPathOverride: resolveCodexBinaryPath(),
    env: {
      CODEX_HOME: codexHome,
      CODEX_API_KEY: requireEnv("CODEX_API_KEY"),
      HOME: "/tmp",
      PATH: process.env.PATH ?? ""
    },
    config: {
      model: process.env.CODEX_MODEL ?? "gpt-5.3-codex",
      approval_policy: "never",
      sandbox_mode: "read-only",
      model_reasoning_effort: "low"
    }
  });

  const thread = codex.startThread({
    workingDirectory: "/tmp",
    skipGitRepoCheck: true
  });
  const turn = await thread.run(buildPrompt(trimmedIdea), {
    outputSchema: storefrontJsonSchema
  });

  return parseCodexResponse(turn.finalResponse);
}

export const __testables = {
  buildPrompt,
  parseCodexResponse,
  storefrontJsonSchema
};
