/* Hash routing exactly as legacy (app4.js route, app6.js): #learn #practice #test #progress #coach #guide, unknown → learn.
   Clicking the tab you are on (or learn with an empty hash) re-routes, i.e. resets the screen. */
import { useSyncExternalStore } from "react";

export const TABS = ["learn", "practice", "test", "progress", "coach", "guide"] as const;
export type Tab = (typeof TABS)[number];

export function currentTab(): Tab {
  const h = (location.hash || "").replace(/^#/, "");
  return (TABS as readonly string[]).includes(h) ? (h as Tab) : "learn";
}

let nonce = 0;
const subs = new Set<() => void>();
const emit = () => { nonce++; subs.forEach(f => f()); };
let wired = false;
const subscribe = (f: () => void) => {
  if (!wired) { wired = true; window.addEventListener("hashchange", emit); }
  subs.add(f); return () => { subs.delete(f); };
};
/* `nonce` changes on every route, so screens keyed on it start fresh (legacy: RUN=null, SESSION=null) */
export function useRoute() {
  const n = useSyncExternalStore(subscribe, () => nonce);
  return { tab: currentTab(), nonce: n };
}
export function reroute() { emit(); }
export function navigate(tab: Tab | string) {
  const h = "#" + tab;
  if (location.hash === h || (!location.hash && tab === "learn")) reroute(); else location.hash = tab;
}

/* action "go-lesson": open a lesson's intro on Learn (legacy PENDING) */
let pending = 0;
export function goLesson(n: number) { pending = n; if (location.hash !== "#learn") location.hash = "learn"; else reroute(); }
export function takePending() { const n = pending; pending = 0; return n; }
