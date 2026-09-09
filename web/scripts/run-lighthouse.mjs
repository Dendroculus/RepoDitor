import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { spawn, spawnSync } from "node:child_process";

import { chromium } from "@playwright/test";
import lighthouse from "lighthouse";
import desktopConfig from "lighthouse/core/config/desktop-config.js";

import { LIGHTHOUSE_RUNS, readAndEvaluateLighthouse } from "./check-lighthouse-budget.mjs";

const ROOT = resolve(import.meta.dirname, "..");
const OUTPUT = join(ROOT, ".lighthouse");
const URL = "http://127.0.0.1:4174";
const CHROME_PORT = 9223;

function run(command, args, env = process.env) {
  const result = spawnSync(command, args, { cwd: ROOT, encoding: "utf8", env, stdio: "inherit" });
  if (result.status !== 0) throw new Error(`${command} ${args.join(" ")} failed.`);
}

async function waitFor(url, name) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      if ((await fetch(url)).ok) return;
    } catch {
      // The local process is still starting.
    }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 200));
  }
  throw new Error(`${name} did not become ready.`);
}

await mkdir(OUTPUT, { recursive: true });
const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error("Run Lighthouse through npm so its build command is available.");
run(process.execPath, [npmCli, "run", "build"]);
const preview = spawn(
  process.execPath,
  [
    join(ROOT, "node_modules", "vite", "bin", "vite.js"),
    "preview",
    "--host",
    "127.0.0.1",
    "--port",
    "4174",
  ],
  { cwd: ROOT, stdio: "inherit" },
);
const chrome = spawn(
  chromium.executablePath(),
  [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    `--remote-debugging-port=${CHROME_PORT}`,
    "--remote-debugging-address=127.0.0.1",
    `--user-data-dir=${join(OUTPUT, `chrome-${process.pid}`)}`,
    "about:blank",
  ],
  { stdio: "ignore" },
);

try {
  await Promise.all([
    waitFor(URL, "Vite preview"),
    waitFor(`http://127.0.0.1:${CHROME_PORT}/json/version`, "Chromium debugger"),
  ]);
  const failures = [];

  for (const profile of ["desktop", "mobile"]) {
    const paths = [];
    for (let index = 1; index <= LIGHTHOUSE_RUNS; index += 1) {
      const outputPath = join(OUTPUT, `${profile}-${index}.json`);
      paths.push(outputPath);
      const result = await lighthouse(
        URL,
        {
          logLevel: "silent",
          onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
          output: "json",
          port: CHROME_PORT,
        },
        profile === "desktop" ? desktopConfig : undefined,
      );
      if (!result) throw new Error(`${profile} Lighthouse run ${index} returned no report.`);
      await writeFile(outputPath, JSON.stringify(result.lhr), "utf8");
    }
    const result = await readAndEvaluateLighthouse(profile, paths);
    console.log(
      `${profile}: performance ${result.performance.join(", ")} (mean ${result.mean.toFixed(1)})`,
    );
    failures.push(...result.failures.map((failure) => `${profile}: ${failure}`));
  }

  if (failures.length) throw new Error(`Lighthouse budget failed:\n${failures.join("\n")}`);
  console.log("Lighthouse budgets passed.");
} finally {
  chrome.kill();
  preview.kill();
}
