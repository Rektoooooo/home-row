/* A screen change like legacy setView (app4.js): scroll to the top and, on a fresh screen (TAB|kind differs from the last one),
   fade the view in. A stage (legacy mountStage) only records itself: it neither scrolls nor fades. Re-rendering the same screen
   (a toggle, a shuffle) never calls this again, so the scroll offset stays. `key` forces another screen change within one kind. */
import { useLayoutEffect } from "react";
import { currentTab } from "@/lib/route";
import { reduceMotion } from "@/ui/engine";

let VK = "";
export const toTop = () => window.scrollTo(0, 0);

export function useScreen(kind: string, key: string = kind) {
  useLayoutEffect(() => {
    const k = currentTab() + "|" + kind, fresh = k !== VK; VK = k;
    if (kind === "stage") return;
    toTop();
    const view = document.getElementById("view");
    if (fresh && view && !reduceMotion()) { view.classList.remove("view-in"); void view.offsetWidth; view.classList.add("view-in"); }
  }, [kind, key]);
}

/* mount one where a screen starts (the markup of a screen carries it; a screen that is only re-rendered does not run it again) */
export function Screen({ kind, k }: { kind: string; k?: string }) { useScreen(kind, k); return null; }
