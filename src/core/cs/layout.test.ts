import { describe, it, expect, afterEach } from "vitest";
import { buildLayout, charInfo, idsFor, LAYOUTS, LAY, reach, homeCh } from "../data";
import { setCOURSE, SC, S } from "../state";
import { CS_LETTERS } from "./course";

const PUNCT = [..."., ?!:\"()-/%"];
const ALL = [...CS_LETTERS, ...CS_LETTERS.toUpperCase(), ..."0123456789", ...PUNCT];

afterEach(() => { setCOURSE("en"); SC.csLayout = "qwertz"; S.settings.layout = "iso"; });

describe("Czech layouts", () => {
  for (const variant of ["cs-qwertz", "cs-qwerty"]) for (const shape of ["iso", "ansi"]) for (const mac of [true, false]) {
    const name = `${variant} ${shape} ${mac ? "mac" : "windows"}`;
    it(`${name}: every character of the Czech course can be typed`, () => {
      const lay = buildLayout(shape, variant, mac);
      const missing = ALL.filter(ch => !lay.chars[ch]);
      expect(missing).toEqual([]);
      for (const ch of ALL) {
        const m = lay.chars[ch];
        expect(lay.byId[m.id], ch).toBeTruthy();
        if (m.dead) expect(lay.byId[m.dead.id], ch + " accent key").toBeTruthy();
      }
    });
    it(`${name}: accent keys are not characters, the number row is letters then digits on Shift`, () => {
      const lay = buildLayout(shape, variant, mac);
      expect(lay.chars["´"]).toBeUndefined();
      expect(lay.chars["ˇ"]).toBeUndefined();
      expect(lay.chars["ě"]).toEqual({ id: "Digit2", shift: false });
      expect(lay.chars["2"]).toEqual({ id: "Digit2", shift: true });
      expect(lay.chars["+"]).toEqual({ id: "Digit1", shift: false });
      expect(lay.chars["ú"]).toEqual({ id: "BracketLeft", shift: false });
      expect(lay.chars["ů"]).toEqual({ id: "Semicolon", shift: false });
      expect(lay.chars['"']).toEqual({ id: "Semicolon", shift: true });
      expect(lay.chars["!"]).toEqual({ id: "Quote", shift: true });
      expect(lay.chars["?"]).toEqual({ id: "Comma", shift: true });
      expect(lay.chars[":"]).toEqual({ id: "Period", shift: true });
      expect(lay.chars["-"]).toEqual({ id: "Slash", shift: false });
      expect(lay.chars[")"]).toEqual({ id: "BracketRight", shift: false });
      expect(lay.chars["("]).toEqual({ id: "BracketRight", shift: true });
      expect(lay.chars["/"]).toEqual({ id: "BracketLeft", shift: true });
      expect(lay.chars["%"]).toEqual({ id: "Minus", shift: true });
      /* accent first, then the letter */
      expect(lay.chars["ó"]).toEqual({ id: "KeyO", shift: false, dead: { id: "Equal", shift: false } });
      expect(lay.chars["Ó"]).toEqual({ id: "KeyO", shift: true, dead: { id: "Equal", shift: false } });
      expect(lay.chars["ď"]).toEqual({ id: "KeyD", shift: false, dead: { id: "Equal", shift: true } });
      expect(lay.chars["Ď"]).toEqual({ id: "KeyD", shift: true, dead: { id: "Equal", shift: true } });
      /* capitals of letters that have a key: Caps Lock + the key (the Czech school method) */
      expect(lay.chars["Č"]).toEqual({ id: "Digit4", shift: false, caps: true });
      expect(lay.chars["Ú"]).toEqual({ id: "BracketLeft", shift: false, caps: true });
      expect(lay.chars["á"]).toEqual({ id: "Digit8", shift: false });
      expect(lay.chars["Á"]).toEqual({ id: "Digit8", shift: false, caps: true });
      expect(lay.chars["Ů"]).toEqual({ id: "Semicolon", shift: false, caps: true });
    });
    it(`${name}: Y and Z`, () => {
      const lay = buildLayout(shape, variant, mac), qz = variant === "cs-qwertz";
      expect(lay.chars["z"].id).toBe(qz ? "KeyY" : "KeyZ");
      expect(lay.chars["y"].id).toBe(qz ? "KeyZ" : "KeyY");
      expect(lay.byId.KeyY.f).toBe("RI");
      expect(lay.byId.KeyZ.f).toBe("LP");
      expect(lay.chars["Ý"]).toEqual({ id: "Digit7", shift: false, caps: true });
      expect(lay.chars["ž"].id).toBe("Digit6");
      expect(lay.chars["Ž"]).toEqual({ id: "Digit6", shift: false, caps: true });
    });
    it(`${name}: same key geometry as the U.S. layout; the number row uses the Czech school fingers`, () => {
      const lay = buildLayout(shape, variant, mac), us = LAYOUTS[shape], num = /^Digit\d$/;
      expect(lay.keys.map((k: any) => [k.id, k.x, k.row, k.w, num.test(k.id) ? "" : k.f])).toEqual(us.keys.map((k: any) => [k.id, k.x, k.row, k.w, num.test(k.id) ? "" : k.f]));
      expect([1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(d => lay.byId["Digit" + d].f)).toEqual(["LP", "LP", "LR", "LM", "LI", "LI", "RI", "RI", "RM", "RR"]);
      expect(["Minus", "Equal", "BracketLeft", "BracketRight", "Semicolon", "Quote", "Slash"].map(id => lay.byId[id].f)).toEqual(Array(7).fill("RP"));
    });
  }
  it("platform legends: Mac and Windows differ only on the key left of 1 and Shift + ¨", () => {
    const m = buildLayout("iso", "cs-qwertz", true), w = buildLayout("iso", "cs-qwertz", false);
    const diff = m.keys.filter((k: any, i: number) => k.base !== w.keys[i].base || k.sh !== w.keys[i].sh).map((k: any) => k.id);
    expect(diff).toEqual(["Backquote", "Backslash"]);
    expect(w.chars[";"]).toEqual({ id: "Backquote", shift: false });
    expect(w.chars["°"]).toBeUndefined();
    expect(m.chars["<"]).toEqual({ id: "Backquote", shift: false });
    expect(buildLayout("ansi", "cs-qwertz", true).chars["\\"]).toEqual({ id: "Backquote", shift: false });
  });
});

describe("Czech course: charInfo and the layout switch", () => {
  it("LAY() follows the course and the Czech variant", () => {
    expect(LAY()).toBe(LAYOUTS.iso);
    setCOURSE("cs");
    expect(LAY().chars.z.id).toBe("KeyY");
    SC.csLayout = "qwerty";
    expect(LAY().chars.z.id).toBe("KeyZ");
    S.settings.layout = "ansi";
    expect(LAY().byId.IntlBackslash).toBeUndefined();
    setCOURSE("en");
    expect(LAY()).toBe(LAYOUTS.ansi);
  });
  it("Č: Caps Lock first, then the č key; Ď: ˇ (Shift + the key left of Backspace), then Shift + D", () => {
    setCOURSE("cs");
    const i = charInfo("Č");
    expect(i.key.id).toBe("Digit4"); expect(i.shift).toBe(false);
    expect(i.ids).toEqual(["Digit4"]); expect(i.fingers).toEqual(["LM"]);
    expect(i.pre.ids).toEqual(["CapsLock"]); expect(i.pre.fingers).toEqual(["LP"]); expect(i.pre.caps).toBe(true);
    const d = charInfo("Ď");
    expect(d.ids).toEqual(["KeyD", "ShiftRight"]);
    expect(d.pre.ids).toEqual(["Equal", "ShiftLeft"]); expect(d.pre.fingers).toEqual(["RP", "LP"]); expect(d.pre.caps).toBeUndefined();
    expect(charInfo("č").pre).toBeUndefined();
    expect(charInfo("ó").pre.ids).toEqual(["Equal"]);
    expect(idsFor(["ó"])).toEqual(["KeyO", "Equal"]);
    expect(idsFor(["Č"])).toEqual(["Digit4", "CapsLock"]);
    expect(homeCh("ó")).toBe("l");
    expect(homeCh("ě")).toBe("a");
    expect(homeCh("ž")).toBe("f");
    expect(homeCh("é")).toBe("l");
    expect(homeCh("ů")).toBe("ů");
  });
  it("the English course never sees Czech characters", () => {
    expect(charInfo("č")).toBeNull();
    expect(charInfo("ó")).toBeNull();
  });
});
