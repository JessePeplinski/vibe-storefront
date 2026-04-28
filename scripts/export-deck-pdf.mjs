import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { chromium } from "playwright";

const port = process.env.DECK_PDF_PORT ?? "3200";
const baseUrl =
  process.env.DECK_BASE_URL ?? `http://127.0.0.1:${port}`;
const outputPath =
  process.env.DECK_PDF_OUTPUT ??
  "deck-export/vibe-storefront-codex-deck.pdf";
const serverTimeoutMs = Number(process.env.DECK_SERVER_TIMEOUT_MS ?? 60000);
const pollIntervalMs = 500;

function spawnCommand(command, args, options = {}) {
  return spawn(command, args, {
    shell: process.platform === "win32",
    stdio: "inherit",
    ...options
  });
}

async function isReachable() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1000);

  try {
    const response = await fetch(baseUrl, {
      redirect: "manual",
      signal: controller.signal
    });

    return response.status < 500;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

async function waitForServer(server) {
  const startTime = Date.now();

  while (Date.now() - startTime < serverTimeoutMs) {
    if (await isReachable()) {
      return;
    }

    if (server.exitCode !== null) {
      throw new Error(`Next server exited early with code ${server.exitCode}.`);
    }

    await delay(pollIntervalMs);
  }

  throw new Error(`Timed out waiting for ${baseUrl}.`);
}

async function stopServer(server) {
  if (!server || server.exitCode !== null) {
    return;
  }

  server.kill("SIGTERM");

  const exited = await Promise.race([
    new Promise((resolve) => server.once("exit", () => resolve(true))),
    delay(5000).then(() => false)
  ]);

  if (!exited && server.exitCode === null) {
    server.kill("SIGKILL");
  }
}

async function exportPdf() {
  await mkdir(outputPath.split("/").slice(0, -1).join("/"), {
    recursive: true
  });

  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: {
      width: 1280,
      height: 720
    }
  });

  try {
    await page.goto(new URL("/deck?print-pdf", baseUrl).toString(), {
      waitUntil: "networkidle"
    });
    await page.waitForSelector(".reveal.ready", { timeout: 30000 });
    await page.waitForFunction(
      () =>
        document.documentElement.classList.contains("reveal-print") &&
        document.querySelectorAll(".pdf-page").length > 0 &&
        document.querySelectorAll(".pdf-page section[hidden]").length === 0,
      { timeout: 30000 }
    );
    await page.waitForFunction(
      () =>
        Array.from(document.images).every(
          (image) => image.complete && image.naturalWidth > 0
        ),
      { timeout: 30000 }
    );
    await page.pdf({
      landscape: true,
      path: outputPath,
      preferCSSPageSize: true,
      printBackground: true
    });
  } finally {
    await browser.close();
  }
}

let server;
let startedServer = false;

try {
  if (await isReachable()) {
    console.log(`Using existing server at ${baseUrl}`);
  } else {
    const command = existsSync(".next/BUILD_ID") ? "start" : "dev";
    console.log(`Starting Next ${command} server at ${baseUrl}`);
    server = spawnCommand("next", [command, "-p", port], {
      env: {
        ...process.env,
        PORT: port
      }
    });
    startedServer = true;
    await waitForServer(server);
  }

  await exportPdf();
  console.log(`Deck PDF exported to ${outputPath}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  if (startedServer) {
    await stopServer(server);
  }
}
