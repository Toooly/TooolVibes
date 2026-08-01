import { cpSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { spawn } from "node:child_process";

const root = process.cwd();
const standaloneDir = resolve(root, ".next", "standalone");
const serverPath = resolve(standaloneDir, "server.js");

if (!existsSync(serverPath)) {
  console.error("[standalone] Build missing. Run the production build before starting the standalone server.");
  process.exit(1);
}

for (const [source, destination] of [
  [resolve(root, ".next", "static"), resolve(standaloneDir, ".next", "static")],
  [resolve(root, "public"), resolve(standaloneDir, "public")],
]) {
  if (existsSync(source)) {
    cpSync(source, destination, { recursive: true, force: true });
  }
}

const server = spawn(process.execPath, [serverPath], {
  env: process.env,
  stdio: "inherit",
});

server.once("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});
