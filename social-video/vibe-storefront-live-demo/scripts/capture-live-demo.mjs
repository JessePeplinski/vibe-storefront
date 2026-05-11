#!/usr/bin/env node

import { chromium } from "playwright";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { dirname, join, resolve } from "node:path";

const workspaceRoot = resolve(import.meta.dirname, "..");
const baseUrl = process.env.VIBE_STOREFRONT_BASE_URL ?? "https://vibe-storefront.com";
const promptText =
  process.env.VIBE_STOREFRONT_DEMO_PROMPT ??
  "Goblin Dock: a modular desktop organizer for people with too many cables, sticky notes, adapters, and half-finished ideas. Slight goblin energy, but premium enough for a real workspace.";

const profileDir = join(workspaceRoot, "captures", ".playwright-profile");
const rawVideoDir = join(workspaceRoot, "captures", "raw");
const remotionCaptureDir = join(workspaceRoot, "remotion", "public", "captures");
const generatedDir = join(workspaceRoot, "remotion", "src", "generated");
const metadataPath = join(workspaceRoot, "captures", "latest-capture.json");
const remotionVideoPath = join(remotionCaptureDir, "live-demo.webm");
const generatedDataPath = join(generatedDir, "demo-capture.ts");

function secondsSince(startedAt) {
  return (Date.now() - startedAt) / 1000;
}

function toRelativeStaticPath(path) {
  return path
    .replace(join(workspaceRoot, "remotion", "public") + "/", "")
    .split("/")
    .join("/");
}

async function waitForEnter(message) {
  const rl = createInterface({ input, output });
  try {
    await rl.question(message);
  } finally {
    rl.close();
  }
}

async function ensureSignedIn() {
  const context = await chromium.launchPersistentContext(profileDir, {
    headless: false,
    viewport: { width: 1920, height: 1080 }
  });
  const page = context.pages()[0] ?? (await context.newPage());

  await page.goto(new URL("/dashboard", baseUrl).toString(), {
    waitUntil: "domcontentloaded"
  });

  const needsSignIn =
    (await page.getByRole("button", { name: /sign in/i }).count()) > 0 ||
    page.url().includes("/sign-in");

  if (needsSignIn) {
    console.log("Sign in is required before recording.");
    await waitForEnter(
      "Complete sign-in in the headed browser window, wait until the dashboard is visible, then press Enter here. "
    );
  }

  await context.close();
}

async function writeDemoData(data) {
  const source = `export const demoCapture = ${JSON.stringify(data, null, 2)} as const;\n`;
  await mkdir(dirname(generatedDataPath), { recursive: true });
  await writeFile(generatedDataPath, source, "utf8");
}

async function runCapture() {
  await mkdir(rawVideoDir, { recursive: true });
  await mkdir(remotionCaptureDir, { recursive: true });

  await ensureSignedIn();

  const context = await chromium.launchPersistentContext(profileDir, {
    headless: false,
    recordVideo: {
      dir: rawVideoDir,
      size: { width: 1920, height: 1080 }
    },
    viewport: { width: 1920, height: 1080 }
  });
  const page = context.pages()[0] ?? (await context.newPage());
  const startedAt = Date.now();

  await page.goto(new URL("/dashboard", baseUrl).toString(), {
    waitUntil: "domcontentloaded"
  });
  await page.waitForTimeout(1000);

  const textarea = page.locator("textarea[name='idea']").first();
  await textarea.waitFor({ state: "visible", timeout: 30000 });

  const typingStartedAt = secondsSince(startedAt);
  await textarea.fill("");
  await textarea.pressSequentially(promptText, { delay: 18 });

  const generateButton = page.getByRole("button", {
    name: /generate storefront/i
  }).first();
  await generateButton.click();
  const generateClickedAt = secondsSince(startedAt);

  await page
    .getByText(/generate product image|draft storefront copy/i)
    .first()
    .waitFor({ state: "visible", timeout: 30000 });

  const shareLink = page.getByRole("link", { name: /open share url/i }).first();
  await shareLink.waitFor({ state: "visible", timeout: 210000 });
  const resultReadyAt = secondsSince(startedAt);

  const shareHref = await shareLink.getAttribute("href");
  if (!shareHref) {
    throw new Error("The generated storefront did not expose a share URL.");
  }

  const shareUrl = new URL(shareHref, baseUrl).toString();
  await page.goto(shareUrl, { waitUntil: "domcontentloaded" });
  await page.locator("main article").waitFor({ state: "visible", timeout: 30000 });
  await page.locator("main article img").first().waitFor({
    state: "visible",
    timeout: 30000
  });
  const sharePageLoadedAt = secondsSince(startedAt);
  await page.waitForTimeout(9000);

  const rawVideoPath = await page.video()?.path();
  await context.close();

  if (!rawVideoPath) {
    throw new Error("Playwright did not produce a video file.");
  }

  const rawVideo = await readFile(rawVideoPath);
  await writeFile(remotionVideoPath, rawVideo);

  const demoData = {
    baseUrl,
    captureVideo: toRelativeStaticPath(remotionVideoPath),
    generatedAt: new Date().toISOString(),
    prompt: promptText,
    resultReadyAtSec: Number(resultReadyAt.toFixed(2)),
    revealEndSec: Number((sharePageLoadedAt + 8).toFixed(2)),
    revealStartSec: Number(Math.max(0, sharePageLoadedAt - 1).toFixed(2)),
    sharePageLoadedAtSec: Number(sharePageLoadedAt.toFixed(2)),
    shareUrl,
    submitEndSec: Number((generateClickedAt + 3).toFixed(2)),
    submitStartSec: Number(Math.max(0, typingStartedAt - 0.8).toFixed(2))
  };

  await writeFile(metadataPath, JSON.stringify(demoData, null, 2) + "\n", "utf8");
  await writeDemoData(demoData);

  console.log(`Captured production demo: ${shareUrl}`);
  console.log(`Raw video copied to ${remotionVideoPath}`);
}

runCapture().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

