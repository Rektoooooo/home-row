/* WELCOME state (legacy/src/app9.js: WEL, showWelcome, wlFinish, wlCheck, the status hook). A module store so the status hook
   can open the welcome before React has mounted; <Welcome> renders it. */
import { useSyncExternalStore } from "react";
import { S, C, SC, COURSE } from "@/core/state";
import { switchCourse, setCsLayout } from "@/core/course";
import { save, writeLocal } from "@/core/store";
import { hasProgress } from "@/core/stats";
import { statusHooks } from "@/core/sync";
import * as moveMod from "@/core/move";
import { goLesson, navigate } from "@/lib/route";
import { stopExercise } from "./engine";
import { rebuildKeyboards } from "./keyboard";
import { soundPreview } from "@/core/sound";
import { notify } from "@/core/state";

export interface Wel { open: boolean; step: number; layout: string; goal: number; sound: string; sound0: string; soundSeen: boolean; res: { wpm: number; acc: number } | null; checking: boolean }
let W: Wel = { open: false, step: 1, layout: "iso", goal: 15, sound: "cream", sound0: "off", soundSeen: false, res: null, checking: false };
const subs = new Set<() => void>();
const set = (p: Partial<Wel>) => { W = { ...W, ...p }; subs.forEach(f => f()); };
export const getWelcome = () => W;
export const useWelcome = (): Wel => useSyncExternalStore(f => { subs.add(f); return () => { subs.delete(f); }; }, () => W);

export const wlSound0 = () => S.settings.soundPack && S.settings.soundPack !== "off" ? S.settings.soundPack : "cream";
export const wlHasProgress = hasProgress;

export function showWelcome(step: number) {
  stopExercise();
  if (step === 1) set({ layout: S.settings.layout, goal: S.settings.goal, sound: wlSound0(), sound0: S.settings.soundPack, soundSeen: false, res: null });
  set({ open: true, checking: false, step, soundSeen: step === 4 ? true : W.soundSeen });
}
export function wlStep(step: number) { set({ step, soundSeen: step === 4 ? true : W.soundSeen }); }
/* the keyboard the computer types with: "en" (U.S., English course) or "cs-qwertz" / "cs-qwerty" (Czech course).
   Applied at once, so the typing check already uses the chosen course's words */
export const wlCourse = () => (COURSE === "cs" ? (SC.csLayout === "qwerty" ? "cs-qwerty" : "cs-qwertz") : "en");
export function wlPick(g: "layout" | "goal" | "sound" | "course", v: string | number) {
  if (g === "course") { if (v === "en") switchCourse("en"); else { setCsLayout(v === "cs-qwerty" ? "qwerty" : "qwertz"); switchCourse("cs"); } set({}); }
  else if (g === "layout") set({ layout: v as string });
  else if (g === "goal") set({ goal: Number(v) });
  else { set({ sound: v as string }); if (v !== "off") soundPreview(v); }
}
/* leaves the welcome. dest: "lesson" opens lesson 1's intro, anything else goes to Learn */
export function wlFinish(dest: "lesson" | "learn") {
  const st = S.settings; let ch = false, layoutCh = false;
  if (st.layout !== W.layout) { st.layout = W.layout; ch = true; layoutCh = true; }
  if (st.goal !== W.goal) { st.goal = W.goal; ch = true; }
  if (W.soundSeen && (st.soundPack !== W.sound || W.sound !== W.sound0)) { st.soundPack = W.sound; st.sound = W.sound !== "off"; ch = true; }
  if (ch) S.settingsAt = Date.now();
  S.seenTips.welcome = true; save();
  set({ open: false, checking: false });
  if (layoutCh) rebuildKeyboards();
  if (ch) notify();
  if (dest === "lesson") goLesson(1); else navigate("learn");
}
/* step 5 -> the isolated 60 s typing check, shown in the main area by <App> */
export function wlCheck() {
  if (W.soundSeen) { S.settings.soundPack = W.sound; S.settings.sound = W.sound !== "off"; }
  set({ open: false, checking: true });
}
export function wlCheckBack() { set({ open: true, checking: false, step: 5 }); }
export function wlCheckDone(res: any) {
  if (!C().baseline && res.wpm > 0) C().baseline = { wpm: Math.round(res.wpm * 10) / 10, acc: res.acc, ts: Date.now() };
  set({ res: { wpm: res.wpm, acc: res.acc }, open: true, checking: false, step: 6 });
}
export function wlAbandonCheck() { if (W.checking) set({ checking: false }); }

/* the welcome opens by itself once the save status settles, and only for someone with no progress */
let checked = false;
export function installWelcomeHook() {
  statusHooks.push((s: any) => {
    if (checked || s === "connecting") return; checked = true;
    if (S.seenTips.welcome || moveMod.MOVE) return;
    if (wlHasProgress()) { S.seenTips.welcome = true; writeLocal(); return; }
    showWelcome(1);
  });
}
