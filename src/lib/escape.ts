import { useEffect } from "react";
import { nav } from "@/ui/engine";

/* the screen's Esc action (legacy UI.escape): runs on Escape outside a stage and with no dialog open */
export function useEscape(fn: (() => void) | null) {
  useEffect(() => {
    nav.escape = fn;
    return () => { if (nav.escape === fn) nav.escape = null; };
  }, [fn]);
}
