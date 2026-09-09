import { expect, test } from "@playwright/test";

import { loadSave } from "./fixtures";

test.beforeEach(async ({ page }) => page.goto("/"));

test("theme toggles directly and persists without persisting save state", async ({ page }) => {
  await page.getByRole("button", { name: "Switch to light theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  expect(await page.evaluate(() => ({ ...localStorage }))).toEqual({ "repoditor-theme": "light" });
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(page.getByRole("button", { name: "Switch to dark theme" })).toBeVisible();
});

test("language shell, GitHub link, and hash-addressable policy dialogs work", async ({ page }) => {
  await expect(page.getByRole("combobox", { name: "Language" })).toHaveValue("en");
  await expect(page.getByRole("link", { name: "GitHub" }).first()).toHaveAttribute(
    "href",
    "https://github.com/Yoruxyv/RepoDitor",
  );
  const trigger = page.getByRole("link", { name: "Data & Privacy" });
  await trigger.click();
  await expect(page).toHaveURL(/#privacy$/u);
  await expect(page.getByRole("dialog")).toContainText(
    "Save contents are processed locally and are not persisted by RepoDitor Web.",
  );
  await page.goBack();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(trigger).toBeFocused();

  await page.goto("/#security");
  await expect(page.getByRole("dialog")).toContainText("Report vulnerabilities privately");
  await page.getByRole("button", { name: "Close Security" }).press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
});

test("critical Run path has no horizontal overflow on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await expect(page.getByText("Run saves").first()).toBeVisible();
  await loadSave(page, "run");
  await page.getByRole("tab", { name: "Run" }).click();
  await page.getByRole("spinbutton", { name: "Currency" }).fill("13");
  await expect(page.getByText("1 pending change")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});
