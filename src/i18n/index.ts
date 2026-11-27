/* I18N: the app language (English or Czech). Framework-free, so core modules can use it; the React hook is in react.ts.

   t("Start lesson")                      English source text is the key. Czech comes from CS (cs.ts); missing → English.
   t("tab|Practice")                      "ctx|" gives the same English text a separate key when Czech needs a different word.
   t("Lesson {n} · {title}", { n, title }) placeholders in braces.
   tn(n, "{n} lesson", "{n} lessons")     plurals: English one/other; Czech [one, few, other, many?] keyed by the singular.
   tx("Press {key} now.", { key: <b/> })  like t, but values may be React nodes; returns one fragment to render.
   Formatting: num(), dec(), pct(), speed(), speedUnit(), dayLabel(), monthShort(), dowShort(), list(), finger(), reachText(). */
import { createElement, Fragment, type ReactNode } from "react";
import { CS } from "./cs";

export type Lang = "en" | "cs";
export type Vars = Record<string, string | number>;
export let LANG: Lang = "en";
export const LANG_LS = "homerow.lang";

const subs = new Set<() => void>();
export function subscribeLang(f: () => void) { subs.add(f); return () => { subs.delete(f); }; }
export function setLang(l: Lang, persist = true) {
  if (persist) { try { localStorage.setItem(LANG_LS, l); } catch (e) {} }
  if (l === LANG) return;
  LANG = l; subs.forEach(f => { try { f(); } catch (e) {} });
}
/* boot: a saved choice wins; otherwise a brand-new visitor whose browser is Czech starts in Czech; everyone else stays English */
export function initLang(newVisitor: boolean, browserLang?: string) {
  let saved: string | null = null; try { saved = localStorage.getItem(LANG_LS); } catch (e) {}
  if (saved === "en" || saved === "cs") { LANG = saved; return; }
  const bl = browserLang ?? (typeof navigator !== "undefined" ? navigator.language || "" : "");
  LANG = newVisitor && /^(cs|sk)\b/i.test(bl) ? "cs" : "en";
}
/* tests */
export function setLangForTests(l: Lang) { LANG = l; }

const dict = (): Record<string, string | string[]> => (LANG === "cs" ? CS : {});
const strip = (k: string) => { const i = k.indexOf("|"); return i > 0 && i < 24 && !k.slice(0, i).includes(" ") ? k.slice(i + 1) : k; };
const fill = (s: string, v?: Vars) => (v ? s.replace(/\{(\w+)\}/g, (m, k) => (Object.prototype.hasOwnProperty.call(v, k) ? String(v[k]) : m)) : s);

export function t(k: string, v?: Vars): string {
  const d = dict()[k];
  return fill(typeof d === "string" ? d : strip(k), v);
}
const PR: Record<string, Intl.PluralRules> = {};
const rule = (l: Lang) => (PR[l] ||= new Intl.PluralRules(l));
/* n is also passed as {n} (formatted for the language) unless vars set it */
export function tn(n: number, one: string, other: string, v?: Vars): string {
  const vars: Vars = Object.assign({ n: num(n, Number.isInteger(n) ? 0 : 1) }, v || {});
  if (LANG === "cs") {
    const d = CS[one];
    if (Array.isArray(d)) {
      const c = rule("cs").select(n), s = c === "one" ? d[0] : c === "few" ? d[1] : c === "many" ? (d[3] ?? d[1]) : d[2];
      return fill(s, vars);
    }
  }
  return fill(strip(n === 1 ? one : other), vars);
}
/* returns one fragment (its parts are children, so React needs no keys) */
export function tx(k: string, v: Record<string, ReactNode>): ReactNode {
  const d = dict()[k], s = typeof d === "string" ? d : strip(k), out: ReactNode[] = [];
  let last = 0; const re = /\{(\w+)\}/g; let m: RegExpExecArray | null;
  while ((m = re.exec(s))) { if (m.index > last) out.push(s.slice(last, m.index)); out.push(Object.prototype.hasOwnProperty.call(v, m[1]) ? v[m[1]] : m[0]); last = m.index + m[0].length; }
  if (last < s.length) out.push(s.slice(last));
  return createElement(Fragment, null, ...out);
}

/* ---- numbers ---- */
/* x with d decimals (English: as String() / toFixed() give it; Czech: decimal comma) */
export const num = (x: number, d = 0) => { const s = d ? x.toFixed(d) : String(Math.round(x)); return LANG === "cs" ? s.replace(".", ",") : s; };
/* a number already formatted as text ("38.5", "3.2") */
export const dec = (s: string | number) => (LANG === "cs" ? String(s).replace(".", ",") : String(s));
/* "95.5%" → Czech "95,5 %" (input: the English text) */
export const pct = (s: string) => (LANG === "cs" ? s.replace(".", ",").replace(/%$/, " %") : s);
/* speed: English WPM; Czech úhozy za minutu = WPM × 5 (saved data stays in WPM) */
export const speedVal = (wpm: number) => (LANG === "cs" ? wpm * 5 : wpm);
export const speed = (wpm: number) => Math.round(speedVal(wpm));
export const speedUnit = () => (LANG === "cs" ? "úh./min" : "WPM");
export const speedTxt = (wpm: number) => speed(wpm) + " " + speedUnit();
/* the speed star: the rounded number the reader sees must reach the target they see (Czech: 68 úh./min never meets 70) */
export const meetsSpeed = (wpm: number, target: number) => (LANG === "cs" ? Math.round(wpm * 5) >= target * 5 : Math.round(wpm) >= target);

/* ---- dates ---- */
const MON_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"], DOW_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MON_CS = ["led", "úno", "bře", "dub", "kvě", "čvn", "čvc", "srp", "zář", "říj", "lis", "pro"], DOW_CS = ["ne", "po", "út", "st", "čt", "pá", "so"];
const MONTH_CS_GEN = ["ledna", "února", "března", "dubna", "května", "června", "července", "srpna", "září", "října", "listopadu", "prosince"];
const MONTH_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MONTH_CS = ["leden", "únor", "březen", "duben", "květen", "červen", "červenec", "srpen", "září", "říjen", "listopad", "prosinec"];
export const monthShort = (i: number) => (LANG === "cs" ? MON_CS : MON_EN)[i];
export const monthName = (i: number) => (LANG === "cs" ? MONTH_CS : MONTH_EN)[i];
export const dowShort = (i: number) => (LANG === "cs" ? DOW_CS : DOW_EN)[i];
/* "Wed 17 Jun" / "st 17. 6." */
export const dayLabel = (d: Date) => (LANG === "cs" ? DOW_CS[d.getDay()] + " " + d.getDate() + ". " + (d.getMonth() + 1) + "." : DOW_EN[d.getDay()] + " " + d.getDate() + " " + MON_EN[d.getMonth()]);
/* "17 June" / "17. června" */
export const dayMonth = (d: Date) => (LANG === "cs" ? d.getDate() + ". " + MONTH_CS_GEN[d.getMonth()] : d.getDate() + " " + MONTH_EN[d.getMonth()]);
/* "a, b and c" / "a, b a c" */
export const list = (a: string[]) => (a.length < 2 ? a.join("") : a.slice(0, -1).join(", ") + (LANG === "cs" ? " a " : " and ") + a[a.length - 1]);

/* ---- fingers and reaches ---- */
const FINGER_EN: Record<string, string> = { LP: "left pinky", LR: "left ring finger", LM: "left middle finger", LI: "left index finger", RI: "right index finger", RM: "right middle finger", RR: "right ring finger", RP: "right pinky", TH: "thumb" };
/* Czech: nominative ("levý malíček") and instrumental ("levým malíčkem": stiskni levým malíčkem) */
const FINGER_CS: Record<string, [string, string]> = {
  LP: ["levý malíček", "levým malíčkem"], LR: ["levý prsteníček", "levým prsteníčkem"], LM: ["levý prostředníček", "levým prostředníčkem"], LI: ["levý ukazováček", "levým ukazováčkem"],
  RI: ["pravý ukazováček", "pravým ukazováčkem"], RM: ["pravý prostředníček", "pravým prostředníčkem"], RR: ["pravý prsteníček", "pravým prsteníčkem"], RP: ["pravý malíček", "pravým malíčkem"], TH: ["palec", "palcem"],
};
export const finger = (f: string, form: "nom" | "ins" = "nom") => (LANG === "cs" ? (FINGER_CS[f] ? FINGER_CS[f][form === "ins" ? 1 : 0] : "") : FINGER_EN[f] || "");
/* reach() phrases ("up and in", "up two rows", "in place", "home key", "thumb") */
const REACH_CS: Record<string, string> = { up: "nahoru", "up two rows": "o dvě řady nahoru", down: "dolů", in: "dovnitř", out: "ven", "in place": "na místě", "home key": "základní klávesa", thumb: "palec" };
export const reachText = (phrase: string) => (LANG === "cs" ? phrase.split(" and ").map(p => REACH_CS[p] || p).join(" a ") : phrase);
