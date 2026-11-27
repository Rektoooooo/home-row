/* MOVE from the old address.  Ported from legacy/src/app12.js. The DOM dialog is the UI's job; the decisions live here. */
import { EN_LESSONS as LESSONS } from "./data";
import { S, setS } from "./state";
import { LSK, sanitize, merge, stable, save, isObj, fin } from "./store";
import { COACH_LS, sanitizeCoach, clone } from "./coach";
import { COACH, COACH_RAW, applyCoachRaw } from "./sync";

export const OLD_HOST="home-row-lime.vercel.app",NEW_APP="https://homerow.sebthe.dev/app/";
export let MOVE: any = null;
export function setMOVE(v: any) { MOVE = v; }

/* the fragment the old address forwards: "#move=" + the raw saved progress and coach doc (never sent to a server) */
export function buildMoveFragment(storage: any) {
  let frag = "";
  try {
    const s = storage.getItem(LSK), c = storage.getItem(COACH_LS);
    if (s || c) frag = "#move=" + encodeURIComponent(JSON.stringify({ s: s ? JSON.parse(s) : null, c: c ? JSON.parse(c) : null }));
  } catch (e) {}
  return frag;
}
/* on the old host: replace the address with the new one plus the payload. Returns true when it forwards. loc/storage are injectable. */
export function forwardFromOldHost(loc: any = (globalThis as any).location, storage: any = (globalThis as any).localStorage) {
  if (loc.hostname !== OLD_HOST) return false;
  const frag = buildMoveFragment(storage);
  loc.replace(NEW_APP + frag);
  return true;
}
/* parses a "#move=…" hash into MOVE (or null) */
export function parseMove(hash: string) {
  let m: any = null;
  if (hash.indexOf("#move=") !== 0) return null;
  try {
    const o = JSON.parse(decodeURIComponent(hash.slice(6)));
    if (isObj(o)) {
      const s = o.s ? sanitize(o.s) : null, c = isObj(o.c) ? sanitizeCoach(o.c) : null;
      const lessons = s ? LESSONS.filter(l => s.lessons[l.n] && s.lessons[l.n].done).length : 0;
      const mins = s ? Math.round(Object.values(s.days).reduce((a: any, d: any) => a + (fin(d.ms) ? d.ms : 0), 0) as number / 60000) : 0;
      const coach = c ? c.lessons.length : 0;
      if (lessons || mins || (s && s.tests.length) || coach) m = { s, c: coach ? o.c : null, lessons, mins, coach };
    }
  } catch (e) {}
  return m;
}
/* reads #move=… once and removes it from the address bar */
export function readMove(loc: any = (globalThis as any).location, hist: any = (globalThis as any).history) {
  if (loc.hash.indexOf("#move=") !== 0) return;
  MOVE = parseMove(loc.hash);
  try { hist.replaceState(null, "", loc.pathname + loc.search + "#learn"); } catch (e) {}
}
export function moveSummary(M: any = MOVE) {
  const p = [];
  if (M.lessons) p.push(M.lessons + (M.lessons === 1 ? " lesson" : " lessons") + " passed");
  if (M.mins) p.push(M.mins + (M.mins === 1 ? " minute" : " minutes") + " of practice");
  if (M.coach) p.push(M.coach + (M.coach === 1 ? " lesson" : " lessons") + " from Claude");
  return p.length > 1 ? p.slice(0, -1).join(", ") + " and " + p[p.length - 1] : p[0] || "your progress";
}
/* showMove's question gate: false when everything is already here (the old link was opened again), and MOVE is cleared */
export function moveNeeded() {
  if (!MOVE) return false;
  const have = new Set((COACH.lessons || []).map((l: any) => l.id)), newCoach = MOVE.c && (MOVE.c.lessons || []).some((l: any) => isObj(l) && !have.has(l.id));
  if (!newCoach && (!MOVE.s || stable(merge(S, MOVE.s)) === stable(merge(S, S)))) { MOVE = null; return false; }
  return true;
}
/* "Bring it over" (yes) or "Not now" (no): the data part of the dialog's done(yes). Returns what was moved. */
export function finishMove(yes: boolean) {
  const m = MOVE; MOVE = null;
  if (yes && m) {
    if (m.s) { setS(merge(S, m.s)); save(); }
    if (m.c) {
      const cur: any = isObj(COACH_RAW) ? clone(COACH_RAW) : {}, ids = new Set((Array.isArray(cur.lessons) ? cur.lessons : []).map((l: any) => isObj(l) && l.id));
      cur.lessons = (Array.isArray(cur.lessons) ? cur.lessons : []).concat((m.c.lessons || []).filter((l: any) => isObj(l) && !ids.has(l.id))).slice(0, 20);
      if (!cur.note && m.c.note) cur.note = m.c.note;
      applyCoachRaw(cur, true);
    }
  }
  return m;
}
