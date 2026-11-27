import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { seed, unseed, fixClock, unfixClock, installLocalStorage, clone } from "../testutil";
import { LESSONS, EN_LESSONS, WL, EN_WL, LAY, LAYOUTS, CO, charInfo, buildLayout } from "../data";
import { S, SC, COURSE, setS, setSC, setCOURSE, emptyState, emptyCourse, C } from "../state";
import { sanitize, merge, save, writeLocal, loadLocalCs, LSK, LSK_CS } from "../store";
import { switchCourse, setCsLayout, courseFromStore, applyCourse } from "../course";
import { genLesson, genPractice, testChunk, cleanText, nextRound, pmode, pmLockN, courseTexts } from "../generate";
import { applyLessonResult, lessonDone, nextLessonN, poolLetters, usefulPair, applyKeyEvents, hasProgress } from "../stats";
import { CS_TEXTS } from "./texts";

let ls: any;
beforeEach(() => { fixClock(); ls = installLocalStorage(); setS(emptyState()); setSC(emptyCourse()); setCOURSE("en"); applyCourse(); });
afterEach(() => { unseed(); unfixClock(); setS(emptyState()); setSC(emptyCourse()); setCOURSE("en"); applyCourse(); });

/* every character can be typed on every Czech variant, shape and platform */
const LAYS = ["cs-qwertz", "cs-qwerty"].flatMap(v => ["iso", "ansi"].flatMap(sh => [true, false].map(mac => buildLayout(sh, v, mac))));
const untypable = (t: string) => [...new Set([...t])].filter(ch => ch !== " " && LAYS.some(l => !l.chars[ch]));

describe("Czech course: switching", () => {
  it("switchCourse swaps lessons, words, layout and progress, and back", () => {
    expect(LESSONS).toBe(EN_LESSONS);
    switchCourse("cs");
    expect(COURSE).toBe("cs"); expect(SC.on).toBe(true);
    expect(LESSONS).toHaveLength(29); expect(WL).not.toBe(EN_WL); expect(CO.id).toBe("cs");
    expect(LAY().chars["ě"].id).toBe("Digit2");
    expect(C()).toBe(SC);
    expect(CO).toMatchObject({ capsN: 26, punctN: 27, numN: [28, 29], allN: 25, longN: 14 });
    switchCourse("en");
    expect(LESSONS).toBe(EN_LESSONS); expect(LAY()).toBe(LAYOUTS.iso); expect(C()).toBe(S);
    expect(CO).toMatchObject({ capsN: 19, punctN: 20, numN: [21, 22], allN: 18, longN: 13 });
  });
  it("QWERTY swaps where Y and Z come in", () => {
    switchCourse("cs");
    expect(LESSONS[8].keys).toEqual(["t", "z"]); expect(LESSONS[17].keys).toEqual(["y", "-"]);
    setCsLayout("qwerty");
    expect(LESSONS[8].keys).toEqual(["t", "y"]); expect(LESSONS[17].keys).toEqual(["z", "-"]);
    expect(LAY().chars.z.id).toBe("KeyZ");
  });
  it("the active course is remembered in the Czech store", () => {
    switchCourse("cs");
    const saved = JSON.parse(ls.getItem(LSK_CS));
    expect(saved.on).toBe(true);
    setSC(loadLocalCs()); setCOURSE("en"); courseFromStore();
    expect(COURSE).toBe("cs");
  });
});

describe("Czech course: progress is kept apart", () => {
  it("a Czech lesson result goes to SC; English progress and the English key stay as they were", () => {
    const en = clone(S);
    switchCourse("cs");
    applyLessonResult(1, { ms: 60000, chars: 75, presses: 75, correct: 75 }); applyKeyEvents([{ c: "č", miss: false, dt: 200, pc: "ř", pmiss: false }]); save();
    expect(SC.lessons[1].done).toBe(true); expect(lessonDone(1)).toBe(true);
    expect(SC.keys["č"].n).toBe(1); expect(SC.pairs["řč"].n).toBe(1);
    expect(S.lessons).toEqual(en.lessons); expect(S.keys).toEqual({});
    switchCourse("en");
    expect(lessonDone(1)).toBe(false); expect(nextLessonN()).toBe(1);
    expect(JSON.parse(ls.getItem(LSK)).lessons).toEqual({});
    expect(JSON.parse(ls.getItem(LSK_CS)).lessons[1].done).toBe(true);
    expect(hasProgress()).toBe(true);
  });
  it("a tab running the English-only app rewrites homerow.v1 and never touches the Czech store", () => {
    switchCourse("cs"); applyLessonResult(1, { ms: 60000, chars: 75, presses: 75, correct: 75 }); save();
    const before = ls.getItem(LSK_CS);
    /* what an old tab does: its own S (no Czech fields) written over the key */
    const old = emptyState(); old.lessons = { 3: { done: true, stars: 2, wpm: 20, acc: 1, attempts: 1, last: 1 } };
    ls.setItem(LSK, JSON.stringify(old));
    expect(ls.getItem(LSK_CS)).toBe(before);
    expect(loadLocalCs().lessons[1].done).toBe(true);
  });
  it("saving in the English course leaves the Czech store alone", () => {
    switchCourse("cs"); switchCourse("en");
    const before = ls.getItem(LSK_CS);
    S.lessons[1] = { done: true, stars: 1, wpm: 10, acc: 1, attempts: 1, last: 1 }; save(); writeLocal();
    expect(ls.getItem(LSK_CS)).toBe(before);
  });
  it("sanitize and merge round-trip the Czech store (Czech pairs, on, csLayout, 29 lessons)", () => {
    const a = emptyCourse(); a.on = true; a.csLayout = "qwerty"; a.settingsAt = 5;
    a.lessons = { 29: { done: true, stars: 3, wpm: 30, acc: 1, attempts: 2, last: 9 }, 30: { done: true } };
    a.pairs = { "čr": { n: 9, errEma: .1 }, "ab": { n: 3, errEma: .2 }, "a;": { n: 3, errEma: .1 } }; a.pairsAt = 7;
    const s = sanitize(clone(a), true);
    expect(s.on).toBe(true); expect(s.csLayout).toBe("qwerty"); expect(s.course).toBe("cs");
    expect(Object.keys(s.lessons)).toEqual(["29"]); expect(Object.keys(s.pairs).sort()).toEqual(["ab", "čr"]);
    expect(sanitize(clone(s), true)).toEqual(s);
    /* English sanitize still refuses lesson 29 and Czech pairs */
    const e = sanitize(clone(a));
    expect(e.lessons).toEqual({}); expect(Object.keys(e.pairs)).toEqual(["ab"]); expect(e.on).toBeUndefined();
    const b = emptyCourse(); b.on = false; b.settingsAt = 9; b.lessons = { 1: { done: true, stars: 1, wpm: 12, acc: .96, attempts: 1, last: 3 } };
    const m = merge(s, sanitize(clone(b), true));
    expect(m.on).toBe(false); expect(m.csLayout).toBe("qwertz"); expect(Object.keys(m.lessons).sort()).toEqual(["1", "29"]);
    expect(m.pairs["čr"].n).toBe(9);
  });
});

describe("Czech course: generated text", () => {
  for (const v of ["qwertz", "qwerty"] as const) {
    it(`${v}: every lesson, seeds 1-6: typable everywhere, three steps, the lesson's keys show up`, () => {
      switchCourse("cs"); setCsLayout(v);
      for (const L of LESSONS) for (let sd = 1; sd <= 6; sd++) {
        seed(sd * 31 + L.n);
        const steps = genLesson(L.n)!;
        expect(steps, `lesson ${L.n}`).toHaveLength(3);
        steps.forEach((t: string, i: number) => {
          expect(t.length, `lesson ${L.n} step ${i + 1}`).toBeGreaterThan(10);
          expect(untypable(t), `lesson ${L.n} step ${i + 1}: ${t}`).toEqual([]);
          expect(t).not.toMatch(/ {2}/);
        });
        const all = steps.join(" ");
        for (const k of L.keys) expect(all.includes(k), `lesson ${L.n} key ${k}: ${all}`).toBe(true);
        if (L.shift) expect(/[A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ]/.test(steps[2])).toBe(true);
        /* before the capitals lesson only letters already taught appear */
        if (L.n < CO.capsN) {
          const known = new Set(LESSONS.slice(0, L.n).flatMap((l: any) => l.keys));
          const extra = [...new Set([...all])].filter(ch => ch !== " " && !known.has(ch));
          expect(extra, `lesson ${L.n}`).toEqual([]);
        }
      }
    });
  }
  it("practice rounds and tests (capitals, punctuation, numbers) stay typable", () => {
    switchCourse("cs");
    for (let n = 1; n <= LESSONS.length; n++) SC.lessons[n] = { done: true, stars: 1, wpm: 20, acc: 1, attempts: 1, last: 1 };
    const pool = poolLetters();
    expect(pool).toContain("ů"); expect(pool).toContain("ó");
    for (let sd = 1; sd <= 30; sd++) {
      seed(sd);
      const focus = pool[sd % pool.length];
      const t = genPractice(pool, focus, { caps: true, punct: true, nums: true });
      expect(untypable(t), t).toEqual([]);
      const pair = genPractice(pool, "ře", { caps: false, punct: false, nums: false });
      expect(pair).toContain("ře");
      for (const p of ["c200", "e950"]) { const c = testChunk(30, { pool: p, caps: true, punct: true, nums: true }, ""); expect(untypable(c.text), c.text).toEqual([]); }
    }
    seed(4); expect(untypable(nextRound(pool, true).text)).toEqual([]);
  });
  it("Real text uses the Czech passages; Code is English only", () => {
    switchCourse("cs");
    expect(courseTexts()).toBe(CS_TEXTS);
    CS_TEXTS.forEach(t => expect(untypable(t.x), t.t).toEqual([]));
    expect(pmLockN("text")).toBe(27);
    ls.setItem("homerow.pmode", "code");
    expect(pmode()).toBe("adaptive");
    switchCourse("en"); expect(pmode()).toBe("code"); expect(pmLockN("text")).toBe(20); expect(pmLockN("code")).toBe(22);
  });
  it("Your text keeps Czech letters in the Czech course and fixes quotes and dashes", () => {
    switchCourse("cs");
    const r = cleanText("„Příliš žluťoučký kůň“ úpěl ďábelské ódy — Ångström…");
    expect(r.text).toBe('"Příliš žluťoučký kůň" úpěl ďábelské ódy - Angstrom...');
    switchCourse("en");
    expect(cleanText("Příliš žluťoučký").text).toBe("Prilis zlutoucky");
  });
  it("letter pairs: Czech pairs count in the Czech course only", () => {
    expect(usefulPair("ře")).toBe(false);
    switchCourse("cs");
    expect(usefulPair("ře")).toBe(true);
    expect(charInfo("ř")).toBeTruthy();
  });
});
