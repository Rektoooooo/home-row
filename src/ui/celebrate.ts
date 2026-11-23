/* Toasts, confetti and the live-update hooks the core calls (legacy/src/app10.js toast, confetti, viewHook).
   Toasts are shadcn Sonner custom toasts that carry the legacy `.toast` look; confetti is the legacy canvas burst. */
import { createElement } from "react";
import { toast } from "sonner";
import { setHooks } from "@/core/hooks";
import { notify } from "@/core/state";
import { takeCelebrate, aico } from "@/core/rewards";
import { rebuildKeyboards } from "./keyboard";
import { reduceMotion } from "./engine";

export const TOAST_MS = 4500;
export interface ToastOpts { icon?: string; title: string; sub?: string }

/* medal icons are small trusted SVG strings built by the core (rewards.ts); title and sub are plain text */
export function showToast(o: ToastOpts) {
  toast.custom(() => createElement("div", { className: "toast" + (reduceMotion() ? " pulse" : ""), role: "status", "aria-live": "polite" },
    o.icon ? createElement("span", { className: "toast-ic", dangerouslySetInnerHTML: { __html: o.icon } }) : null,
    createElement("div", { className: "toast-t" }, createElement("b", null, o.title), o.sub ? createElement("span", null, o.sub) : null)),
  { duration: TOAST_MS });
}
export const checkMedal = () => '<span class="medal" style="--ac:var(--ok);width:36px;height:36px"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>';
export { aico };

export function confetti() {
  if (reduceMotion()) return;
  const app = document.getElementById("app"); if (!app) return;
  const pn = document.querySelector("#view .panel"), r: any = pn ? pn.getBoundingClientRect() : { left: 0, width: innerWidth, top: innerHeight * .25 };
  const ox = r.left + r.width / 2, oy = Math.max(48, Math.min(innerHeight * .5, r.top + 20));
  const cs = getComputedStyle(document.documentElement), cols = ["--f-pinky", "--f-ring", "--f-middle", "--f-index", "--f-thumb"].map(n => cs.getPropertyValue(n).trim());
  const cv = document.createElement("canvas"), dpr = Math.min(2, window.devicePixelRatio || 1), W = innerWidth, H = innerHeight;
  cv.className = "confetti"; cv.width = W * dpr; cv.height = H * dpr; cv.setAttribute("aria-hidden", "true"); app.appendChild(cv);
  const c = cv.getContext("2d")!; c.scale(dpr, dpr);
  const ps: any[] = []; for (let i = 0; i < 80; i++) {
    const a = -Math.PI / 2 + (Math.random() - .5) * 1.5, v = 380 + Math.random() * 520;
    ps.push({ x: ox + (Math.random() - .5) * 60, y: oy, vx: Math.cos(a) * v, vy: Math.sin(a) * v, s: 5 + Math.random() * 5, col: cols[i % 5], r: Math.random() * 6.28, vr: (Math.random() - .5) * 14 });
  }
  const t0 = performance.now(); let last = t0;
  const step = (t: number) => {
    const e = (t - t0) / 1000, dt = Math.min(.05, (t - last) / 1000); last = t;
    if (e >= 1.1 || !cv.isConnected) { cv.remove(); return; }
    c.clearRect(0, 0, W, H);
    ps.forEach(p => {
      p.vy += 1500 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt;
      c.save(); c.globalAlpha = Math.max(0, Math.min(1, (1.1 - e) / .4)); c.translate(p.x, p.y); c.rotate(p.r); c.fillStyle = p.col; c.fillRect(-p.s / 2, -p.s / 3, p.s, p.s * .6); c.restore();
    });
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/* weekly coach switch / message: Settings re-reads sync.ts when this counter changes */
let weeklyVer = 0; const weeklySubs = new Set<() => void>();
export const subscribeWeekly = (f: () => void) => { weeklySubs.add(f); return () => { weeklySubs.delete(f); }; };
export const weeklyVersion = () => weeklyVer;

/* the core's side effects go to the React UI */
export function installUiHooks() {
  setHooks({
    toast: showToast,
    renderRing: () => notify(),
    achBooted: () => notify(),
    syncWeeklyUI: () => { weeklyVer++; weeklySubs.forEach(f => f()); },
    onRemoteApplied: () => { notify(); rebuildKeyboards(); },
  });
}

/* confetti when a result screen shows up right after a celebration was requested (legacy: viewHook after setView) */
export function watchCelebrate(): () => void {
  const view = document.getElementById("view"); if (!view) return () => {};
  const hit = (n: Node) => n.nodeType === 1 && ((n as Element).matches(".result") || !!(n as Element).querySelector(".result"));
  const mo = new MutationObserver(ms => {
    if (!ms.some(m => [...m.addedNodes].some(hit))) return;
    if (takeCelebrate()) requestAnimationFrame(confetti);
  });
  mo.observe(view, { childList: true, subtree: true });
  return () => mo.disconnect();
}
