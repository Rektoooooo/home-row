/* The weekly coach row of Settings (legacy app8b.js syncWeeklyUI): which text or switch shows, from sync.ts state. */
import { SAMPLE, coachOff, WK, getClaude } from "@/core/sync";
import { t } from "@/i18n";

export function weeklyView() {
  const gone = coachOff, none = !SAMPLE && !gone;
  return {
    available: !none && !gone,
    off: gone ? t("Claude isn't available for this page.") : getClaude() ? t("Available on the published link.") : t("Available when Home Row runs inside Claude."),
    msg: gone ? "" : WK.msg,
  };
}
