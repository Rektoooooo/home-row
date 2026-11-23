import { describe, it, expect, beforeEach, afterEach } from "vitest";
import "./testutil";
import { seed, unseed, fixClock, unfixClock, installLocalStorage, golden, useState, J } from "./testutil";
import { genLesson, genStep, pseudoWord, genPractice, testChunk, extras, genPairRound, practiceDigits, pOpts, focusKey, chooseFocus, slowPairs, nextRound, paceFor, setNEXT } from "./generate";
import { poolLetters, strengthOf, weakW, usefulPair } from "./stats";
import { LESSONS, BADDEAD } from "./data";
import { S } from "./state";

beforeEach(() => { fixClock(); installLocalStorage(); });
afterEach(() => { unseed(); unfixClock(); });

describe("GEN golden: lessons", () => {
  const g = golden("gen");
  it("genLesson / genStep match the legacy output for every lesson, seeds 1-5, five states", () => {
    let last = "";
    expect(g.lessons.length).toBeGreaterThan(800);
    for (const r of g.lessons) {
      if (r.state !== last) { useState(r.state); last = r.state; }
      seed(r.seed);
      const out = r.step ? genStep(r.n, r.s) : genLesson(r.n);
      expect({ k: [r.state, r.n, r.seed, r.step ? r.s : 0], out }).toEqual({ k: [r.state, r.n, r.seed, r.step ? r.s : 0], out: r.out });
    }
  });
  it("pseudoWord matches the legacy output", () => {
    useState("empty");
    for (const r of g.pseudoWord) {
      seed(r.seed);
      const out: string[] = [];
      for (let k = 0; k < 6; k++) out.push(pseudoWord(r.al, r.o || undefined));
      expect(out).toEqual(r.out);
    }
  });
});

describe("GEN: practice and test text golden", () => {
  const p = golden("practice");
  it("practice rounds, focus, pairs, extras match", () => {
    let cur = "";
    let info: any = null;
    for (const r of p.rounds) {
      if (r.kind === "info") {
        useState(r.state); cur = r.state; info = r;
        const pool = poolLetters();
        const got = J({ pool, focus: focusKey(pool), chooseFocus: chooseFocus(pool), slow6: slowPairs(6), slow8: slowPairs(8), slowPool: slowPairs(5, pool), slowAvoid: slowPairs(5, pool, ["th", "he"]) });
        expect(got).toEqual(J({ pool: r.pool, focus: r.focus, chooseFocus: r.chooseFocus, slow6: r.slow6, slow8: r.slow8, slowPool: r.slowPool, slowAvoid: r.slowAvoid }));
        expect([paceFor("practice"), paceFor("test", 30), paceFor("test", 60), paceFor("test", 15)]).toEqual(r.pace);
        expect(["f", "j", "x", "zz", "shift"].map(k => J(strengthOf(S.keys[k])))).toEqual(r.strength);
        expect(["th", "he", "in", "ng"].map(k => J(strengthOf(S.pairs[k], 6)))).toEqual(r.strengthMin);
        expect(pool.map((k: string) => weakW(k))).toEqual(r.weakW);
        expect(J(pOpts())).toEqual(r.pOpts);
        expect(practiceDigits()).toBe(r.digits);
        expect([focusKey(pool), focusKey(pool, ["f", "j"]), focusKey(pool, pool)]).toEqual(r.focusKey);
        expect(["th", "zz", "qx", "he", "a", "ab", "1a", "ng", "ck"].map(usefulPair)).toEqual(r.usefulPair);
        continue;
      }
      const pool = poolLetters();
      seed(r.seed);
      if (r.kind === "practice") expect(genPractice(pool, r.focus, r.o)).toBe(r.out);
      else if (r.kind === "pair") expect(genPairRound(pool, r.pair, r.o)).toBe(r.out);
      else if (r.kind === "next") { setNEXT(null); expect(J(nextRound(pool, true))).toEqual(r.out); }
      else if (r.kind === "extras") expect(extras(r.toks, r.o)).toEqual(r.out);
      else throw new Error("unknown " + r.kind);
    }
    expect(cur).toBe("ansiEarly"); expect(info).toBeTruthy();
  });
  it("testChunk matches", () => {
    useState("mid");
    expect(p.testChunks.length).toBeGreaterThan(50);
    for (const r of p.testChunks) { seed(r.seed); expect(J(testChunk(r.n, r.o, r.prev))).toEqual(r.out); }
  });
});

describe("GEN hand-written: every lesson key shows up in each word step (lessons 1-18)", () => {
  for (const state of ["empty", "mid", "late", "ansiEarly"]) {
    it("state " + state, () => {
      useState(state);
      for (let n = 1; n <= 18; n++) {
        const L = LESSONS[n - 1];
        /* the keys of the lesson and every earlier one (lessons 1-17 are letters and , . / ; ) */
        const keys = new Set<string>();
        for (let i = 0; i < n; i++) LESSONS[i].keys.forEach((k: string) => keys.add(k));
        for (let s = 1; s <= 40; s++) {
          seed(s * 1009 + n);
          const texts = genLesson(n) as string[];
          expect(texts).toHaveLength(3);
          for (const t of texts) { expect(t.length).toBeGreaterThan(0); expect(BADDEAD.test(t)).toBe(false); expect(/ {2}/.test(t)).toBe(false); }
          /* the combine and word steps must hold each new key of this lesson; the word step holds every letter of the lesson set */
          if (!L.review) for (const k of L.keys) { expect(texts[1].includes(k) || texts[2].includes(k)).toBe(true); expect(texts[0].includes(k)).toBe(true); }
          const word = texts[2];
          for (const k of keys) {
            if (!/^[a-z]$/.test(k)) continue;
            expect([n, s, k, word.includes(k)]).toEqual([n, s, k, true]);
          }
        }
      }
    });
  }
});
