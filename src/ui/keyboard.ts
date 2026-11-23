/* KEYBOARD + HANDS SVG: imperative builders ported from legacy/src/app2.js (keySVG, makeKeyboard, makeHands).
   Built once into an <svg> and updated through set/press/err/setHeat; never re-rendered per keystroke.
   React wraps these in components/Keyboard.tsx. */
import { LAY, fcol, esc } from "@/core/data";

const U = 60, G = 3;
let KSID = "ks0", KSN = 0; /* the sheen gradient id of the keyboard being built */

function keySVG(k: any) {
  const x = k.x * U, y = k.row * U, w = k.w * U, h = U - 2 * G;
  const cls = ["key"]; if (k.mod && !k.sh) cls.push("mod");
  const style = k.f && k.f !== "-" ? 'style="--fc:' + fcol(k.f) + '"' : "";
  let shape, edge, txt = "";
  if (k.L) {
    const x0 = x + G, x1 = x + w - G, xm = x + G + .25 * U, yt = y + G, yn = y + U - G, yb = y + 2 * U - G, r = 8;
    const d = "M" + (x0 + r) + "," + yt + " H" + (x1 - r) + " Q" + x1 + "," + yt + " " + x1 + "," + (yt + r) + " V" + (yb - r) + " Q" + x1 + "," + yb + " " + (x1 - r) + "," + yb + " H" + (xm + r) + " Q" + xm + "," + yb + " " + xm + "," + (yb - r) + " V" + (yn + r) + " Q" + xm + "," + yn + " " + (xm - r) + "," + yn + " H" + (x0 + r) + " Q" + x0 + "," + yn + " " + x0 + "," + (yn - r) + " V" + (yt + r) + " Q" + x0 + "," + yt + " " + (x0 + r) + "," + yt + " Z";
    shape = '<path class="cap" d="' + d + '"/><path class="shine" d="' + d + '" fill="url(#' + KSID + ')"/>'; edge = '<path class="edge" d="' + d + '" transform="translate(0,3)"/>';
    txt = '<text class="ml" x="' + (x + w - G - 9) + '" y="' + (y + 2 * U - G - 9) + '" text-anchor="end">return</text>';
  } else {
    shape = '<rect class="cap" x="' + (x + G) + '" y="' + (y + G) + '" width="' + (w - 2 * G) + '" height="' + h + '" rx="9"/><rect class="shine" x="' + (x + G) + '" y="' + (y + G) + '" width="' + (w - 2 * G) + '" height="' + h + '" rx="9" fill="url(#' + KSID + ')"/>';
    edge = '<rect class="edge" x="' + (x + G) + '" y="' + (y + G + 3) + '" width="' + (w - 2 * G) + '" height="' + h + '" rx="9"/>';
    if (k.mod) {
      const a = k.a === "e" ? "end" : k.a === "c" ? "middle" : "start", tx = k.a === "e" ? x + w - G - 9 : k.a === "c" ? x + w / 2 : x + G + 9;
      txt = '<text class="ml" x="' + tx + '" y="' + (y + G + h - 8) + '" text-anchor="' + a + '">' + esc(k.mod) + '</text>';
    } else if (k.sh && typeof k.sh === "string" && !/^[A-Z]$/.test(k.sh)) {
      txt = '<text class="sl" x="' + (x + G + 10) + '" y="' + (y + G + 20) + '">' + esc(k.sh) + '</text><text class="bl" x="' + (x + G + 10) + '" y="' + (y + G + 43) + '">' + esc(k.base) + '</text>';
    } else if (k.base && !k.space) { txt = '<text class="lg" x="' + (x + w / 2) + '" y="' + (y + G + h / 2 + 9) + '" text-anchor="middle">' + esc(k.base.toUpperCase()) + '</text>'; }
  }
  txt = txt.replace(/<text /g, '<text aria-hidden="true" ');
  if (k.base && !k.space && !k.L) txt += '<text class="hv" aria-hidden="true" x="' + (x + w / 2) + '" y="' + (y + G + h - 7) + '" text-anchor="middle"></text>';
  const bump = (k.id === "KeyF" || k.id === "KeyJ") ? '<rect class="bump" x="' + (x + w / 2 - 9) + '" y="' + (y + G + h - 10) + '" width="18" height="3" rx="1.5"/>' : "";
  const ring = k.L ? "" : '<rect class="ring" x="' + (x + G) + '" y="' + (y + G) + '" width="' + (w - 2 * G) + '" height="' + h + '" rx="8"/>';
  return '<g class="' + cls.join(" ") + '" data-id="' + k.id + '" ' + style + '>' + edge + '<g class="top">' + shape + txt + bump + ring + '</g></g>';
}

export type KbMode = "stage" | "map" | "heat" | "fingers";
export interface Keyboard {
  svg: SVGSVGElement;
  st: { next: string[]; learned: string[]; upnext: string[] };
  build(): void;
  set(o: Partial<Keyboard["st"]>): void;
  setHeat(m: any): void;
  press(id: string): void;
  err(id: string): void;
  destroy(): void;
}

/* every live keyboard, so a layout switch (ISO/ANSI) can rebuild them all (KB-11) */
const KBS = new Set<Keyboard>();
export function rebuildKeyboards() { KBS.forEach(k => k.build()); }

export function makeKeyboard(svg: SVGSVGElement, mode: KbMode): Keyboard {
  let els: Record<string, Element> = {};
  const timers: Record<string, any> = {};
  const c: Keyboard = {
    svg, st: { next: [], learned: [], upnext: [] },
    build() {
      const lay = LAY(); svg.setAttribute("viewBox", "0 0 900 304"); svg.setAttribute("data-mode", mode);
      KSID = "ks" + (++KSN);
      svg.innerHTML = '<defs><linearGradient id="' + KSID + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".75"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>' + lay.keys.map(keySVG).join("");
      els = {};
      svg.querySelectorAll(".key").forEach(g => { els[g.getAttribute("data-id")!] = g; });
      apply();
    },
    set(o) { Object.assign(c.st, o); apply(); },
    setHeat(m) {
      for (const id in els) {
        const g = els[id] as SVGGElement, d = m && m[id];
        g.classList.toggle("has", !!d); g.classList.toggle("hot", !!(d && d.hot));
        if (d) g.style.setProperty("--hp", d.pct.toFixed(0) + "%"); else g.style.removeProperty("--hp");
        const t = g.querySelector(".hv"); if (t) t.textContent = d ? d.label : "";
      }
    },
    press(id) { flash(id, "down", 90); },
    err(id) { flash(id, "err", 180); },
    destroy() { for (const k in timers) clearTimeout(timers[k]); KBS.delete(c); },
  };
  function apply() {
    const t = (list: string[], cls: string) => { const s = new Set(list); for (const id in els) els[id].classList.toggle(cls, s.has(id)); };
    t(c.st.next, "next"); t(c.st.learned, "learned"); t(c.st.upnext, "upnext");
  }
  function flash(id: string, cls: string, ms: number) {
    const g = els[id]; if (!g) return;
    g.classList.add(cls); clearTimeout(timers[id + cls]); timers[id + cls] = setTimeout(() => g.classList.remove(cls), ms);
  }
  c.build(); KBS.add(c);
  return c;
}

export interface Hands { svg: SVGSVGElement; set(list: string[]): void; }
export function makeHands(svg: SVGSVGElement): Hands {
  const cx: any = { LP: 135, LR: 195, LM: 255, LI: 315, RI: 495, RM: 555, RR: 615, RP: 675 }, len = { P: 48, R: 64, M: 72, I: 64 };
  const L: any = { LP: len.P, LR: len.R, LM: len.M, LI: len.I, RI: len.I, RM: len.M, RR: len.R, RP: len.P };
  let h = '<rect class="palm" x="105" y="62" width="250" height="50" rx="25"/><rect class="palm" x="465" y="62" width="250" height="50" rx="25"/>';
  for (const f in cx) h += '<rect class="hf" data-f="' + f + '" style="--fc:' + fcol(f) + '" x="' + (cx[f] - 22) + '" y="' + (80 - L[f]) + '" width="44" height="' + (L[f] + 22) + '" rx="22"/>';
  h += '<rect class="hf" data-f="TH" style="--fc:var(--f-thumb)" x="-22" y="-60" width="44" height="76" rx="22" transform="translate(352,106) rotate(38)"/>';
  h += '<rect class="hf" data-f="TH" style="--fc:var(--f-thumb)" x="-22" y="-60" width="44" height="76" rx="22" transform="translate(448,106) rotate(-38)"/>';
  svg.setAttribute("viewBox", "0 0 900 126"); svg.innerHTML = h;
  return { svg, set(list) { const s = new Set(list); svg.querySelectorAll(".hf").forEach(e => e.classList.toggle("on", s.has(e.getAttribute("data-f")!))); } };
}
