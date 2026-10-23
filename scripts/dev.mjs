/** Module responsible for starting the local API and web application. */

import { spawn } from "node:child_process";

const children = [
  spawn(".venv/bin/python", ["-m", "nilik.cli.serve"], { stdio: "inherit" }),
  spawn("pnpm", ["--dir", "web", "dev"], { stdio: "inherit" }),
];

function stop() {
  for (const child of children) child.kill("SIGTERM");
}

process.on("SIGINT", stop);
process.on("SIGTERM", stop);
for (const child of children)
  child.on("exit", (code) => code && process.exit(code));
