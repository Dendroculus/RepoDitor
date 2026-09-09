(() => {
  const locales = new Set(["en", "id", "ja", "ko", "zh-CN"]);
  let theme;
  let locale;
  try {
    const stored = localStorage.getItem("repoditor-theme");
    theme = stored === "dark" || stored === "light" ? stored : undefined;
    const storedLocale = localStorage.getItem("repoditor-locale");
    locale = locales.has(storedLocale) ? storedLocale : undefined;
  } catch {
    // Browser privacy settings may deny storage; safe defaults remain available.
  }
  theme ??= matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  locale ??= "en";
  document.documentElement.dataset.theme = theme;
  document.documentElement.dataset.themeReady = "true";
  document.documentElement.dataset.locale = locale;
  document.documentElement.lang = locale;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", theme === "light" ? "#f3f2ed" : "#0d1110");
})();
