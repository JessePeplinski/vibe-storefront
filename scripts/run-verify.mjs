import { spawn } from "node:child_process";

const collectCoverage = process.env.CI_COLLECT_COVERAGE === "1";
const skipBrowserSmoke = process.env.CI_SKIP_BROWSER_SMOKE === "1";

const steps = [
  ["typecheck", ["npm", ["run", "typecheck"]]],
  ["lint", ["npm", ["run", "lint"]]],
  [
    collectCoverage ? "unit tests with coverage" : "unit tests",
    ["npm", ["run", collectCoverage ? "test:coverage" : "test"]]
  ],
  ["build", ["npm", ["run", "build"]]]
];

if (!skipBrowserSmoke) {
  steps.push(["browser smoke", ["npm", ["run", "smoke:browser"]]]);
}

function runStep(label, command, args) {
  console.log(`\n> verify: ${label}`);

  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      shell: process.platform === "win32",
      stdio: "inherit"
    });

    child.on("error", reject);
    child.on("exit", (code, signal) => {
      resolve({ code, signal });
    });
  });
}

for (const [label, [command, args]] of steps) {
  const result = await runStep(label, command, args);

  if (result.code !== 0) {
    process.exitCode = result.code ?? 1;
    break;
  }
}

if (skipBrowserSmoke && process.exitCode === undefined) {
  console.log("\n> verify: browser smoke skipped by CI_SKIP_BROWSER_SMOKE=1");
}
