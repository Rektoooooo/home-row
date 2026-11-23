import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { golden, useState, J, seed, unseed, fixClock, unfixClock, installLocalStorage } from "./testutil";
import { cleanText, splitParts, mtFeedback, pmLocked, pmMinutes, pmPickText, pmPickSnip, pmode, pmDone, pmMarkDone, pmLang, pmSnips, RT, CS, setRT, setCS, mtList, mtSave } from "./generate";
import { TEXTS, SNIPPETS } from "./texts";
import { charInfo } from "./data";

let ls: any;
beforeEach(() => { fixClock(); ls = installLocalStorage(); });
afterEach(() => { unseed(); unfixClock(); });

describe("practice modes golden: Your text tools", () => {
  const g = golden("textmodes");
  it("cleanText / splitParts / mtFeedback match", () => {
    useState("empty");
    for (const p of g.parts) {
      expect(J(cleanText(p.t))).toEqual(p.clean);
      expect(J(splitParts(cleanText(p.t).text))).toEqual(p.split);
      expect(J(splitParts(cleanText(p.t).text, 5))).toEqual(p.split5);
      expect(J([mtFeedback(p.t, false), mtFeedback(p.t, true)])).toEqual(p.feedback);
    }
  });
  it("locks, minutes, text and snippet picking, saved mode and done list match", () => {
    const m = g.mode, st = golden("states");
    useState("mid"); ls.clear(); setRT(null); setCS(null);
    expect(["adaptive", "text", "code", "mine"].map(pmLocked)).toEqual(m.midLocked);
    useState("late"); expect(["adaptive", "text", "code", "mine"].map(pmLocked)).toEqual(m.lateLocked);
    useState("unlockAll"); expect(["text", "code"].map(pmLocked)).toEqual(m.unlockAllLocked);
    useState("mid");
    expect([1, 5, 100, 400, 1000, 6000].map(n => [n, pmMinutes(n)])).toEqual(m.minutes);
    const picks: any[] = [];
    for (const done of [[], [TEXTS[0].t, TEXTS[1].t], TEXTS.map(x => x.t)]) {
      ls.setItem("homerow.textsDone", JSON.stringify(done));
      for (let s = 1; s <= 4; s++) { seed(s); const a = [RT && RT.t]; pmPickText(); a.push(RT.t); pmPickText(); a.push(RT.t); picks.push({ done, seed: s, picks: a }); }
    }
    expect(picks).toEqual(m.textPicks);
    const sp: any[] = [];
    for (const lang of ["All", "JavaScript", "Python", "Swift", "CSS", "SQL", "Shell", "Nope"]) {
      ls.setItem("homerow.clang", lang);
      for (let s = 1; s <= 3; s++) { seed(s); pmPickSnip(); const a = [CS.t]; pmPickSnip(); a.push(CS.t); sp.push({ lang, seed: s, picks: a, lang2: pmLang(), n: pmSnips().length }); }
    }
    expect(sp).toEqual(m.snipPicks);
    expect([["adaptive"], ["text"], ["code"], ["mine"], ["bogus"], [null]].map(([v]) => { if (v === null) ls.removeItem("homerow.pmode"); else ls.setItem("homerow.pmode", v); return [v, pmode()]; })).toEqual(m.pmode);
    ls.setItem("homerow.textsDone", JSON.stringify(["a", 5, "b"])); expect(pmDone()).toEqual(m.done);
    pmMarkDone("z"); pmMarkDone("a"); expect(pmDone()).toEqual(m.done2);
    ls.setItem("homerow.textsDone", "garbage"); expect(pmDone()).toEqual(m.done3);
    expect(st.mid).toBeTruthy();
  });
});

describe("practice modes hand-written", () => {
  it("every character of every shipped text and snippet can be typed on the keyboard (Enter in code)", () => {
    useState("empty");
    for (const t of TEXTS) for (const ch of t.x) expect([t.t, ch, !!charInfo(ch)]).toEqual([t.t, ch, true]);
    for (const s of SNIPPETS) for (const ch of s.x) expect([s.t, ch, ch === "\n" || !!charInfo(ch)]).toEqual([s.t, ch, true]);
  });
  it("splitParts keeps parts to about 300 characters and caps at 20 parts", () => {
    const sp = splitParts(("This is a sentence that is somewhat long. ").repeat(300));
    expect(sp.parts).toHaveLength(20); expect(sp.cut).toBe(true);
    for (const p of sp.parts) { expect(p.length).toBeLessThanOrEqual(360); expect(p.length).toBeGreaterThan(100); }
  });
  it("cleanText maps smart quotes and strips accents", () => {
    useState("empty");
    expect(cleanText("“Hi” — café")).toEqual({ text: '"Hi" - cafe', changed: 4 });
  });
  it("your texts are kept (5 at most) in localStorage under homerow.mytexts", () => {
    mtSave(Array.from({ length: 8 }, (_, i) => ({ id: "i" + i, title: "t", parts: ["p"], next: 0, at: 0 })));
    expect(JSON.parse(ls.getItem("homerow.mytexts"))).toHaveLength(5); expect(mtList()).toHaveLength(5);
    ls.setItem("homerow.mytexts", "{}"); expect(mtList()).toEqual([]);
  });
});
