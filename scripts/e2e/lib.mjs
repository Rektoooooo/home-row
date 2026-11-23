/* shared helpers for the e2e / screenshot scripts (playwright-core driving the installed Chrome) */
import { chromium } from "playwright-core";

export const REACT = process.env.REACT_URL || "http://localhost:5199/app/";
export const LEGACY = process.env.LEGACY_URL || "http://localhost:8780/app/";

export async function launch() {
  return chromium.launch({ channel: "chrome", headless: true });
}

/* synthetic progress: lessons 1-5 passed, a few days of practice, some key stats. Never real user data. */
export function seedState(opts = {}) {
  const now = Date.now();
  const d = (n) => { const x = new Date(); x.setDate(x.getDate() - n); return x.getFullYear() + "-" + String(x.getMonth() + 1).padStart(2, "0") + "-" + String(x.getDate()).padStart(2, "0"); };
  const lessons = {};
  const passed = opts.passed ?? 5;
  for (let n = 1; n <= passed; n++) lessons[n] = { done: true, stars: [3, 2, 2, 1, 3][n % 5], wpm: 18 + n, acc: 0.96 + (n % 3) / 100, attempts: 2, last: now };
  const days = {};
  [0, 1, 2, 3].forEach((i) => { days[d(i)] = { ms: i === 0 ? 7 * 60000 : 12 * 60000, chars: 900 + i * 50, presses: 1000, correct: 960, ex: 3, t: now }; });
  const keys = {};
  "asdfjkl;".split("").forEach((k, i) => { keys[k] = { n: 40 + i, errEma: 0.04, timeEma: 420 + i * 25 }; });
  const s = {
    v: 1, updatedAt: now, resetAt: 0, settings: { hints: "always", stop: true, sound: false, soundPack: "off", weekly: false, goal: 15, target: 25, layout: "iso", unlockAll: false, pace: "target", pCaps: false, pPunct: false, pNums: false, tDur: 30, tPool: "c200", tCaps: false, tPunct: false, tNums: false },
    settingsAt: 0, lessons, custom: {}, keys, keysAt: now, pairs: {}, pairsAt: 0, days, tests: [], bests: { practice: 0, lessonWpm: 22, test15: 0, test30: 0, test60: 0, test120: 0 },
    seenTips: { deadKey: true, welcome: true }, ach: {}, baseline: null, modes: { text: 0, code: 0, mine: 0, at: 0 },
  };
  return s;
}

export async function newPage(browser, { width = 1600, height = 980, scheme = "light", reducedMotion = "no-preference", state = null, hash = "" } = {}, url = REACT) {
  const ctx = await browser.newContext({ viewport: { width, height }, colorScheme: scheme, reducedMotion, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  if (state) await page.addInitScript((s) => { try { if (!localStorage.getItem("homerow.v1")) localStorage.setItem("homerow.v1", JSON.stringify(s)); } catch (e) {} }, state);
  await page.goto(url + hash, { waitUntil: "load" });
  await page.waitForTimeout(500);
  return { ctx, page, errors };
}

/* types the text currently on the stage with real key presses; `skip` chars are typed wrong on purpose (to force a fail / a given accuracy) */
export async function typeStage(page, { wrong = 0, delay = 0 } = {}) {
  await page.waitForSelector("#txt .c", { timeout: 5000 });
  const txt = await page.evaluate(() => [...document.querySelectorAll("#txt .c")].map((e) => e.textContent).join(""));
  let w = wrong;
  for (const ch of txt) {
    if (w > 0) { w--; await page.keyboard.press(ch === "z" ? "x" : "z"); }
    await page.keyboard.press(ch === " " ? "Space" : ch, { delay });
  }
  return txt.length;
}

/* plays a lesson from its intro: Enter starts it, types the three steps, Enter between steps; resolves when results show */
export async function playLesson(page, opts = {}) {
  await page.keyboard.press("Enter"); // intro → stage
  for (let step = 1; step <= 3; step++) {
    await typeStage(page, step === 3 ? opts : {});
    await page.waitForSelector(".result", { timeout: 5000 });
    if (step < 3) await page.keyboard.press("Enter"); // step summary → next step
  }
}
