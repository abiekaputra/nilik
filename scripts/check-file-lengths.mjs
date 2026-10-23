/** Module responsible for enforcing source file length limits. */

import { readdir, readFile } from "node:fs/promises";
import { extname, join } from "node:path";

const roots = ["src", "web/src", "scripts", "tests", "e2e"];
const extensions = new Set([".py", ".ts", ".tsx", ".js", ".mjs", ".css"]);
const failures = [];

async function inspect(path) {
  for (const entry of await readdir(path, { withFileTypes: true })) {
    const target = join(path, entry.name);
    if (entry.isDirectory()) {
      await inspect(target);
      continue;
    }
    if (!extensions.has(extname(entry.name))) continue;
    const lines = (await readFile(target, "utf8")).split("\n").length;
    const limit =
      target.startsWith("tests") || target.includes(".test.")
        ? 1000
        : extname(entry.name) === ".py"
          ? 400
          : 300;
    if (lines > limit) failures.push(`${target}: ${lines}/${limit}`);
  }
}

for (const root of roots) await inspect(root);
if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log("Source file length limits passed.");
