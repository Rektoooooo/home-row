/* Phase 3 e2e: shell, Learn, intro, the 3-step run with real keystrokes, results, keys, dialog focus trap.
   Needs a running server:  npm run dev -- --port 5199   (REACT_URL overrides the default http://localhost:5199/app/) */
import { launch, newPage, seedState, typeStage, REACT } from "./lib.mjs";

let fails = 0;
const ok = (c, m) => { console.log((c ? "PASS " : "FAIL ") + m); if (!c) fails++; };
const b = await launch();
const fresh = { ...seedState({ passed: 0 }), days: {}, keys: {}, bests: { practice: 0, lessonWpm: 0, test15: 0, test30: 0, test60: 0, test120: 0 } };
const { page, errors } = await newPage(b, { reducedMotion: "reduce", state: fresh }, REACT);
const stored = () => page.evaluate(() => JSON.parse(localStorage.getItem("homerow.v1")));
const text = (sel) => page.locator(sel).first().innerText();

// 1. Learn renders; routing
ok(await page.locator("h1.vh").innerText() === "Learn", "Learn renders");
ok((await text(".today h1")).startsWith("Lesson 1 · F and J"), "Today card shows lesson 1");
await page.evaluate(() => { location.hash = "nonsense"; }); await page.waitForTimeout(150);
ok(await page.locator('[role=tab][aria-current=page]').innerText() === "Learn", "unknown hash → Learn");
await page.evaluate(() => { location.hash = "coach"; }); await page.waitForTimeout(150);
ok((await text("#view h1")) === "Coach", "#coach shows placeholder");
await page.click(".brand"); await page.waitForTimeout(150);
ok(page.url().endsWith("#learn") && (await page.locator("h1.vh").count()) === 1, "brand link → #learn");

// 2. Enter on Learn → primary → intro; Esc → back to list (focus must not sit on a link or button)
await page.evaluate(() => document.activeElement.blur());
await page.keyboard.press("Enter"); await page.waitForTimeout(200);
ok((await text(".panel h1")).startsWith("Lesson 1 · F and J"), "Enter on Learn opens the intro (primary button)");
await page.keyboard.press("Escape"); await page.waitForTimeout(200);
ok(await page.locator(".today").count() === 1, "Esc on the intro returns to the lesson list");

// 3. lesson 1 through real keystrokes
await page.locator(".lrow").first().click(); await page.waitForTimeout(200);
ok(await page.locator(".keylist .bigcap").count() === 2, "intro lists the 2 keys with big caps");
await page.keyboard.press("Enter"); await page.waitForSelector("#txt .c");
ok((await text(".crumb")).startsWith("Lesson 1 · Step 1 of 3 · Find the keys"), "crumb: " + (await text(".crumb")));
// Esc inside a stage restarts it
await page.keyboard.press("f"); await page.keyboard.press("Escape"); await page.waitForTimeout(150);
ok((await text("#l-prog")).startsWith("0 /"), "Esc in a stage restarts it");
await typeStage(page); await page.waitForSelector(".result");
ok((await text(".result h1")).endsWith("done"), "step summary: " + (await text(".result h1")));
await page.keyboard.press("Enter"); await typeStage(page); await page.waitForSelector(".result"); await page.keyboard.press("Enter");
const names = await text(".crumb");
ok(/Step 3 of 3 · (Words|Rhythm)/.test(names), "step 3 name: " + names);
await typeStage(page); await page.waitForSelector(".result .status");
ok(await text(".result .status") === "Passed", "results show Passed");
ok((await page.locator(".result .stars-lg svg.star-on").count()) >= 1, "results show stars");
ok((await text(".result .msg")) === "Lesson 2 is unlocked.", "unlock message");
const st = await stored();
ok(st.lessons[1] && st.lessons[1].done && st.lessons[1].stars >= 1 && st.lessons[1].attempts === 1, "localStorage homerow.v1 lessons[1] saved " + JSON.stringify(st.lessons[1]));
ok(Object.keys(st.days).length === 1, "today's practice time recorded");

// 4. forced ~94.6% result: retry until the total presses allow it
let shown = null;
for (let attempt = 0; attempt < 60 && !shown; attempt++) {
  if (attempt === 0) await page.getByRole("button", { name: /Try again/ }).click(); // pass-screen "Try again" starts the run directly
  await page.waitForSelector("#txt .c");
  const lens = [];
  for (let step = 1; step <= 3; step++) {
    if (step === 3) {
      const L = await page.evaluate(() => document.querySelectorAll("#txt .c").length);
      const T = lens[0] + lens[1] + L;
      let best = 0, bd = 9;
      for (let k = 0; k < 40; k++) { const d = Math.abs(T / (T + k) - 0.9463); if (d < bd) { bd = d; best = k; } }
      const acc = T / (T + best);
      if (acc >= 0.946 && acc < 0.947) { await typeStage(page, { wrong: best }); }
      else { await typeStage(page); }
      await page.waitForSelector(".result .status");
      if (acc >= 0.946 && acc < 0.947) shown = true;
      break;
    }
    lens.push(await typeStage(page)); await page.waitForSelector(".result"); await page.keyboard.press("Enter");
  }
  if (!shown) await page.getByRole("button", { name: /Try again/ }).click();
}
const failed = await text(".result .status");
ok(failed === "Not passed yet", "94.6% run is not passed (" + failed + ")");
const msg = await text(".result .msg");
ok(msg.startsWith("Accuracy 94.6%"), "message shows 94.6%: " + msg);
ok((await text(".pstat:nth-child(2) .num")) === "94.6%", "accuracy stat reads 94.6%");
ok((await page.locator(".result .stars-lg").count()) === 0, "no stars on a fail");
await page.getByRole("button", { name: /Try again/ }).click();

// 5. dialog open blocks typing and traps focus
await page.waitForSelector("#txt .c");
const c0 = await page.evaluate(() => document.querySelector("#txt .c").textContent);
await page.keyboard.press(c0); await page.waitForTimeout(100);
const before = await text("#l-prog");
await page.click("#open-settings"); await page.waitForSelector('[role=dialog][data-state=open]');
for (const k of "abcdefg") await page.keyboard.press(k);
for (let i = 0; i < 6; i++) await page.keyboard.press("Tab");
ok(await page.evaluate(() => !!document.activeElement.closest('[role=dialog]')), "focus stays trapped inside the dialog after Tab");
ok((await text("#l-prog")) === before, "typing is ignored while a dialog is open (" + before + ")");
await page.keyboard.press("Escape"); await page.waitForTimeout(250);
ok(await page.locator('[role=dialog][data-state=open]').count() === 0, "Esc closes the dialog");
await page.keyboard.press(await page.evaluate(() => document.querySelectorAll("#txt .c")[1].textContent.replace(" ", "Space"))); await page.waitForTimeout(150);
ok((await text("#l-prog")).startsWith("2 /"), "typing resumes after the dialog closes: " + (await text("#l-prog")));
// Enter on the focused Back button is native, not the global primary
await page.keyboard.press("Escape");

// 6. layout switch rebuilds keyboards; settings.unlockAll respected
await page.click('[data-tab=learn]'); await page.waitForTimeout(250);
ok(await page.locator(".lrow.locked").count() > 0, "locked rows exist");
ok(errors.length === 0, "no console errors " + JSON.stringify(errors.slice(0, 3)));
await b.close();
console.log(fails ? `${fails} FAILED` : "all passed");
process.exit(fails ? 1 : 0);
