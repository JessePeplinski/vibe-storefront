import { spawn } from "node:child_process";

const steps = [
  ["typecheck", ["npm", ["run", "typecheck"]]],
  ["lint", ["npm", ["run", "lint"]]],
  ["unit tests", ["npm", ["test"]]],
  ["build", ["npm", ["run", "build"]]],
  ["browser smoke", ["npm", ["run", "smoke:browser"]]]
];

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
