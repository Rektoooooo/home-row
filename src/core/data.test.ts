import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { golden, useState, J, fixClock, unfixClock, installLocalStorage } from "./testutil";
import { WL, LESSONS, LAYOUTS, charInfo, reach, homeCh, fcol, shiftIdFor, STEP_NAMES, idsFor, BADDEAD, BLOCK } from "./data";
import { logoBody } from "./shareCard";
import { TEXTS, SNIPPETS } from "./texts";
import { S } from "./state";

beforeEach(() => { fixClock(); installLocalStorage(); });
afterEach(() => { unfixClock(); });

describe("DATA golden", () => {
  const d = golden("data").data, c = golden("data").chars;
  it("word list, lessons, step names, texts, snippets, dead-key regex", () => {
    expect([...WL]).toEqual(d.words);
    expect(J(LESSONS)).toEqual(d.lessons);
    expect(LESSONS).toHaveLength(22);
    expect(STEP_NAMES).toEqual(d.stepNames);
    expect(J(TEXTS)).toEqual(d.texts);
    expect(J(SNIPPETS)).toEqual(d.snippets);
    expect(BADDEAD.source).toBe(d.baddead);
    expect(["ass", "hell", "butt", "kkk", "tits", "tit", "fine", "assist"].map(w => BLOCK.test(w))).toEqual(d.blocked);
  });
  it("ISO and ANSI layouts are identical to the legacy ones", () => {
    expect(J(LAYOUTS)).toEqual(d.layouts);
  });
  it("logo geometry string", () => { expect(logoBody("lgx")).toBe(d.logo); });
  for (const lay of ["iso", "ansi"]) {
    it("charInfo, reach, homeCh, fcol, shiftIdFor on " + lay, () => {
      useState("empty"); S.settings.layout = lay;
      expect(c[lay].chars.map(([ch]: any) => [ch, J(charInfo(ch))])).toEqual(c[lay].chars);
      const reachOf = (id: string) => { try { return J(reach(id)); } catch (e) { return { $error: true }; } };
      expect(c[lay].reach.map(([id]: any) => [id, reachOf(id)])).toEqual(c[lay].reach);
      expect(reachOf("Nope")).toEqual(c[lay].reachMissing);
      expect(c[lay].chars.map(([ch]: any) => [ch, homeCh(ch)])).toEqual(c[lay].homeCh);
      expect(["LP", "LR", "TH", "-", "zz", null].map(f => [f, fcol(f as any)])).toEqual(c[lay].fcol);
      expect(["LP", "RP", "TH", null].map(f => [f, shiftIdFor(f)])).toEqual(c[lay].shiftId);
    });
  }
  it("idsFor", () => { useState("empty"); expect(["f", "F", "shift", "1", "!", " ", "é", "A", ";", "Q"].map(ch => [ch, idsFor([ch])])).toEqual(d.idsFor); });
});

describe("DATA hand-written", () => {
  it("home keys: F and J carry the bumps; thumb has no reach", () => {
    useState("empty");
    expect(reach("KeyF")).toEqual({ home: true, phrase: "home key" });
    expect(reach("Space")).toEqual({ thumb: true, phrase: "thumb" });
    expect(reach("KeyE").phrase).toBe("up");
    expect(charInfo("A")!.shift).toBe(true);
    expect(charInfo("A")!.shiftId).toBe("ShiftRight");
    expect(charInfo("é")).toBeNull();
  });
});
