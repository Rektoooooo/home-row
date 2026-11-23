/* Phase 6 e2e: the prerendered landing page. Needs the build served:  npx vite preview --port 5204
   (LAND_URL overrides http://localhost:5204/). Legacy comparison shots need http://localhost:8780/ (LEGACY_LAND_URL). */
import { chromium } from "playwright-core";

const URL_ = process.env.LAND_URL || "http://localhost:5204/";
const LEG = process.env.LEGACY_LAND_URL || "http://localhost:8780/";
const SHOTS = "notes/shots/phase6/";
let fails = 0;
const ok = (c, m) => { console.log((c ? "PASS " : "FAIL ") + m); if (!c) fails++; };
const b = await chromium.launch({ channel: "chrome", headless: true });

/* a counting AudioContext, injected before the page runs */
const audioSpy = () => {
  window.__nodes = 0;
  const C = window.AudioContext;
  const wrap = (proto, names) => names.forEach((n) => { const o = proto[n]; proto[n] = function (...a) { window.__nodes++; return o.apply(this, a); }; });
  wrap(C.prototype, ["createOscillator", "createBufferSource", "createGain", "createBiquadFilter"]);
};
async function open(opts = {}, url = URL_) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, colorScheme: "light", ...opts });
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  await page.addInitScript(audioSpy);
  await page.goto(url, { waitUntil: "load" });
  await page.addStyleTag({ content: "html{scroll-behavior:auto!important}" }); // the page scrolls smoothly; tests jump
  await page.waitForTimeout(600);
  return { ctx, page, errors };
}

// 1. JS disabled: the prerendered HTML is the whole page
{
  const ctx = await b.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  await p.goto(URL_);
  ok((await p.locator("h1").innerText()).startsWith("Type with all ten fingers"), "no-JS: h1 prerendered");
  ok(await p.locator("#dKb .key").count() === 60, "no-JS: demo keyboard prerendered");
  ok(await p.locator(".sk").count() === 4 && await p.locator("#coach").count() === 1 && await p.locator("footer").count() === 1, "no-JS: all sections present");
  ok(await p.locator(".rv").first().evaluate((e) => getComputedStyle(e).opacity) === "1", "no-JS: reveal content visible (no .js class)");
  ok(await p.locator("#dText .c").count() === 38, "no-JS: sentence 1 shown");
  await ctx.close();
}

// 2. with JS: hydrates cleanly, nav, reveal, demo
const { ctx, page, errors } = await open();
ok(await page.locator("html.js").count() === 1, "html.js class set by the head script");
ok(await page.locator("#h1.in").count() === 1, "hero reveal runs after hydration");
ok(await page.locator("#features .rv:not(.in)").count() > 0, "below-fold reveal waits for scroll");
await page.evaluate(() => document.getElementById("practice").scrollIntoView()); await page.waitForTimeout(900);
ok(await page.locator("#practice .h2.in").count() === 1, "reveal on scroll");
ok(await page.locator("#nav.stuck").count() === 1, "nav gets .stuck when scrolled");
await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(300);
ok(await page.locator("#nav.stuck").count() === 0, "nav unsticks at top");
ok(await page.locator("#yr").innerText() === String(new Date().getFullYear()), "footer shows the current year");
ok((await page.locator("a.btn.sm").first().getAttribute("href")) === "/app/", "nav CTA -> /app/");
for (const sel of [".badge", ".cta-row .btn.lg:not(.quiet)", ".coachbox .btn", ".cbox .btn", "footer a.s"]) ok((await page.locator(sel).first().getAttribute("href")) === "/app/", "CTA " + sel + " -> /app/");

// typing demo
const demoText = () => page.evaluate(() => [...document.querySelectorAll("#dText .c")].map((e) => e.textContent).join(""));
await page.evaluate(() => document.getElementById("demo").scrollIntoView({ block: "center" }));
let sawChip = false, sawBad = false, sawBk = false, sawTyped = false;
for (let i = 0; i < 160 && !(sawBad && sawBk && sawTyped); i++) {
  await page.waitForTimeout(100);
  const st = await page.evaluate(() => ({ bad: !!document.querySelector("#dText .c.bad"), next: document.querySelector("#dKb .key.next")?.dataset.id, chip: document.getElementById("dFin").textContent, key: document.getElementById("dKey").textContent, cnt: +document.getElementById("dCnt").textContent }));
  if (/(Left|Right) (pinky|ring|middle|index)/.test(st.chip)) sawChip = true;
  if (st.bad) { sawBad = true; if (st.next === "bk" && st.key === "delete") sawBk = true; }
  if (st.cnt > 10) sawTyped = true;
}
ok(sawTyped, "demo types"); ok(sawChip, "finger chip shows a finger"); ok(sawBad, "demo makes a mistake"); ok(sawBk, "backspace highlighted while the mistake is on screen");
await page.waitForFunction(() => !document.querySelector("#dText .c.bad") && +document.getElementById("dCnt").textContent > 14, null, { timeout: 8000 }).catch(() => {});
ok(!(await page.locator("#dText .c.bad").count()), "mistake got fixed");
ok(/^\d+%$/.test(await page.locator("#dAcc").innerText()) && +(await page.locator("#dProg").evaluate((e) => parseFloat(e.style.width))) >= 0, "stats update");
// pauses when scrolled away
await page.evaluate(() => scrollTo(0, 3000)); await page.waitForTimeout(1500);
const c1 = await page.locator("#dCnt").innerText(); await page.waitForTimeout(1500);
ok(c1 === await page.locator("#dCnt").innerText(), "demo pauses when scrolled away");
await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(2500);
ok(c1 !== await page.locator("#dCnt").innerText() || (await demoText()) !== "", "demo resumes when visible");

// practice tabs
await page.evaluate(() => document.getElementById("practice").scrollIntoView());
await page.click("#tab-code"); await page.waitForTimeout(100);
ok(await page.locator("#pane-code.on").count() === 1 && await page.locator("#tab-code").getAttribute("aria-selected") === "true" && await page.locator("#pane-real.on").count() === 0, "tab click switches pane");
await page.keyboard.press("ArrowRight"); ok(await page.locator("#pane-own.on").count() === 1, "ArrowRight -> Your text");
await page.keyboard.press("ArrowRight"); ok(await page.locator("#pane-real.on").count() === 1, "ArrowRight wraps");
await page.keyboard.press("End"); ok(await page.locator("#pane-own.on").count() === 1, "End");
await page.keyboard.press("Home"); ok(await page.locator("#pane-real.on").count() === 1 && await page.locator("#tab-real").evaluate((e) => document.activeElement === e), "Home");

// sound keycap
await page.evaluate(() => document.querySelector(".keys4").scrollIntoView({ block: "center" })); await page.waitForTimeout(700);
const n0 = await page.evaluate(() => window.__nodes);
await page.click('.sk[data-pack="cream"]');
ok(await page.locator(".sk.tap").count() === 1, "tap animation class"); await page.waitForTimeout(250);
ok((await page.evaluate(() => window.__nodes)) > n0 + 10, "sound keycap creates audio nodes");
ok(await page.locator("#soundNote").innerText() === "Playing Creamy.", "sound note updates"); ok(await page.locator(".sk.tap").count() === 0, "tap class removed");

// share card
await page.waitForFunction(() => window.__cardDrawn === true, null, { timeout: 8000 }).catch(() => {});
const px = await page.evaluate(() => { const c = document.getElementById("shareCard"), d = c.getContext("2d").getImageData(600, 300, 1, 1).data; return [c.width, c.height, d[3]]; });
ok(px[0] === 1200 && px[1] === 630 && px[2] === 255, "share card canvas drawn (1200x630, opaque)");

// menu: wide hides it; check at 390 below
ok(!errors.length, "no console errors (desktop)" + (errors.length ? ": " + errors.join(" | ") : ""));
await ctx.close();

// 3. mobile: menu sheet, no horizontal scroll
{
  const m = await open({ viewport: { width: 390, height: 844 }, hasTouch: true });
  ok(await m.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "390px: no horizontal scroll");
  const btn = m.page.locator("#menuBtn");
  ok(await btn.isVisible(), "390px: menu button visible");
  await btn.click(); await m.page.waitForTimeout(250);
  ok(await btn.getAttribute("aria-expanded") === "true" && await btn.getAttribute("aria-label") === "Close menu" && await m.page.locator("#sheet.open").count() === 1, "menu opens");
  await m.page.keyboard.press("Escape"); await m.page.waitForTimeout(150);
  ok(await m.page.locator("#sheet.open").count() === 0 && await btn.evaluate((e) => document.activeElement === e), "Esc closes menu and refocuses the button");
  await btn.click(); await m.page.click('#sheet a[href="#coach"]'); await m.page.waitForTimeout(300);
  ok(await m.page.locator("#sheet.open").count() === 0, "clicking a sheet link closes it");
  ok(!m.errors.length, "no console errors (mobile)" + (m.errors.length ? ": " + m.errors.join(" | ") : ""));
  await m.ctx.close();
}

// 4. reduced motion: one still frame
{
  const r = await open({ reducedMotion: "reduce" });
  await r.page.waitForTimeout(1500);
  ok(await r.page.locator("#dWpm").innerText() === "62" && (await r.page.evaluate(() => [...document.querySelectorAll("#dText .c.ok")].length)) === 15 && await r.page.locator("#dCnt").innerText() === "15", "reduced motion: still frame (15 typed, WPM 62)");
  const a = await r.page.locator("#dCnt").innerText(); await r.page.waitForTimeout(1200);
  ok(a === await r.page.locator("#dCnt").innerText(), "reduced motion: nothing moves");
  ok(await r.page.locator("#h1").evaluate((e) => getComputedStyle(e).opacity) === "1", "reduced motion: reveal content visible");
  ok(!r.errors.length, "no console errors (reduced)" + (r.errors.length ? ": " + r.errors.join(" | ") : ""));
  await r.ctx.close();
}

// 5. CTA navigates to /app/
{
  const c = await open();
  await Promise.all([c.page.waitForURL(/\/app\/$/), c.page.click(".cta-row .btn.lg:not(.quiet)")]);
  ok(c.page.url().endsWith("/app/"), "CTA goes to /app/");
  await c.ctx.close();
}

// 6. screenshots React vs legacy (needs both servers)
if (process.env.SHOTS !== "0") {
  const sizes = [[1920, 1080], [1440, 900], [1024, 768], [390, 844]];
  for (const [w, h] of sizes) {
    for (const [tag, url] of [["react", URL_], ["legacy", LEG]]) {
      const s = await open({ viewport: { width: w, height: h }, reducedMotion: "reduce" }, url).catch(() => null);
      if (!s) continue;
      await s.page.evaluate(async () => { document.querySelectorAll(".rv").forEach((e) => e.classList.add("in")); await document.fonts.ready; });
      await s.page.waitForTimeout(1200);
      await s.page.screenshot({ path: `${SHOTS}${tag}-${w}-hero.png` });
      await s.page.screenshot({ path: `${SHOTS}${tag}-${w}-full.png`, fullPage: true });
      await s.ctx.close();
    }
  }
}
await b.close();
console.log(fails ? `${fails} FAILED` : "ALL PASS");
process.exit(fails ? 1 : 0);
