import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { expect, type Page } from "@playwright/test";

export async function saveFixture(name: "meta" | "run") {
  const encoded = await readFile(
    resolve(import.meta.dirname, "fixtures", `${name}.es3.b64`),
    "utf8",
  );
  return Buffer.from(encoded.trim(), "base64");
}

export async function loadSave(page: Page, name: "meta" | "run") {
  await page.locator('input[type="file"]').setInputFiles({
    buffer: await saveFixture(name),
    mimeType: "application/octet-stream",
    name: name === "run" ? "REPO_SAVE.es3" : "MetaSave.es3",
  });
  await expect(page.getByTestId("save-workspace")).toBeVisible();
}
