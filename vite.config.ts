/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import { resolve } from "node:path";

const root = import.meta.dirname;

// Two builds from one codebase:
//   vite build                  → dist/ (landing at /, trainer at /app/) for Vercel
//   vite build --mode artifact  → dist-artifact/app/index.html, one self-contained file for claude.ai
export default defineConfig(({ mode }) => {
  const artifact = mode === "artifact";
  return {
    plugins: [react(), tailwindcss(), ...(artifact ? [viteSingleFile({ removeViteModuleLoader: true })] : [])],
    resolve: { alias: { "@": resolve(root, "src") } },
    define: { __ARTIFACT__: JSON.stringify(artifact) },
    build: artifact
      ? { outDir: "dist-artifact", emptyOutDir: true, rollupOptions: { input: resolve(root, "app/index.html") } }
      : {
          outDir: "dist",
          emptyOutDir: true,
          rollupOptions: { input: { main: resolve(root, "index.html"), app: resolve(root, "app/index.html") } },
        },
    test: { environment: "node", include: ["src/**/*.test.ts"] },
  };
});
