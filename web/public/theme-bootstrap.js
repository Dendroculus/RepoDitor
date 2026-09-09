(() => {
  let theme;
  try {
    const stored = localStorage.getItem("repoditor-theme");
    theme = stored === "dark" || stored === "light" ? stored : undefined;
  } catch {
    // Browser privacy settings may deny storage; system preference remains available.
  }
  theme ??= matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  document.documentElement.dataset.theme = theme;
  document.documentElement.dataset.themeReady = "true";
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", theme === "light" ? "#f3f2ed" : "#0d1110");
})();
