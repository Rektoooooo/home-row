import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { golden, useState, J, clone, seed, unseed, fixClock, unfixClock, installLocalStorage, NOW } from "./testutil";
import { S, setS } from "./state";
import { sanitize, emptyState } from "./store";
import { LESSONS } from "./data";
import { pctTxt, wpmCalc, keyWpm, keyAcc, streak, minutesToday, learnedChars, weakestKey, nextLessonN, unlocked, lessonDone, hasProgress, heatMap, buildSteps, sumRes,
  poolLetters, applyLessonResult, applyCustomResult, applyTestResult, scoreRun, dayWpm, dLabel, dateKey, addDays, applyKeyEvents, addDay } from "./stats";
import { levelInfo, xpWords, ACH, checkAchievements, weekStats, mondayOf, fmtMin, weekTitle, liveCheck, resetRewardsForTests, takeCelebrate, LASTLV, achBootHook } from "./rewards";
import { isoWeek, weekId, weekBrief, practiceMs7 } from "./sync";
import { testCard, weekCard } from "./shareCard";
import { allowedChars, buildSummary, buildPrompt, coachAsk } from "./coach";
import { shuffle, niceStep } from "./generate";
import { hooks, setHooks } from "./hooks";

beforeEach(() => { fixClock(); installLocalStorage(); resetRewardsForTests(); });
afterEach(() => { unseed(); unfixClock(); });

describe("STATS / REW golden, per synthetic state", () => {
  const per = golden("stats");
  for (const sn of Object.keys(per)) {
    it("state " + sn, () => {
      useState(sn);
      const r = per[sn];
      expect(xpWords()).toBe(r.xpWords); expect(J(levelInfo())).toEqual(r.levelInfo);
      expect(streak()).toBe(r.streak); expect(minutesToday()).toBe(r.minutesToday);
      expect([...learnedChars()].sort()).toEqual(r.learned); expect(weakestKey()).toBe(r.weakestKey); expect(nextLessonN()).toBe(r.nextLessonN);
      expect(Array.from({ length: 22 }, (_, i) => unlocked(i + 1))).toEqual(r.unlocked);
      expect(Array.from({ length: 22 }, (_, i) => lessonDone(i + 1))).toEqual(r.lessonDone);
      expect(hasProgress()).toBe(r.hasProgress); expect(practiceMs7()).toBe(r.practiceMs7);
      expect(J(heatMap("speed"))).toEqual(r.heat.speed);
      expect(J(buildSteps())).toEqual(r.buildSteps); expect(poolLetters()).toEqual(r.pool);
      expect(Object.keys(S.keys).map(k => [k, keyWpm(S.keys[k]), keyAcc(S.keys[k])])).toEqual(r.keyWpm);
      /* achievement conditions */
      expect(ACH.map(a => [a.id, !!a.test()])).toEqual(r.ach);
      /* weeks */
      const mon = mondayOf(new Date());
      expect(dateKey(mon)).toBe(r.mondayOf);
      expect([0, -7, -14].map(d => { const m = addDays(mon, d); return J({ mon: dateKey(m), ws: weekStats(m), brief: weekBrief(m), title: weekTitle(m) }); })).toEqual(r.weeks);
      const last = S.tests[S.tests.length - 1];
      expect(J(last ? testCard(last) : null)).toEqual(r.testCard); expect(J(weekCard())).toEqual(r.weekCard);
      /* coach prompt data */
      expect(J(buildSummary())).toEqual(r.summary); expect(buildPrompt(buildSummary(), allowedChars())).toBe(r.prompt);
      expect([...allowedChars()].join("")).toBe(r.allowed); expect(coachAsk()).toBe(r.coachAsk);
      /* checkAchievements (silent), then again */
      const before = clone(S.ach);
      const got = checkAchievements({ silent: true });
      expect({ got, ach: J(S.ach), before }).toEqual(r.granted);
      expect(checkAchievements({ silent: true })).toEqual(r.grantedAgain);
    });
  }
  it("the accuracy / speed heat map", () => {
    const h = golden("heat");
    for (const sn of Object.keys(h)) { useState(sn); expect(J(heatMap("speed"))).toEqual(h[sn].speed); expect(J(heatMap("acc"))).toEqual(h[sn].acc); }
  });
  it("levelInfo for fixed word counts", () => { for (const [w, out] of golden("levels")) expect(J(levelInfo(w))).toEqual(out); });
  it("pctTxt, wpmCalc, keyWpm, keyAcc", () => {
    const p = golden("pct");
    p.pct.forEach(([v, t]: any) => expect([v, pctTxt(v)]).toEqual([v, t]));
    p.wpm.forEach(([c, m, w]: any) => expect(wpmCalc(c, m)).toBe(w));
    p.kw.forEach(([k, w, a]: any) => expect(J([keyWpm(k), keyAcc(k)])).toEqual([w, a]));
  });
  it("ISO week and week id", () => {
    for (const r of golden("isoweek")) { const d = new Date(r.y, r.m, r.d); expect(isoWeek(d)).toEqual(r.iso); expect(weekId(d)).toBe(r.id); }
  });
  it("small helpers (sumRes, niceStep, shuffle, dayWpm, dLabel, fmtMin) and applyKeyEvents / addDay", () => {
    const m = golden("misc");
    useState("mid");
    expect([sumRes([]), sumRes([{ ms: 1000, chars: 10, presses: 12, correct: 11 }, { ms: 2000, chars: 20, presses: 20, correct: 20 }]), sumRes([{ ms: 0, chars: 0, presses: 0, correct: 0 }])].map(J)).toEqual(m.sumRes);
    expect([1, 9, 10, 11, 25, 41, 99, 199, 500, 5000].flatMap(x => [4, 5].map(t => [x, t, niceStep(x, t)]))).toEqual(m.niceStep);
    seed(5); expect(shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])).toEqual(m.shuffle);
    expect([null, { ms: 59999, chars: 100 }, { ms: 60000, chars: 100 }, { ms: 120000, chars: 1000 }].map(d => J(dayWpm(d)))).toEqual(m.dayWpm);
    expect([[2026, 5, 17], [2026, 0, 1], [2026, 11, 31]].map(([y, mo, d]) => dLabel(new Date(y, mo, d)))).toEqual(m.dLabel);
    expect([0, 0.2, 0.5, 0.6, 1, 59.4, 59.6, 60, 61, 125, 600].map(x => [x, fmtMin(x)])).toEqual(m.fmtMin);
    const ev1 = [{ c: "f", miss: false, dt: 300, pc: "", pmiss: false }, { c: "j", miss: false, dt: 250, pc: "f", pmiss: false }, { c: "J", miss: true, dt: null, pc: "j", pmiss: false }, { c: "\n", miss: false }, { c: "a", miss: false, dt: 5000, pc: "J", pmiss: true }, { c: "T", miss: false, dt: 200, pc: "a", pmiss: false }, { c: "1", miss: false, dt: 300, pc: "T", pmiss: false }, { c: "t", miss: true, dt: null, pc: "a", pmiss: false }];
    useState("mid"); applyKeyEvents(ev1); addDay(60000, 300, 310, 300);
    expect(J({ keys: S.keys, pairs: S.pairs, today: S.days["2026-06-17"], keysAt: S.keysAt, pairsAt: S.pairsAt, ndays: Object.keys(S.days).length })).toEqual(m.afterEvents);
    useState("late");
    const al = "abcdefghijklmnopqrstuvwxyz", evs: any[] = [];
    for (const a of al) for (const b of al) evs.push({ c: b, miss: false, dt: 200, pc: a, pmiss: false });
    applyKeyEvents(evs); applyKeyEvents(evs.slice(0, 40));
    expect(J({ pairs: Object.keys(S.pairs).length, sample: S.pairs.th, keys: S.keys.a })).toEqual(m.afterMany);
  });
});

describe("LEARN-12 / LEARN-13: pass rule and stars, through the same result screen path as the legacy debug App.results", () => {
  const recs = golden("results");
  it("matches the legacy results for the accuracy and speed edges", () => {
    expect(recs.length).toBeGreaterThan(30);
    for (const r of recs) {
      useState(r.state);
      expect(J(S.lessons[r.n] || null)).toEqual(r.before); expect(S.bests.lessonWpm).toBe(r.bestBefore);
      const res = applyLessonResult(r.n, r.agg);
      expect(J(S.lessons[r.n])).toEqual(r.after);
      expect(S.bests.lessonWpm).toBe(r.bestAfter);
      expect(res.passed).toBe(r.passed);
      expect(res.stars).toBe(r.stars);
      expect([String(Math.round(res.wpm)), pctTxt(res.acc)]).toEqual([r.nums[0], r.nums[1]]);
    }
  });
  it("edges by hand: 94.6 / 94.96 fail, 95 passes, 97.95 is two stars, 98 + target+5 is three", () => {
    const L1 = LESSONS[0].wpm; /* 12 */
    const run = (correct: number, presses: number, chars: number) => scoreRun({ ms: 60000, chars, presses, correct }, L1);
    expect(run(946, 1000, 300)).toMatchObject({ passed: false, stars: 0 });
    expect(pctTxt(0.946)).toBe("94.6%");
    expect(run(9496, 10000, 300)).toMatchObject({ passed: false, stars: 0 });
    expect(pctTxt(0.9496)).toBe("94.9%");
    expect(pctTxt(0.95)).toBe("95%");
    expect(run(95, 100, 300)).toMatchObject({ passed: true, stars: 2 });
    expect(run(95, 100, 5 * 11)).toMatchObject({ passed: true, stars: 1 }); /* 11 wpm < 12 */
    expect(run(9795, 10000, 300)).toMatchObject({ passed: true, stars: 2 }); expect(pctTxt(0.9795)).toBe("97.9%");
    expect(run(98, 100, 5 * 17)).toMatchObject({ passed: true, stars: 3 });
    expect(run(98, 100, 5 * 16)).toMatchObject({ passed: true, stars: 2 });
    expect(run(979, 1000, 5 * 40)).toMatchObject({ passed: true, stars: 2 });
    expect(run(0, 0, 0)).toMatchObject({ passed: true, acc: 1 }); /* no presses counts as accuracy 1 */
  });
  it("keeps the best of every attempt and counts attempts; custom lessons use the speed setting as target", () => {
    useState("empty");
    applyLessonResult(2, { ms: 60000, chars: 300, presses: 100, correct: 99 });
    const r1 = clone(S.lessons[2]);
    const second = applyLessonResult(2, { ms: 60000, chars: 10, presses: 100, correct: 50 });
    expect(second.wasDone).toBe(true); expect(second.celebrate).toBe(false);
    expect(S.lessons[2]).toMatchObject({ done: true, stars: r1.stars, wpm: r1.wpm, acc: r1.acc, attempts: 2 });
    S.settings.target = 30;
    const c1 = applyCustomResult("abc", { ms: 60000, chars: 5 * 30, presses: 100, correct: 99 });
    expect(c1).toMatchObject({ passed: true, stars: 2, celebrate: true });
    const c2 = applyCustomResult("abc", { ms: 60000, chars: 5 * 36, presses: 100, correct: 99 });
    expect(c2.stars).toBe(3); expect(S.custom.abc.attempts).toBe(2);
    for (let i = 0; i < 105; i++) S.custom["k" + i] = { wpm: 1, acc: 1, stars: 1, attempts: 1, last: i };
    applyCustomResult("abc", { ms: 60000, chars: 1, presses: 1, correct: 1 });
    expect(Object.keys(S.custom).length).toBe(100); expect(S.custom.abc).toBeTruthy();
  });
  it("applyTestResult appends, keeps 100 and records the best", () => {
    useState("empty");
    const res = { wpm: 33.333, raw: 35.55, acc: 0.97 };
    expect(applyTestResult(res, 30, { pool: "c200", caps: true, punct: false, nums: true })).toBe(true);
    expect(S.tests[0]).toMatchObject({ ts: NOW, dur: 30, pool: "c200", opts: "cn", wpm: 33.3, raw: 35.6, acc: 0.97 }); expect(S.bests.test30).toBe(33.333);
    expect(applyTestResult({ ...res, wpm: 20 }, 30, { pool: "c200" })).toBe(false);
    for (let i = 0; i < 120; i++) applyTestResult({ ...res, wpm: 1 }, 15, { pool: "e950" });
    expect(S.tests.length).toBe(100);
  });
});

describe("REW hand-written: levels, achievements silent at load", () => {
  it("level n needs 300 + 150 (n-1) more words", () => {
    expect(levelInfo(0)).toEqual({ level: 1, into: 0, need: 300, pct: 0 });
    expect(levelInfo(300)).toMatchObject({ level: 2, into: 0, need: 450 });
    expect(levelInfo(749).level).toBe(2); expect(levelInfo(750).level).toBe(3); expect(levelInfo(1350).level).toBe(4);
  });
  it("liveCheck toasts for a level up and a new badge; the load-time hook is silent", () => {
    const toasts: any[] = []; setHooks({ toast: (o: any) => toasts.push(o) });
    useState("empty");
    expect(achBootHook("connecting")).toBe(false);
    S.lessons[1] = { done: true, stars: 1, wpm: 10, acc: 0.97, attempts: 1, last: NOW };
    expect(achBootHook("local")).toBe(true); /* granted silently */
    expect(toasts).toHaveLength(0); expect(S.ach["first-lesson"]).toBe(NOW);
    expect(achBootHook("account")).toBe(false); /* only the first status change counts */
    S.lessons[2] = S.lessons[3] = S.lessons[4] = S.lessons[5] = S.lessons[6] = { done: true, stars: 3, wpm: 10, acc: 0.97, attempts: 1, last: NOW };
    S.days[dateKey(new Date())] = { ms: 1, chars: 1, presses: 1, correct: 3000, ex: 1, t: NOW }; /* 600 words: level 2 */
    liveCheck(true);
    expect(toasts.map(t => t.title)).toEqual(expect.arrayContaining(["Level 2", "Achievement unlocked"]));
    expect(takeCelebrate()).toBe(true); expect(takeCelebrate()).toBe(false);
    setHooks({ toast: () => {} });
  });
  it("streak: today counts only with a minute; a day without one is skipped when today is empty", () => {
    useState("streak31"); expect(streak()).toBe(31);
    useState("streak7"); expect(streak()).toBe(7);
    useState("gap"); expect(streak()).toBe(3);
    useState("empty"); expect(streak()).toBe(0);
  });
});
