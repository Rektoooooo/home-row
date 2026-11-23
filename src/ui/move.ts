/* MOVE from the old address: dialog state (legacy app12.js showMove). The decisions live in core/move.ts. */
import { useSyncExternalStore } from "react";
import { S, notify } from "@/core/state";
import { MOVE, finishMove, moveNeeded, moveSummary } from "@/core/move";
import { reroute } from "@/lib/route";
import { checkMedal, showToast } from "./celebrate";
import { showWelcome, wlHasProgress } from "./welcome";

let M = { open: false, summary: "" };
const subs = new Set<() => void>();
const set = (p: Partial<typeof M>) => { M = { ...M, ...p }; subs.forEach(f => f()); };
export const useMove = () => useSyncExternalStore(f => { subs.add(f); return () => { subs.delete(f); }; }, () => M);

/* at the end of boot: asks only when there is something new to bring over (quiet on repeat) */
export function startMove() {
  if (!MOVE || !moveNeeded()) return;
  set({ open: true, summary: moveSummary() });
}
export function answerMove(yes: boolean) {
  finishMove(yes); set({ open: false });
  if (yes) {
    notify(); reroute();
    showToast({ icon: checkMedal(), title: "Progress moved", sub: "Everything from the old address is here." });
  } else if (!S.seenTips.welcome && !wlHasProgress()) showWelcome(1);
}
