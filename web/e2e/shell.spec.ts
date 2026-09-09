import { expect, test } from "@playwright/test";

import { loadSave } from "./fixtures";

test.beforeEach(async ({ page }) => page.goto("/"));

test("theme toggles directly and persists without persisting save state", async ({ page }) => {
  const toggle = page.getByRole("button", { name: "Switch to light theme" });
  const icons = toggle.locator("[data-theme-icon]");
  const moon = page.locator('[data-theme-icon="moon"]');
  const sun = page.locator('[data-theme-icon="sun"]');
  const initialMoonTransform = await moon.evaluate((node) => getComputedStyle(node).transform);
  const initialSunTransform = await sun.evaluate((node) => getComputedStyle(node).transform);
  await expect(icons).toHaveCount(2);
  await expect(page.locator(".theme-surface").first()).toHaveCSS("transition-duration", "0.18s");
  await toggle.click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect
    .poll(() => moon.evaluate((node) => getComputedStyle(node).transform))
    .not.toBe(initialMoonTransform);
  await expect
    .poll(() => sun.evaluate((node) => getComputedStyle(node).transform))
    .not.toBe(initialSunTransform);
  expect(await page.evaluate(() => ({ ...localStorage }))).toEqual({ "repoditor-theme": "light" });
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(page.getByRole("button", { name: "Switch to dark theme" })).toBeVisible();
});

test("language shell, GitHub link, and hash-addressable policy dialogs work", async ({ page }) => {
  const languageTrigger = page.getByRole("button", { name: "Language: English" });
  await expect(languageTrigger).toHaveText("English");
  await languageTrigger.click();
  const languageMenu = page.getByRole("listbox", { name: "Language" });
  const englishOption = page.getByRole("option", { name: "English" });
  await expect(englishOption).toBeFocused();
  const [menuBox, optionBox] = await Promise.all([
    languageMenu.boundingBox(),
    englishOption.boundingBox(),
  ]);
  expect(menuBox).not.toBeNull();
  expect(optionBox).not.toBeNull();
  if (!menuBox || !optionBox) throw new Error("Language menu must have visible geometry.");
  expect(optionBox.width).toBeGreaterThanOrEqual(menuBox.width - 10);
  await englishOption.press("Escape");
  await expect(languageMenu).not.toBeVisible();
  await expect(languageTrigger).toBeFocused();
  await expect(page.getByRole("link", { name: "GitHub" }).first()).toHaveAttribute(
    "href",
    "https://github.com/Yoruxyv/RepoDitor",
  );
  const trigger = page.getByRole("link", { name: "Data & Privacy" });
  await trigger.click();
  await expect(page).toHaveURL(/#privacy$/u);
  const policyDialog = page.getByRole("dialog");
  await expect(policyDialog).toHaveAttribute("data-state", "open");
  await expect(policyDialog).toContainText(
    "Save contents are processed locally and are not persisted by RepoDitor Web.",
  );
  await expect(policyDialog).toHaveCSS("transition-duration", "0.3s");
  await page.goBack();
  await expect(policyDialog).toHaveAttribute("data-state", "closing");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(trigger).toBeFocused();

  await page.goto("/#security");
  await expect(page.getByRole("dialog")).toContainText("Report vulnerabilities privately");
  await page.getByRole("button", { name: "Close Security" }).press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
});

test("Find my save scrolls only when the viewport is genuinely short", async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.getByRole("button", { name: "Find my save" }).click();
  const dialog = page.getByRole("dialog", { name: "Find my save" });
  const scrollRegion = page.getByTestId("find-save-scroll-region");
  const normalSize = await scrollRegion.evaluate((element) => ({
    clientHeight: element.clientHeight,
    scrollHeight: element.scrollHeight,
  }));
  expect(normalSize.scrollHeight).toBeLessThanOrEqual(normalSize.clientHeight);
  await expect(dialog).toHaveCSS("max-width", "576px");

  await page.setViewportSize({ width: 1366, height: 500 });
  await expect
    .poll(() => scrollRegion.evaluate((element) => element.scrollHeight > element.clientHeight))
    .toBe(true);
  await expect(page.getByRole("button", { name: "Close save location guide" })).toBeVisible();

  await page.setViewportSize({ width: 375, height: 812 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
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
