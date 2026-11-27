import { describe, expect, it } from "vitest";
import { CS_CORE, CS_MORE } from "./words";
import { CS_TEXTS } from "./texts";
import { CS_BLOCK, CS_SENT, CS_UNITS } from "./extra";

const LETTERS = "a-záčďéěíňóřšťúůýž";
const WORD = new RegExp(`^[${LETTERS}]+$`);
const ALLOWED = /^[a-zA-ZáčďéěíňóřšťúůýžÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ0-9 .,?!:"()\-/%]+$/;
const ALL = [...CS_CORE, ...CS_MORE];
const clean = (s: string) => !/ {2}/.test(s) && s === s.trim() && !/[\n\r\t]/.test(s);

describe("Czech word lists", () => {
  it("uses letters only", () => {
    for (const w of ALL) expect(w, w).toMatch(WORD);
  });
  it("has the right counts, no duplicates, no overlap", () => {
    expect(CS_CORE.length).toBe(200);
    expect(new Set(CS_CORE).size).toBe(200);
    expect(CS_MORE.length).toBeGreaterThanOrEqual(780);
    expect(CS_MORE.length).toBeLessThanOrEqual(850);
    expect(new Set(CS_MORE).size).toBe(CS_MORE.length);
    const core = new Set(CS_CORE);
    expect(CS_MORE.filter((w) => core.has(w))).toEqual([]);
  });
  it.each([..."ůúěščřžýáíéóďťň"])("has at least 3 words with %s", (c) => {
    expect(ALL.filter((w) => w.includes(c)).length).toBeGreaterThanOrEqual(3);
  });
});

describe("Czech passages", () => {
  it("has 40 passages with unique titles and valid text", () => {
    expect(CS_TEXTS.length).toBe(40);
    expect(new Set(CS_TEXTS.map((p) => p.t)).size).toBe(40);
    for (const p of CS_TEXTS) {
      expect(p.t.split(" ").length, p.t).toBeLessThanOrEqual(4);
      expect(p.x, p.t).toMatch(ALLOWED);
      expect(clean(p.x), p.t).toBe(true);
      expect(p.x.length, p.t).toBeGreaterThanOrEqual(160);
      expect(p.x.length, p.t).toBeLessThanOrEqual(330);
    }
  });
});

describe("Czech sentences, units and block list", () => {
  const kinds = ["ques", "excl", "quote", "colon", "paren"] as const;
  it("has 14 valid sentences per kind", () => {
    for (const k of kinds) {
      expect(CS_SENT[k].length, k).toBe(14);
      for (const s of CS_SENT[k]) {
        expect(s, s).toMatch(ALLOWED);
        expect(clean(s), s).toBe(true);
        expect(s.length, s).toBeGreaterThanOrEqual(12);
        expect(s.length, s).toBeLessThanOrEqual(48);
        expect(s[0], s).toBe(s[0].toUpperCase());
        expect(s[0], s).not.toMatch(/[0-9]/);
      }
    }
  });
  it("matches each kind's punctuation", () => {
    for (const s of CS_SENT.ques) expect(s.endsWith("?"), s).toBe(true);
    for (const s of CS_SENT.excl) expect(s.endsWith("!"), s).toBe(true);
    for (const s of CS_SENT.quote) expect((s.match(/"/g) ?? []).length, s).toBe(2);
    for (const s of CS_SENT.colon) expect(s.includes(":"), s).toBe(true);
    for (const s of CS_SENT.paren) expect(/\(.+\)/.test(s), s).toBe(true);
  });
  it("has simple units", () => {
    expect(CS_UNITS.length).toBeGreaterThanOrEqual(12);
    expect(CS_UNITS.length).toBeLessThanOrEqual(16);
    for (const u of CS_UNITS) expect(u, u).toMatch(ALLOWED);
  });
  it("blocks its own entries but none of the real words", () => {
    for (const w of ["kurva", "píča", "čurák", "debil", "kretén"]) expect(CS_BLOCK.test(w), w).toBe(true);
    for (const w of ALL) expect(CS_BLOCK.test(w), w).toBe(false);
    expect(CS_BLOCK.source.split("|").length).toBeGreaterThanOrEqual(20);
  });
});
