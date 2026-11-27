/* Phase 5 e2e + screenshots: settings, welcome, rewards (toasts, confetti), share, move.
   Needs the dev server:  npx vite --port 5203 --strictPort   and the legacy app on :8780 (shots only)
   REACT_URL=http://localhost:5203/app/ node scripts/e2e/phase5.mjs          -> assertions
   REACT_URL=... node scripts/e2e/phase5.mjs shots                           -> notes/shots/phase5/{react,legacy}-*.png */
import { launch, newPage, seedState, typeStage, playLesson, LEGACY } from "./lib.mjs";
import { mkdirSync } from "node:fs";

const REACT = process.env.REACT_URL || "http://localhost:5203/app/";
let fails = 0;
const ok = (c, m) => { console.log((c ? "PASS " : "FAIL ") + m); if (!c) fails++; };
const OUT = new URL("../../notes/shots/phase5/", import.meta.url).pathname;
const SHOTS = process.argv[2] === "shots";
const b = await launch();
const stored = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("homerow.v1") || "null"));
const noErrors = (errors, where) => ok(errors.length === 0, "no console errors " + where + (errors.length ? ": " + errors.join(" | ") : ""));
const FRESH = { ...seedState({ passed: 0 }), days: {}, keys: {}, seenTips: { deadKey: true, welcome: false }, bests: { practice: 0, lessonWpm: 0, test15: 0, test30: 0, test60: 0, test120: 0 } };
const T = (page, sel) => page.locator(sel).first().innerText();

/* a fresh browser: nothing stored (the welcome decides from the real empty state) */
async function fresh(opts = {}, hash = "") {
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: "light", reducedMotion: opts.motion || "reduce" });
  const page = await ctx.newPage(); const errors = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); }); page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  if (opts.init) await page.addInitScript(opts.init, opts.arg);
  await page.goto(REACT + hash, { waitUntil: "load" }); await page.waitForTimeout(500);
  return { ctx, page, errors };
}

if (!SHOTS) {
  /* ---------- 1. welcome, all six steps, sound pick, typing check, plan ---------- */
  {
    const { ctx, page, errors } = await fresh({ init: () => {
      window.__ac = 0; const A = window.AudioContext; window.AudioContext = function (...a) { window.__ac++; return new A(...a); };
    } });
    ok(await page.locator(".welcome").count() === 1, "fresh visit shows the welcome");
    ok(await T(page, "#wl-title") === "Learn to type with all ten fingers", "step 1 title");
    ok(await page.locator(".welcome").getAttribute("aria-modal") === "true" && await page.locator("header.top").getAttribute("inert") !== null, "welcome is modal, header inert");
    ok(await page.evaluate(() => document.documentElement.style.overflow) === "hidden", "scroll locked");
    ok(await page.locator(".wl-foot .back").isHidden(), "no Back on step 1");
    ok((await page.locator(".wl-dots").getAttribute("aria-label")) === "Step 1 of 6", "dots label");
    await page.keyboard.press("Enter"); await page.waitForTimeout(150);
    ok(await T(page, "#wl-title") === "Which keyboard do you have?", "Enter goes to step 2");
    ok(await page.locator('.wl-course [role=radio][aria-checked=true]').innerText().then((t) => t.includes("U.S.")), "U.S. (English course) preselected");
    ok(await page.locator('.kbc [role=radio][aria-checked=true]').innerText().then((t) => t.includes("ISO")), "ISO preselected");
    await page.keyboard.press("ArrowRight"); await page.waitForTimeout(100);
    ok(await page.locator('.kbc [role=radio][aria-checked=true]').innerText().then((t) => t.includes("ANSI")), "ArrowRight selects ANSI");
    ok(await page.locator('.wl-course [role=radio][aria-checked=true]').innerText().then((t) => t.includes("U.S.")), "the course stays U.S.");
    await page.keyboard.press("Enter"); await page.waitForTimeout(150);
    ok(await T(page, "#wl-title") === "How much time each day?", "step 3");
    await page.getByRole("radio", { name: /20/ }).click();
    ok(await page.locator('[role=radio][aria-checked=true]').innerText().then((t) => t.startsWith("20")), "goal 20 picked");
    await page.keyboard.press("Enter"); await page.waitForTimeout(150);
    ok(await T(page, "#wl-title") === "Pick your key sound", "step 4");
    ok(await page.locator('[role=radio][aria-checked=true]').innerText().then((t) => t.includes("Creamy")), "Creamy preselected");
    await page.getByRole("radio", { name: /Typewriter/ }).click();
    ok(await page.evaluate(() => window.__ac) >= 1, "picking a sound plays a preview (AudioContext created)");
    ok(await page.locator('[role=radio][aria-checked=true]').innerText().then((t) => t.includes("Typewriter")), "Typewriter picked");
    await page.getByRole("radio", { name: "No sound" }).click(); await page.getByRole("radio", { name: /Typewriter/ }).click();
    await page.keyboard.press("Enter"); await page.waitForTimeout(150);
    ok(await T(page, "#wl-title") === "A quick typing check", "step 5");
    ok((await stored(page))?.settings?.soundPack !== "type", "nothing is applied before the check/finish");
    await page.getByRole("button", { name: /Start the check/ }).click(); await page.waitForTimeout(300);
    ok(await page.locator(".welcome").count() === 0 && (await T(page, ".crumb")) === "Welcome · Typing check", "the check runs in the app (crumb)");
    ok(await page.locator(".pace").count() === 0, "no pace ghost in the check");
    /* type some of it, then let the 60 s run out by moving the clock */
    await page.waitForSelector("#txt .c");
    const txt = await page.evaluate(() => [...document.querySelectorAll("#txt .c")].map((e) => e.textContent).join(""));
    for (const ch of txt.slice(0, 60)) await page.keyboard.press(ch === " " ? "Space" : ch);
    await page.waitForTimeout(150);
    ok(await page.locator("#txt .c.ok").count() >= 50, "typing works in the check");
    await page.evaluate(() => { window.__t0 = performance.now; const o = performance.now.bind(performance); performance.now = () => o() + 61000; });
    await page.waitForSelector(".welcome", { timeout: 8000 });
    ok(await T(page, "#wl-title") === "Your plan", "after the check: Your plan");
    ok(await page.locator(".pstats .pstat").count() === 2 && (await T(page, ".pstats .pstat .sub")) === "Your starting speed", "plan shows WPM + accuracy");
    ok(await page.locator(".wl-head2").innerText().then((t) => t === "Touch typing at 30 WPM in about 5 weeks"), "plan heading for 20 min/day: " + await T(page, ".wl-head2"));
    const s = await stored(page);
    ok(s.baseline && s.baseline.wpm > 0, "baseline stored");
    ok(Object.keys(s.days).length === 0 && Object.keys(s.keys).length === 0 && s.tests.length === 0 && s.bests.test60 === 0, "typing check left no stats");
    await page.getByRole("button", { name: /Start lesson 1/ }).click(); await page.waitForTimeout(400);
    ok(await page.locator(".welcome").count() === 0 && (await T(page, ".panel h1")).startsWith("Lesson 1"), "Start lesson 1 opens lesson 1's intro");
    const s2 = await stored(page);
    ok(s2.settings.layout === "ansi" && s2.settings.goal === 20 && s2.settings.soundPack === "type" && s2.settings.sound === true && s2.seenTips.welcome === true, "welcome choices applied");
    ok(await T(page, "#ring-t") === "0 / 20 min", "ring uses the chosen goal");
    await page.reload({ waitUntil: "load" }); await page.waitForTimeout(500);
    ok(await page.locator(".welcome").count() === 0, "no welcome after a reload");
    noErrors(errors, "(welcome)"); await ctx.close();
  }
  /* skip paths */
  {
    const { ctx, page } = await fresh();
    await page.getByRole("button", { name: "Skip" }).click(); await page.waitForTimeout(250);
    const s = await stored(page);
    ok(await page.locator(".welcome").count() === 0 && s.seenTips.welcome === true && s.settings.soundPack === "off" && s.settings.layout === "iso" && s.settings.goal === 15, "Skip: welcome gone, settings untouched");
    ok(page.url().endsWith("#learn") || (await T(page, "h1.vh")) === "Learn", "Skip goes to Learn");
    await ctx.close();
  }
  {
    const { ctx, page } = await fresh();
    await page.keyboard.press("Enter"); await page.keyboard.press("Enter"); await page.keyboard.press("Enter"); await page.waitForTimeout(150);
    ok(await T(page, "#wl-title") === "Pick your key sound", "reached step 4");
    await page.getByRole("radio", { name: /Soft/ }).click();
    await page.getByRole("button", { name: "Skip" }).click(); await page.waitForTimeout(250);
    ok((await stored(page)).settings.soundPack === "soft", "Skip after step 4: the chosen sound is applied");
    await ctx.close();
  }
  {
    const { ctx, page } = await fresh();
    await page.keyboard.press("Enter"); await page.waitForTimeout(100);
    await page.getByRole("button", { name: /Back/ }).click(); await page.waitForTimeout(100);
    ok(await T(page, "#wl-title") === "Learn to type with all ten fingers", "Back returns a step");
    await page.getByRole("button", { name: "Skip" }).click(); await page.waitForTimeout(200);
    ok((await stored(page)).settings.soundPack === "off", "Skip before step 4 leaves sound untouched");
    await ctx.close();
  }
  /* returning user */
  {
    const { ctx, page, errors } = await fresh({ init: (s) => { if (!localStorage.getItem("homerow.v1")) localStorage.setItem("homerow.v1", JSON.stringify(s)); }, arg: { ...seedState({ passed: 3 }), seenTips: { deadKey: true, welcome: false } } });
    ok(await page.locator(".welcome").count() === 0, "returning user (progress, welcome not yet marked) sees no welcome");
    ok((await stored(page)).seenTips.welcome === true, "…and it is marked seen");
    noErrors(errors, "(returning user)"); await ctx.close();
  }

  const SEEDED = (n = 3) => ({ ...seedState({ passed: n }), seenTips: { deadKey: true, welcome: true } });
  const seedInit = (s) => { if (!localStorage.getItem("homerow.v1")) localStorage.setItem("homerow.v1", JSON.stringify(s)); };
  const open = async (page) => { await page.click("#open-settings"); await page.waitForSelector('[role=dialog][data-state=open]'); await page.waitForTimeout(150); };
  const radio = (page, group, name) => page.getByRole("radiogroup", { name: group }).or(page.locator('[aria-label="' + group + '"]')).getByRole("radio", { name });
  const checked = async (page, group, name) => (await radio(page, group, name).getAttribute("aria-checked")) === "true";

  /* ---------- 2. settings: every control, its effect, persistence, reset ---------- */
  {
    const { ctx, page, errors } = await fresh({ init: seedInit, arg: SEEDED(3) });
    await page.evaluate(() => { window.__starts = 0; const p = AudioBufferSourceNode.prototype.start; AudioBufferSourceNode.prototype.start = function (...a) { window.__starts++; return p.apply(this, a); }; });
    /* open a lesson intro so a keyboard is on screen, then change the shape from Settings */
    await page.evaluate(() => document.activeElement.blur()); await page.keyboard.press("Enter"); await page.waitForTimeout(250);
    const kbLen = () => page.evaluate(() => document.querySelector("svg.kb")?.innerHTML.length || 0);
    const iso0 = await kbLen();
    await open(page);
    ok(await page.getByRole("dialog", { name: "Settings" }).isVisible(), "settings opens as a dialog named Settings");
    const sections = await page.locator(".sgroup > h3").evaluateAll((e) => e.map((x) => x.textContent));
    ok(sections.join(",") === "Language and course,Appearance,Typing,Goals,Keyboard,Lessons,Progress,Coach,About", "sections: " + sections.join(","));
    ok(await checked(page, "Theme", "System") && await checked(page, "Keyboard hints", "Always") && await checked(page, "Key sound", "Off") && await checked(page, "Daily goal", "15 min") && await checked(page, "Target speed", "25") && await checked(page, "Pace caret", "Target") && await checked(page, "Keyboard shape", "ISO"), "defaults shown");
    ok(await page.getByRole("switch", { name: "Stop on mistakes" }).isChecked() && !(await page.getByRole("switch", { name: "Unlock all lessons" }).isChecked()), "switch defaults: stop on, unlock off");
    ok((await T(page, "#set-coach-off")) === "Available when Home Row runs inside Claude.", "website coach text");
    ok((await T(page, "#save-status")) === "Saved in this browser only", "save status line");
    await radio(page, "Keyboard hints", "When I hesitate").click();
    await page.getByRole("switch", { name: "Stop on mistakes" }).click();
    await radio(page, "Key sound", "Clicky").click();
    ok(await page.evaluate(() => window.__starts) > 0, "choosing a sound pack plays a preview burst");
    await radio(page, "Daily goal", "20 min").click();
    await radio(page, "Target speed", "35").click();
    await radio(page, "Pace caret", "Best").click();
    await radio(page, "Keyboard shape", "ANSI").click();
    await page.getByRole("switch", { name: "Unlock all lessons" }).click();
    await radio(page, "Theme", "Dark").click();
    await page.waitForTimeout(200);
    ok(await page.evaluate(() => document.documentElement.getAttribute("data-theme") === "dark" && document.documentElement.classList.contains("dark") && localStorage.getItem("homerow.theme") === "dark"), "theme Dark applied and saved per browser");
    ok(await T(page, "#ring-t") === "0 / 20 min" || /\/ 20 min/.test(await T(page, "#ring-t")), "daily goal changes the ring: " + await T(page, "#ring-t"));
    ok(await kbLen() !== iso0, "ISO to ANSI rebuilds the keyboard behind the dialog");
    let s = await stored(page);
    ok(s.settings.hints === "hesitate" && s.settings.stop === false && s.settings.soundPack === "click" && s.settings.sound === true && s.settings.goal === 20 && s.settings.target === 35 && s.settings.pace === "best" && s.settings.layout === "ansi" && s.settings.unlockAll === true && s.settingsAt > 0, "settings saved");
    await page.keyboard.press("Escape"); await page.waitForTimeout(250);
    ok(await page.locator('[role=dialog][data-state=open]').count() === 0, "Esc closes");
    await page.reload({ waitUntil: "load" }); await page.waitForTimeout(500); await open(page);
    ok(await checked(page, "Keyboard hints", "When I hesitate") && await checked(page, "Key sound", "Clicky") && await checked(page, "Daily goal", "20 min") && await checked(page, "Target speed", "35") && await checked(page, "Pace caret", "Best") && await checked(page, "Keyboard shape", "ANSI") && await checked(page, "Theme", "Dark"), "segmented settings persist after reload");
    ok(!(await page.getByRole("switch", { name: "Stop on mistakes" }).isChecked()) && await page.getByRole("switch", { name: "Unlock all lessons" }).isChecked(), "switches persist after reload");
    /* key sound while typing: a pack makes sound, Off does not */
    await radio(page, "Theme", "System").click();
    await page.click('button[aria-label="Close settings"]'); await page.waitForTimeout(250);
    await page.evaluate(() => { window.__starts = 0; const p = AudioBufferSourceNode.prototype.start; AudioBufferSourceNode.prototype.start = function (...a) { window.__starts++; return p.apply(this, a); }; });
    await page.locator("a.brand").click(); await page.waitForTimeout(200);
    await page.getByRole("tab", { name: /Test/ }).click(); await page.waitForTimeout(200);
    await page.getByRole("button", { name: /Start test/ }).click(); await page.waitForTimeout(300);
    await page.waitForSelector("#txt .c");
    const ch = await page.evaluate(() => document.querySelector("#txt .c").textContent);
    await page.keyboard.press(ch === " " ? "Space" : ch); await page.waitForTimeout(200);
    ok(await page.evaluate(() => window.__starts) > 0, "typing plays the key sound of the chosen pack");
    /* the dialog blocks typing */
    const before = await page.locator("#txt .c.ok, #txt .c.bad").count();
    await open(page);
    await page.keyboard.type("asdfasdfasdf"); await page.waitForTimeout(150);
    ok(await page.locator("#txt .c.ok, #txt .c.bad").count() === before, "typing is blocked while Settings is open");
    /* reset with confirm */
    await page.getByRole("button", { name: "Reset progress" }).click();
    ok(await page.locator("#reset-confirm").isVisible() && await page.locator("#reset-confirm p").innerText().then((t) => t === "This erases all lessons, key stats and history, here and in your account."), "reset asks for confirmation in the dialog");
    await page.getByRole("button", { name: "Keep my progress" }).click();
    ok(await page.locator("#reset-confirm").count() === 0 && Object.keys((await stored(page)).lessons).length === 3, "Keep my progress changes nothing");
    await page.getByRole("button", { name: "Reset progress" }).click(); await page.getByRole("button", { name: "Yes, erase everything" }).click(); await page.waitForTimeout(400);
    s = await stored(page);
    ok(Object.keys(s.lessons).length === 0 && Object.keys(s.days).length === 0 && s.settings.goal === 20 && s.resetAt > 0, "reset erases progress, keeps settings");
    ok(await page.locator('[role=dialog][data-state=open]').count() === 0, "dialog closed after reset");
    await open(page); ok(await page.locator("#reset-confirm").count() === 0, "reopening collapses the confirm");
    await page.getByRole("button", { name: "Show the welcome again" }).click(); await page.waitForTimeout(250);
    ok(await page.locator(".welcome").count() === 1 && await T(page, "#wl-title") === "Learn to type with all ten fingers", "Show the welcome again replays step 1");
    noErrors(errors, "(settings)"); await ctx.close();
  }
  /* a mocked claude.ai: db + user (so the account sync and the coach doc connect), optional sampler and downloads */
  const claudeInit = ({ sample, downloads, seed }) => {
    window.__sampled = 0; window.__saved = [];
    const doc = () => ({ get: async () => ({ exists: false }), set: async () => {}, onSnapshot: (cb) => { setTimeout(() => cb({ exists: false }), 0); return () => {}; } });
    window.claude = { use: async (n) => n === "db" ? { doc } : n === "user" ? { id: async () => "u1" }
      : n === "sample" && sample ? { json: async () => { window.__sampled++; return { bad: true }; } }
      : n === "downloads" && downloads ? { save: async (o) => { window.__saved.push({ filename: o.filename, size: o.data.size, type: o.data.type }); const m = window.__dlmode; if (m) { const e = new Error(m); e.code = m; throw e; } } } : null };
    if (!localStorage.getItem("homerow.v1")) localStorage.setItem("homerow.v1", JSON.stringify(seed));
  };
  for (const variant of ["no-sampler", "sampler"]) {
    const { ctx, page, errors } = await fresh({ init: claudeInit, arg: { sample: variant === "sampler", downloads: false, seed: SEEDED(3) } });
    await page.waitForTimeout(600); await open(page);
    ok((await T(page, "#save-status")) === "Saved to your claude.ai account", variant + ": save status says account");
    if (variant === "no-sampler") {
      ok((await T(page, "#set-coach-off")) === "Available on the published link.", "claude.ai without sampler: 'Available on the published link.'");
    } else {
      ok(await page.locator("#set-coach-off").count() === 0 && await page.getByRole("switch", { name: "Weekly coach" }).isVisible(), "sampler: the weekly switch shows");
      await page.getByRole("switch", { name: "Weekly coach" }).click(); await page.waitForTimeout(500);
      ok(await page.evaluate(() => window.__sampled) === 1, "turning it on runs the weekly lesson once");
      ok((await T(page, "#set-weekly-msg")).length > 0 && (await stored(page)).settings.weekly === true, "weekly message shown, setting saved: " + await T(page, "#set-weekly-msg"));
      await page.getByRole("switch", { name: "Weekly coach" }).click(); await page.waitForTimeout(150);
      ok((await T(page, "#set-weekly-msg")) === "" && (await stored(page)).settings.weekly === false, "turning it off clears the message");
    }
    noErrors(errors, "(weekly " + variant + ")"); await ctx.close();
  }

  /* ---------- 3. rewards: silent grants at load, live achievement toast + confetti, new best ---------- */
  {
    const seed = { ...seedState({ passed: 5 }), seenTips: { deadKey: true, welcome: true }, ach: {} };
    const { ctx, page, errors } = await fresh({ motion: "no-preference", init: seedInit, arg: seed });
    await page.waitForTimeout(1500);
    ok(await page.locator("[data-sonner-toast]").count() === 0, "no toast at load for silently granted badges");
    let s = await stored(page);
    ok(!!s.ach["first-lesson"] && !!s.ach["three-stars"], "badges granted silently at load: " + Object.keys(s.ach).join(","));
    ok(await page.locator('#flame[role="img"]').count() === 1 && await page.locator("#flame.lit").count() === 1, "flame is lit (7 min today)");
    /* play lesson 6: passing it earns "Home row" */
    await page.click('.lrow[data-n="6"]'); await page.waitForTimeout(250);
    ok((await T(page, ".panel h1")).startsWith("Lesson 6"), "intro of lesson 6: " + await T(page, ".panel h1"));
    await playLesson(page); await page.waitForTimeout(500);
    const toast = page.locator("[data-sonner-toast]").filter({ hasText: "Achievement unlocked" });
    ok(await toast.count() === 1 && (await toast.innerText()).includes("Home row"), "live achievement toast: Achievement unlocked / Home row");
    ok(await toast.locator('[role="status"]').count() === 1 && await toast.locator(".medal").count() === 1, "toast is role=status with a medal");
    ok(await page.locator("canvas.confetti").count() >= 1 && await page.locator("canvas.confetti").getAttribute("aria-hidden") === "true", "confetti on the first pass");
    ok((await stored(page)).ach["home-row"] > 0, "home-row stored");
    await page.waitForTimeout(5200);
    ok(await page.locator("[data-sonner-toast]").count() === 0, "the toast is gone after 4.5 s");
    noErrors(errors, "(rewards)"); await ctx.close();
  }
  {
    /* reduced motion: no confetti */
    const seed = { ...seedState({ passed: 5 }), seenTips: { deadKey: true, welcome: true }, ach: {} };
    const { ctx, page } = await fresh({ motion: "reduce", init: seedInit, arg: seed });
    await page.click('.lrow[data-n="6"]'); await page.waitForTimeout(250);
    await playLesson(page); await page.waitForTimeout(500);
    ok(await page.locator("canvas.confetti").count() === 0 && await page.locator("[data-sonner-toast]").count() >= 1, "reduced motion: toast yes, confetti no");
    await ctx.close();
  }
  /* test new best -> toast + confetti; share dialog on the website downloads the PNG */
  {
    const { ctx, page, errors } = await fresh({ motion: "no-preference", init: seedInit, arg: { ...SEEDED(3), settings: { ...SEEDED(3).settings, tDur: 15 } } });
    await page.getByRole("tab", { name: /Test/ }).click(); await page.waitForTimeout(250);
    ok(await page.getByRole("button", { name: /Share best/ }).count() === 0, "no 'Share best' before any best");
    await page.getByRole("button", { name: /Start test/ }).click(); await page.waitForSelector("#txt .c");
    const txt = await page.evaluate(() => [...document.querySelectorAll("#txt .c")].map((e) => e.textContent).join(""));
    for (const ch of txt.slice(0, 50)) await page.keyboard.press(ch === " " ? "Space" : ch);
    await page.evaluate(() => { const o = performance.now.bind(performance); performance.now = () => o() + 16000; });
    await page.waitForSelector(".result", { timeout: 8000 }); await page.waitForTimeout(500);
    const bt = page.locator("[data-sonner-toast]").filter({ hasText: "New best" });
    ok(await bt.count() === 1 && /^New best · \d+ WPM at 15 s/.test(await bt.innerText()), "new best toast: " + (await bt.innerText().catch(() => "")).replace(/\n/g, " "));
    ok(await page.locator("canvas.confetti").count() >= 1, "confetti on a new best");
    await page.getByRole("button", { name: "Share", exact: true }).click(); await page.waitForSelector("#sh-img", { timeout: 8000 });
    ok(await page.getByRole("dialog", { name: "Share your result" }).isVisible(), "share dialog named Share your result");
    const dim = await page.evaluate(() => { const i = document.querySelector("#sh-img"); return [i.naturalWidth, i.naturalHeight, i.alt]; });
    ok(dim[0] === 1200 && dim[1] === 630 && /^Share card: \d+ WPM/.test(dim[2]), "card image 1200x630 with alt: " + dim.join(" "));
    ok(await page.locator("#sh-save").evaluate((e) => e === document.activeElement), "Save image button is focused");
    const [dl] = await Promise.all([page.waitForEvent("download"), page.click("#sh-save")]);
    ok(/^home-row-\d+-wpm\.png$/.test(dl.suggestedFilename()), "website: PNG download " + dl.suggestedFilename());
    await page.keyboard.press("Escape"); await page.waitForTimeout(250);
    ok(await page.locator('[role=dialog][data-state=open]').count() === 0, "Esc closes the share dialog");
    ok(await page.locator(".result").count() === 1, "Esc on the dialog does not also leave the result screen");
    await page.goto(REACT + "#test", { waitUntil: "load" }); await page.waitForTimeout(400);
    await page.getByRole("button", { name: /Share best · 15 s/ }).click(); await page.waitForSelector("#sh-img");
    ok(true, "Share best opens the dialog");
    await page.click("#sh-close"); await page.waitForTimeout(200);
    await page.goto(REACT + "#progress", { waitUntil: "load" }); await page.waitForTimeout(400);
    await page.getByRole("button", { name: "Share week" }).click(); await page.waitForSelector("#sh-img");
    ok(/This week|minutes of practice this week/.test(await page.locator("#sh-img").getAttribute("alt")), "Share week card: " + await page.locator("#sh-img").getAttribute("alt"));
    noErrors(errors, "(test best + share)"); await ctx.close();
  }
  /* share inside claude.ai: the downloads capability */
  for (const mode of ["", "declined", "rate_limited", "other", "nodl"]) {
    const { ctx, page, errors } = await fresh({ init: claudeInit, arg: { sample: false, downloads: mode !== "nodl", seed: { ...SEEDED(3), tests: [{ ts: Date.now() - 1000, dur: 30, pool: "c200", opts: "", wpm: 41.2, raw: 44, acc: 0.95 }], bests: { practice: 0, lessonWpm: 0, test15: 0, test30: 41.2, test60: 0, test120: 0 } } } });
    await page.evaluate((m) => { window.__dlmode = m === "other" ? "boom" : m === "nodl" ? "" : m; }, mode);
    await page.waitForTimeout(500);
    await page.getByRole("tab", { name: /Test/ }).click(); await page.waitForTimeout(200);
    await page.getByRole("button", { name: /Share best · 30 s/ }).click(); await page.waitForSelector("#sh-img", { timeout: 8000 });
    if (mode === "nodl") {
      ok(await page.locator("#sh-save").count() === 0 && (await T(page, "#sh-msg")) === "Right-click or long-press the image to save it.", "claude.ai without downloads: no Save button, right-click hint");
    } else {
      await page.click("#sh-save"); await page.waitForTimeout(300);
      const saved = await page.evaluate(() => window.__saved);
      const msg = await T(page, "#sh-msg");
      const want = { "": "Saved.", declined: "", rate_limited: "Try again in a moment.", other: "Saving isn't available here." }[mode];
      ok(saved.length === 1 && saved[0].filename === "home-row-41-wpm.png" && saved[0].type === "image/png" && saved[0].size > 5000 && msg === want, "claude.ai downloads.save (" + (mode || "ok") + "): " + JSON.stringify(saved[0]) + " msg=" + JSON.stringify(msg));
    }
    noErrors(errors, "(share " + mode + ")"); await ctx.close();
  }

  /* ---------- 4. move from the old address ---------- */
  {
    const payload = { s: { ...seedState({ passed: 3 }) }, c: null };
    const hash = "#move=" + encodeURIComponent(JSON.stringify(payload));
    const { ctx, page, errors } = await fresh({}, hash);
    ok(await page.getByRole("dialog", { name: "Bring your progress here?" }).isVisible(), "#move= opens the dialog");
    ok(page.url().endsWith("#learn"), "the fragment is removed from the address bar");
    const msg = await T(page, "[data-slot=dialog-content] .msg");
    ok(/3 lessons passed and 43 minutes of practice\. It is added to anything already saved here, so nothing is lost\.$/.test(msg), "summary: " + msg);
    ok(await page.locator(".welcome").count() === 0, "no welcome while a move is pending");
    ok(await page.getByRole("button", { name: "Bring it over" }).evaluate((e) => e === document.activeElement), "Bring it over has focus");
    await page.getByRole("button", { name: "Bring it over" }).click(); await page.waitForTimeout(500);
    const t = page.locator("[data-sonner-toast]").filter({ hasText: "Progress moved" });
    ok(await t.count() === 1 && (await t.innerText()).includes("Everything from the old address is here."), "toast: Progress moved");
    ok(Object.keys((await stored(page)).lessons).length === 3, "progress merged and saved");
    await page.goto(REACT + hash, { waitUntil: "load" }); await page.waitForTimeout(600);
    ok(await page.locator('[role=dialog]').count() === 0, "opening the old link again is quiet");
    noErrors(errors, "(move)"); await ctx.close();
  }
  {
    const payload = { s: { ...seedState({ passed: 2 }) }, c: null };
    const hash = "#move=" + encodeURIComponent(JSON.stringify(payload));
    const { ctx, page } = await fresh({}, hash);
    await page.keyboard.press("Escape"); await page.waitForTimeout(400);
    ok(await page.locator(".welcome").count() === 1 && Object.keys((await stored(page))?.lessons || {}).length === 0, "Esc = Not now: nothing moved, a fresh user gets the welcome");
    await ctx.close();
  }

  /* ---------- 5. reduced motion: dialogs, toasts and the welcome still open and close; sound re-click; toast queue ---------- */
  {
    const { ctx, page, errors } = await fresh({ motion: "reduce" });
    ok(await page.evaluate(() => getComputedStyle(document.querySelector("#root *")).transitionDuration) === "0s", "reduced motion: transitions are off app-wide");
    ok(await page.locator(".welcome").count() === 1, "reduced motion: the welcome opens");
    await page.getByRole("button", { name: "Skip" }).click(); await page.waitForTimeout(400);
    ok(await page.locator(".welcome").count() === 0, "reduced motion: the welcome closes (Skip)");
    await page.click("#open-settings"); await page.waitForSelector('[role=dialog][data-state=open]');
    await page.keyboard.press("Escape"); await page.waitForSelector('[role=dialog]', { state: "detached", timeout: 2000 }).then(() => ok(true, "reduced motion: the settings dialog closes"), () => ok(false, "reduced motion: the settings dialog closes"));
    await page.evaluate(() => window.__hr.toast({ title: "Reduced motion toast" }));
    ok(await page.locator("[data-sonner-toast]").filter({ hasText: "Reduced motion toast" }).count() === 1, "reduced motion: a toast shows");
    await page.waitForTimeout(5200);
    ok(await page.locator("[data-sonner-toast]").count() === 0, "reduced motion: the toast leaves after 4.5 s");
    noErrors(errors, "(reduced motion)"); await ctx.close();
  }
  {
    /* clicking the selected key sound replays its preview, only there; the other segmented controls keep their value silently */
    const { ctx, page } = await fresh({ init: seedInit, arg: SEEDED(3) });
    await page.evaluate(() => { window.__starts = 0; const p = AudioBufferSourceNode.prototype.start; AudioBufferSourceNode.prototype.start = function (...a) { window.__starts++; return p.apply(this, a); }; });
    await open(page);
    await radio(page, "Key sound", "Clicky").click(); await page.waitForTimeout(1200);
    const n1 = await page.evaluate(() => window.__starts); await radio(page, "Key sound", "Clicky").click(); await page.waitForTimeout(300);
    ok(await page.evaluate(() => window.__starts) > n1 && await checked(page, "Key sound", "Clicky"), "re-clicking the selected key sound replays its preview and keeps it selected");
    await page.waitForTimeout(1200);
    const n2 = await page.evaluate(() => window.__starts); await radio(page, "Daily goal", "15 min").click(); await radio(page, "Daily goal", "15 min").click(); await page.waitForTimeout(300);
    ok(await page.evaluate(() => window.__starts) === n2 && await checked(page, "Daily goal", "15 min") && (await stored(page)).settings.goal === 15, "re-clicking another segmented control keeps its value, no side effects");
    await ctx.close();
  }
  {
    /* toasts: at most 3 at once, the rest queue and each gets its full 4.5 s */
    const { ctx, page } = await fresh({ motion: "no-preference", init: seedInit, arg: SEEDED(3) });
    await page.evaluate(() => { for (let i = 1; i <= 5; i++) window.__hr.toast({ title: "Queued " + i }); });
    await page.waitForTimeout(400);
    const titles = () => page.locator("[data-sonner-toast]").evaluateAll((e) => e.map((x) => x.textContent).sort());
    let t = await titles();
    ok(t.length === 3 && t.every((x) => /Queued [123]/.test(x)), "five toasts: three show, two wait: " + t.join(","));
    await page.waitForTimeout(4400);
    t = await titles();
    ok(t.length === 2 && t.every((x) => /Queued [45]/.test(x)), "the queued two show once the first three are gone: " + t.join(","));
    await page.waitForTimeout(4200);
    ok(await page.locator("[data-sonner-toast]").filter({ hasText: /Queued [45]/ }).count() === 2, "a queued toast still has its full 4.5 s (shown 4.2 s ago)");
    await page.waitForTimeout(1200);
    ok(await page.locator("[data-sonner-toast]").count() === 0, "all toasts are gone in the end");
    await ctx.close();
  }
}


if (SHOTS) {
  mkdirSync(OUT, { recursive: true });
  const VPS = [["1600", 1600, 980], ["1024", 1024, 768], ["390", 390, 844]];
  const bolt = '<span class="medal" style="--ac:var(--f-ring);width:36px;height:36px"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13 3L5.5 13.5h5.8L10.5 21 18.5 10h-5.8z"/></svg></span>';
  const seeded = { ...seedState({ passed: 5 }), seenTips: { deadKey: true, welcome: true }, tests: [{ ts: Date.now() - 5000, dur: 30, pool: "c200", opts: "", wpm: 41.2, raw: 44, acc: 0.95 }], bests: { practice: 0, lessonWpm: 22, test15: 0, test30: 41.2, test60: 0, test120: 0 } };
  const move = "#move=" + encodeURIComponent(JSON.stringify({ s: seedState({ passed: 3 }), c: null }));
  const SCENES = [
    ["settings", { seed: true }, async (p) => { await p.click("#open-settings"); }],
    ...[1, 2, 3, 4, 5, 6].map((n) => ["welcome" + n, {}, async (p, leg) => {
      for (let i = 1; i < n && i < 5; i++) { await p.keyboard.press("Enter"); await p.waitForTimeout(150); }
      if (n === 6) { await p.locator(leg ? '[data-wl="skipcheck"]' : 'button:has-text("Skip this step")').click(); }
    }]),
    ["toast", { seed: true, hash: "#test" }, async (p, leg) => { await p.evaluate((o) => { (window.App ? window.App.toast : window.__hr.toast)(o); }, { icon: bolt, title: "New best · 41 WPM at 30 s" }); await p.waitForTimeout(500); }],
    ["share", { seed: true, hash: "#test" }, async (p) => { await p.locator('button:has-text("Share best")').click(); await p.waitForSelector("#sh-img:not([hidden])"); await p.waitForTimeout(400); }],
    ["move", { hash: move }, async () => {}],
  ];
  for (const [vname, w, h] of VPS) for (const scheme of ["light", "dark"]) for (const [name, o, act] of SCENES) for (const leg of [false, true]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, colorScheme: scheme, reducedMotion: "reduce", deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    if (o.seed) await page.addInitScript((s) => { if (!localStorage.getItem("homerow.v1")) localStorage.setItem("homerow.v1", JSON.stringify(s)); }, seeded);
    await page.goto((leg ? LEGACY : REACT) + (o.hash || ""), { waitUntil: "load" }); await page.waitForTimeout(900);
    try { await act(page, leg); await page.waitForTimeout(500); await page.screenshot({ path: OUT + (leg ? "legacy-" : "react-") + name + "-" + vname + "-" + scheme + ".png" }); }
    catch (e) { console.log("shot failed", name, vname, scheme, leg ? "legacy" : "react", String(e).split("\n")[0]); }
    await ctx.close();
  }
  console.log("shots done");
}
await b.close();
console.log(fails ? fails + " FAILED" : "ALL PASSED"); process.exit(fails ? 1 : 0);
