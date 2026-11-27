/* COURSE: the English course (progress in S) or the Czech course (progress in SC, layout SC.csLayout).
   applyCourse() swaps the course bindings in data.ts; switchCourse() and setCsLayout() are what the UI calls. */
import { setCourseData, courseMeta, bigrams, EN_WL, EN_LESSONS, EN_BG, EN_BLOCK, EN_NB, EN_DEAD, EN_BADDEAD, EN_isLetter, EN_CO } from "./data";
import { CS_CORE, CS_MORE } from "./cs/words";
import { CS_BLOCK } from "./cs/extra";
import { csLessons, CS_LETTERS, CS_LETTER_RE, CS_NB } from "./cs/course";
import { S, SC, COURSE, setCOURSE, type CourseId } from "./state";
import { save, writeLocalCs, touchCs } from "./store";
import { resetCourseCaches } from "./generate";
import { hooks } from "./hooks";

const EN_DATA = { WL: EN_WL, LESSONS: EN_LESSONS, BG: EN_BG, BLOCK: EN_BLOCK, NB: EN_NB, DEAD: EN_DEAD, BADDEAD: EN_BADDEAD, isLetter: EN_isLetter, CO: EN_CO };

export const CS_WL: string[] = [...new Set([...CS_CORE, ...CS_MORE])];
const CS_BG = bigrams(CS_WL);
const CS_L = "[" + CS_LETTERS + "]";
const NEVER = /(?!)/;
const csData = (v: "qwertz" | "qwerty") => {
  const L = csLessons(v);
  return {
    WL: CS_WL, LESSONS: L, BG: CS_BG, BLOCK: CS_BLOCK, NB: CS_NB, DEAD: "", BADDEAD: NEVER, isLetter: (c?: any) => CS_LETTER_RE.test(c),
    CO: courseMeta("cs", L, { layout: v === "qwerty" ? "QWERTY" : "QWERTZ", letters: CS_LETTERS, home: "asdfjklů", marks: ",.-", joiner: "-", rare: "qwx", letterRe: new RegExp(CS_L), wordRe: new RegExp("^" + CS_L + "+$"),
      pairRe: new RegExp("^" + CS_L + "{2}$"), core: CS_CORE, code: false }),
  };
};
const CS_DATA = { qwertz: csData("qwertz"), qwerty: csData("qwerty") };
export const csVariant = (): "qwertz" | "qwerty" => (SC.csLayout === "qwerty" ? "qwerty" : "qwertz");

/* make data.ts follow COURSE and the Czech variant; generated-text caches belong to one course */
export function applyCourse() {
  setCourseData(COURSE === "cs" ? CS_DATA[csVariant()] : EN_DATA);
  resetCourseCaches();
}
/* boot and account load: the Czech store says whether it is the active course */
export function courseFromStore() { setCOURSE(SC.on ? "cs" : "en"); applyCourse(); }

export function switchCourse(c: CourseId) {
  if (c === COURSE) return;
  setCOURSE(c); SC.on = c === "cs"; SC.settingsAt = Date.now();
  writeLocalCs(); touchCs(); applyCourse(); save(); hooks.courseChanged();
}
export function setCsLayout(v: "qwertz" | "qwerty") {
  if (SC.csLayout === v) return;
  SC.csLayout = v; SC.settingsAt = Date.now();
  writeLocalCs(); touchCs(); applyCourse(); save(); hooks.courseChanged();
}
/* for tests */
export const courseState = () => ({ course: COURSE, on: SC.on, csLayout: SC.csLayout, layout: S.settings.layout });
