import { describe, it, expect, afterEach } from "vitest";
import { scanKeys } from "./scan";
import { CS } from "./cs";
import { t, tn, setLangForTests, pct, speedTxt, dayLabel, list, finger, reachText, num } from "./index";
import { EN_LESSONS } from "../core/data";
import { csLessons } from "../core/cs/course";
import { ACH } from "../core/rewards";
import { POOL_NAME, PMODES } from "../core/generate";

afterEach(() => setLangForTests("en"));

/* keys that read the same in Czech (citations, units, separators) */
const SAME = new Set(["Dhakal, Feit, Kristensson, Oulasvirta: Observations on Typing from 136 Million Keystrokes, CHI 2018", "Feit, Weir, Oulasvirta: How We Type, CHI 2016",
  "<1 min", "{h} h {m} min", "{h} h", "{m} min", "{from} – {to}", "{dow} {day}"]);
const found = scanKeys(process.cwd()).filter(f => !/\|$/.test(f.key));
const L = [...EN_LESSONS, ...csLessons("qwertz"), ...csLessons("qwerty")];
const dynamic = [
  ...new Set(L.map(l => "stage|" + l.stage)), ...new Set(L.map(l => "lesson|" + l.title)), ...ACH.map((a: any) => "ach|" + a.title),
  ...Object.values(POOL_NAME).map(s => "pool|" + s), "pool|Everyday 1000", ...PMODES.map((m: any) => "mode|" + m[1]),
];
const ph = (s: string) => [...new Set(s.match(/\{\w+\}/g) || [])].sort();

describe("Czech dictionary", () => {
  it("every key the app uses has a Czech translation", () => {
    const missing = [...new Set([...found.map(f => f.key), ...dynamic])].filter(k => !SAME.has(k) && !(k in CS));
    expect(missing).toEqual([]);
  });
  it("plurals are [one, few, other(, many)] arrays and only plurals are arrays", () => {
    const plural = new Set(found.filter(f => f.plural).map(f => f.key));
    for (const [k, v] of Object.entries(CS)) {
      if (plural.has(k)) { expect(Array.isArray(v), k).toBe(true); expect((v as string[]).length, k).toBeGreaterThanOrEqual(3); }
      else expect(typeof v, k).toBe("string");
    }
  });
  it("translations keep exactly the placeholders of the English text", () => {
    const pl = new Map(found.filter(f => f.plural).map(f => [f.key, f.plural!]));
    for (const [k, v] of Object.entries(CS)) {
      const want = ph(k + (pl.get(k) || ""));
      for (const s of Array.isArray(v) ? v : [v]) expect(ph(s), k + " → " + s).toEqual(want);
    }
  });
  it("no stale entries", () => {
    const used = new Set([...found.map(f => f.key), ...dynamic]);
    expect(Object.keys(CS).filter(k => !used.has(k))).toEqual([]);
  });
});

describe("Czech formatting", () => {
  it("plural forms, numbers, percent, speed, dates, lists, fingers, reaches", () => {
    setLangForTests("cs");
    expect([1, 2, 4, 5, 0, 21].map(n => tn(n, "{n} lesson", "{n} lessons"))).toEqual(["1 lekce", "2 lekce", "4 lekce", "5 lekcí", "0 lekcí", "21 lekcí"]);
    expect([1, 3, 7].map(n => tn(n, "{n} mistake", "{n} mistakes", { sec: 30, speed: 150, unit: "úh./min" }))).toBeTruthy();
    expect(tn(1, "{n} day", "{n} days")).toBe("1 den");
    expect(tn(3, "{n} day", "{n} days")).toBe("3 dny");
    expect(tn(12, "{n} day", "{n} days")).toBe("12 dní");
    expect(pct("95.5%")).toBe("95,5 %");
    expect(pct("100%")).toBe("100 %");
    expect(num(3.25, 1)).toBe("3,3");
    expect(speedTxt(20)).toBe("100 úh./min");
    expect(dayLabel(new Date(2026, 10, 9))).toBe("po 9. 11.");
    expect(list(["a", "b", "c"])).toBe("a, b a c");
    expect(finger("LI", "ins")).toBe("levým ukazováčkem");
    expect(reachText("up and in")).toBe("nahoru a dovnitř");
    expect(t("tab|Practice")).toBe("Procvičování");
    expect(t("Nothing here yet, untranslated")).toBe("Nothing here yet, untranslated");
    setLangForTests("en");
    expect(tn(1, "{n} lesson", "{n} lessons")).toBe("1 lesson");
    expect(t("tab|Practice")).toBe("Practice");
    expect(pct("95.5%")).toBe("95.5%");
  });
});
