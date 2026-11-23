/* results / step-done screens: numeric .pstat .num values count up from 0 over 500 ms (REW-29); skipped under reduced motion */
import { reduceMotion } from "./engine";

export function countUp(root: ParentNode = document) {
  if (reduceMotion()) return;
  const items = [...root.querySelectorAll("#view .result .pstat .num")].filter(e => /\d/.test(e.textContent || "") && !/:/.test(e.textContent || "")).map(e => ({ e, f: e.textContent || "" }));
  if (!items.length) return;
  const t0 = performance.now(), D = 500;
  const step = (t: number) => {
    const p = Math.min(1, (t - t0) / D), k = 1 - Math.pow(1 - p, 3);
    items.forEach(it => { if (it.e.isConnected) it.e.textContent = p >= 1 ? it.f : it.f.replace(/\d+(?:\.\d+)?/g, n => n.includes(".") ? (+n * k).toFixed(1) : String(Math.round(+n * k))); });
    if (p < 1) requestAnimationFrame(step);
  };
  step(t0); requestAnimationFrame(step);
}
