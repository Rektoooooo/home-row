/* Phase 4B e2e + screenshots: Progress, Coach, Guide (React app vs legacy).
   Needs the dev server:  npx vite --port 5202 --strictPort   and the legacy app on :8780
   node scripts/e2e/phase4b.mjs          → assertions
   node scripts/e2e/phase4b.mjs shots    → notes/shots/phase4b/{react,legacy}-*.png  (pair them with the python one-liner in the report) */
import { launch, newPage, seedState, typeStage, LEGACY } from "./lib.mjs";
import { mkdirSync } from "node:fs";

const REACT = process.env.REACT_URL || "http://localhost:5202/app/";
let fails = 0;
const ok = (c, m) => { console.log((c ? "PASS " : "FAIL ") + m); if (!c) fails++; };
const OUT = new URL("../../notes/shots/phase4b/", import.meta.url).pathname;

/* synthetic progress with history: lessons, 40 days, all letters, pairs, tests (no real data) */
function richState(passed = 8) {
  const s = seedState({ passed });
  const dk = (n) => { const x = new Date(); x.setDate(x.getDate() - n); return x.getFullYear() + "-" + String(x.getMonth() + 1).padStart(2, "0") + "-" + String(x.getDate()).padStart(2, "0"); };
  const now = Date.now();
  s.days = {};
  for (let i = 0; i < 70; i++) {
    if ((i * 7) % 5 === 3) continue;
    const min = [0, 1, 2, 3, 6].includes(i) ? 18 : 3 + ((i * 11) % 14);
    const ms = min * 60000, chars = Math.round(ms / 60000 * 5 * (14 + (70 - i) / 4));
    s.days[dk(i)] = { ms, chars, presses: Math.round(chars * 1.04), correct: chars, ex: 3, t: now };
  }
  s.keys = {};
  "asdfjklqweruiopghtyvbnmcxz;".split("").forEach((k, i) => { s.keys[k] = { n: 20 + i * 7, errEma: 0.02 + (i % 7) * 0.03, timeEma: 330 + (i * 37) % 420 }; });
  s.pairs = {};
  ["th", "he", "in", "er", "an", "re", "on", "at", "en", "nd", "ti", "es", "or", "te", "of"].forEach((p, i) => { s.pairs[p] = { n: 12 + i * 5, errEma: 0.03 + (i % 5) * 0.02, timeEma: 360 + i * 22 }; });
  s.tests = [];
  for (let i = 0; i < 12; i++) s.tests.push({ ts: now - (i * 2 + 1) * 86400000 / 1.3, dur: [15, 30, 60][i % 3], pool: i % 4 ? "c200" : "e950", opts: i % 5 === 0 ? "cp" : "", wpm: 24 + i * 1.7, raw: 27 + i, acc: 0.93 + (i % 5) / 100 });
  s.tests.sort((a, b) => a.ts - b.ts);
  s.bests.test30 = 40; s.baseline = { wpm: 18, acc: 0.94, ts: now - 60 * 86400000 };
  s.modes = { text: 2, code: 0, mine: 0, at: now };
  return s;
}

const COACH_REPLY = (title, t2) => "Here is what I would work on: your right hand is slower than your left.\n\n```json\n" + JSON.stringify({
  homerow: 1, note: "Slow down on the right hand and keep the rhythm even.",
  lessons: [{ title, why: "Drills for your right hand home keys.", steps: [{ name: "Drill", text: "jkl; jkl; jjkk llj; jk;l jk;l" }, { name: "Pairs", text: t2 }, { name: "Words", text: "all ask add sad fall flask salad lads dad" }] }],
}) + "\n```\nHope that helps!";

const b = await launch();

/* ---------- 1. Progress ---------- */
{
  const ctx = await b.newContext({ viewport: { width: 1400, height: 1000 }, colorScheme: "light", reducedMotion: "no-preference" });
  const page = await ctx.newPage(); const errors = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); }); page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  await page.addInitScript((s) => { if (!localStorage.getItem("homerow.v1")) localStorage.setItem("homerow.v1", JSON.stringify(s)); }, richState());
  await page.goto(REACT + "#progress", { waitUntil: "load" }); await page.waitForTimeout(700);
  const t = (sel) => page.locator(sel).first().innerText();
  ok(await t("#view h1") === "Progress", "Progress h1");
  ok(await page.locator(".lvl-card .lvl.big .lvl-n").innerText().then(x => /^Level \d+$/.test(x)), "level hero");
  ok(await page.locator(".wrecap .pstat").count() === 4, "weekly recap has 4 stats");
  ok(await page.locator(".tiles .tile").count() === 4, "4 tiles");
  ok((await t(".tiles .tile:nth-child(4)")).includes("8 of 22 passed"), "lessons tile: 8 of 22");
  const nCells = await page.locator(".cal rect[data-tip]").count();
  ok(nCells > 70 && nCells <= 84, "calendar cells drawn (" + nCells + ")");
  await page.locator(".cal rect[data-tip]").nth(nCells - 1).hover(); await page.waitForTimeout(400);
  const tip = await page.locator('[role="tooltip"]').first().innerText().catch(() => "");
  ok(/min/.test(tip), "calendar tooltip on hover: " + tip);
  await page.mouse.move(5, 5);
  const box = await page.locator("#trend").boundingBox();
  await page.mouse.move(box.x + box.width * 0.75, box.y + box.height * 0.5); await page.waitForTimeout(400);
  const ctip = await page.locator('[role="tooltip"]').first().innerText().catch(() => "");
  ok(/WPM/.test(ctip), "chart tooltip: " + ctip);
  ok(await page.locator("#tcross2").evaluate(e => getComputedStyle(e).display) === "block", "chart crosshair shown");
  await page.mouse.move(5, 5); await page.waitForTimeout(300);
  ok(await page.locator("#tcross2").evaluate(e => getComputedStyle(e).display) === "none", "chart crosshair hidden on leave");
  ok(await page.locator(".ach").count() === 21, "21 achievements");
  const earned = await page.locator(".ach.on").count();
  ok(earned >= 5, "earned badges granted silently at load (" + earned + ")");
  ok(/Earned \d+ \w+/.test(await t(".ach.on .ach-s")), "earned badge shows date");
  await page.locator(".ach.off").first().scrollIntoViewIfNeeded(); await page.waitForTimeout(300); await page.locator(".ach.off").first().focus(); await page.waitForTimeout(500);
  ok((await page.locator('[role="tooltip"]').allInnerTexts()).join(" ").length > 5, "badge tooltip on focus");
  ok(await page.locator("#heat-kb .key.has").count() > 10, "heat keyboard colours keys");
  ok(await t("#ramp-l") === "Slower", "ramp captions (speed)");
  await page.click('[data-seg="Heat"][data-v="acc"]');
  ok(await t("#ramp-l") === "85%" && await page.locator('[data-v="acc"]').getAttribute("aria-pressed") === "true", "Accuracy heat toggle");
  ok(await page.locator(".slow .pk").count() === 5, "5 slowest keys");
  ok(await page.locator(".chips .pchip").count() === 8, "8 pair chips");
  await page.locator("details summary").first().click();
  ok(await page.locator("details[open] .tbl tbody tr").count() > 20, "all keys table opens");
  ok(await page.locator(".crow").count() === 22, "22 lesson rows");
  ok(await page.locator(".crow[aria-disabled=true]").count() === 22 - 9, "locked rows");
  ok(await page.locator(".tbl.tt tbody tr").count() === 10, "10 recent tests");
  await page.getByRole("button", { name: "Reset progress" }).click();
  ok(await page.getByText("This erases all lessons").count() === 1, "reset confirm shown");
  await page.getByRole("button", { name: "Cancel" }).click();
  ok(await page.getByRole("button", { name: "Reset progress" }).count() === 1, "reset cancel");
  await page.locator(".crow:not([aria-disabled=true])").nth(2).click(); await page.waitForTimeout(400);
  ok((await t(".panel h1")).startsWith("Lesson 3"), "lesson row opens its intro on Learn");
  ok(errors.filter(e => !/status of 500/.test(e)).length === 0, "Progress: no console errors " + errors.slice(0, 2)); /* the 500 is Learn importing the Session view another worker is still writing */
  await ctx.close();
}

/* ---------- 2. Progress, empty state ---------- */
{
  const { ctx, page, errors } = await newPage(b, { width: 1200, height: 900, state: { ...seedState({ passed: 0 }), days: {}, keys: {}, lessons: {} } }, REACT);
  await page.goto(REACT + "#progress"); await page.waitForTimeout(500);
  ok(await page.locator(".chart-empty").count() === 1, "empty trend message");
  ok((await page.locator(".wrecap").innerText()).includes("No practice yet this week"), "empty recap");
  ok((await page.locator(".empty").first().innerText()).length > 5, "empty slowest keys");
  ok((await page.locator("#view").innerText()).includes("None yet"), "best test None yet");
  ok(errors.length === 0, "Progress empty: no console errors " + errors.slice(0, 2));
  await ctx.close();
}

/* ---------- 3. Coach on the website ---------- */
{
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: "reduce", permissions: ["clipboard-read", "clipboard-write"] }, undefined);
  await ctx.grantPermissions(["clipboard-read", "clipboard-write"], { origin: new URL(REACT).origin });
  const page = await ctx.newPage(); const errors = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); }); page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  await page.addInitScript((s) => { if (!localStorage.getItem("homerow.v1")) localStorage.setItem("homerow.v1", JSON.stringify(s)); }, richState(6));
  await page.goto(REACT + "#coach", { waitUntil: "load" }); await page.waitForTimeout(500);
  const t = (sel) => page.locator(sel).first().innerText();
  ok(await t("#view h1") === "Coach", "Coach h1");
  ok((await t(".section-s h2")) === "Get new lessons from Claude", "paste panel title");
  ok(await page.locator(".psteps li").count() === 3, "three steps");
  ok((await t(".empty")).startsWith("No lessons yet. Paste Claude's reply above"), "empty lessons text (website)");
  ok(await page.locator("#share-box").count() === 0, "no Share card on the website");
  await page.getByRole("button", { name: "Copy my progress" }).click(); await page.waitForTimeout(300);
  const clip = await page.evaluate(() => navigator.clipboard.readText());
  ok(clip.includes("I'm learning to touch type with Home Row") && clip.includes('"homerow":1') && clip.includes("My progress (JSON)"), "Copy my progress copies the coach prompt");
  ok(await t("#paste-msg") === "Copied. Paste it into a chat with Claude.", "copied message");
  await page.getByRole("button", { name: "Paste Claude's reply" }).click();
  ok(await page.locator("#paste-in").evaluate(e => e === document.activeElement), "textarea focused on open");
  await page.getByRole("button", { name: "Add lessons" }).click();
  ok((await t("#paste-msg")).startsWith("No lessons found."), "no block → message");
  await page.fill("#paste-in", "Here you go: {\"homerow\":1,\"lessons\":[{\"title\":\"Bad\",\"steps\":[{\"text\":\"café là là là\"}]}]}");
  await page.getByRole("button", { name: "Add lessons" }).click();
  ok((await t("#paste-msg")).startsWith("That lesson can't be used"), "bad characters → message: " + (await t("#paste-msg")).slice(0, 40));
  await page.fill("#paste-in", COACH_REPLY("Right hand drills", "ja jk jl j; ka kj kl k; la lj lk l; sa sd sf"));
  await page.getByRole("button", { name: "Add lessons" }).click(); await page.waitForTimeout(300);
  ok(await t("#paste-msg") === "Added 1 lesson below.", "added message: " + await t("#paste-msg"));
  ok(await page.locator(".cgrid .panel").count() === 1, "one lesson card");
  ok((await t(".cgrid .panel .label")).toLowerCase().startsWith("made in chat"), "card eyebrow");
  ok((await t(".coach-note")).includes("Slow down on the right hand"), "Claude's note shown");
  ok((await t(".scount")) === "1 lesson", "count 1 lesson");
  await page.getByRole("button", { name: "Paste Claude's reply" }).click();
  await page.fill("#paste-in", COACH_REPLY("Right hand drills", "ja jk jl j; ka kj kl k; la lj lk l; sa sd sf"));
  await page.getByRole("button", { name: "Add lessons" }).click(); await page.waitForTimeout(300);
  ok(await page.locator(".cgrid .panel").count() === 1, "duplicate paste keeps one lesson");
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("homerow.coach")));
  ok(stored.lessons.length === 1 && stored.note && stored.note.text, "coach doc saved in localStorage");
  await page.screenshot({ path: OUT + "react-coach-lessons-check.png" }).catch(() => {});
  // run the custom lesson with real keystrokes
  await page.getByRole("button", { name: "Start" }).click(); await page.waitForTimeout(300);
  ok((await t(".panel .label")).toLowerCase() === "from claude", "custom intro eyebrow");
  ok(await page.locator(".csteps li").count() === 3, "custom intro lists 3 steps");
  await page.keyboard.press("Escape"); await page.waitForTimeout(200);
  ok(await page.locator(".cgrid").count() === 1, "Esc on the intro → Coach");
  await page.getByRole("button", { name: "Start" }).click(); await page.waitForTimeout(200);
  await page.keyboard.press("Enter"); await page.waitForSelector("#txt .c");
  ok((await t(".crumb")).startsWith("Claude · Right hand drills · Step 1 of 3 · Drill"), "crumb: " + await t(".crumb"));
  for (let step = 1; step <= 3; step++) {
    await typeStage(page); await page.waitForSelector(".result", { timeout: 5000 });
    if (step === 1) ok((await t(".result .label")).toLowerCase() === "from claude · step 1 of 3", "step summary eyebrow");
    if (step < 3) await page.keyboard.press("Enter");
  }
  await page.waitForTimeout(300);
  ok((await t(".result .label")).toLowerCase() === "from claude" && (await t(".result h1")) === "Right hand drills", "custom results screen");
  ok(await page.locator(".result .stars-lg").count() === 1, "passed: stars shown");
  const custom = await page.evaluate(() => JSON.parse(localStorage.getItem("homerow.v1")).custom);
  ok(Object.keys(custom).length === 1 && Object.values(custom)[0].attempts === 1, "custom result stored");
  await page.getByRole("button", { name: "Back to Coach" }).click(); await page.waitForTimeout(300);
  ok(await page.locator(".cgrid .cmeta .stars").count() === 1, "card shows stars after the run");
  ok((await t(".cgrid .cmeta")).includes("WPM"), "card meta: " + await t(".cgrid .cmeta"));
  await page.getByRole("button", { name: "Remove" }).click();
  ok((await t(".cgrid .panel-foot")).includes("Remove this lesson?"), "inline remove confirm");
  await page.getByRole("button", { name: "Keep" }).click();
  ok(await page.locator(".cgrid .panel").count() === 1, "Keep keeps it");
  await page.getByRole("button", { name: "Remove" }).click(); await page.locator(".cgrid .panel-foot .btn").first().click(); await page.waitForTimeout(300);
  ok(await page.locator(".cgrid").count() === 0 && (await t(".empty")).startsWith("No lessons yet"), "Remove deletes the lesson");
  // pass lesson 1 first: fresh state
  await page.evaluate(() => { const s = JSON.parse(localStorage.getItem("homerow.v1")); s.lessons = {}; localStorage.setItem("homerow.v1", JSON.stringify(s)); });
  await page.reload({ waitUntil: "load" }); await page.waitForTimeout(400);
  ok((await t(".empty")).startsWith("Pass lesson 1 first."), "Pass lesson 1 first");
  await page.getByRole("button", { name: "Go to lesson 1" }).click(); await page.waitForTimeout(400);
  ok((await t(".panel h1")).startsWith("Lesson 1"), "Go to lesson 1 opens its intro");
  ok(errors.length === 0, "Coach (website): no console errors " + errors.slice(0, 3));
  await ctx.close();
}

/* ---------- 3b. clipboard blocked → fallback textarea ---------- */
{
  const { ctx, page } = await newPage(b, { width: 1200, height: 900, reducedMotion: "reduce", state: richState(6) }, REACT);
  await page.addInitScript(() => {});
  await page.goto(REACT + "#coach"); await page.waitForTimeout(400);
  await page.evaluate(() => { Object.defineProperty(navigator, "clipboard", { value: { writeText: () => Promise.reject(new Error("blocked")) }, configurable: true }); });
  await page.getByRole("button", { name: "Copy my progress" }).click(); await page.waitForTimeout(300);
  ok((await page.locator("#paste-msg").innerText()).startsWith("Your browser blocked copying"), "blocked clipboard message");
  ok(await page.locator("#paste-copy").evaluate(e => e === document.activeElement && e.value.includes("homerow")), "fallback textarea selected with the progress text");
  await ctx.close();
}

/* ---------- 4. Coach inside claude.ai (mocked window.claude) ---------- */
{
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: "reduce" });
  const page = await ctx.newPage(); const errors = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); }); page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  await page.addInitScript((s) => {
    if (!localStorage.getItem("homerow.v1")) localStorage.setItem("homerow.v1", JSON.stringify(s));
    const docs = { "data/users/u1/coach": { note: { text: "Account note from chat.", at: Date.now() }, lessons: [{ id: "chat-abc", title: "From the account", why: "A lesson that lives in the account doc.", by: "chat", created: Date.now(), steps: [{ name: "One", text: "asdf jkl; asdf jkl;" }] }] } };
    const listeners = {};
    const db = { doc: (p) => ({
      get: async () => ({ exists: p in docs, data: () => docs[p] }),
      set: async (v) => { docs[p] = JSON.parse(JSON.stringify(v)); (listeners[p] || []).forEach(f => f({ exists: true, data: () => docs[p] })); },
      onSnapshot: (f) => { (listeners[p] = listeners[p] || []).push(f); setTimeout(() => f({ exists: p in docs, data: () => docs[p] }), 0); return () => {}; },
    }) };
    window.__docs = docs;
    window.claude = { use: async (n) => {
      if (n === "db") return db;
      if (n === "user") return { id: async () => "u1" };
      if (n === "sample") return { json: async (prompt, o) => {
        window.__asked = (window.__asked || 0) + 1;
        await new Promise(r => setTimeout(r, 900));
        if (o && o.signal && o.signal.aborted) throw { code: "cancelled" };
        const allowed = (/Use ONLY these characters: (.*) plus the space bar/.exec(prompt) || [])[1] || "asdfjkl;";
        const w = [...allowed].filter(c => /[a-z]/.test(c)).slice(0, 4).join("");
        return { note: "Mock advice from Claude.", lesson: { title: "Mock lesson", why: "Made for you by the mock.", steps: [{ name: "Drill", text: (w + " ").repeat(8).trim() }, { name: "Mix", text: (w + " " + w.split("").reverse().join("") + " ").repeat(6).trim() }, { name: "Flow", text: (w + " ").repeat(12).trim() }] } };
      } };
      return null;
    } };
  }, richState(6));
  await page.goto(REACT + "#coach", { waitUntil: "load" }); await page.waitForTimeout(1500);
  const t = (sel) => page.locator(sel).first().innerText();
  ok((await t(".section-s h2")) === "A lesson made for you", "Ask Claude panel shown (claude.ai)");
  ok(await page.getByRole("button", { name: "Ask Claude for a lesson" }).count() === 1, "Ask button");
  ok(await page.getByText("From the account").count() === 1 && (await t(".coach-note")).includes("Account note"), "account lessons + note rendered");
  ok((await page.locator("#view h2").allInnerTexts()).includes("Let Claude see your progress"), "Share card (account variant)");
  ok((await t("#share-box")).includes("claude.ai/artifact"), "share prompt shown");
  await page.getByRole("button", { name: "Ask Claude for a lesson" }).click(); await page.waitForTimeout(250);
  ok(await page.locator(".thinking").count() === 1 && await page.getByRole("button", { name: "Stop" }).count() === 1, "Thinking… and Stop while running");
  await page.getByRole("button", { name: "Stop" }).click(); await page.waitForTimeout(1200);
  ok(await page.locator(".thinking").count() === 0 && await page.locator(".coach-err").count() === 0, "Stop: cancelled without an error message");
  await page.getByRole("button", { name: "Ask Claude for a lesson" }).click(); await page.waitForTimeout(1600);
  ok(await page.getByText("New lesson added below.").count() === 1, "ask result message");
  ok(await page.locator(".cgrid .panel").count() === 2 && await page.getByText("Mock lesson").count() === 1, "asked lesson added to the grid");
  ok((await page.locator(".cgrid .label").allInnerTexts()).some(x => x.toLowerCase().startsWith("made in the app")), "eyebrow Made in the app");
  ok((await t(".coach-note")).includes("Mock advice"), "note replaced by the asked one");
  const doc = await page.evaluate(() => window.__docs["data/users/u1/coach"]);
  ok(doc.lessons.length === 2, "account coach doc written");
  ok(errors.length === 0, "Coach (claude.ai): no console errors " + errors.slice(0, 3));
  await ctx.close();
}

/* ---------- 5. Guide ---------- */
{
  const { ctx, page, errors } = await newPage(b, { width: 1200, height: 900, state: richState() }, REACT);
  await page.goto(REACT + "#guide"); await page.waitForTimeout(500);
  ok(await page.locator(".guide h1").innerText() === "Guide", "Guide h1");
  ok((await page.locator(".guide h2").allInnerTexts()).join("|") === "1. Sit and place your hands|2. Find the home row|3. One finger for each key|4. How to practise|5. What to expect|6. When you get stuck|7. Notes for your keyboard|Sources", "Guide sections");
  ok(await page.locator("#g-kb .key").count() > 40, "finger keyboard rendered");
  ok(await page.locator(".legend > span").count() === 5, "legend 5 entries");
  ok(await page.locator(".guide .src a[rel=noopener][target=_blank]").count() === 7, "7 sources");
  ok(errors.length === 0, "Guide: no console errors " + errors.slice(0, 2));
  await ctx.close();
}

/* ---------- screenshots ---------- */
if (process.argv[2] === "shots") {
  mkdirSync(OUT, { recursive: true });
  const SIZES = [[1600, 980], [1024, 768], [390, 844]];
  for (const which of ["react", "legacy"]) {
    const url = which === "react" ? REACT : LEGACY;
    for (const scheme of ["light", "dark"]) for (const [w, h] of SIZES) {
      const tag = `${w}-${scheme}`;
      const ctx = await b.newContext({ viewport: { width: w, height: h }, colorScheme: scheme, reducedMotion: "reduce" });
      const page = await ctx.newPage(); const errors = [];
      page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); }); page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
      const coachDoc = { note: { text: "Your right hand is a little slower than your left. Keep the rhythm even and slow down on the pairs.", at: Date.now() }, lessons: [
        { id: "chat-aaa", title: "Right hand drills", why: "Drills for your right hand home keys and the pairs that slow you down.", by: "chat", created: Date.now() - 86400000 * 3, steps: [{ name: "Drill", text: "jkl; jkl; jjkk llj; jk;l" }, { name: "Pairs", text: "ja jk jl j; ka kj kl k;" }, { name: "Words", text: "all ask add sad fall flask" }] },
        { id: "app-bbb", title: "Left hand reach", why: "Short lesson for the keys you miss most.", by: "app", created: Date.now() - 86400000, steps: [{ name: "Drill", text: "asdf asdf fdsa fdsa" }, { name: "Pairs", text: "as sd df fa ad sf" }, { name: "Words", text: "sad fad dad ads add" }] },
        { id: "weekly-2026-w46", title: "This week: steady rhythm", why: "Your weekly lesson, written from last week's practice.", by: "app", created: Date.now(), steps: [{ name: "Drill", text: "asdf jkl; asdf jkl;" }, { name: "Pairs", text: "ad sk dl fj ;a" }, { name: "Words", text: "salad flask dads falls" }] }] };
      await page.addInitScript(([s, c]) => { if (!localStorage.getItem("homerow.v1")) localStorage.setItem("homerow.v1", JSON.stringify(s)); if (c && !localStorage.getItem("homerow.coach")) localStorage.setItem("homerow.coach", JSON.stringify(c)); }, [richState(), null]);
      const shot = async (name, full) => { await page.waitForTimeout(450); await page.screenshot({ path: `${OUT}${which}-${name}-${tag}.png`, fullPage: !!full }); };
      await page.goto(url + "#progress", { waitUntil: "load" }); await page.waitForTimeout(700);
      await shot("progress", false); await shot("progress-full", true);
      await page.goto(url + "#guide", { waitUntil: "load" }); await shot("guide", true);
      // Coach empty (no lessons), website
      await page.goto(url + "#coach", { waitUntil: "load" }); await page.waitForTimeout(400);
      await shot("coach-empty", true);
      // paste panel open
      await page.getByRole("button", { name: "Paste Claude's reply" }).click(); await page.waitForTimeout(200);
      await shot("coach-paste", false);
      // with lessons
      await page.evaluate((c) => localStorage.setItem("homerow.coach", JSON.stringify(c)), coachDoc);
      await page.reload({ waitUntil: "load" }); await shot("coach-lessons", true);
      // custom intro and results
      await page.getByRole("button", { name: "Start" }).first().click(); await page.waitForTimeout(300); await shot("custom-intro", false);
      await page.keyboard.press("Enter"); await page.waitForSelector("#txt .c");
      for (let step = 1; step <= 3; step++) { await typeStage(page); await page.waitForSelector(".result", { timeout: 5000 }); if (step < 3) await page.keyboard.press("Enter"); }
      await shot("custom-results", false);
      await ctx.close();
      if (errors.length) console.log(which, tag, "console errors:", errors.slice(0, 3));
    }
  }
}
await b.close();
console.log(fails ? fails + " FAILED" : "ALL PASSED");
process.exit(fails ? 1 : 0);
