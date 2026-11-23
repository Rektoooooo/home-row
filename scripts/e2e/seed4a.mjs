/* synthetic progress for the phase 4A scripts (never real user data): lessons passed up to `passed`, mixed key strengths, some letter pairs, a few tests */
import { seedState } from "./lib.mjs";
export function seed4a({ passed = 22, tests = true } = {}) {
  const s = seedState({ passed });
  const now = Date.now();
  const keys = {};
  "abcdefghijklmnopqrstuvwxyz".split("").forEach((k, i) => { keys[k] = { n: 20 + i * 4, errEma: 0.02 + (i % 7) * 0.012, timeEma: 330 + (i % 9) * 55 }; });
  keys.q = { n: 3, errEma: 0.2, timeEma: 900 };
  s.keys = keys; s.keysAt = now;
  const pairs = {};
  ["th", "er", "in", "an", "re", "on", "at", "en"].forEach((p, i) => { pairs[p] = { n: 12 + i, errEma: 0.03 + i * 0.01, timeEma: 360 + i * 70 }; });
  s.pairs = pairs; s.pairsAt = now;
  if (tests) {
    s.tests = [
      { ts: now - 86400000 * 3, dur: 30, pool: "c200", opts: "", wpm: 31.2, raw: 33, acc: 0.95 },
      { ts: now - 86400000 * 2, dur: 60, pool: "e950", opts: "cp", wpm: 34.6, raw: 36.1, acc: 0.97 },
      { ts: now - 86400000, dur: 15, pool: "c200", opts: "", wpm: 38, raw: 39, acc: 0.98 },
    ];
    s.bests.test30 = 31.2; s.bests.test60 = 34.6; s.bests.test15 = 38; s.bests.practice = 28;
  }
  return s;
}
