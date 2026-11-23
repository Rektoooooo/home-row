// Prerenders <Landing/> into dist/index.html (run after `vite build`). The landing page is static HTML that
// hydrates in the browser: the build ships the full page, no content waits on JavaScript.
import { createServer } from "vite";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const file = resolve(root, "dist/index.html");
const html = readFileSync(file, "utf8");
if (!html.includes("<!--landing-->")) throw new Error("dist/index.html has no <!--landing--> placeholder (already prerendered?)");

const server = await createServer({ root, appType: "custom", server: { middlewareMode: true }, logLevel: "error" });
try {
  const { render } = await server.ssrLoadModule("/src/landing/entry-server.tsx");
  const markup = render().replace(/<link rel="preload"[^>]*\/>/g, ""); // React hoists image preloads; the head already has what it needs
  writeFileSync(file, html.replace("<!--landing-->", () => markup));
  console.log(`prerendered landing: dist/index.html (${(markup.length / 1024).toFixed(0)} KB of markup)`);
} finally {
  await server.close();
}
