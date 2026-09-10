import { readFile } from "node:fs/promises";

import { expect, test, type Locator, type Page } from "@playwright/test";

import { launchSourceE2eHarness, type SourceE2eHarness } from "./support/harness";
import { waitForDiscoveredSave } from "./support/waits";

const TEST_VALUES = {
  cosmeticIcon27Loading: "cosmetic-icon-27-loading",
  cosmeticsPendingEditCount: "cosmetics-pending-edit-count",
  dataLoadedBeforeFilter: "data-loaded-before-filter",
  pendingChange: "1 pending change",
  revertAll: "Revert all",
  searchCosmetics: "Search cosmetics",
} as const;

async function imageNaturalWidth(locator: Locator): Promise<number> {
  return locator.evaluate((element) => {
    if (!(element instanceof HTMLImageElement)) {
      throw new Error("Expected locator to resolve to an HTMLImageElement.");
    }

    return element.naturalWidth;
  });
}

async function selectCustomOption(page: Page, label: string, value: string): Promise<void> {
  const control = page.getByRole("combobox", { name: label });
  if ((await control.getAttribute("aria-expanded")) !== "true") {
    await control.click();
  }
  await page.locator(`[role="option"][data-value=${JSON.stringify(value)}]`).click();
}

test("covers cosmetic catalog and pending-edit behavior", async () => {
  let harness: SourceE2eHarness | undefined;

  try {
    harness = await launchSourceE2eHarness();
    const { page, savePath, metaPath, sourceBefore, metaBefore } = harness;

    await waitForDiscoveredSave(page);
    await page.getByRole("button", { name: "Cosmetics" }).click();

    await expect(page.getByRole("heading", { name: "Cosmetics" })).toBeVisible();
    await expect(page.getByText("Known catalog")).toBeVisible();
    await expect(page.getByText("Saved presets")).toBeVisible();
    await expect(page.getByLabel("Search by cosmetic ID")).toHaveCount(0);
    await expect(page.getByText("Cosmetic #27")).toHaveCount(0);
    const cosmeticIcon = page.getByTestId("cosmetic-icon-27");
    await expect(cosmeticIcon.locator("img")).toHaveAttribute("loading", "lazy");
    expect(await imageNaturalWidth(cosmeticIcon.locator("img"))).toBe(0);
    await cosmeticIcon.scrollIntoViewIfNeeded();
    await expect(cosmeticIcon.locator("img")).toBeVisible();
    await expect.poll(() => imageNaturalWidth(cosmeticIcon.locator("img"))).toBeGreaterThan(0);
    await expect(cosmeticIcon.locator("img")).not.toHaveAttribute("src", /AppData|LocalLow|\.png/i);
    await cosmeticIcon.locator("img").evaluate((image) => {
      image.dataset.loadedBeforeFilter = "true";
    });
    await selectCustomOption(page, "Type", "0");
    await expect(cosmeticIcon).toBeHidden();
    await selectCustomOption(page, "Type", "all");
    await page
      .getByRole("searchbox", { name: TEST_VALUES.searchCosmetics })
      .fill("missing cosmetic");
    await expect(cosmeticIcon).toBeHidden();
    await page.getByRole("searchbox", { name: TEST_VALUES.searchCosmetics }).fill("");
    await selectCustomOption(page, "Ownership", "locked");
    await expect(cosmeticIcon).toBeHidden();
    await selectCustomOption(page, "Ownership", "all");
    await selectCustomOption(page, "Sort", "id-desc");
    await expect(cosmeticIcon.locator("img")).toHaveAttribute(
      TEST_VALUES.dataLoadedBeforeFilter,
      "true",
    );
    await expect(page.getByTestId(TEST_VALUES.cosmeticIcon27Loading)).toHaveCount(0);
    await expect(page.getByTestId("cosmetic-icon-26")).toHaveAttribute(
      "data-icon-source",
      "fallback",
    );
    await expect(page.getByRole("button", { name: "Clear All Presets" })).toBeDisabled();
    await page.getByRole("button", { name: "Lock All Cosmetics", exact: true }).click();
    await expect(page.getByTestId(TEST_VALUES.cosmeticsPendingEditCount)).toHaveText(
      TEST_VALUES.pendingChange,
    );
    await expect(page.locator("#cosmetics-pending")).toContainText(TEST_VALUES.pendingChange);
    expect((await readFile(metaPath)).equals(metaBefore)).toBe(true);
    expect((await readFile(savePath)).equals(sourceBefore)).toBe(true);
    await page.getByRole("button", { name: "Run Saves" }).click();
    await page.getByRole("button", { name: "Cosmetics" }).click();
    await expect(cosmeticIcon.locator("img")).toHaveAttribute(
      TEST_VALUES.dataLoadedBeforeFilter,
      "true",
    );
    await expect(page.getByTestId(TEST_VALUES.cosmeticIcon27Loading)).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Lock All pending" })).toBeDisabled();
    await page.getByRole("button", { name: TEST_VALUES.revertAll }).click();
    await page.getByRole("button", { name: "Unlock All Cosmetics", exact: true }).click();
    await expect(page.getByTestId(TEST_VALUES.cosmeticsPendingEditCount)).toHaveText(
      TEST_VALUES.pendingChange,
    );
    await page.getByRole("button", { name: TEST_VALUES.revertAll }).click();
  } finally {
    await harness?.dispose();
  }
});
