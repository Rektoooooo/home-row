/* Phase 3 visual comparison: React app vs the legacy app with the same seeded progress.
   node scripts/e2e/shots-phase3.mjs  → notes/shots/phase3/{react,legacy}-<view>-<width>-<scheme>.png */
import { launch, newPage, seedState, typeStage, REACT, LEGACY } from "./lib.mjs";
import { mkdirSync } from "node:fs";
const OUT = new URL("../../notes/shots/phase3/", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const SIZES = [[1600, 980], [1024, 768], [390, 844]];
const only = process.argv[2];
const b = await launch();
const FIXED = "the quick brown fox jumps over the lazy dog and keeps typing along the line without any stop";

for (const which of ["react", "legacy"]) {
  const url = which === "react" ? REACT : LEGACY;
  for (const scheme of ["light", "dark"]) {
    for (const [w, h] of SIZES) {
      if (only && only !== `${w}`) continue;
      const tag = `${w}-${scheme}`;
      const { ctx, page, errors } = await newPage(b, { width: w, height: h, scheme, reducedMotion: "reduce", state: seedState() }, url);
      const shot = async (name, full = false) => { await page.waitForTimeout(350); await page.screenshot({ path: `${OUT}${which}-${name}-${tag}.png`, fullPage: full }); };
      await shot("learn", false);
      await shot("learn-full", true);
      // lesson 6 (next lesson) intro
      await page.evaluate(() => { location.hash = "learn"; });
      const row = page.locator(".lrow").nth(5);
      await row.click();
      await page.waitForTimeout(300);
      await shot("intro", false);
      // stage: Enter starts the lesson, type a few characters so it is mid-run
      await page.keyboard.press("Enter");
      await page.waitForSelector("#txt .c");
      await page.waitForTimeout(300);
      const txt = await page.evaluate(() => [...document.querySelectorAll("#txt .c")].map(e => e.textContent).join(""));
      for (const ch of txt.slice(0, 14)) await page.keyboard.press(ch === " " ? "Space" : ch);
      await shot("stage", false);
      // finish the rest of step 1, then steps 2 and 3 → results
      for (const ch of txt.slice(14)) await page.keyboard.press(ch === " " ? "Space" : ch);
      await page.waitForSelector(".result"); await shot("summary", false);
      await page.keyboard.press("Enter");
      await typeStage(page); await page.waitForSelector(".result"); await page.keyboard.press("Enter");
      await typeStage(page); await page.waitForSelector(".result .stars, .result .status");
      await shot("results", false);
      await ctx.close();
      if (errors.length) console.log(which, tag, "console errors:", errors.slice(0, 3));
    }
  }
}
await b.close();
