import { join, resolve } from "node:path";
import { spawn, spawnSync } from "node:child_process";

const root = resolve(import.meta.dirname, "..");
const url = "http://127.0.0.1:4173";

async function waitForPreview() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      if ((await fetch(url)).ok) return;
    } catch {
      // Preview is still starting.
    }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 200));
  }
  throw new Error("Vite preview did not become ready.");
}

const preview = spawn(
  process.execPath,
  [
    join(root, "node_modules", "vite", "bin", "vite.js"),
    "preview",
    "--host",
    "127.0.0.1",
    "--port",
    "4173",
  ],
  { cwd: root, stdio: "inherit" },
);

try {
  await waitForPreview();
  const result = spawnSync(
    process.execPath,
    [join(root, "node_modules", "@playwright", "test", "cli.js"), "test"],
    {
      cwd: root,
      env: { ...process.env, REPODITOR_PREVIEW_READY: "1" },
      stdio: "inherit",
    },
  );
  if (result.status !== 0) process.exitCode = result.status ?? 1;
} finally {
  preview.kill();
}
