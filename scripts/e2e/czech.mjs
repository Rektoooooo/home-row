/* Czech e2e: a fresh Czech visitor (welcome in Czech, Czech QWERTZ course, lesson 1 with normal motion), the Settings
   switches by clicking (course and language, dialog stays open, choices survive a reload, English progress untouched),
   a scan of every screen for leftover English, no overflow at 1024 and 390 px, and the share card.
   Needs a running server (REACT_URL, default http://localhost:5199/app/). SHOTS=dir saves screenshots. */
import { launch, REACT } from "./lib.mjs";

let fails = 0;
const ok = (c, m) => { console.log((c ? "PASS " : "FAIL ") + m); if (!c) fails++; };
const SHOTS = process.env.SHOTS || "";
const b = await launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, locale: "cs-CZ", colorScheme: "dark", reducedMotion: "no-preference" });
const page = await ctx.newPage();
const errors = [];
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
const T = async (sel) => (await page.locator(sel).first().innerText()).trim();
const ls = (k) => page.evaluate((k) => JSON.parse(localStorage.getItem(k) || "null"), k);
const texts = [];
const grab = async (where) => texts.push([where, await page.evaluate(() => (document.querySelector(".welcome, [role=dialog][data-state=open]") || document.querySelector("main") || document.body).innerText)]);
/* types the stage text; non-ASCII letters go in as text input, like a composed character */
async function typeStage() {
  await page.waitForSelector("#txt .c", { timeout: 5000 });
  const txt = await page.evaluate(() => [...document.querySelectorAll("#txt .c")].map((e) => e.textContent).join(""));
  for (const ch of txt) { if (/[ -~]/.test(ch)) await page.keyboard.press(ch === " " ? "Space" : ch); else await page.keyboard.insertText(ch); }
  return txt;
}

/* ---------- 1. fresh Czech visitor ---------- */
await page.goto(REACT, { waitUntil: "load" }); await page.waitForTimeout(600);
ok(await page.locator(".welcome").count() === 1, "fresh visit shows the welcome");
ok(await T("#wl-title") === "Nauč se psát všemi deseti", "a Czech browser starts in Czech: " + await T("#wl-title"));
ok(await page.evaluate(() => document.documentElement.lang) === "cs", "<html lang=cs>");
await grab("welcome 1");
await page.keyboard.press("Enter"); await page.waitForTimeout(200);
ok(await T("#wl-title") === "Jakou máš klávesnici?", "step 2 in Czech");
ok((await page.locator(".wl-course [role=radio][aria-checked=true]").innerText()).includes("U.S."), "English course preselected");
await grab("welcome 2");
await page.getByRole("radio", { name: /Česká QWERTZ/ }).click(); await page.waitForTimeout(200);
ok((await page.locator(".wl-course [role=radio][aria-checked=true]").innerText()).includes("QWERTZ"), "Czech QWERTZ picked");
ok((await ls("homerow.cs.v1"))?.on === true, "the Czech course is on at once");
await page.keyboard.press("Enter"); await page.waitForTimeout(200);
await grab("welcome 3");
await page.keyboard.press("Enter"); await page.waitForTimeout(200);
await grab("welcome 4");
await page.keyboard.press("Enter"); await page.waitForTimeout(200);
ok(await T("#wl-title") === "Krátký test psaní", "step 5");
await grab("welcome 5");
await page.getByRole("button", { name: /Začít test/ }).click(); await page.waitForTimeout(500);
const check = await page.evaluate(() => [...document.querySelectorAll("#txt .c")].map((e) => e.textContent).join(""));
ok(/[ěščřžýáíéůú]/.test(check), "the typing check uses Czech words: " + check.slice(0, 40));
for (const ch of check.slice(0, 30)) { if (/[ -~]/.test(ch)) await page.keyboard.press(ch === " " ? "Space" : ch); else await page.keyboard.insertText(ch); }
await page.evaluate(() => { const E = (window).__hrEX; });
await page.waitForTimeout(61000);
await page.waitForSelector(".welcome #wl-title", { timeout: 5000 });
ok(await T("#wl-title") === "Tvůj plán", "the plan after the check");
const plan = await page.locator(".wl-road").innerText();
ok(plan.includes("lekce 1–6") && plan.includes("lekce 7–24") && plan.includes("lekce 25–29"), "the plan follows the Czech course: " + plan.replace(/\s+/g, " "));
ok(/úh\.\/min/.test(await page.locator(".welcome").innerText()), "starting speed in úh./min");
await grab("welcome 6");
if (SHOTS) await page.screenshot({ path: SHOTS + "/cz-welcome-plan.png" });
await page.getByRole("button", { name: /Začít lekci 1/ }).click(); await page.waitForTimeout(500);
ok((await T(".panel h1")).startsWith("Lekce 1 · F a J"), "lesson 1 intro in Czech");
ok((await page.locator(".panel").innerText()).includes("J K L Ů"), "home row names Ů");
await grab("intro");
await page.keyboard.press("Enter"); await page.waitForTimeout(300);
for (let s = 0; s < 3; s++) { await typeStage(); await page.waitForTimeout(700); if (s < 2) { await grab("step done " + (s + 1)); await page.keyboard.press("Enter"); await page.waitForTimeout(400); } }
await page.waitForSelector(".result", { timeout: 5000 }); await page.waitForTimeout(900);
const res = await page.locator(".result").innerText();
ok(/100 %/.test(res), "results: 100 % after the count-up");
ok(/úh\.\/min/i.test(res), "results: speed in úh./min");
await grab("results");
if (SHOTS) await page.screenshot({ path: SHOTS + "/cz-results.png" });
ok((await ls("homerow.cs.v1")).lessons[1].done === true, "lesson 1 saved in the Czech store");
ok(Object.keys((await ls("homerow.v1")).lessons).length === 0, "English progress untouched");

/* ---------- 2. leftover English on every tab (Czech course, Czech app) ---------- */
for (const tab of ["learn", "practice", "test", "progress", "coach", "guide"]) {
  await page.evaluate((t) => { location.hash = t; }, tab); await page.waitForTimeout(500); await grab("tab " + tab);
}
await page.evaluate(() => { location.hash = "progress"; }); await page.waitForTimeout(400);
const shareBtn = page.getByRole("button", { name: /Sdílet týden/ });
if (await shareBtn.count()) {
  await shareBtn.click(); await page.waitForTimeout(1500); await grab("share dialog");
  if (SHOTS) { const img = page.locator("[role=dialog] img").first(); if (await img.count()) await img.screenshot({ path: SHOTS + "/cz-share.png" }); }
  ok(await page.locator("[role=dialog] img").count() === 1, "share card made");
  await page.keyboard.press("Escape"); await page.waitForTimeout(300);
} else ok(false, "Sdílet týden button");

/* ---------- 3. Settings switches by clicking ---------- */
await page.evaluate(() => { location.hash = "learn"; }); await page.waitForTimeout(300);
const total = async () => page.evaluate(() => [...document.body.innerText.matchAll(/Splněno \d+ z (\d+)|(\d+) passed|of (\d+) passed/g)].reduce((a, m) => a + +(m[1] || m[2] || m[3]), 0));
ok(await total() === 29, "Czech course: 29 lessons on Learn (" + await total() + ")");
await page.getByRole("button", { name: "Nastavení" }).click(); await page.waitForTimeout(300);
await grab("settings");
await page.getByRole("radio", { name: /Anglický/ }).click(); await page.waitForTimeout(400);
ok(await page.locator("#settings").isVisible(), "Settings stays open after the course switch");
ok((await ls("homerow.cs.v1")).on === false, "course switched to English");
await page.getByRole("radio", { name: "English" }).click(); await page.waitForTimeout(400);
ok(await page.locator("#settings").isVisible() && (await T("#settings h2, #settings [class*=font-heading]")) === "Settings", "Settings stays open and turns English");
await page.keyboard.press("Escape"); await page.waitForTimeout(300);
await page.reload(); await page.waitForTimeout(700);
ok(await page.evaluate(() => document.documentElement.lang) === "en" && (await page.locator('[role=tab][aria-current=page]').innerText()) === "Learn", "English app after a reload");
ok((await ls("homerow.cs.v1")).on === false && (await ls("homerow.cs.v1")).lessons[1].done === true, "Czech progress kept while the English course is on");
ok(!(await page.locator("main").innerText()).includes("ů"), "English course keyboard (no ů)");
await page.getByRole("button", { name: "Settings" }).click(); await page.waitForTimeout(300);
await page.getByRole("radio", { name: /Czech \(Czech keyboard\)/ }).click(); await page.waitForTimeout(400);
await page.getByRole("radio", { name: "Čeština" }).click(); await page.waitForTimeout(400);
ok(await page.locator("#settings").isVisible(), "Settings still open after switching back");
await page.getByRole("radio", { name: "QWERTY" }).click(); await page.waitForTimeout(300);
ok((await ls("homerow.cs.v1")).csLayout === "qwerty", "Czech QWERTY saved");
await page.getByRole("radio", { name: "QWERTZ" }).click(); await page.waitForTimeout(300);
await page.keyboard.press("Escape"); await page.waitForTimeout(300);

/* ---------- 4. overflow ---------- */
for (const w of [1024, 390]) {
  await page.setViewportSize({ width: w, height: 860 });
  for (const tab of ["learn", "practice", "test", "progress", "coach", "guide"]) {
    await page.evaluate((t) => { location.hash = t; }, tab); await page.waitForTimeout(350);
    const o = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, w: innerWidth, tabs: [...document.querySelectorAll(".tab span")].filter((s) => s.scrollWidth > s.parentElement.clientWidth).map((s) => s.textContent) }));
    ok(o.sw <= o.w && !o.tabs.length, `no overflow at ${w}px on ${tab}` + (o.tabs.length ? " tabs: " + o.tabs : ""));
  }
}

/* ---------- 5. leftover English: print suspicious lines (not a hard fail: names, keys and sources are English on purpose) ---------- */
const EN = /\b(the|and|you|your|with|lessons?|practi[cs]e|keys?|speed|accuracy|start|next|back|done|steps?|words?|minutes?|today|week|level|streak|settings|keyboard|hints?|target|goal|best|share|save|close|show|more|new|yet|of|to|in|on|at|for|is|are|this|that)\b/i;
const ALLOW = /Home Row|Claude|claude\.ai|Shift|Enter|Backspace|QWERT|ISO|ANSI|U\.S\.|English|JavaScript|Python|Swift|CSS|SQL|Shell|Keybr|Monkeytype|OSHA|CHI 20|Wikipedi|Feit|Dhakal|WPM|^(fn|control|option|command|tab|caps|shift|delete|return|esc)$/;
const seen = new Set();
for (const [where, txt] of texts) for (const line of txt.split("\n").map((l) => l.trim()).filter(Boolean)) {
  const stripped = line.replace(new RegExp(ALLOW.source, "g"), "");
  if (EN.test(stripped) && !seen.has(line)) { seen.add(line); console.log("EN? [" + where + "] " + line.slice(0, 140)); }
}
ok(!errors.length, "no console errors " + JSON.stringify(errors.slice(0, 3)));
await b.close();
console.log(fails ? fails + " FAILED" : "ALL PASSED");
process.exit(fails ? 1 : 0);
