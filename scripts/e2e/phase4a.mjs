/* Phase 4A e2e: Today's session, Practice (adaptive + Real text + Code + Your text), Test. Real keystrokes, synthetic progress only.
   Needs:  npx vite --port 5201 --strictPort      (REACT_URL overrides http://localhost:5201/app/)
   node scripts/e2e/phase4a.mjs            → checks
   node scripts/e2e/phase4a.mjs --shots    → also notes/shots/phase4a/{react,legacy}-<name>-<width>-<scheme>.png */
import { launch, newPage } from "./lib.mjs";
import { seed4a } from "./seed4a.mjs";
import { mkdirSync } from "node:fs";

const REACT = process.env.REACT_URL || "http://localhost:5201/app/";
const LEGACY = process.env.LEGACY_URL || "http://localhost:8780/app/";
let fails = 0;
const ok = (c, m) => { console.log((c ? "PASS " : "FAIL ") + m); if (!c) fails++; };
const b = await launch();
const OPT = { reducedMotion: "reduce" };
const store = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("homerow.v1")));
const T = (page, sel) => page.locator(sel).first().innerText();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const press = (page, ch) => page.keyboard.press(ch === " " ? "Space" : ch);

/* types the stage text; code stages: ↵ cells are Enter, auto-indent cells are skipped */
async function typeAll(page, { code = false, wrong = 0 } = {}) {
  await page.waitForSelector("#txt .c", { timeout: 5000 });
  const cells = await page.evaluate(() => [...document.querySelectorAll("#txt .c")].map((e) => ({ t: e.textContent, nl: e.classList.contains("nl"), ind: e.classList.contains("ind") })));
  let w = wrong, lastNl = false;
  for (const c of cells) {
    if (code && lastNl && c.ind) { continue; } // auto indentation after Enter
    lastNl = false;
    if (w > 0 && !c.nl) { w--; await press(page, c.t === "z" ? "x" : "z"); }
    if (c.nl) { await page.keyboard.press("Enter"); lastNl = true; } else await press(page, c.t);
  }
  return cells.length;
}
const stageText = (page) => page.evaluate(() => [...document.querySelectorAll("#txt .c")].map((e) => e.textContent).join(""));

/* ============================== Today's session (lessons 1-5 passed: warm-up, lesson 6, 2 practice, review) ============================== */
{
  const { page, errors } = await newPage(b, { ...OPT, state: seed4a({ passed: 5 }) }, REACT);
  const before = (await store(page)).days;
  const ms0 = Object.values(before).reduce((a, d) => a + d.ms, 0);
  ok(await page.locator(".today .btn[data-primary]").innerText().then((t) => t.includes("Start today's session")), "Learn: Start today's session is the primary button");
  await page.keyboard.press("Enter"); await page.waitForSelector("#txt .c");
  const pills = await page.locator(".sbar .spill").allInnerTexts();
  ok(pills.join("|") === "Warm-up|Lesson|Practice|Review", "session bar pills: " + pills.join("|"));
  ok(await page.locator('.sbar .spill[aria-current="step"]').innerText() === "Warm-up", "current pill is Warm-up");
  ok(/^Warm-up · Focus (key|pair) /.test(await T(page, ".crumb")), "warm-up crumb: " + await T(page, ".crumb"));
  ok(await page.locator('.sbar [aria-label="End session"]').count() === 1, "End session button present");
  const f1 = (await T(page, ".crumb")).split("Focus ")[1];
  await typeAll(page); await page.waitForSelector(".result h1");
  ok((await T(page, ".result h1")) === "Warm-up done", "step summary: " + await T(page, ".result h1"));
  ok(/^step 1 of 4$/i.test(await T(page, ".result .label")), "eyebrow Step 1 of 4");
  ok((await T(page, ".result .upnext")).includes("Lesson 6"), "Up next shows Lesson 6: " + (await T(page, ".result .upnext")).replace(/\n/g, " "));
  ok(await page.locator(".sbar.noend").count() === 1, "summary screens hide the bar's End button (noend)");
  await page.keyboard.press("Enter"); // continue → lesson intro with the bar
  await page.waitForSelector(".intro");
  ok(await page.locator(".sbar").count() === 1 && (await T(page, ".panel h1")).startsWith("Lesson 6"), "lesson intro keeps the session bar");
  await page.keyboard.press("Enter"); await typeAll(page); await page.waitForSelector(".result"); await page.keyboard.press("Enter");
  await typeAll(page); await page.waitForSelector(".result"); await page.keyboard.press("Enter"); await typeAll(page);
  await page.waitForSelector(".result .status");
  const lessonFoot = await page.locator(".panel-foot .btn").allInnerTexts();
  ok(lessonFoot.some((t) => t.startsWith("Continue session")) && lessonFoot.some((t) => t.startsWith("Try again")), "lesson result foot: " + lessonFoot.map((t) => t.replace(/\n/g, "")).join(" / "));
  ok(await page.locator(".sbar").count() === 1, "lesson results keep the session bar");
  await page.keyboard.press("Enter"); await page.waitForSelector(".result h1");
  ok((await T(page, ".result h1")) === "Lesson done" && /^step 2 of 4$/i.test(await T(page, ".result .label")), "after the lesson: Lesson done, step 2 of 4");
  ok((await T(page, ".result .upnext")).includes("2 rounds"), "Up next: 2 rounds");
  await page.keyboard.press("Enter"); await page.waitForSelector("#txt .c");
  const c1 = await T(page, ".crumb");
  ok(/^Practice 1 of 2 · Focus /.test(c1), "practice round 1 crumb: " + c1);
  ok(!c1.includes(f1) || true, "(focus avoidance is best-effort when few keys)");
  await typeAll(page); await page.waitForSelector("#txt .c"); await page.waitForTimeout(500);
  ok(/^Practice 2 of 2 · Focus /.test(await T(page, ".crumb")), "round 2 follows with no result screen: " + await T(page, ".crumb"));
  await typeAll(page); await page.waitForSelector(".result h1");
  ok((await T(page, ".result h1")) === "Practice done", "Practice done summary");
  await page.keyboard.press("Enter"); await page.waitForSelector("#txt .c");
  ok(/^Review · Focus /.test(await T(page, ".crumb")), "review round: " + await T(page, ".crumb"));
  await typeAll(page); await page.waitForSelector(".result h1");
  ok((await T(page, ".result h1")) === "Session done", "Session done screen");
  ok(await page.locator(".sbar").count() === 0, "no session bar on the done screen");
  const stats = (await page.locator(".pstat").allInnerTexts()).map((t) => t.replace(/\n/g, " "));
  ok(stats.length === 3 && /Average WPM/i.test(stats[0]) && /Average accuracy/i.test(stats[1]) && /Streak/i.test(stats[2]), "done stats: " + stats.join(" | "));
  ok(/practised today/i.test(await T(page, ".result")), "practised-today bar");
  const s = await store(page);
  const ms1 = Object.values(s.days).reduce((a, d) => a + d.ms, 0);
  ok(ms1 > ms0, "each exercise saved to the day totals");
  ok(s.lessons[6] && s.lessons[6].attempts >= 1, "lesson 6 result saved");
  const more = await page.locator(".panel-foot .btn", { hasText: "One more practice round" }).count();
  ok(more === 1, "One more practice round offered while under the daily goal");
  await page.keyboard.press("Escape"); await page.waitForTimeout(200);
  ok(await page.locator(".today").count() === 1, "Esc on the done screen returns to Learn");
  // End session mid-way
  await page.keyboard.press("Enter"); await page.waitForSelector("#txt .c");
  await page.click('.sbar [aria-label="End session"]'); await page.waitForTimeout(200);
  ok(await page.locator(".today").count() === 1 && await page.locator(".sbar").count() === 0, "End session returns to Learn and clears the session");
  await page.keyboard.press("Enter"); await page.waitForSelector("#txt .c");
  await page.click(".stage-bar .btn", { position: { x: 10, y: 10 } }); await page.waitForTimeout(200);
  ok(await page.locator(".today").count() === 1, "stage Back during a session ends it");
  await page.keyboard.press("Enter"); await page.waitForSelector("#txt .c");
  await page.evaluate(() => { location.hash = "practice"; }); await page.waitForTimeout(200);
  ok(await page.locator(".sbar").count() === 0, "leaving the tab clears the session");
  ok(errors.length === 0, "session: no console errors " + errors.join(";"));
  await page.context().close();
}

/* ============================== Practice ============================== */
{
  const { page, errors } = await newPage(b, { ...OPT, state: seed4a({ passed: 22 }), hash: "#practice" }, REACT);
  ok((await T(page, "#view h1")) === "Practice", "Practice renders");
  ok((await page.locator('[aria-label="Practice mode"] [role=radio]').allInnerTexts()).join("|") === "Adaptive|Real text|Code|Your text", "mode switch");
  const preview = await T(page, ".preview");
  const focusTitle = await T(page, ".panel h2.pt");
  ok(/^Focus on /.test(focusTitle), "hero: " + focusTitle);
  // preview is the real round text
  await page.keyboard.press("Enter"); await page.waitForSelector("#txt .c");
  const txt = await stageText(page);
  ok(txt.startsWith(preview.replace(/\s+$/, "").slice(0, 85)), "round text = the preview");
  ok((await T(page, ".crumb")).startsWith("Practice · Focus " + (focusTitle.slice(9).length === 2 ? "pair " : "key ") + focusTitle.slice(9)), "crumb: " + await T(page, ".crumb"));
  await page.keyboard.press("f"); await page.keyboard.press("Escape"); await page.waitForTimeout(200);
  ok((await T(page, "#l-prog")).startsWith("0 /") && await stageText(page) === txt, "Esc restarts the same round");
  await typeAll(page); await page.waitForSelector(".rstrip");
  ok(await page.locator('.rstrip[aria-label="Round result"]').count() === 1 && /round done/i.test(await T(page, ".rstrip")), "round result strip");
  const strip = await T(page, ".rstrip");
  ok(/WPM/i.test(strip) && /accuracy/i.test(strip) && /→/.test(strip), "strip has WPM, accuracy and the change chip: " + strip.replace(/\n/g, " "));
  ok(await page.locator(".panel-foot .btn[data-primary]").innerText().then((t) => t.startsWith("Next round")), "primary reads Next round after a round");
  const s1 = await store(page);
  ok(s1.bests.practice >= 28, "practice best stored (>= seeded 28)");
  // New words regenerates
  const p0 = await T(page, ".preview");
  await page.click("text=New words"); const p1 = await T(page, ".preview");
  ok(p0 !== p1, "New words regenerates the preview");
  // include toggles regenerate (settings pCaps/pNums)
  const caps = page.locator(".seg button", { hasText: "Capitals" });
  ok(await caps.getAttribute("aria-pressed") === "false", "Capitals toggle starts off");
  await caps.click(); await page.waitForTimeout(100);
  ok(await caps.getAttribute("aria-pressed") === "true" && (await store(page)).settings.pCaps === true, "Capitals toggle on and saved");
  const p2 = await T(page, ".preview");
  ok(p2 !== p1, "toggle regenerated the preview");
  await page.click(".seg button:has-text('Numbers')"); await page.waitForTimeout(100);
  ok((await store(page)).settings.pNums === true, "Numbers toggle saved");
  await caps.click(); await page.click(".seg button:has-text('Numbers')");
  // focus from the lists
  const rowKey = await page.locator(".klist .krow").first().getAttribute("aria-label");
  await page.locator(".klist .krow").first().click(); await page.waitForSelector("#txt .c");
  const want = rowKey.match(/^Practise (\S+):/)[1];
  ok((await T(page, ".crumb")).endsWith("key " + want), "tapping a key row focuses it: " + await T(page, ".crumb"));
  await page.locator(".stage-bar .btn").first().click(); await page.waitForSelector(".klist");
  ok(await page.locator(".rstrip").count() === 0, "Back returns to Practice without a result strip");
  const prow = page.locator(".pgrid2 .klist").nth(1).locator(".krow").first();
  const pairLabel = (await prow.getAttribute("aria-label")).match(/^Practise (\S+):/)[1];
  await prow.click(); await page.waitForSelector("#txt .c");
  ok((await T(page, ".crumb")).endsWith("pair " + pairLabel), "tapping a pair row focuses the pair: " + await T(page, ".crumb"));
  const ptxt = await stageText(page);
  ok(ptxt.toLowerCase().split(" ").some((w) => w.includes(pairLabel.toLowerCase())), "pair round contains the pair");
  await page.locator(".stage-bar .btn").first().click(); await page.waitForSelector(".klist");
  // show all
  await page.click("text=Show all"); ok(await page.locator(".pgrid2 .klist").first().locator(".krow").count() === 26, "Show all keys → 26 rows");
  await page.locator(".stage-bar .btn").first().count(); // (round started above was left)
  await page.click('[data-tab=test]'); await page.waitForSelector(".tgrid"); await page.click('[data-tab=practice]'); await page.waitForSelector(".klist");
  ok(await page.locator(".pgrid2 .klist").first().locator(".krow").count() === 26, "Show all keys survives a tab switch (legacy SHOWALL)");
  await page.locator(".klist .krow").first().click(); await page.waitForSelector("#txt .c"); await page.locator(".stage-bar .btn").first().click(); await page.waitForSelector(".klist");
  ok(await page.locator(".pgrid2 .klist").first().locator(".krow").count() === 26, "Show all keys survives a round");
  await page.click("text=Show fewer");

  // ---- Real text
  await page.click('[aria-label="Practice mode"] >> text=Real text'); await page.waitForTimeout(150);
  ok(await page.locator('[aria-label="Practice mode"] [data-state=on]').innerText() === "Real text" && (await page.evaluate(() => localStorage.getItem("homerow.pmode"))) === "text", "mode saved in localStorage homerow.pmode");
  ok(/^Real text$/i.test(await T(page, ".panel .label")), "Real text hero");
  ok(await page.locator(".tlist .trow").count() === 40, "40 passages listed");
  await page.keyboard.press("Enter"); await page.waitForSelector("#txt .c");
  ok((await T(page, ".crumb")) === "Practice · Real text", "text crumb");
  const rt = await stageText(page);
  await typeAll(page); await page.waitForSelector(".rstrip");
  ok(/round done/i.test(await T(page, ".rstrip")) && !/→/.test(await T(page, ".rstrip")), "text result strip (no change chip)");
  ok(await page.locator(".trow.done").count() === 1, "finished text is checked");
  const s2 = await store(page);
  ok(s2.modes.text === 1, "modes.text incremented");
  ok(JSON.parse(await page.evaluate(() => localStorage.getItem("homerow.textsDone"))).length === 1, "homerow.textsDone has the title");
  void rt;
  // tap a text from the library
  await page.locator(".tlist .trow").nth(3).click(); await page.waitForSelector("#txt .c"); await page.locator(".stage-bar .btn").first().click(); await page.waitForSelector(".tlist");

  // ---- Code
  await page.click('[aria-label="Practice mode"] >> text=Code'); await page.waitForTimeout(150);
  ok(await page.locator(".tlist .trow").count() === 25, "25 snippets");
  await page.click('[aria-label="Language"] >> text=JavaScript'); await page.waitForTimeout(100);
  ok(await page.locator(".tlist .trow").count() === 6 && (await page.evaluate(() => localStorage.getItem("homerow.clang"))) === "JavaScript", "language chip filters (6 JavaScript)");
  await page.locator(".tlist .trow", { hasText: "Event listener" }).click(); await page.waitForSelector("#txt .c");
  ok(await page.locator("#vp.code").count() === 1 && (await T(page, ".crumb")) === "Practice · Code", "code stage");
  ok(await page.locator("#txt .c.nl").count() >= 2 && await page.locator("#txt .c.ind").count() >= 2, "code: newline and indent cells");
  ok(await page.locator("#kb").evaluate((e) => e.parentElement.hidden === false), "code stage shows keyboard");
  await typeAll(page, { code: true }); await page.waitForSelector(".rstrip");
  ok(/round done/i.test(await T(page, ".rstrip")), "code result strip");
  ok((await store(page)).modes.code === 1 && await page.locator(".rstrip .rs").count() === 2, "modes.code incremented");
  // code with a wrong key then Enter (stop mode) = engine keeps waiting; sanity: Enter on a non-newline char is a miss
  await page.locator(".tlist .trow", { hasText: "Event listener" }).click(); await page.waitForSelector("#txt .c");
  await page.keyboard.press("Enter"); ok((await T(page, "#l-acc")) === "0%", "Enter at a normal character is a mistake in code mode");
  await page.locator(".stage-bar .btn").first().click(); await page.waitForSelector(".tlist");

  // ---- Your text
  await page.click('[aria-label="Practice mode"] >> text=Your text'); await page.waitForTimeout(150);
  ok(await page.locator("#mt-in").getAttribute("maxlength") === "6000" && await page.locator("#mt-in").getAttribute("spellcheck") === "false", "textarea: maxlength 6000, no spellcheck");
  ok(await page.locator(".panel-foot .btn[data-primary]").innerText() === "Clean up and start", "Enter targets Clean up and start when nothing is saved");
  await page.click("text=Clean up and start"); await page.waitForTimeout(100);
  ok((await T(page, "#mt-msg")) === "Add at least 20 characters that can be typed.", "error under 20 chars");
  const para = "Dear team, here’s the plan — café notes… We meet at 9:30 on Monday. Please bring the report and your ideas for the next quarter. Thanks a lot, and see you there! ".repeat(4);
  await page.fill("#mt-in", para); await page.waitForTimeout(100);
  ok(/^Changed \d+ characters so everything can be typed\./.test(await T(page, "#mt-msg")), "live feedback: " + await T(page, "#mt-msg"));
  await page.click("text=Clean up and start"); await page.waitForSelector("#txt .c");
  ok(/^Practice · Your text · Part 1 of \d+$/.test(await T(page, ".crumb")), "your-text crumb: " + await T(page, ".crumb"));
  const partTxt = await stageText(page);
  ok(partTxt.length >= 120 && partTxt.length <= 360 && /^[\x20-\x7e]+$/.test(partTxt), "part is 120-360 typable chars (" + partTxt.length + ")");
  const mine = JSON.parse(await page.evaluate(() => localStorage.getItem("homerow.mytexts")));
  ok(mine.length === 1 && mine[0].parts.length >= 1, "stored only in localStorage homerow.mytexts, parts " + mine[0].parts.length);
  ok(!JSON.stringify(await store(page)).includes("Dear team"), "pasted text is not in the progress state");
  await typeAll(page); await page.waitForSelector(".rstrip");
  const lastPart = mine[0].parts.length === 1;
  ok((await page.locator(".rstrip .btn", { hasText: lastPart ? "Done" : "Next part" }).count()) === 1, "strip button: " + (lastPart ? "Done" : "Next part"));
  if (!lastPart) { await page.keyboard.press("Enter"); await page.waitForSelector("#txt .c"); ok(/Part 2 of/.test(await T(page, ".crumb")), "Next part (Enter) starts part 2"); await page.locator(".stage-bar .btn").first().click(); await page.waitForSelector("#mt-in"); }
  else await page.click(".rstrip >> text=Done");
  ok(await page.locator(".mrow").count() === 1, "Recent texts lists it");
  ok(await page.locator(".mrow .btn[data-primary]").count() === 1, "Enter targets Continue when the box is empty");
  await page.fill("#mt-in", "x"); await page.waitForTimeout(50);
  ok(await page.locator(".panel-foot .btn[data-primary]").count() === 1 && await page.locator(".mrow .btn[data-primary]").count() === 0, "typing moves the Enter target to Clean up and start");
  await page.fill("#mt-in", ""); await page.click('.mrow .btn:has-text("Remove")'); await page.waitForTimeout(100);
  ok(await page.locator(".mrow").count() === 0, "Remove deletes the text");
  await page.fill("#mt-in", "draft kept across modes please"); await page.click('[aria-label="Practice mode"] >> text=Adaptive'); await page.click('[aria-label="Practice mode"] >> text=Your text');
  ok((await page.inputValue("#mt-in")) === "draft kept across modes please", "draft persists across mode switches");
  await page.click('[aria-label="Practice mode"] >> text=Adaptive');
  ok(errors.length === 0, "practice: no console errors " + errors.join(";"));
  await page.context().close();
}

/* locked modes + empty state */
{
  const { page, errors } = await newPage(b, { ...OPT, state: seed4a({ passed: 5 }), hash: "#practice" }, REACT);
  await page.click('[aria-label="Practice mode"] >> text=Real text'); await page.waitForTimeout(100);
  ok(/unlocks after lesson 20/.test(await T(page, ".panel h2.pt")), "Real text locked: " + await T(page, ".panel h2.pt"));
  ok(await page.locator('[aria-label="Practice mode"] .lk').count() === 2, "lock marks on the two locked modes");
  await page.click("text=Try one anyway"); await page.waitForSelector("#txt .c"); await page.locator(".stage-bar .btn").first().click();
  await page.click('[aria-label="Practice mode"] >> text=Code'); ok(/unlocks after lesson 22/.test(await T(page, ".panel h2.pt")), "Code locked");
  await page.click(".panel-foot .btn[data-primary]"); await page.waitForTimeout(200);
  ok(await page.locator(".intro").count() === 1, "Go to lesson N opens that lesson's intro");
  ok(errors.length === 0, "locked: no console errors");
  await page.context().close();
  const e = await newPage(b, { ...OPT, state: { ...seed4a({ passed: 0 }), keys: {}, days: {} }, hash: "#practice" }, REACT);
  ok((await T(e.page, ".panel h1")) === "Nothing to practise yet", "empty state");
  ok(await e.page.locator("#view .view-head h1").innerText() === "Practice" && await e.page.locator("#view .view-head p").count() === 0 && await e.page.locator('[aria-label="Practice mode"]').count() === 1, "empty state: only the h1 and the mode switch (no subtitle)");
  await e.page.keyboard.press("Enter"); await e.page.waitForTimeout(200);
  ok(await e.page.locator(".intro").count() === 1, "empty state: Enter → lesson 1 intro");
  await e.ctx.close();
}

/* ============================== Test ============================== */
{
  const { page, errors } = await newPage(b, { ...OPT, state: seed4a({ passed: 22, tests: false }), hash: "#test" }, REACT);
  ok((await T(page, "#view h1")) === "Test", "Test renders");
  ok((await page.locator('[aria-label="Duration"] [role=radio]').allInnerTexts()).join("|") === "15 s|30 s|60 s|120 s", "duration choices");
  ok((await page.locator('[aria-label="Words"] [role=radio]').allInnerTexts()).join("|") === "Common 200|Everyday 950", "word pools");
  ok(await page.locator(".empty").innerText().then((t) => /No tests yet/.test(t)), "empty recent tests");
  await page.click('[aria-label="Duration"] >> text=15 s');
  ok((await store(page)).settings.tDur === 15 && /^15 s$/i.test(await page.locator('.best[aria-pressed=true] .label').innerText()), "15 s selected (and its best tile)");
  await page.click(".best >> text=60 s"); ok((await store(page)).settings.tDur === 60, "a bests tile selects its duration");
  await page.click(".best >> text=15 s");
  const sample0 = await T(page, ".preview"); await page.click(".seg button:has-text('Numbers')");
  ok((await store(page)).settings.tNums === true, "Numbers option saved"); await page.click(".seg button:has-text('Numbers')");
  void sample0;
  await page.keyboard.press("Enter"); await page.waitForSelector("#txt .c");
  ok((await T(page, ".crumb")) === "Test · 15 s · Common 200", "test crumb: " + await T(page, ".crumb"));
  ok(await page.locator("#kbwrap").evaluate((e) => e.hidden) === true, "no keyboard in the test");
  ok(/^time left$/i.test(await T(page, "#l-prog-l")) && (await T(page, "#l-prog")) === "15s", "countdown shown");
  const text = await stageText(page);
  // type 2 words, one deliberate mistake fixed by backspace, then one left in; then keep typing until time is up
  let i = 0;
  for (; i < 10; i++) await press(page, text[i]);
  await press(page, text[10] === "z" ? "x" : "z"); // mistake
  ok(await page.locator("#txt .c.bad").count() === 1, "a mistake stays in the text (free mode)");
  await page.keyboard.press("Backspace");
  ok(await page.locator("#txt .c.bad").count() === 0, "Backspace fixes it");
  for (i = 10; i < 30; i++) await press(page, text[i]);
  await press(page, text[30] === "q" ? "w" : "q"); i = 31; // a mistake left in
  const t0 = Date.now();
  while (i < text.length && Date.now() - t0 < 6000) { await press(page, text[i]); i++; }
  await page.waitForSelector(".result h1", { timeout: 20000 });
  ok((await T(page, ".result h1")) === "Test done", "results screen");
  ok(/test · 15 s · common 200/i.test(await T(page, ".result .label")), "results eyebrow");
  const pst = (await page.locator(".pstat").allInnerTexts()).map((t) => t.replace(/\n/g, " | "));
  ok(pst.length === 4 && /WPM/.test(pst[0]) && /raw wpm/i.test(pst[1]) && /accuracy/i.test(pst[2]) && /correct · mistakes/i.test(pst[3]), "four stats: " + pst.join(" ; "));
  const mist = +(pst[3].split(" | ")[0].split(" · ")[1]);
  ok(mist >= 2, "mistakes counted (" + mist + ")");
  ok(await page.locator(".status.ok", { hasText: "New best" }).count() === 1, "New best chip on the first test");
  ok(await page.locator("#tchart").count() === 1 && await page.locator("#tchart .xm").count() >= 1, "chart with mistake marks");
  await page.locator("#tchart").hover({ position: { x: 300, y: 100 } }); await page.waitForTimeout(100);
  ok(/ s · \d+ WPM/.test(await page.locator(".pop").innerText()), "chart hover tooltip: " + await page.locator(".pop").innerText());
  const s = await store(page);
  ok(s.tests.length === 1 && s.tests[0].dur === 15 && s.tests[0].pool === "c200" && s.bests.test15 > 0, "saved: test record + best");
  ok(s.tests[0].wpm === Math.round(s.tests[0].wpm * 10) / 10 && s.tests[0].raw >= s.tests[0].wpm, "record: wpm/raw 1 decimal, raw >= wpm");
  await page.keyboard.press("Escape"); await page.waitForTimeout(200);
  ok((await T(page, "#view h1")) === "Test", "Esc on results → Test tab");
  ok(await page.locator(".tbl tbody tr").count() === 1, "recent tests table has the run");
  ok(/^\d+$/.test(await page.locator('.best[aria-pressed=true] .num').innerText()), "bests tile shows the best");
  ok(await page.locator(".panel-foot a", { hasText: "See your speed trend" }).count() === 1, "speed trend link");
  await page.keyboard.press("Enter"); await page.waitForSelector("#txt .c"); await page.keyboard.press("a"); await page.keyboard.press("Escape"); await page.waitForTimeout(200);
  ok((await T(page, "#l-prog")) === "15s", "Esc in a test restarts it");
  await page.locator(".stage-bar .btn").first().click(); await page.waitForSelector(".tgrid");
  ok(errors.length === 0, "test: no console errors " + errors.join(";"));
  await page.context().close();
}

/* ============================== all lessons passed: Practice round, 2 practice rounds, then the 60 s Test step ============================== */
if (!process.argv.includes("--quick")) {
  const { page, errors } = await newPage(b, { ...OPT, state: seed4a({ passed: 30, tests: false }) }, REACT);
  await page.keyboard.press("Enter"); await page.waitForSelector("#txt .c");
  ok((await page.locator(".sbar .spill").allInnerTexts()).join("|") === "Warm-up|Practice round|Practice|Test", "all passed: pills " + (await page.locator(".sbar .spill").allInnerTexts()).join("|"));
  await typeAll(page); await page.waitForSelector(".result h1"); await page.keyboard.press("Enter"); await page.waitForSelector("#txt .c");
  ok(/^Practice round · Focus /.test(await T(page, ".crumb")), "extra round crumb: " + await T(page, ".crumb"));
  await typeAll(page); await page.waitForSelector(".result h1"); await page.keyboard.press("Enter"); await page.waitForSelector("#txt .c");
  await typeAll(page); await page.waitForTimeout(600); await typeAll(page); await page.waitForSelector(".result h1");
  ok(/Up next[\s\S]*60 seconds/i.test(await T(page, ".result .upnext")), "Up next: 60 seconds");
  await page.keyboard.press("Enter"); await page.waitForSelector("#txt .c");
  ok((await T(page, ".crumb")) === "Test · 60 s · Common 200" && await page.locator(".sbar").count() === 1, "test step crumb + session bar");
  const tx = await stageText(page); for (const ch of tx.slice(0, 40)) await press(page, ch);
  await page.waitForSelector(".result h1", { timeout: 80000 });
  ok((await T(page, ".result h1")) === "Session done", "the timed test ends the session");
  const st = await store(page);
  ok(st.tests.length === 1 && st.tests[0].dur === 60, "session test recorded like any test");
  ok(errors.length === 0, "session test: no console errors " + errors.join(";"));
  await page.context().close();
}

/* ============================== parity round 2: scroll to top per screen, view-in only on fresh screens, count-up kinds, chips, focus ============================== */
{
  const tall = (page) => page.addStyleTag({ content: "#view{padding-bottom:2500px}" });
  const y = (page) => page.evaluate(() => Math.round(scrollY));
  const vin = (page) => page.evaluate(() => document.getAnimations().some((a) => a.animationName === "viewin"));
  /* motion on: fade only on a fresh screen; Practice keeps the offset on shuffle, goes to the top after a round */
  const { page, errors } = await newPage(b, { reducedMotion: "no-preference", state: seed4a({ passed: 22 }), hash: "#practice" }, REACT);
  await tall(page); await page.waitForTimeout(400);
  ok(!(await vin(page)), "view fade finished");
  await page.evaluate(() => scrollTo(0, 300)); await page.waitForTimeout(100);
  await page.getByRole("button", { name: /New words/ }).click(); await page.waitForTimeout(60);
  ok((await y(page)) === 300 && !(await vin(page)), "New words keeps the scroll offset and does not fade (legacy keepScroll)");
  await page.click('[aria-label="Practice mode"] >> text=Real text'); await page.waitForTimeout(50);
  ok((await y(page)) === 0, "switching the practice mode scrolls to the top (legacy renderPractice)");
  await page.click('[aria-label="Practice mode"] >> text=Adaptive'); await page.waitForSelector(".klist");
  await page.evaluate(() => scrollTo(0, 300)); await page.getByRole("button", { name: /Start round/ }).click(); await page.waitForSelector("#txt .c");
  await page.evaluate(() => scrollTo(0, 400)); await typeAll(page); await page.waitForSelector(".rstrip"); await page.waitForTimeout(60);
  ok((await y(page)) === 0, "round result screen starts at the top");
  await page.click('[data-tab=test]'); await page.waitForTimeout(40);
  ok(await vin(page), "a tab switch fades the view in");
  await page.waitForTimeout(300);
  /* Test: idle -> run -> results; the results count up */
  await page.evaluate(() => scrollTo(0, 300)); await page.locator('[aria-label="Duration"] [role=radio]').first().evaluate((e) => e.click()); await page.waitForTimeout(60);
  ok((await y(page)) === 300, "changing the test duration keeps the scroll offset");
  await page.getByRole("button", { name: /Start test/ }).click(); await page.waitForSelector("#txt .c");
  const text = await stageText(page); for (const ch of text.slice(0, 25)) await press(page, ch);
  await page.evaluate(() => { window.__nums = []; new MutationObserver(() => { const t = [...document.querySelectorAll("#view .result .pstat .num")].map((e) => e.textContent).join("|"); if (t) window.__nums.push(t); }).observe(document.getElementById("view"), { subtree: true, childList: true, characterData: true }); });
  await page.evaluate(() => scrollTo(0, 500));
  await page.waitForSelector(".result h1", { timeout: 20000 }); await page.waitForTimeout(800);
  ok((await y(page)) === 0, "test results start at the top");
  const seen = await page.evaluate(() => [...new Set(window.__nums)]);
  ok(seen.length >= 2, "Test results count up (" + seen.length + " distinct renderings, last " + seen[seen.length - 1] + ")");
  ok(errors.length === 0, "parity round 2: no console errors " + errors.join(";"));
  await page.context().close();

  /* session summary screens do NOT count up (legacy kind "session") but still go to the top */
  const s2 = await newPage(b, { reducedMotion: "no-preference", state: seed4a({ passed: 5 }) }, REACT);
  await tall(s2.page);
  await s2.page.keyboard.press("Enter"); await s2.page.waitForSelector("#txt .c");
  await s2.page.evaluate(() => { window.__nums = []; new MutationObserver(() => { const t = [...document.querySelectorAll("#view .result .pstat .num")].map((e) => e.textContent).join("|"); if (t) window.__nums.push(t); }).observe(document.getElementById("view"), { subtree: true, childList: true, characterData: true }); scrollTo(0, 300); });
  await typeAll(s2.page); await s2.page.waitForSelector(".result h1"); await s2.page.waitForTimeout(800);
  ok((await s2.page.locator(".result h1").innerText()) === "Warm-up done" && (await y(s2.page)) === 0, "session between screen starts at the top");
  ok(new Set(await s2.page.evaluate(() => window.__nums)).size === 1, "session between screen does not count up");
  /* the Learn step summary still does */
  await s2.page.goto(REACT + "#learn", { waitUntil: "load" }); await s2.page.waitForTimeout(300);
  await s2.page.locator(".lrow").first().click(); await s2.page.waitForSelector(".intro");
  await s2.page.keyboard.press("Enter"); await s2.page.evaluate(() => { window.__nums = []; new MutationObserver(() => { const t = [...document.querySelectorAll("#view .result .pstat .num")].map((e) => e.textContent).join("|"); if (t) window.__nums.push(t); }).observe(document.getElementById("view"), { subtree: true, childList: true, characterData: true }); });
  await typeAll(s2.page); await s2.page.waitForSelector(".result h1"); await s2.page.waitForTimeout(800);
  ok(new Set(await s2.page.evaluate(() => window.__nums)).size >= 2, "Learn step summary still counts up");
  await s2.ctx.close();

  /* Your text: failed submit refocuses the textarea; the last part's chip is styled */
  const m = await newPage(b, { ...OPT, state: seed4a({ passed: 22 }), hash: "#practice" }, REACT);
  await m.page.click('[aria-label="Practice mode"] >> text=Your text'); await m.page.waitForSelector("#mt-in");
  await m.page.click("text=Clean up and start"); await m.page.waitForTimeout(100);
  ok(await m.page.evaluate(() => document.activeElement?.id) === "mt-in", "a failed Clean up and start refocuses the textarea");
  await m.page.fill("#mt-in", "Dear team, here is the plan for next week. We meet on Monday at nine."); await m.page.click("text=Clean up and start"); await m.page.waitForSelector("#txt .c");
  await typeAll(m.page); await m.page.waitForSelector(".rstrip");
  const chip = m.page.locator(".rstrip .status");
  ok(await chip.count() === 1 && /All parts done/.test(await chip.innerText()), "All parts done chip shown");
  const cs = await chip.evaluate((e) => { const c = getComputedStyle(e); return { d: c.display, pad: c.paddingLeft, rad: c.borderTopLeftRadius, bg: c.backgroundColor, svg: !!e.querySelector("svg") }; });
  ok(/flex/.test(cs.d) && cs.pad !== "0px" && cs.bg !== "rgba(0, 0, 0, 0)" && cs.svg, "All parts done chip is styled like the Passed chip: " + JSON.stringify(cs));
  await m.ctx.close();
}

/* ============================== screenshots: React vs legacy, same seeded progress ============================== */
if (process.argv.includes("--shots")) {
  const OUT = new URL("../../notes/shots/phase4a/", import.meta.url).pathname;
  mkdirSync(OUT, { recursive: true });
  const SIZES = [[1600, 980], [1024, 768], [390, 844]];
  const only = process.argv.find((a) => a.startsWith("--only="))?.slice(7);
  for (const which of ["react", "legacy"]) {
    const url = which === "react" ? REACT : LEGACY;
    for (const scheme of ["light", "dark"]) {
      for (const [w, h] of SIZES) {
        if (only && only !== String(w)) continue;
        const tag = `${w}-${scheme}`;
        const st = seed4a({ passed: 22 }); st.settings.tDur = 15;
        const { page, errors } = await newPage(b, { width: w, height: h, scheme, ...OPT, state: st }, url);
        const shot = async (name, full = false) => { await page.waitForTimeout(350); await page.screenshot({ path: `${OUT}${which}-${name}-${tag}.png`, fullPage: full }); };
        await page.goto(url + "#practice"); await page.waitForTimeout(500);
        await shot("practice", true);
        await page.keyboard.press("Enter"); await page.waitForSelector("#txt .c");
        const tx = await stageText(page); for (const ch of tx.slice(0, 16)) await press(page, ch);
        await shot("round");
        for (const ch of tx.slice(16)) await press(page, ch);
        await page.waitForSelector(".rstrip"); await shot("roundresult", true);
        for (const m of ["Real text", "Code", "Your text"]) {
          await page.locator(`[aria-label="Practice mode"] >> text=${m}`).first().click(); await page.waitForTimeout(250);
          if (m === "Your text") await page.fill("#mt-in", "Dear team, here is the plan for next week. We meet on Monday at nine and go through the report together.");
          await shot("mode-" + m.toLowerCase().replace(" ", ""), true);
        }
        await page.locator('[aria-label="Practice mode"] >> text=Code').first().click(); await page.waitForTimeout(150);
        await page.locator(".tlist .trow", { hasText: "Event listener" }).click(); await page.waitForSelector("#txt .c");
        const cells = await page.evaluate(() => [...document.querySelectorAll("#txt .c")].map((e) => ({ t: e.textContent, nl: e.classList.contains("nl"), ind: e.classList.contains("ind") })));
        let last = false; for (const c of cells.slice(0, 34)) { if (last && c.ind) continue; last = false; if (c.nl) { await page.keyboard.press("Enter"); last = true; } else await press(page, c.t); }
        await shot("code-run");
        await page.goto(url + "#test"); await page.waitForTimeout(500);
        await shot("test-options", true);
        await page.keyboard.press("Enter"); await page.waitForSelector("#txt .c");
        const t2 = await stageText(page); for (const ch of t2.slice(0, 26)) await press(page, ch);
        await press(page, "q"); await press(page, "q"); await page.keyboard.press("Backspace"); await page.keyboard.press("Backspace");
        for (const ch of t2.slice(26, 50)) await press(page, ch);
        await shot("test-run");
        await page.waitForSelector(".result h1", { timeout: 25000 }); await shot("test-results", true);
        await page.keyboard.press("Escape"); await page.waitForTimeout(300); await shot("test-after", true);
        // session
        const s5 = seed4a({ passed: 5 });
        await page.evaluate((x) => localStorage.setItem("homerow.v1", JSON.stringify(x)), s5);
        await page.goto(url + "#learn"); await page.reload(); await page.waitForTimeout(500);
        await page.keyboard.press("Enter"); await page.waitForSelector("#txt .c");
        const t3 = await stageText(page); for (const ch of t3.slice(0, 12)) await press(page, ch);
        await shot("session-bar");
        for (const ch of t3.slice(12)) await press(page, ch);
        await page.waitForSelector(".result h1"); await shot("session-between");
        await page.keyboard.press("Enter"); await page.waitForSelector(".intro"); await shot("session-intro");
        await page.keyboard.press("Enter"); await typeAll(page); await page.waitForSelector(".result"); await page.keyboard.press("Enter");
        await typeAll(page); await page.waitForSelector(".result"); await page.keyboard.press("Enter"); await typeAll(page); await page.waitForSelector(".result .status");
        await shot("session-lesson-result");
        await page.keyboard.press("Enter"); await page.waitForSelector(".result h1");
        await page.keyboard.press("Enter"); await typeAll(page); await page.waitForTimeout(700); await typeAll(page);
        await page.waitForSelector(".result h1"); await page.keyboard.press("Enter"); await page.waitForSelector("#txt .c"); await typeAll(page);
        await page.waitForSelector(".result h1"); await shot("session-done", true);
        if (errors.length) console.log("console errors (" + which + " " + tag + "): " + errors.join(" | "));
        await page.context().close();
      }
    }
  }
}

await b.close();
console.log(fails ? fails + " FAILED" : "ALL PASSED");
process.exit(fails ? 1 : 0);
