import { fileURLToPath, URL } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  base: "./",
  publicDir: false,
  plugins: [react()],
  build: {
    assetsInlineLimit: 0,
    emptyOutDir: true,
    outDir: fileURLToPath(new URL("../../build/installer-ui", import.meta.url)),
    sourcemap: false,
  },
});
