#!/usr/bin/env node
/* Records golden fixtures from the legacy DEBUG build (window.App) for the TypeScript core port.
 *
 *   1. serve the legacy debug build, e.g.:  cd local && python3 -m http.server 8765      (legacy/build.sh writes local/index.html)
 *   2. node scripts/record-golden.mjs        (LEGACY_URL overrides http://localhost:8765/)
 *
 * Every recorded call runs with a seeded Math.random (mulberry32), a fixed clock and the UTC time zone, on a synthetic
 * state made with the legacy helpers (App.setState / seedLessons / seedKeys / seedPairs). No real user data is used.
 * The page HTML is rewritten in flight to expose a few internal functions as window.__X (nothing on disk is changed).
 * Outputs: src/core/__golden__/*.json.  Vitest (src/core/*.test.ts) replays them against the port.
 */
import { chromium } from "playwright-core";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(here, "..", "src", "core", "__golden__");
const URL = process.env.LEGACY_URL || "http://localhost:8765/";
const NOW = Date.UTC(2026, 5, 17, 12, 0, 0); // Wed 17 Jun 2026 12:00 UTC (shared with the tests)
fs.mkdirSync(OUT, { recursive: true });

/* internals of the legacy IIFE we want to call; appended just before the DEBUG block ends */
const EXPOSE = `window.__X={pctTxt,hash36,braceEnd,findLessonJSON,importLessons,coachAsk,cleanLesson,extras,nextRound,buildSteps,sumRes,heatMap,idsFor,wlHasProgress,
keyWpm,keyAcc,streak,minutesToday,learnedChars,weakestKey,nextLessonN,unlocked,lessonDone,weakW,usefulPair,stable,LAYOUTS,homeCh,weekBrief,mondayOf,dayWpm,longestRun,
practiceMs7,pmMinutes,pmLocked,pmPickText,pmPickSnip,getRT:()=>RT,getCS:()=>CS,fmtMin,weekTitle,focusKey,genPairRound,practiceDigits,pOpts,pairFingers,focusStat,
mtFeedback,dateKey,addDays,dLabel,logoBody,isoWeek,weekId,fill,ctx,drill,combine,wordText,realPool,shuffle,niceStep,STEP_NAMES,GCOL,FING,fcol,shiftIdFor,passedAll,
sanitizeCoach,allowedChars,buildPrompt,buildSummary,validateReply,applyKeyEvents:(evs)=>applyKeyEvents(evs),addDay,ID_RE,pmDone,pmMarkDone,pmLang,pmSnips,mtList,mtSave,pmode,
STATUS_TXT,decorate,gen19,sent20,genNum,BG,BLOCK,POOLS,POOL_NAME,testChunk,pw,pseudoOnce,xpWords,levelInfo,coachMutateRaw:()=>COACH_RAW,setHeat:v=>{HEAT=v}};/*DEBUG-END*/`;

/* runs in every page before the app: seeded random + json helper */
const PRELUDE = `
window.__mb = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
window.__seed = s => { Math.random = window.__mb(s); };
window.__J = o => o === undefined ? null : JSON.parse(JSON.stringify(o));
window.__st = o => { App.setState(o); return App.state(); };
`;

const browser = await chromium.launch({ channel: "chrome" });
const ctx = await browser.newContext({ timezoneId: "UTC", reducedMotion: "reduce", viewport: { width: 1200, height: 900 } });
const page = await ctx.newPage();
await page.addInitScript(PRELUDE);
await page.route(URL, async route => {
  const r = await route.fetch();
  let t = await r.text();
  if (!t.includes("/*DEBUG-END*/")) throw new Error("this is not the legacy DEBUG build (no /*DEBUG-END*/ marker)");
  t = t.replace("/*DEBUG-END*/", EXPOSE);
  await route.fulfill({ response: r, body: t });
});
await page.clock.setFixedTime(new Date(NOW));
page.on("pageerror", e => console.log("[page error]", e.message));
await page.goto(URL);
await page.waitForFunction(() => typeof window.App === "object" && typeof window.__X === "object");

const write = (name, data) => {
  fs.writeFileSync(path.join(OUT, name + ".json"), JSON.stringify(data));
  console.log("wrote", name + ".json", (JSON.stringify(data).length / 1024).toFixed(0) + " KB");
};
const ev = (fn, arg) => page.evaluate(fn, arg);

/* ------------------------------------------------------------------ synthetic states, built with the legacy helpers */
const STATES = await ev(() => {
  const NOW = Date.now(), DAY = 864e5;
  const dk = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  const dayAgo = i => dk(new Date(NOW - i * DAY));
  const out = {};
  const keyStat = (i, n, strong) => strong ? { n, errEma: 0.01, timeEma: 220 + (i % 3) * 10 } : { n, errEma: 0.02 + (i % 6) * 0.03, timeEma: 260 + ((i * 97) % 700) };
  const keyMap = (chars, base, strongSet) => { const m = {}; [...chars].forEach((c, i) => { if (i % 11 === 10) m[c] = { n: 3, errEma: 0.05 }; else if (i % 7 === 6) m[c] = { n: base + i, errEma: 0.08 }; else m[c] = keyStat(i, base + i * 3, strongSet && strongSet.includes(c)); }); return m; };
  const pairMap = names => { const m = {}; names.forEach((p, i) => { m[p] = i % 5 === 4 ? { n: 4, errEma: 0.1 } : { n: 12 + i * 3, errEma: 0.02 + (i % 4) * 0.04, timeEma: 280 + ((i * 61) % 500) }; }); return m; };
  const PAIRS = ["th", "he", "in", "er", "an", "re", "on", "at", "en", "nd", "ti", "es", "or", "te", "of", "ed", "is", "it", "al", "ar", "st", "to", "nt", "ng", "se", "ha", "as", "ou", "io", "le", "ve", "co", "me", "de", "hi", "ri", "ro", "ic", "ne", "ea", "ra", "ce", "li", "ch", "ll", "be", "ma", "si", "om", "ur"];
  const save = k => { out[k] = window.__J(App.state()); };
  const days = (n, ms, wpm, extra) => { const S = App.state(); for (let i = 0; i < n; i++) { const m = ms + (i % 4) * 30000; S.days[dayAgo(i)] = { ms: m, chars: Math.round(m / 60000 * 5 * (wpm + (i % 5))), presses: Math.round(m / 60000 * 5 * (wpm + (i % 5)) * 1.04), correct: Math.round(m / 60000 * 5 * (wpm + (i % 5)) * 1.01), ex: 3 + i % 3, t: NOW - i * DAY }; } if (extra) Object.assign(S.days, extra); };

  /* empty */
  App.setState({}); save("empty");
  /* mid: 8 lessons, some keys and pairs, some days, a few tests */
  App.setState({}); App.seedLessons(8);
  App.seedKeys(keyMap("fjdksla;gheiruty", 30)); App.seedPairs(pairMap(PAIRS.slice(0, 18)));
  days(12, 600000, 18);
  let S = App.state(); S.tests = [{ ts: NOW - 5 * DAY, dur: 30, pool: "c200", opts: "", wpm: 21.5, raw: 24, acc: 0.95 }, { ts: NOW - 2 * DAY, dur: 60, pool: "e950", opts: "cp", wpm: 24.2, raw: 26, acc: 0.93 }, { ts: NOW - 3600000, dur: 30, pool: "c200", opts: "", wpm: 26, raw: 27, acc: 0.97 }];
  S.bests = { practice: 22, lessonWpm: 21, test15: 0, test30: 26, test60: 24.2, test120: 0 }; S.baseline = { wpm: 15, acc: 0.9, ts: NOW - 20 * DAY };
  S.modes = { text: 1, code: 0, mine: 0, at: NOW - DAY }; S.ach = { "first-lesson": NOW - 10 * DAY };
  save("mid");
  /* late: all 22 lessons, ANSI, strong keys, a streak, tests */
  App.setState({}); App.seedLessons(22);
  S = App.state(); S.settings.layout = "ansi"; S.settings.target = 30; S.settings.pCaps = true; S.settings.pPunct = true; S.settings.pNums = true; S.settings.tPool = "e950"; S.settings.goal = 20;
  Object.keys(S.lessons).forEach(n => { S.lessons[n].stars = n % 3 === 0 ? 3 : 2; });
  App.seedKeys(keyMap("abcdefghijklmnopqrstuvwxyz;,./'-?!:\"1234567890", 60, "asdfjkl;ghe")); App.seedKeys({ shift: { n: 40, errEma: 0.06, timeEma: 400 } });
  App.seedPairs(pairMap(PAIRS));
  days(34, 840000, 30);
  S = App.state(); S.tests = []; for (let i = 0; i < 8; i++) S.tests.push({ ts: NOW - (8 - i) * DAY, dur: [15, 30, 60, 120][i % 4], pool: i % 2 ? "e950" : "c200", opts: ["", "c", "cp", "cpn"][i % 4], wpm: 28 + i * 2.5, raw: 30 + i * 2.5, acc: 0.9 + i * 0.012 });
  S.bests = { practice: 38, lessonWpm: 34, test15: 40, test30: 44.5, test60: 41, test120: 38 }; S.baseline = { wpm: 22, acc: 0.92, ts: NOW - 40 * DAY };
  S.modes = { text: 2, code: 1, mine: 1, at: NOW - DAY };
  save("late");
  /* unlockAll with nearly nothing learned */
  App.setState({}); S = App.state(); S.settings.unlockAll = true; App.seedKeys(keyMap("etaoinshrdlu", 20)); App.seedPairs(pairMap(PAIRS.slice(0, 10))); save("unlockAll");
  /* early ANSI */
  App.setState({}); App.seedLessons(4); S = App.state(); S.settings.layout = "ansi"; S.settings.hints = "hesitate"; S.settings.target = 20; S.settings.pace = "best"; S.bests.practice = 17.5;
  App.seedKeys(keyMap("fjdksla;", 15)); App.seedPairs(pairMap(["fj", "jf", "dk", "kd", "ds", "sa", "ad", "as"])); save("ansiEarly");
  /* a seven day streak ending today, daily goal reached on 5 days, no tests */
  App.setState({}); App.seedLessons(6); days(7, 900000, 22); save("streak7");
  /* a 31 day streak ending yesterday (today empty) */
  App.setState({}); App.seedLessons(18); S = App.state(); for (let i = 1; i <= 31; i++) S.days[dayAgo(i)] = { ms: 61000, chars: 400, presses: 420, correct: 410, ex: 2, t: NOW - i * DAY }; save("streak31");
  /* a gap in the streak */
  App.setState({}); S = App.state(); [0, 1, 2, 4, 5, 6, 7, 8, 9, 10].forEach(i => { S.days[dayAgo(i)] = { ms: 125000, chars: 700, presses: 720, correct: 710, ex: 2, t: NOW - i * DAY }; }); save("gap");
  /* a lot of correct words: levels */
  App.setState({}); S = App.state(); S.days[dayAgo(0)] = { ms: 5e6, chars: 9e4, presses: 1e5, correct: 1.5e5, ex: 90, t: NOW }; S.days[dayAgo(1)] = { ms: 5e6, chars: 9e4, presses: 1e5, correct: 2e5, ex: 90, t: NOW - DAY }; save("levels");
  return out;
});
const STATE_NAMES = Object.keys(STATES);
write("states", STATES);
const useState = (name) => STATES[name];

/* ------------------------------------------------------------------ generation: App.gen for every lesson, seeds 1-5 */
{
  const rec = [];
  for (const sn of ["empty", "mid", "late", "ansiEarly", "unlockAll"]) {
    const r = await ev(({ st, sn }) => {
      const out = [];
      window.__st(st);
      for (let n = 1; n <= 22; n++) for (let seed = 1; seed <= 5; seed++) { window.__seed(seed); out.push({ state: sn, n, seed, out: App.gen(n) }); }
      for (let n = 1; n <= 22; n++) for (let s = 1; s <= 3; s++) { window.__seed(100 + n * 3 + s); out.push({ state: sn, n, s, seed: 100 + n * 3 + s, step: true, out: App.genStep(n, s) }); }
      return out;
    }, { st: useState(sn), sn });
    rec.push(...r);
  }
  /* pseudo words */
  const pw = await ev(() => {
    const out = [];
    const sets = ["fjdk", "asdfjkl;", "abcdefghijklmnopqrstuvwxyz", "ab", "fj", "etaoinshrdlu"];
    const opts = [undefined, { min: 3, max: 5 }, { min: 3, max: 6, must: "j" }, { min: 2, max: 4, must: "e" }, { min: 4, max: 9 }];
    for (const al of sets) for (const o of opts) for (let seed = 1; seed <= 3; seed++) { window.__seed(seed * 17); const r = []; for (let k = 0; k < 6; k++) r.push(App.pseudoWord(al, o)); out.push({ al, o: o || null, seed: seed * 17, out: r }); }
    return out;
  });
  write("gen", { lessons: rec, pseudoWord: pw });
}

/* ------------------------------------------------------------------ practice and test text */
{
  const recs = [];
  for (const sn of ["mid", "late", "unlockAll", "ansiEarly"]) {
    const r = await ev(({ st, sn }) => {
      const out = [];
      window.__st(st);
      const pool = App.pool();
      const info = { state: sn, pool, focus: App.focus(), chooseFocus: App.chooseFocus(), slow6: App.slowPairs(6), slow8: App.slowPairs(8), slowPool: App.slowPairs(5, pool), slowAvoid: App.slowPairs(5, pool, ["th", "he"]) };
      info.pace = [App.paceFor("practice"), App.paceFor("test", 30), App.paceFor("test", 60), App.paceFor("test", 15)];
      info.strength = ["f", "j", "x", "zz", "shift"].map(k => App.strength(App.state().keys[k]));
      info.strengthMin = ["th", "he", "in", "ng"].map(k => App.strength(App.state().pairs[k], 6));
      info.weakW = pool.map(k => __X.weakW(k));
      info.pOpts = __X.pOpts();
      info.digits = __X.practiceDigits();
      info.focusKey = [__X.focusKey(pool), __X.focusKey(pool, ["f", "j"]), __X.focusKey(pool, pool)];
      info.usefulPair = ["th", "zz", "qx", "he", "a", "ab", "1a", "ng", "ck"].map(p => __X.usefulPair(p));
      out.push({ kind: "info", ...window.__J(info) });
      const foci = [info.focus, info.chooseFocus, pool[0], pool[pool.length - 1], "th", "he", "er", "in"].filter((v, i, a) => a.indexOf(v) === i).filter(f => f.length === 1 ? pool.includes(f) : [...f].every(c => pool.includes(c)));
      const optSets = [{}, { caps: true }, { punct: true }, { nums: true }, { caps: true, punct: true, nums: true }];
      for (const f of foci) for (const o of optSets) for (let seed = 1; seed <= 2; seed++) { window.__seed(seed * 31 + f.length); out.push({ kind: "practice", focus: f, o, seed: seed * 31 + f.length, out: App.genPractice(pool, f, o) }); }
      for (const o of optSets) { window.__seed(77); out.push({ kind: "pair", pair: "th", o, seed: 77, out: __X.genPairRound(pool, "th", o) }); }
      for (let seed = 1; seed <= 3; seed++) { window.__seed(seed); out.push({ kind: "next", seed, out: __X.nextRound(pool, true) }); }
      /* extras with each option on a fixed token list */
      const toks = ["the", "and", "really", "quick", "fox", "jumps", "over", "lazy", "dog", "never", "Hello", "world", "yes", "no", "x", "in", "of", "a"];
      const exOpts = [{ caps: true }, { punct: true }, { punct: true, contr: true }, { nums: true }, { nums: true, digits: "56789" }, { caps: true, punct: true, nums: true, contr: true, prev: "end." }, { caps: true, prev: "yes!" }];
      for (const o of exOpts) for (let seed = 1; seed <= 3; seed++) { window.__seed(seed * 5); out.push({ kind: "extras", toks, o, seed: seed * 5, out: __X.extras(toks, o) }); }
      return out;
    }, { st: useState(sn), sn });
    recs.push(...r);
  }
  /* test chunks need no state except a few settings */
  const tc = await ev(() => {
    const out = [];
    window.__st(App.state());
    for (const pool of ["c200", "e950"]) for (const o of [{ caps: false, punct: false, nums: false }, { caps: true }, { punct: true }, { nums: true }, { caps: true, punct: true, nums: true }]) for (const prev of ["", "done.", "x?"]) for (let seed = 1; seed <= 2; seed++) {
      window.__seed(seed * 13); const oo = { pool, ...o };
      out.push({ n: 12 + seed * 3, o: oo, prev, seed: seed * 13, out: App.testChunk(12 + seed * 3, oo, prev) });
    }
    window.__seed(3); out.push({ n: 45, o: { pool: "c200" }, prev: "", seed: 3, out: App.testChunk(45, { pool: "c200" }, "") });
    return out;
  });
  write("practice", { rounds: recs, testChunks: tc });
}

/* ------------------------------------------------------------------ store: sanitize, merge, stable */
{
  const SAN = [
    "null", "5", '"x"', "[]", "true", "{}", '{"v":2}',
    '{"updatedAt":"x","resetAt":-5,"settingsAt":1e999,"keysAt":1e20,"pairsAt":123}',
    '{"updatedAt":1700000000000,"resetAt":1600000000000,"settingsAt":1650000000000,"keysAt":1690000000000,"pairsAt":1690000000001}',
    '{"settings":"nope"}', '{"settings":[]}',
    '{"settings":{"hints":"bad","stop":"yes","sound":true,"soundPack":"off"}}',
    '{"settings":{"soundPack":"click","sound":false}}', '{"settings":{"soundPack":"type"}}', '{"settings":{"sound":true}}', '{"settings":{"sound":false}}',
    '{"settings":{"soundPack":"nope","sound":true}}', '{"settings":{"soundPack":"soft","sound":true}}', '{"settings":{"soundPack":"cream","sound":false}}', '{"settings":{"soundPack":"soft"}}',
    '{"settings":{"hints":"hesitate","stop":false,"weekly":true,"goal":25,"target":25,"layout":"ansi","unlockAll":true}}',
    '{"settings":{"hints":"hidden","goal":30,"target":40,"layout":"dvorak","pCaps":true,"pPunct":1,"pNums":true,"tCaps":true,"tPunct":false,"tNums":"yes"}}',
    '{"settings":{"tDur":45,"tPool":"e950","pace":"best"}}', '{"settings":{"tDur":120,"tPool":"c1000","pace":"slow"}}', '{"settings":{"goal":"15","target":"25","tDur":"30"}}',
    '{"lessons":{"0":{"done":true},"1":{"done":true,"stars":5,"wpm":-3,"acc":2,"attempts":1e9,"last":5},"22":{"done":false,"stars":2.9,"wpm":600,"acc":0.5,"attempts":3.7,"last":1e16},"23":{"done":true},"x":{"done":true},"5":null,"6":[],"7":"s","8":{"done":"yes","stars":"3"}}}',
    '{"lessons":[1,2,3]}',
    '{"custom":{"ok-1":{"wpm":30,"acc":0.9,"stars":2,"attempts":4,"last":50},"bad id":{"wpm":1},"":{"wpm":1},"a_b-C":{"wpm":999,"acc":9,"stars":9,"attempts":-4,"last":-1},"toolong0123456789012345678901234567890123456789":{"wpm":1},"nul":null,"arr":[]}}',
    '{"keys":{"f":{"n":50,"errEma":0.1,"timeEma":300},"j":{"n":50,"errEma":5,"timeEma":-3},"k":{"n":"x","errEma":0.1},"l":{"n":-5,"errEma":-1,"timeEma":1e9},"abcdefghi":{"n":5},"d":{"n":1e9,"timeEma":0},"s":{"n":12.7,"errEma":"a","timeEma":"5"},"shift":{"n":20,"errEma":0.2,"timeEma":500},"a":null,"b":[1]}}',
    '{"pairs":{"th":{"n":10,"errEma":0.1,"timeEma":250},"a":{"n":1},"abc":{"n":1},"TH":{"n":1},"1a":{"n":1},"he":{"n":-3,"errEma":3,"timeEma":1e9},"in":{"n":"x"},"er":null,"an":{"n":5.5}}}',
    '{"days":{"2026-06-01":{"ms":60000,"chars":300,"presses":310,"correct":305,"ex":2,"t":5},"2026-6-1":{"ms":1},"x":{"ms":1},"2026-06-02":{"ms":-5,"chars":1e99,"presses":"a","correct":-1,"ex":1e9,"t":-4},"2026-06-03":null,"2026-06-04":[]}}',
    '{"tests":[{"ts":1,"wpm":30,"acc":0.9},{"ts":"x","wpm":30,"acc":0.9},{"ts":2,"wpm":1e999,"acc":0.9},{"ts":3,"wpm":30,"acc":0.9,"dur":99999,"pool":"abcdefghijklmnopqrstuvwxyz","opts":"cpnxyzabcdefgh","raw":-1},null,5,{"ts":4,"wpm":20,"acc":1,"pool":123,"opts":null}]}',
    '{"tests":"x"}', '{"bests":{"practice":50,"lessonWpm":-4,"test15":1e9,"test30":"x","test60":12.5,"extra":3}}',
    '{"seenTips":{"deadKey":1,"welcome":"yes"}}', '{"seenTips":{"deadKey":0}}', '{"seenTips":null}',
    '{"ach":{"first-lesson":1700000000000,"Bad Id":5,"x":-5,"y":"z","long-id-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa":5,"ok-2":1e99,"c":{"a":1}}}',
    '{"baseline":{"wpm":18.5,"acc":0.91,"ts":1690000000000}}', '{"baseline":{"wpm":"x","ts":1}}', '{"baseline":{"wpm":900,"acc":5,"ts":5}}', '{"baseline":null}',
    '{"modes":{"text":3,"code":-1,"mine":1e12,"at":77}}', '{"modes":{"text":"a"}}', '{"modes":5}',
  ];
  const big = {};
  /* generated: more than the limits (100 custom, 200 keys, 300 pairs, 400 days, 100 tests, 64 achievements) */
  const gen = await ev(() => {
    const o = { custom: {}, keys: {}, pairs: {}, days: {}, tests: [], ach: {} };
    for (let i = 0; i < 105; i++) o.custom["c" + i] = { wpm: i, acc: 0.9, stars: 1, attempts: i, last: i };
    for (let i = 0; i < 210; i++) o.keys["k" + i] = { n: i + 1, errEma: 0.05, timeEma: 300 };
    const al = "abcdefghijklmnopqrstuvwxyz"; let c = 0;
    for (const a of al) for (const b of al) { if (c++ < 330) o.pairs[a + b] = { n: c, errEma: 0.05, timeEma: 300 }; }
    for (let i = 0; i < 420; i++) { const d = new Date(Date.UTC(2024, 0, 1) + i * 864e5); o.days[d.toISOString().slice(0, 10)] = { ms: 60000 + i, chars: i, presses: i, correct: i, ex: 1, t: i + 1 }; }
    for (let i = 0; i < 120; i++) o.tests.push({ ts: i + 1, dur: 30, pool: "c200", opts: "", wpm: 20 + i % 7, raw: 22, acc: 0.9 });
    for (let i = 0; i < 70; i++) o.ach["a" + i] = 1000 + i;
    return JSON.stringify(o);
  });
  SAN.push(gen);
  const sanitizeOut = await ev(list => list.map(j => ({ in: j, out: window.__J(App.sanitize(JSON.parse(j))) })), SAN);

  /* merge: pairs of (a, b) JSON states */
  const base = (over) => JSON.stringify(over);
  const T = 1700000000000, D = 864e5;
  const mk = (o) => ({ updatedAt: T, ...o });
  const A = mk({ settingsAt: T - 5, settings: { goal: 20, target: 30, layout: "ansi", soundPack: "soft", sound: true }, lessons: { 1: { done: true, stars: 2, wpm: 20, acc: 0.96, attempts: 2, last: T - D }, 2: { done: false, stars: 0, wpm: 10, acc: 0.8, attempts: 1, last: T - D } },
    custom: { x1: { wpm: 20, acc: 0.9, stars: 1, attempts: 1, last: T - D } }, keysAt: T - 100, keys: { f: { n: 20, errEma: 0.1, timeEma: 300 }, j: { n: 10, errEma: 0.2 } }, pairsAt: T - 50, pairs: { th: { n: 10, errEma: 0.1, timeEma: 300 } },
    days: { "2026-06-10": { ms: 60000, chars: 300, presses: 320, correct: 310, ex: 2, t: T - D }, "2026-06-11": { ms: 90000, chars: 400, presses: 420, correct: 400, ex: 1, t: T - 2 * D } },
    tests: [{ ts: T - 3 * D, dur: 30, pool: "c200", opts: "", wpm: 25, raw: 26, acc: 0.95 }, { ts: T - D, dur: 60, pool: "e950", opts: "c", wpm: 30, raw: 31, acc: 0.96 }],
    bests: { practice: 20, lessonWpm: 22, test15: 0, test30: 25, test60: 30, test120: 0 }, seenTips: { deadKey: true, welcome: false },
    ach: { "first-lesson": T - 10 * D, "wpm-20": T - 3 * D }, baseline: { wpm: 15, acc: 0.9, ts: T - 30 * D }, modes: { text: 2, code: 0, mine: 0, at: T - D } });
  const B = mk({ updatedAt: T + 1000, settingsAt: T + 5, settings: { goal: 10, target: 25, layout: "iso", soundPack: "cream", sound: true }, lessons: { 1: { done: true, stars: 3, wpm: 18, acc: 0.99, attempts: 5, last: T }, 3: { done: true, stars: 1, wpm: 15, acc: 0.95, attempts: 1, last: T } },
    custom: { x1: { wpm: 25, acc: 0.85, stars: 2, attempts: 3, last: T }, x2: { wpm: 10, acc: 0.9, stars: 1, attempts: 1, last: T } }, keysAt: T + 200, keys: { f: { n: 50, errEma: 0.05, timeEma: 280 }, k: { n: 9, errEma: 0.3 } }, pairsAt: T - 80, pairs: { he: { n: 14, errEma: 0.05, timeEma: 250 } },
    days: { "2026-06-10": { ms: 70000, chars: 250, presses: 330, correct: 300, ex: 3, t: T }, "2026-06-12": { ms: 30000, chars: 100, presses: 110, correct: 100, ex: 1, t: T } },
    tests: [{ ts: T - D, dur: 60, pool: "e950", opts: "c", wpm: 31, raw: 31, acc: 0.96 }, { ts: T + 5, dur: 15, pool: "c200", opts: "", wpm: 40, raw: 41, acc: 0.97 }],
    bests: { practice: 24, lessonWpm: 20, test15: 40, test30: 0, test60: 29, test120: 5 }, seenTips: { deadKey: false, welcome: true },
    ach: { "first-lesson": T - 5 * D, "home-row": T - D, "wpm-30": T }, baseline: { wpm: 18, acc: 0.92, ts: T - 40 * D }, modes: { text: 1, code: 3, mine: 1, at: T } });
  const withReset = (o, r) => ({ ...o, resetAt: r });
  const pairsIn = [
    ["A,B", A, B], ["B,A", B, A], ["A,A", A, A], ["A,null", A, null], ["A,{}", A, {}], ["A,garbage", A, "x"], ["{},B", {}, B],
    ["A,B reset between", withReset(A, T - 4 * D), withReset(B, 0)],
    ["A reset late kills B old data", A, withReset(B, T - D + 1)],
    ["A reset mid", withReset(A, T - 2 * D), B],
    ["both reset", withReset(A, T - 2 * D), withReset(B, T - D)],
    ["reset after everything", withReset(A, T + 10 * D), B],
    ["settings tie", { ...A, settingsAt: 100 }, { ...B, settingsAt: 100 }],
    ["keys newer is A", { ...A, keysAt: T + 900 }, B],
    ["keys A below reset", withReset({ ...A, keysAt: 5 }, 10), { ...B, keysAt: 20 }],
    ["pairs newer B", A, { ...B, pairsAt: T + 1 }],
    ["achievement earliest wins", { ach: { x: 100, y: 5, z: 50 }, resetAt: 40 }, { ach: { x: 70, y: 80, w: 41 }, resetAt: 0 }],
    ["baseline earliest", { baseline: { wpm: 10, acc: 0.9, ts: 500 } }, { baseline: { wpm: 12, acc: 0.8, ts: 400 } }],
    ["baseline before reset dropped", { resetAt: 450, baseline: { wpm: 10, acc: 0.9, ts: 500 } }, { baseline: { wpm: 12, acc: 0.8, ts: 400 } }],
    ["bests need updatedAt>=reset", { resetAt: 100, updatedAt: 50, bests: { practice: 99 } }, { updatedAt: 200, bests: { practice: 5, test30: 7 } }],
    ["seenTips or", { seenTips: { deadKey: true } }, { seenTips: { welcome: true } }],
    ["modes at below reset", { resetAt: 100, modes: { text: 5, code: 5, mine: 5, at: 50 } }, { modes: { text: 1, code: 2, mine: 3, at: 120 } }],
    ["lesson done or", { lessons: { 4: { done: false, stars: 1, wpm: 5, acc: 0.5, attempts: 1, last: 5 } } }, { lessons: { 4: { done: true, stars: 0, wpm: 9, acc: 0.6, attempts: 2, last: 6 } } }],
  ];
  pairsIn.push(["manytests", JSON.parse(gen), { tests: Array.from({ length: 60 }, (_, i) => ({ ts: 1000 + i, dur: 30, pool: "c200", opts: "", wpm: 20, raw: 20, acc: 0.9 })) }]);
  pairsIn.push(["manyach", JSON.parse(gen), { ach: Object.fromEntries(Array.from({ length: 30 }, (_, i) => ["b" + i, 500 + i])) }]);
  pairsIn.push(["manydays", JSON.parse(gen), { days: Object.fromEntries(Array.from({ length: 30 }, (_, i) => ["2030-01-" + String(i + 1).padStart(2, "0"), { ms: 1, chars: 1, presses: 1, correct: 1, ex: 1, t: 9e12 + i }])) }]);
  const mergeIn = pairsIn.map(([n, a, b]) => ({ n, a: JSON.stringify(a), b: b === null ? "null" : JSON.stringify(b) }));
  const mergeOut = await ev(list => list.map(x => {
    let out; try { out = window.__J(App.mergeTest(JSON.parse(x.a), JSON.parse(x.b))); } catch (e) { out = { $error: String(e && e.message) }; }
    return { n: x.n, a: x.a, b: x.b, out };
  }), mergeIn);
  /* direct merge(a,b) of already sanitized states (merge returns a when b is falsy) + stable() */
  const stableIn = [null, 1, "s", [3, 1, { b: 1, a: [2, 1] }], { z: 1, a: { y: [1, { k: null }], b: "x" }, m: true }, { a: undefined, b: 2 }, [undefined, 1]];
  const stableOut = await ev(list => list.map(x => __X.stable(x)), stableIn);
  const eq = await ev(() => { const e = App.emptyState(); return window.__J(e); });
  /* a round trip through sanitize on every synthetic state must be a fixed point; record the sanitized form too */
  const idem = await ev(sts => Object.fromEntries(Object.entries(sts).map(([k, v]) => [k, window.__J(App.sanitize(v))])), STATES);
  write("store", { sanitize: sanitizeOut, merge: mergeOut, stable: { in: stableIn, out: stableOut }, emptyState: eq, idem });
}

/* ------------------------------------------------------------------ stats, levels, achievements, weeks */
{
  const per = {};
  for (const sn of STATE_NAMES) {
    per[sn] = await ev(({ st, sn }) => {
      window.__st(st);
      const X = __X, S = App.state(), r = {};
      r.xpWords = App.xpWords(); r.levelInfo = App.levelInfo();
      r.streak = X.streak(); r.minutesToday = X.minutesToday(); r.learned = [...X.learnedChars()].sort(); r.weakestKey = X.weakestKey(); r.nextLessonN = X.nextLessonN();
      r.unlocked = Array.from({ length: 22 }, (_, i) => X.unlocked(i + 1)); r.lessonDone = Array.from({ length: 22 }, (_, i) => X.lessonDone(i + 1));
      r.hasProgress = X.wlHasProgress(); r.longestRun = X.longestRun(); r.practiceMs7 = X.practiceMs7();
      r.heat = { speed: X.heatMap(), acc: null };
      r.buildSteps = X.buildSteps(); r.pool = App.pool();
      r.keyWpm = Object.keys(S.keys).map(k => [k, X.keyWpm(S.keys[k]), X.keyAcc(S.keys[k])]);
      r.ach = App.ACH.map(a => [a.id, !!a.test()]);
      /* weekly numbers */
      const mon = X.mondayOf(new Date());
      r.mondayOf = X.dateKey(mon);
      r.weeks = [0, -7, -14].map(d => { const m = X.addDays(mon, d); const ws = App.weekStats(m); return { mon: X.dateKey(m), ws, brief: X.weekBrief(m), title: X.weekTitle(m) }; });
      r.testCard = S.tests.length ? App.testCard(S.tests[S.tests.length - 1]) : null;
      r.weekCard = App.weekCard();
      r.summary = App.coachSummary(); r.prompt = App.coachPrompt(); r.allowed = App.allowedChars();
      r.coachAsk = X.coachAsk();
      /* checkAchievements: silent grant on a copy of the state, with the fixed clock */
      const before = JSON.stringify(S.ach), got = App.checkAchievements({ silent: true });
      r.granted = { got, ach: window.__J(App.state().ach), before: JSON.parse(before) };
      /* second call grants nothing */
      r.grantedAgain = App.checkAchievements({ silent: true });
      return window.__J(r);
    }, { st: useState(sn), sn });
    /* heatmap accuracy mode: App has no handle for HEAT, so patch it through the (internal) heatMap by temporarily clicking the control is not possible; use the data attribute */
  }
  write("stats", per);

  /* heat map: the legacy function reads the HEAT variable (speed | acc) */
  const heatAcc = {};
  for (const sn of ["mid", "late", "empty", "ansiEarly"]) {
    heatAcc[sn] = await ev(({ st }) => {
      window.__st(st);
      __X.setHeat("acc"); const acc = __X.heatMap();
      __X.setHeat("speed"); const speed = __X.heatMap();
      return window.__J({ speed, acc });
    }, { st: useState(sn) });
  }
  write("heat", heatAcc);

  /* levelInfo values */
  const lv = await ev(() => [0, 1, 299, 300, 301, 449, 450, 749, 750, 1349, 1350, 2099, 2100, 2999, 3000, 10000, 123456].map(w => [w, window.__J(App.levelInfo(w))]));
  write("levels", lv);

  /* pctTxt, wpm, keyWpm/keyAcc edges */
  const pct = await ev(() => {
    const v = [0, 0.001, 0.5, 0.946, 0.9496, 0.94999, 0.95, 0.9500001, 0.9795, 0.98, 0.9999, 0.999, 1, 0.9, 0.12345, 0.3333333, 0.6, 0.7, 0.99, 0.9949999];
    const w = [[0, 0], [100, 60000], [250, 60000], [5, 0], [7, -1], [123, 7777], [1, 1], [500, 30000]];
    const kw = [null, {}, { timeEma: 300 }, { timeEma: 0 }, { timeEma: 1234.5, n: 3 }, { n: 0, errEma: 0.5 }, { n: 5, errEma: 0.123 }, { n: 5, errEma: 0.999 }];
    return { pct: v.map(x => [x, __X.pctTxt(x)]), wpm: w.map(([c, m]) => [c, m, App.wpm(c, m)]), kw: kw.map(k => [k, __X.keyWpm(k), __X.keyAcc(k)]) };
  });
  write("pct", pct);

  /* weekly: ISO week + id for many dates */
  const iso = await ev(() => {
    const ds = [[2020, 11, 31], [2021, 0, 1], [2021, 0, 3], [2021, 0, 4], [2021, 11, 31], [2022, 0, 2], [2022, 0, 3], [2024, 11, 30], [2025, 0, 1], [2026, 5, 17], [2026, 11, 28], [2027, 0, 3], [2027, 0, 4], [2015, 11, 31], [2016, 0, 3], [2026, 0, 1], [2026, 11, 31]];
    return ds.map(([y, m, d]) => { const dt = new Date(y, m, d); return { y, m, d, iso: App.wk.isoWeek(dt), id: App.wk.weekId(dt) }; });
  });
  write("isoweek", iso);
}

/* ------------------------------------------------------------------ lesson results (LEARN-12 / LEARN-13) through the real result screen */
{
  const recs = [];
  const aggs = [];
  const mk = (presses, correct, chars, ms) => ({ ms, chars, presses, correct, missBy: { f: 2, j: 1 } });
  /* acc edges around .95 / .98 and wpm edges around lesson targets (lesson 1 target 12, lesson 18 target 18) */
  aggs.push([1, mk(1000, 946, 300, 60000)]); /* 94.6% */
  aggs.push([1, mk(10000, 9496, 300, 60000)]); /* 94.96% */
  aggs.push([1, mk(10000, 9499, 300, 60000)]); /* 94.99% */
  aggs.push([1, mk(100, 95, 300, 60000)]); /* exactly 95% */
  aggs.push([1, mk(10000, 9795, 300, 60000)]); /* 97.95% */
  aggs.push([1, mk(100, 98, 300, 60000)]); /* exactly 98% */
  aggs.push([1, mk(1000, 979, 300, 60000)]);
  aggs.push([1, mk(100, 100, 300, 60000)]); /* 60 wpm (300 chars / 1 min) */
  aggs.push([1, mk(100, 100, 59, 60000)]); /* wpm 11.8 -> rounds to 12 (target 12) */
  aggs.push([1, mk(100, 99, 58, 60000)]); /* 11.6 -> 12 */
  aggs.push([1, mk(100, 99, 57, 60000)]); /* 11.4 -> 11 */
  aggs.push([1, mk(100, 99, 85, 60000)]); /* 17 wpm = target+5 */
  aggs.push([1, mk(100, 99, 84, 60000)]); /* 16.8 -> 17 */
  aggs.push([1, mk(100, 99, 83, 60000)]); /* 16.6 -> 17 */
  aggs.push([1, mk(100, 99, 82, 60000)]); /* 16.4 -> 16 */
  aggs.push([1, mk(100, 97, 200, 60000)]); /* acc 97, fast: 2 stars not 3 */
  aggs.push([1, mk(0, 0, 0, 0)]); /* no presses: acc 1 */
  aggs.push([18, mk(200, 196, 400, 60000)]); aggs.push([18, mk(200, 190, 400, 60000)]); aggs.push([18, mk(200, 199, 115, 60000)]);
  aggs.push([22, mk(300, 300, 130, 60000)]); aggs.push([22, mk(300, 285, 90, 60000)]);
  for (const sn of ["empty", "mid"]) {
    const r = await ev(({ st, list }) => {
      const out = [];
      for (const [n, agg] of list) {
        window.__st(st);
        const before = window.__J(App.state().lessons[n] || null);
        const bestBefore = App.state().bests.lessonWpm;
        App.results(n, agg);
        const S = App.state();
        const nums = [...document.querySelectorAll("#view .pstat .num")].map(e => e.textContent);
        const stars = document.querySelectorAll("#view .stars-lg .star-on").length;
        const status = document.querySelector("#view .status") ? document.querySelector("#view .status").textContent : "";
        out.push({ n, agg, before, bestBefore, after: window.__J(S.lessons[n]), bestAfter: S.bests.lessonWpm, nums, stars, passed: /Passed/.test(status) && !/Not passed/.test(status), ach: Object.keys(S.ach) });
      }
      location.hash = "learn";
      return out;
    }, { st: useState(sn), list: aggs });
    recs.push(...r.map(x => ({ state: sn, ...x })));
  }
  write("results", recs);
}

/* ------------------------------------------------------------------ coach */
{
  const goodSteps = [{ name: "Drill", text: "jf jf fj jf fjf jfj fjf jfj fjf" }, { name: "Words", text: "just fish flight jump shift flaw jelly fluff jog fix just fish flight" }, { name: "Phrases", text: "just fix my flight jump and fish for jelly just fix my flight jump" }];
  const reply = (o) => JSON.stringify(o);
  const good = { note: "Work on your slow keys.", lesson: { title: "Slow keys", why: "You miss J and F the most.", steps: goodSteps } };
  const replies = [
    good,
    { ...good, note: "  trimmed note  " }, { ...good, note: "" }, { ...good, note: 5 }, { note: "x" }, { lesson: good.lesson }, null, "str", [],
    { ...good, lesson: { ...good.lesson, steps: goodSteps.slice(0, 2) } },
    { ...good, lesson: { ...good.lesson, steps: [...goodSteps, goodSteps[0]] } },
    { ...good, lesson: { ...good.lesson, title: "T".repeat(41) } }, { ...good, lesson: { ...good.lesson, title: "T".repeat(40) } }, { ...good, lesson: { ...good.lesson, title: "" } },
    { ...good, lesson: { ...good.lesson, why: "w".repeat(141) } }, { ...good, lesson: { ...good.lesson, why: "w".repeat(140) } }, { ...good, lesson: { ...good.lesson, why: null } }, { ...good, lesson: { ...good.lesson, why: 3 } },
    { ...good, note: "n".repeat(500) },
    { ...good, lesson: { ...good.lesson, steps: [{ name: "x", text: "short" }, goodSteps[1], goodSteps[2]] } },
    { ...good, lesson: { ...good.lesson, steps: [{ name: "x".repeat(31), text: goodSteps[0].text }, goodSteps[1], goodSteps[2]] } },
    { ...good, lesson: { ...good.lesson, steps: [{ text: goodSteps[0].text }, { name: "  ", text: goodSteps[1].text }, goodSteps[2]] } },
    { ...good, lesson: { ...good.lesson, steps: [{ name: "a", text: "jf  jf   fj jf\nfjf jfj fjf" }, goodSteps[1], goodSteps[2]] } },
    { ...good, lesson: { ...good.lesson, steps: [{ name: "a", text: "café jf jf fj jf fjf jfj" }, goodSteps[1], goodSteps[2]] } },
    { ...good, lesson: { ...good.lesson, steps: [{ name: "a", text: "x".repeat(401) }, goodSteps[1], goodSteps[2]] } },
    { ...good, lesson: { ...good.lesson, steps: [{ name: "a", text: "jf'a jf fj jf fjf jfj" }, goodSteps[1], goodSteps[2]] } },
    { ...good, lesson: { ...good.lesson, steps: [{ name: "a", text: "jf jf fj jf fjf jfj Q" }, goodSteps[1], goodSteps[2]] } },
    { ...good, lesson: { ...good.lesson, steps: [{ name: "a", text: "jf jf fj jf fjf jfj z" }, goodSteps[1], goodSteps[2]] } },
    { ...good, lesson: { ...good.lesson, steps: [{ name: "a", text: "jf jf fj jf fjf jfj 12 5" }, goodSteps[1], goodSteps[2]] } },
    { ...good, lesson: { ...good.lesson, steps: [7, goodSteps[1], goodSteps[2]] } },
    { ...good, lesson: { ...good.lesson, steps: [{ name: "a", text: 12 }, goodSteps[1], goodSteps[2]] } },
    { ...good, lesson: { ...good.lesson, title: "  Padded  " } },
  ].map(reply);
  const rawCoach = [
    {}, null, 5, { note: { text: "  hi  ", at: 5 }, lessons: [] }, { note: { text: " ", at: 5 } }, { note: { text: "x".repeat(700), at: "q" } }, { note: "str" },
    { lessons: [{ id: "a1", title: "A", why: "w", by: "app", created: 5, steps: goodSteps }, { id: "a1", title: "dup", steps: goodSteps }, { id: "bad id", title: "x", steps: goodSteps }, { id: "a2", title: "B", steps: goodSteps.slice(0, 1) }, { id: "a3", title: "C", by: "weird", steps: goodSteps.slice(0, 3) }, 5, null, { id: "a4" }] },
    { lessons: Array.from({ length: 50 }, (_, i) => ({ id: "l" + i, title: "T" + i, steps: goodSteps })) },
    { lessons: "no" },
  ].map(x => JSON.stringify(x));
  /* paste-in texts for findLessonJSON / importLessons */
  const block = (o) => JSON.stringify(o);
  const les = (title, text) => ({ title, why: "Because.", steps: [{ name: "One", text }, { name: "Two", text: goodSteps[1].text }, { name: "Three", text: goodSteps[2].text }] });
  const paste = [
    "Here you go:\n\n```json\n" + block({ homerow: 1, note: "Nice work", lessons: [les("First", goodSteps[0].text), les("Second", "jj ff jf fj jjj fff jfj fjf jff")] }) + "\n```\nGood luck!",
    "no json here at all", "{\"homerow\":1,\"lessons\":[]}", "{\"homerow\":1}", "text {\"homerow\":1,\"note\":\"n\",\"lessons\":[" + JSON.stringify(les("Dup", goodSteps[0].text)) + "," + JSON.stringify(les("Dup", goodSteps[0].text)) + "]} tail",
    "{\"homerow\":1,\"note\":\"n\",\"lessons\":[" + JSON.stringify(les("Bad chars", "café jf jf fj jf fjf jfj")) + "," + JSON.stringify(les("OK", goodSteps[0].text)) + ",7,{\"title\":\"x\"}]}",
    "{\"homerow\":1,\"note\":\"" + "n".repeat(700) + "\",\"lessons\":[" + JSON.stringify(les("Long note", goodSteps[0].text)) + "]}",
    "{\"lessons\":[" + JSON.stringify(les("No homerow key", goodSteps[0].text)) + "]}",
    "{\"x\":{\"homerow\":1,\"lessons\":[" + JSON.stringify(les("Nested", goodSteps[0].text)) + "]}}",
    "{\"homerow\":1,\"note\":\"has } brace and \\\"quote\\\"\",\"lessons\":[" + JSON.stringify(les("Braces", goodSteps[0].text)) + "]}",
    "{\"homerow\":1,\"lessons\":[" + Array.from({ length: 9 }, (_, i) => JSON.stringify(les("L" + i, goodSteps[0].text + " " + "jf".repeat(i)))).join(",") + "]}",
    "{\"homerow\":1,\"lessons\":[{\"title\":\"x\",\"steps\":[]}]}", "{\"homerow\"", "{\"homerow\":1,\"lessons\":[", "}{\"homerow\":1,\"lessons\":[]}", "", "{\"lessons\":5,\"homerow\":1}",
    "first {\"a\":1} then {\"homerow\":1,\"note\":\"second\",\"lessons\":[" + JSON.stringify(les("Second obj", goodSteps[0].text)) + "]}",
  ];
  const braceCases = [["{\"a\":1}", 0], ["{\"a\":\"}\"}", 0], ["{\"a\":\"\\\"}\"}", 0], ["{\"a\":{\"b\":1}}", 0], ["{\"a\":1", 0], ["xx{}yy", 2], ["{{}}", 0], ["{\"a\":\"\\\\\"}", 0]];
  const cleanCases = [
    { id: "ok", title: "T", steps: [{ name: "a", text: goodSteps[0].text }] }, { id: "ok", title: "T", why: "w", by: "app", created: 5, steps: [{ text: goodSteps[0].text }] },
    { id: "ok", title: "T", why: "w".repeat(201), steps: [{ text: goodSteps[0].text }] }, { id: "ok", title: " ", steps: [{ text: goodSteps[0].text }] }, { id: "ok", title: "T", steps: [] },
    { id: "ok", title: "T", steps: [1, 2, 3, 4, 5].map(() => ({ text: goodSteps[0].text })) }, { id: "x".repeat(41), title: "T", steps: [{ text: goodSteps[0].text }] }, { id: 5, title: "T", steps: [{ text: goodSteps[0].text }] },
    { id: "ok", title: "T", steps: [{ text: "ab'e jf jf fj jf" }] }, { id: "ok", title: "T", steps: [{ text: "ab\"a jf jf fj jf" }] }, { id: "ok", title: "T", steps: [{ text: "ab' a jf jf fj jf" }] },
    { id: "ok", title: "T", steps: [{ text: "Hello jf jf fj jf ABC" }] }, { id: "ok", title: "T", steps: [{ text: "tab\there jf jf fj jf" }] },
  ];
  const sampleAllowed = [null, "fj", "fjdk "];
  const out = {};
  for (const sn of ["empty", "mid", "late", "ansiEarly"]) {
    out[sn] = await ev(({ st, replies, rawCoach, paste, braceCases, cleanCases, sampleAllowed }) => {
      window.__st(st);
      const r = {};
      r.allowed = App.allowedChars(); r.summary = App.coachSummary(); r.prompt = App.coachPrompt(); r.ask = __X.coachAsk();
      r.promptExtra = __X.buildPrompt(App.coachSummary(), App.allowedChars(), "extra rule here");
      r.validate = replies.map(j => window.__J(App.coachValidate(JSON.parse(j))));
      r.validCoach = rawCoach.map(j => window.__J(App.validCoach(JSON.parse(j))));
      r.find = paste.map(t => window.__J(__X.findLessonJSON(t)));
      r.brace = braceCases.map(([t, s]) => __X.braceEnd(t, s));
      r.hash = ["", "a", "hello", JSON.stringify(["T", ["a", "b"]]), "é中", "x".repeat(1000)].map(s => [s, __X.hash36(s)]);
      /* importLessons uses Date.now() (fixed) and no randomness */
      r.imp = paste.map(t => window.__J(__X.importLessons(t)));
      r.clean = cleanCases.map(c => sampleAllowed.map(al => window.__J(__X.cleanLesson(JSON.parse(JSON.stringify(c)), al === null ? undefined : new Set(al)))));
      return window.__J(r);
    }, { st: useState(sn), replies, rawCoach, paste, braceCases, cleanCases, sampleAllowed });
  }
  write("coach", { replies, rawCoach, paste, braceCases, cleanCases, sampleAllowed, out });
}

/* ------------------------------------------------------------------ real text / code / your text, data */
{
  const texts = [
    "", "   ", "hello world", "Line one.\nLine two.\tTabbed.", "“Smart quotes” and ‘single’ and en–dash em—dash − minus … ellipsis • bullet × times",
    "café naïve résumé über ångström", "emoji \u{1F600} and 中文 text", "a  b   c    d", " nbsp thin　ideographic",
    "x".repeat(250) + ". " + "y".repeat(100) + ". " + "z".repeat(200), ("Sentence number one is here. ").repeat(40), ("word ").repeat(300), "a".repeat(800), ("Short. ").repeat(80),
    ("This is a fairly long sentence that keeps going for a while, with commas, and more words. ").repeat(30),
  ];
  const parts = await ev(({ texts }) => texts.map(t => ({ t, clean: App.cleanText(t), split: App.splitParts(App.cleanText(t).text), split5: App.splitParts(App.cleanText(t).text, 5), feedback: window.__J([__X.mtFeedback(t, false), __X.mtFeedback(t, true)]) })), { texts });
  const mode = await ev(({ st }) => {
    const out = {};
    window.__st(st["mid"]); localStorage.clear();
    out.midLocked = ["adaptive", "text", "code", "mine"].map(m => __X.pmLocked(m));
    window.__st(st["late"]); out.lateLocked = ["adaptive", "text", "code", "mine"].map(m => __X.pmLocked(m));
    window.__st(st["unlockAll"]); out.unlockAllLocked = ["text", "code"].map(m => __X.pmLocked(m));
    window.__st(st["mid"]);
    out.minutes = [1, 5, 100, 400, 1000, 6000].map(n => [n, __X.pmMinutes(n)]);
    /* picking: seeded, with some texts done */
    const picks = [];
    for (const done of [[], [App.TEXTS[0].t, App.TEXTS[1].t], App.TEXTS.map(x => x.t)]) {
      localStorage.setItem("homerow.textsDone", JSON.stringify(done));
      for (let seed = 1; seed <= 4; seed++) { window.__seed(seed); const a = [__X.getRT() && __X.getRT().t]; __X.pmPickText(); a.push(__X.getRT().t); __X.pmPickText(); a.push(__X.getRT().t); picks.push({ done, seed, picks: a }); }
    }
    out.textPicks = picks;
    const sp = [];
    for (const lang of ["All", "JavaScript", "Python", "Swift", "CSS", "SQL", "Shell", "Nope"]) {
      localStorage.setItem("homerow.clang", lang);
      for (let seed = 1; seed <= 3; seed++) { window.__seed(seed); __X.pmPickSnip(); const a = [__X.getCS().t]; __X.pmPickSnip(); a.push(__X.getCS().t); sp.push({ lang, seed, picks: a, lang2: __X.pmLang(), n: __X.pmSnips().length }); }
    }
    out.snipPicks = sp;
    out.pmode = ["adaptive", "text", "code", "mine", "bogus", null].map(v => { if (v === null) localStorage.removeItem("homerow.pmode"); else localStorage.setItem("homerow.pmode", v); return [v, __X.pmode()]; });
    localStorage.setItem("homerow.textsDone", JSON.stringify(["a", 5, "b"])); out.done = __X.pmDone();
    __X.pmMarkDone("z"); __X.pmMarkDone("a"); out.done2 = __X.pmDone();
    localStorage.setItem("homerow.textsDone", "garbage"); out.done3 = __X.pmDone();
    localStorage.clear();
    return window.__J(out);
  }, { st: STATES });
  const data = await ev(() => ({
    words: App.words(), lessons: window.__J(App.LESSONS), texts: App.TEXTS, snippets: App.SNIPPETS, baddead: App.BADDEAD.source,
    layouts: window.__J(__X.LAYOUTS), stepNames: __X.STEP_NAMES, idsFor: window.__J(["f", "F", "shift", "1", "!", " ", "é", "A", ";", "Q"].map(c => [c, __X.idsFor([c])])),
    logo: __X.logoBody("lgx"), blocked: ["ass", "hell", "butt", "kkk", "tits", "tit", "fine", "assist"].map(w => __X.BLOCK.test(w)),
  }));
  const chars = await ev(() => {
    const all = [];
    for (let c = 32; c < 127; c++) all.push(String.fromCharCode(c));
    all.push("§", "±", "é", "\n", "\t", "ě");
    const out = {};
    const safe = f => { try { return window.__J(f()); } catch (e) { return { $error: true }; } };
    for (const lay of ["iso", "ansi"]) {
      const st = App.state(); st.settings.layout = lay;
      out[lay] = { chars: all.map(c => [c, window.__J(App.charInfo(c))]), reach: __X.LAYOUTS[lay].keys.map(k => [k.id, safe(() => App.reach(k.id))]), reachMissing: safe(() => App.reach("Nope")), homeCh: all.map(c => [c, __X.homeCh(c)]), fcol: ["LP", "LR", "TH", "-", "zz", undefined].map(f => [f ?? null, __X.fcol(f)]), shiftId: ["LP", "RP", "TH", undefined].map(f => [f ?? null, __X.shiftIdFor(f)]) };
    }
    st_reset();
    function st_reset() { App.state().settings.layout = "iso"; }
    return window.__J(out);
  });
  write("textmodes", { parts, mode });
  write("data", { data, chars });
}

/* ------------------------------------------------------------------ session / small pure helpers, applyKeyEvents, streak */
{
  const out = await ev(({ st }) => {
    const r = {};
    window.__st(st["mid"]);
    r.sumRes = [__X.sumRes([]), __X.sumRes([{ ms: 1000, chars: 10, presses: 12, correct: 11 }, { ms: 2000, chars: 20, presses: 20, correct: 20 }]), __X.sumRes([{ ms: 0, chars: 0, presses: 0, correct: 0 }])];
    r.niceStep = [1, 9, 10, 11, 25, 41, 99, 199, 500, 5000].flatMap(m => [4, 5].map(t => [m, t, __X.niceStep(m, t)]));
    window.__seed(5); r.shuffle = __X.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    r.dayWpm = [null, { ms: 59999, chars: 100 }, { ms: 60000, chars: 100 }, { ms: 120000, chars: 1000 }].map(d => __X.dayWpm(d));
    r.dLabel = [[2026, 5, 17], [2026, 0, 1], [2026, 11, 31]].map(([y, m, d]) => __X.dLabel(new Date(y, m, d)));
    r.fmtMin = [0, 0.2, 0.5, 0.6, 1, 59.4, 59.6, 60, 61, 125, 600].map(m => [m, __X.fmtMin(m)]);
    /* applyKeyEvents + addDay on a copy */
    const ev1 = [{ c: "f", miss: false, dt: 300, pc: "", pmiss: false }, { c: "j", miss: false, dt: 250, pc: "f", pmiss: false }, { c: "J", miss: true, dt: null, pc: "j", pmiss: false }, { c: "\n", miss: false }, { c: "a", miss: false, dt: 5000, pc: "J", pmiss: true }, { c: "T", miss: false, dt: 200, pc: "a", pmiss: false }, { c: "1", miss: false, dt: 300, pc: "T", pmiss: false }, { c: "t", miss: true, dt: null, pc: "a", pmiss: false }];
    window.__st(st["mid"]);
    __X.applyKeyEvents(ev1); __X.addDay(60000, 300, 310, 300);
    const S = App.state(); r.afterEvents = { keys: window.__J(S.keys), pairs: window.__J(S.pairs), today: window.__J(S.days["2026-06-17"]), keysAt: S.keysAt, pairsAt: S.pairsAt, ndays: Object.keys(S.days).length };
    /* many events: pair pruning to 300 */
    window.__st(st["late"]);
    const al = "abcdefghijklmnopqrstuvwxyz"; const evs = []; let p = ""; for (const a of al) for (const b of al) { evs.push({ c: b, miss: false, dt: 200, pc: a, pmiss: false }); }
    __X.applyKeyEvents(evs); __X.applyKeyEvents(evs.slice(0, 40));
    r.afterMany = { pairs: Object.keys(App.state().pairs).length, sample: window.__J(App.state().pairs.th), keys: window.__J(App.state().keys.a) };
    return window.__J(r);
  }, { st: STATES });
  write("misc", out);
}

await browser.close();
console.log("done");
