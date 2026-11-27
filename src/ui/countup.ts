/* results / step-done screens: numeric .pstat .num values count up from 0 over 500 ms (REW-29); skipped under reduced motion */
import { reduceMotion } from "./engine";

export function countUp(root: ParentNode = document) {
  if (reduceMotion()) return;
  /* the final text is kept on the element, so a second start (React's dev double effect) animates to it and not to the 0 the first one wrote */
  const items = [...root.querySelectorAll("#view .result .pstat .num")].filter(e => /\d/.test(e.textContent || "") && !/:/.test(e.textContent || ""))
    .map(e => { const el = e as HTMLElement, f = el.dataset.cuFinal ?? (e.textContent || ""); el.dataset.cuFinal = f; return { e, f }; });
  if (!items.length) return;
  const t0 = performance.now(), D = 500;
  const step = (t: number) => {
    const p = Math.min(1, (t - t0) / D), k = 1 - Math.pow(1 - p, 3);
    if (p >= 1) items.forEach(it => { delete (it.e as HTMLElement).dataset.cuFinal; });
    items.forEach(it => { if (it.e.isConnected) it.e.textContent = p >= 1 ? it.f : it.f.replace(/\d+(?:[.,]\d+)?/g, n => /[.,]/.test(n) ? (+n.replace(",", ".") * k).toFixed(1).replace(".", n.includes(",") ? "," : ".") : String(Math.round(+n * k))); });
    if (p < 1) requestAnimationFrame(step);
  };
  step(t0); requestAnimationFrame(step);
}
