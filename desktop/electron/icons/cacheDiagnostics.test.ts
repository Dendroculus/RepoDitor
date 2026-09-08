// @vitest-environment node

import { createRequire } from "node:module";
import { mkdtemp, readFile, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const {
  createPresentationCacheDiagnosticSink,
} = require("../../dist-electron/icons/cacheDiagnostics.cjs");

describe("presentation cache diagnostics", () => {
  it("writes only bounded support fields and omits unsafe upgrade keys", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "repoditor-cache-diagnostics-"));
    const logPath = path.join(root, "presentation-cache-diagnostics.jsonl");
    const sink = createPresentationCacheDiagnosticSink(logPath);

    await sink({ reason: "source-changed", upgradeKey: "playerUpgradeHealth" });
    await sink({ reason: "artifact-invalid", upgradeKey: "unsafe key with spaces" });
    const records = (await readFile(logPath, "utf8"))
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line));

    expect(Object.keys(records[0]).sort((left, right) => left.localeCompare(right))).toEqual([
      "reason",
      "timestamp",
      "upgradeKey",
    ]);
    expect(records[0]).toMatchObject({
      reason: "source-changed",
      upgradeKey: "playerUpgradeHealth",
    });
    expect(new Date(records[0].timestamp).toISOString()).toBe(records[0].timestamp);
    expect(Object.keys(records[1]).sort((left, right) => left.localeCompare(right))).toEqual([
      "reason",
      "timestamp",
    ]);
    expect(records[1]).toMatchObject({ reason: "artifact-invalid" });
  });

  it("deduplicates repeated decisions and rotates the local file below its bound", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "repoditor-cache-diagnostics-"));
    const logPath = path.join(root, "presentation-cache-diagnostics.jsonl");
    const sink = createPresentationCacheDiagnosticSink(logPath);

    await sink({ reason: "memory-hit", upgradeKey: "playerUpgradeHealth" });
    await sink({ reason: "memory-hit", upgradeKey: "playerUpgradeHealth" });
    for (let index = 0; index < 700; index += 1) {
      await sink({ reason: "persistent-hit", upgradeKey: `upgrade${index}` });
    }

    const records = (await readFile(logPath, "utf8")).trim().split("\n");
    expect(records.filter((line) => line.includes('"reason":"memory-hit"'))).toHaveLength(1);
    expect((await stat(logPath)).size).toBeLessThanOrEqual(64 * 1024);
  });
});
