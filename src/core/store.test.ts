import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { golden, useState, J, clone, fixClock, unfixClock, installLocalStorage, NOW } from "./testutil";
import { sanitize, merge, stable, emptyState, loadLocal, writeLocal, save, resetAll, LSK, subscribe, getVersion, DEF, settingChanged, setSaveHook } from "./store";
import { S, setS } from "./state";

let ls: any;
beforeEach(() => { fixClock(); ls = installLocalStorage(); setSaveHook(null); });
afterEach(() => { unfixClock(); setSaveHook(null); });

describe("STORE golden", () => {
  const g = golden("store");
  it("sanitize matches on every edge input", () => {
    expect(g.sanitize.length).toBeGreaterThan(40);
    for (const r of g.sanitize) expect({ in: r.in, out: J(sanitize(JSON.parse(r.in))) }).toEqual({ in: r.in, out: r.out });
  });
  it("merge(sanitize(a), sanitize(b)) matches on every pair (reset, achievements, baseline, bests, modes, limits)", () => {
    for (const r of g.merge) {
      let out: any; try { out = J(merge(sanitize(JSON.parse(r.a)), sanitize(JSON.parse(r.b)))); } catch (e: any) { out = { $error: String(e && e.message) }; }
      if (r.out.$error) expect(out.$error).toBeTruthy(); else expect({ n: r.n, out }).toEqual({ n: r.n, out: r.out });
    }
  });
  it("stable() sorts keys like the legacy one", () => {
    const input = [null, 1, "s", [3, 1, { b: 1, a: [2, 1] }], { z: 1, a: { y: [1, { k: null }], b: "x" }, m: true }, { a: undefined, b: 2 }, [undefined, 1]];
    expect(input.map((x: any) => stable(x))).toEqual(g.stable.out);
  });
  it("emptyState matches", () => { expect(J(emptyState())).toEqual(g.emptyState); });
  it("every synthetic legacy state is a fixed point of sanitize", () => {
    const st = golden("states");
    for (const k of Object.keys(st)) { expect(J(sanitize(st[k]))).toEqual(g.idem[k]); expect(g.idem[k]).toEqual(st[k]); }
  });
});

describe("STORE hand-written", () => {
  it("localStorage key is homerow.v1; loadLocal falls back to empty on garbage", () => {
    expect(LSK).toBe("homerow.v1");
    ls.setItem(LSK, "not json"); expect(J(loadLocal())).toEqual(J(emptyState()));
    ls.setItem(LSK, JSON.stringify({ lessons: { 1: { done: true, stars: 2, wpm: 20, acc: 0.97, attempts: 1, last: 5 } } }));
    expect(loadLocal().lessons[1].done).toBe(true);
    ls.removeItem(LSK); expect(J(loadLocal())).toEqual(J(emptyState()));
  });
  it("save() stamps updatedAt, writes localStorage, notifies subscribers and calls the account hook", () => {
    useState("mid");
    const seen: number[] = []; const un = subscribe(() => seen.push(getVersion()));
    const hook = vi.fn(); setSaveHook(hook);
    save();
    expect(S.updatedAt).toBe(NOW);
    expect(JSON.parse(ls.getItem(LSK)).updatedAt).toBe(NOW);
    expect(hook).toHaveBeenCalledTimes(1); expect(seen.length).toBe(1);
    un(); save(); expect(seen.length).toBe(1);
  });
  it("resetAll keeps settings, settingsAt and seenTips, clears the rest and stamps the reset", () => {
    useState("late"); S.seenTips.welcome = true; S.settingsAt = 123;
    const settings = clone(S.settings);
    resetAll();
    expect(S.resetAt).toBe(NOW); expect(S.updatedAt).toBe(NOW); expect(S.keysAt).toBe(NOW); expect(S.pairsAt).toBe(NOW); expect(S.modes.at).toBe(NOW);
    expect(S.settings).toEqual(settings); expect(S.settingsAt).toBe(123); expect(S.seenTips.welcome).toBe(true);
    expect(S.lessons).toEqual({}); expect(S.keys).toEqual({}); expect(S.days).toEqual({}); expect(S.tests).toEqual([]);
  });
  it("a reset beats older remote data in merge, and newer data survives it", () => {
    useState("late");
    const local = clone(S); const reset = emptyState(); reset.resetAt = NOW + 1; reset.updatedAt = NOW + 1;
    const m = merge(reset, local);
    expect(m.lessons).toEqual({}); expect(m.resetAt).toBe(NOW + 1);
    const newer = clone(local); Object.keys(newer.lessons).forEach(k => { if (k !== "1") delete newer.lessons[k]; }); newer.lessons[1].last = NOW + 2; newer.updatedAt = NOW + 2;
    expect(Object.keys(merge(reset, newer).lessons)).toEqual(["1"]);
  });
  it("settingChanged stamps settingsAt and saves", () => {
    useState("mid"); settingChanged(); expect(S.settingsAt).toBe(NOW); expect(JSON.parse(ls.getItem(LSK)).settingsAt).toBe(NOW);
  });
  it("DEF defaults", () => { expect(DEF.goal).toBe(15); expect(DEF.target).toBe(25); expect(DEF.soundPack).toBe("off"); expect(DEF.layout).toBe("iso"); });
  it("achievements: the earliest time wins and reset drops older ones", () => {
    const a = sanitize({ ach: { x: 100, y: 5 }, resetAt: 40 }), b = sanitize({ ach: { x: 70, y: 80, w: 41 } });
    expect(merge(a, b).ach).toEqual({ x: 70, y: 80, w: 41 });
    expect(merge(sanitize({ ach: { x: 100, y: 5 } }), sanitize({ ach: { x: 70 } })).ach).toEqual({ x: 70, y: 5 });
  });
  it("settings: soundPack vs sound boolean (an older tab only writes the boolean)", () => {
    expect(sanitize({ settings: { soundPack: "click", sound: false } }).settings.soundPack).toBe("off");
    expect(sanitize({ settings: { soundPack: "off", sound: true } }).settings.soundPack).toBe("cream");
    expect(sanitize({ settings: { sound: true } }).settings.soundPack).toBe("cream");
    expect(sanitize({ settings: { soundPack: "type" } }).settings.sound).toBe(true);
  });
  it("seenTips merge by OR and baseline keeps the earliest", () => {
    const m = merge(sanitize({ seenTips: { deadKey: true }, baseline: { wpm: 10, acc: 0.9, ts: 500 } }), sanitize({ seenTips: { welcome: true }, baseline: { wpm: 12, acc: 0.8, ts: 400 } }));
    expect(m.seenTips).toEqual({ deadKey: true, welcome: true }); expect(m.baseline.ts).toBe(400);
  });
  it("setS replaces the live binding", () => { const e = emptyState(); setS(e); expect(S).toBe(e); });
});
