import { spawn } from "node:child_process";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "https://vibe-storefront.com";

function spawnCommand(command, args, options = {}) {
  return spawn(command, args, {
    shell: process.platform === "win32",
    stdio: "inherit",
    ...options
  });
}

async function ensureReachable() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(baseUrl, {
      redirect: "manual",
      signal: controller.signal
    });

    if (response.status >= 500) {
      throw new Error(
        `Production smoke target returned HTTP ${response.status}: ${baseUrl}`
      );
    }
  } catch (error) {
    throw new Error(
      `Production smoke target is not reachable: ${baseUrl}`,
      { cause: error }
    );
  } finally {
    clearTimeout(timeout);
  }
}

function runPlaywright() {
  return new Promise((resolve, reject) => {
    const testProcess = spawnCommand(
      "playwright",
      [
        "test",
        "tests/browser-smoke.spec.ts",
        "--browser=chromium",
        "--reporter=line"
      ],
      {
        env: {
          ...process.env,
          PLAYWRIGHT_BASE_URL: baseUrl
        }
      }
    );

    testProcess.on("error", reject);
    testProcess.on("exit", (code, signal) => {
      resolve({ code, signal });
    });
  });
}

try {
  console.log(`Running production browser smoke against ${baseUrl}`);
  await ensureReachable();

  const result = await runPlaywright();

  if (result.code !== 0) {
    process.exitCode = result.code ?? 1;
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
