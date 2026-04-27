import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

const port = process.env.SMOKE_PORT ?? "3100";
const baseUrl =
  process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${port}`;
const serverTimeoutMs = Number(process.env.SMOKE_SERVER_TIMEOUT_MS ?? 60000);
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

let server;
let startedServer = false;

try {
  if (await isReachable()) {
    console.log(`Using existing server at ${baseUrl}`);
  } else {
    console.log(`Starting Next server at ${baseUrl}`);
    server = spawnCommand("next", ["start", "-p", port], {
      env: {
        ...process.env,
        PORT: port
      }
    });
    startedServer = true;
    await waitForServer(server);
  }

  const result = await runPlaywright();

  if (result.code !== 0) {
    process.exitCode = result.code ?? 1;
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  if (startedServer) {
    await stopServer(server);
  }
}
