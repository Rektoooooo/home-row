// Turns the single-file Vite build (a full HTML document) into a claude.ai artifact page: claude.ai wraps the
// file in its own <!doctype><head><body> skeleton, so the page is just <title>, links, styles, markup and scripts.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
const src = process.argv[2] || "dist-artifact/app/index.html";
const out = process.argv[3] || "artifact/home-row.html";
const html = readFileSync(src, "utf8");
const pick = (re) => [...html.matchAll(re)].map((m) => m[0]);
const head = html.slice(html.indexOf("<head>") + 6, html.indexOf("</head>"));
const body = html.slice(html.indexOf("<body>") + 6, html.lastIndexOf("</body>"));
const title = (head.match(/<title>[\s\S]*?<\/title>/) || ["<title>Home Row</title>"])[0];
const links = [...head.matchAll(/<link [^>]*(fonts\.googleapis|fonts\.gstatic)[^>]*>/g)].map((m) => m[0]);
const styles = [...head.matchAll(/<style[^>]*>[\s\S]*?<\/style>/g)].map((m) => m[0]);
const scripts = [...head.matchAll(/<script[^>]*>[\s\S]*?<\/script>/g)].map((m) => m[0]);
if (/<script[^>]*\bsrc=/.test(scripts.join("")) || /<link[^>]*stylesheet[^>]*href="\/(?!\/)/.test(head))
  throw new Error("build still references external files; the artifact must be self-contained");
const page = [title, '<meta name="claude:viewport-fit-sides" content="cover">', ...links, ...styles, body.trim(), ...scripts].join("\n");
mkdirSync(out.replace(/\/[^/]+$/, ""), { recursive: true });
writeFileSync(out, page);
console.log(`artifact page: ${out} (${(page.length / 1024).toFixed(0)} KB)`);
