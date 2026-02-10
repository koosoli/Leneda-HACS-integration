import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig(({ command }) => {
  const isDev = command === "serve";

  return {
    // In production, assets must be served from /leneda-panel/static/ (matches panel.py).
    // In dev, Vite's root "/" is fine — no iframe rewriting needed.
    // If VITE_BASE_URL is set (e.g. for GitHub Pages), use that.
    base: process.env.VITE_BASE_URL || (isDev ? "/" : "/leneda-panel/static/"),

    build: {
      // Output built files directly into the integration's frontend/ directory
      outDir: resolve(__dirname, "../custom_components/leneda/frontend"),
      emptyOutDir: true,
      rollupOptions: {
        input: resolve(__dirname, "index.html"),
      },
    },

    server: {
      port: 5175,
      open: false,
    },

    // Dev-only: load the mock/live API plugin
    plugins: isDev
      ? [
          // Lazy-load to avoid importing dev deps in production builds
          (async () => {
            const { lenedaDevApi } = await import("./dev/dev-server-plugin");
            return lenedaDevApi();
          })() as any,
        ]
      : [],

    resolve: {
      alias: {
        "@": resolve(__dirname, "src"),
      },
    },
  };
});
