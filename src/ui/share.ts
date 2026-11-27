/* SHARE dialog state (legacy app10.js openShare/shSave). Any screen calls openShare(card); <ShareDialog> renders it. */
import { useSyncExternalStore } from "react";
import { drawShareCard } from "@/core/shareCard";
import { getClaude } from "@/core/sync";
import { t } from "@/i18n";

export interface ShareState {
  open: boolean; card: any; phase: "making" | "ready" | "failed"; url: string; alt: string; msg: string; canSave: boolean; busy: boolean;
}
const idle: ShareState = { open: false, card: null, phase: "making", url: "", alt: "", msg: "", canSave: false, busy: false };
let SH: ShareState = idle, blob: Blob | null = null, dl: any = null, token = 0;
const subs = new Set<() => void>();
const set = (p: Partial<ShareState>) => { SH = { ...SH, ...p }; subs.forEach(f => f()); };
export const useShare = (): ShareState => useSyncExternalStore(f => { subs.add(f); return () => { subs.delete(f); }; }, () => SH);

export async function openShare(card: any) {
  const me = ++token; blob = null; dl = null;
  if (SH.url) URL.revokeObjectURL(SH.url);
  set({ open: true, card, phase: "making", url: "", alt: card.alt, msg: "", canSave: false, busy: false });
  /* the downloads capability, if this page has one (use() resolves null when it isn't available) */
  const c = getClaude();
  const dlP = c && typeof c.use === "function" ? Promise.resolve().then(() => c.use("downloads")).catch(() => null) : Promise.resolve(null);
  let b: Blob;
  try { b = await drawShareCard(card) as Blob; } catch (e) { if (token === me) set({ phase: "failed" }); return; }
  const d = await dlP;
  if (token !== me) return;
  blob = b; dl = d;
  const url = URL.createObjectURL(b);
  if (c && !d) set({ phase: "ready", url, msg: t("Right-click or long-press the image to save it."), canSave: false });
  else set({ phase: "ready", url, canSave: true });
}
export function closeShare() {
  token++; if (SH.url) URL.revokeObjectURL(SH.url);
  blob = null; dl = null; set({ ...idle });
}
export async function saveShare() {
  const card = SH.card; if (!blob || !card || SH.busy) return;
  set({ msg: "" });
  if (dl) {
    set({ busy: true });
    try { await dl.save({ filename: card.name, data: blob }); set({ msg: t("Saved.") }); }
    catch (e: any) { const code = e && e.code; if (code === "declined") { /* silent */ } else if (code === "rate_limited") set({ msg: t("Try again in a moment.") }); else set({ msg: t("Saving isn't available here.") }); }
    set({ busy: false });
  } else {
    const a = document.createElement("a"), u = URL.createObjectURL(blob); a.href = u; a.download = card.name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 1000);
  }
}
