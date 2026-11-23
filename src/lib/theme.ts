/* Theme. claude.ai sets data-theme="dark" | "light" on <html> when the viewer picks a theme and nothing for "system"; the website
   has no attribute, so the system setting decides. Like legacy (app4.js) the Settings dialog can override that per browser
   (localStorage "homerow.theme"); the choice writes data-theme itself, and the shadcn `.dark` class follows the attribute. */
import { useSyncExternalStore } from "react";

export type ThemePref = "system" | "light" | "dark";
const THEME_KEY = "homerow.theme";
let pref: ThemePref = "system";
let hostTheme: string | null = null, written: string | null = null;
const subs = new Set<() => void>();

function readPref() { try { const v = localStorage.getItem(THEME_KEY); if (v === "light" || v === "dark") pref = v; } catch (e) {} }
function applyAttr() {
  const root = document.documentElement, want = pref === "system" ? hostTheme : pref;
  written = want;
  if (want) root.setAttribute("data-theme", want); else root.removeAttribute("data-theme");
}
function applyClass() {
  const root = document.documentElement, mq = window.matchMedia("(prefers-color-scheme: dark)");
  const t = root.getAttribute("data-theme"), dark = t === "dark" || (t !== "light" && mq.matches);
  root.classList.toggle("dark", dark);
  root.style.colorScheme = dark ? "dark" : "light";
}
export function setThemePref(v: ThemePref) {
  pref = v === "light" || v === "dark" ? v : "system";
  try { if (pref === "system") localStorage.removeItem(THEME_KEY); else localStorage.setItem(THEME_KEY, pref); } catch (e) {}
  applyAttr(); applyClass(); subs.forEach(f => f());
}
export const useThemePref = (): ThemePref => useSyncExternalStore(f => { subs.add(f); return () => { subs.delete(f); }; }, () => pref);

export function watchTheme(): () => void {
  const root = document.documentElement;
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  readPref(); hostTheme = root.getAttribute("data-theme"); applyAttr(); applyClass();
  mq.addEventListener("change", applyClass);
  const mo = new MutationObserver(() => {
    const now = root.getAttribute("data-theme");
    if (now !== written) { hostTheme = now; if (pref !== "system") applyAttr(); else written = now; }
    applyClass();
  });
  mo.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
  return () => { mq.removeEventListener("change", applyClass); mo.disconnect(); };
}
