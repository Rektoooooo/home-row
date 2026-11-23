/* The weekly coach row of Settings (legacy app8b.js syncWeeklyUI): which text or switch shows, from sync.ts state. */
import { SAMPLE, coachOff, WK, WK_GONE, getClaude } from "@/core/sync";

export function weeklyView() {
  const gone = coachOff || WK.msg === WK_GONE, none = !SAMPLE && !gone;
  return {
    available: !none && !gone,
    off: gone ? WK_GONE : getClaude() ? "Available on the published link." : "Available when Home Row runs inside Claude.",
    msg: gone ? "" : WK.msg,
  };
}
