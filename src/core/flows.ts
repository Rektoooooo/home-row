/* FLOW GLUE for Practice, Test and Today's session: the data parts of legacy startRound / testDone / startSession / stepFinished
   (legacy/src/app5.js, app7.js, app11.js). No DOM here; the views in src/views render what these return. */
import { S } from "./state";
import { lessonDone, poolLetters, keyWpm, applyTestResult, sumRes, wpmCalc } from "./stats";
import { chooseFocus, focusStat, genPractice, pOpts, setPRI, niceStep, testChunk, POOL_NAME, paceFor } from "./generate";
import { rewardsTest, liveCheck } from "./rewards";
import { charInfo, LESSONS } from "./data";

export { sumRes };

/* ---- Practice rounds ---- */
/* startRound(o): null when there is nothing to practise; o.focus / o.text override the chosen focus and the generated text */
export function prepRound(o: any = {}) {
  const pool = poolLetters(); if (!pool.length) return null;
  const focus: string = o.focus || chooseFocus(pool, o.avoid), before = keyWpm(focusStat(focus));
  const text: string = o.text || genPractice(pool, focus, pOpts());
  setPRI({ text, focus });
  return { focus, before, text };
}
/* what an adaptive round does when it ends: practice best, achievements, and the before/after chip data */
export function finishRound(res: any, focus: string, before: number | null) {
  S.bests.practice = Math.max(S.bests.practice || 0, res.wpm); liveCheck(false);
  return { wpm: res.wpm, acc: res.acc, ms: res.ms, focus, before, after: keyWpm(focusStat(focus)) };
}

/* ---- Test ---- */
export interface TestCfg { pool: string; caps: boolean; punct: boolean; nums: boolean }
export const testOptsFromSettings = (): TestCfg => { const st = S.settings; return { pool: st.tPool, caps: st.tCaps, punct: st.tPunct, nums: st.tNums }; };
export { testChunk, POOL_NAME, paceFor };
/* testDone (not baseline): record, best, rewards. Returns isBest */
export function recordTest(res: any, dur: number, o: TestCfg) {
  const isBest = applyTestResult(res, dur, o);
  rewardsTest(res, dur, o, isBest);
  return isBest;
}

/* the "Speed during the test" chart: geometry for the SVG, ported from legacy testDone */
export function testChart(res: any, dur: number) {
  const pts = res.secs.map((c: number, i: number) => ({ sec: i + 1, wpm: c / 5 / ((i + 1) / 60) }));
  const miss: Record<number, number> = {};
  res.missAt.forEach((s: number) => { const k = Math.min(dur, Math.max(1, s)); miss[k] = (miss[k] || 0) + 1; });
  const W = 640, H = 250, L = 38, R = 54, T = 14, B = 28, pw_ = W - L - R, ph = H - T - B;
  const mxv = Math.max(10, ...pts.map((p: any) => p.wpm)), step = niceStep(mxv, 4), ymax = Math.ceil(mxv / step) * step;
  const X = (s: number) => L + (dur <= 1 ? 0 : (s - 1) / (dur - 1)) * pw_, Y = (v: number) => T + ph - (v / ymax) * ph;
  const xs = dur === 15 ? 5 : dur === 30 ? 10 : dur === 60 ? 15 : 30;
  const yTicks: { v: number; y: number }[] = []; for (let v = 0; v <= ymax; v += step) yTicks.push({ v, y: Y(v) });
  const xTicks: { s: number; x: number }[] = []; for (let s = xs; s <= dur; s += xs) xTicks.push({ s, x: X(s) });
  const line = pts.map((p: any, i: number) => (i ? "L" : "M") + X(p.sec).toFixed(1) + " " + Y(p.wpm).toFixed(1)).join(" ");
  const area = line + " L" + X(dur).toFixed(1) + " " + Y(0) + " L" + X(1).toFixed(1) + " " + Y(0) + " Z";
  const last = pts[pts.length - 1] || { sec: 1, wpm: 0 };
  const marks: string[] = [];
  for (const s in miss) { const p = pts[+s - 1]; if (!p) continue; const x = X(+s), y = Y(p.wpm) - 9; marks.push("M" + (x - 3.5) + " " + (y - 3.5) + "l7 7m0-7l-7 7"); }
  const tpts = pts.map((p: any) => ({ x: X(p.sec), y: Y(p.wpm), text: p.sec + " s · " + Math.round(p.wpm) + " WPM" + (miss[p.sec] ? " · " + miss[p.sec] + (miss[p.sec] === 1 ? " mistake" : " mistakes") : "") }));
  return { W, H, T, ph, L, R, yTicks, xTicks, line, area, last, lastX: X(last.sec), lastY: Y(last.wpm), marks, tpts,
    label: "Line chart of your speed during the test. It ends at " + Math.round(last.wpm) + " words per minute after " + dur + " seconds, with " + res.mistakes + " mistakes." };
}

/* ---- Today's session ---- */
export interface SessionStep { id: "warm" | "lesson" | "extra" | "practice" | "test" | "review"; label: string; rounds?: number; n?: number }
export interface Session { steps: SessionStep[]; i: number; round: number; rs: any[]; all: any[]; focus: any[] }
export { buildSteps } from "./stats";
/* the "most improved" key of a finished session (largest gain), or null */
export function mostImproved(focus: any[]) {
  let best: any = null;
  focus.forEach(f => { if (f.before != null && f.after != null && f.after > f.before && (!best || f.after - f.before > best.after - best.before)) best = f; });
  return best;
}
/* the focus the next round will most likely use (for the "Up next" card) */
export function predictFocus(avoid: string[]) { const pool = poolLetters(); return pool.length ? chooseFocus(pool, avoid) : ""; }
export const lessonCaps = (n: number) => { const L = LESSONS[n - 1]; return L.shift ? ["shift"] : (L.keys as string[]); };
export { lessonDone, charInfo, wpmCalc };
