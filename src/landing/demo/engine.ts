/* Hero typing demo engine: a person typing, mistakes and all. Ported from legacy/site/index.html; it updates the
   prerendered markup imperatively (like the legacy script), so typing never re-renders React. */
import { SENT, KF, LEFT, SHIFTED, FNAME, NEAR } from "./data";

const $ = (id: string) => document.getElementById(id)!;
const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const gauss = () => { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
const handOf = (c: string) => (c === " " ? "T" : LEFT.has(c.toLowerCase()) ? "L" : "R");

/* the pause before a key, in ms: hand alternation is quick, the same finger twice is slow, capitals need shift */
function gap(prev: string | null, c: string) {
  let b;
  if (c === " ") b = 100;
  else if (prev == null) b = 210;
  else if (prev === " ") b = 165;
  else { const a = prev.toLowerCase(), z = c.toLowerCase(); b = a === z ? 130 : handOf(prev) !== handOf(c) ? 106 : KF[a] === KF[z] ? 205 : 140; }
  if (c !== c.toLowerCase()) b += 120;
  if (",.".includes(c)) b += 60;
  if (prev === " " && Math.random() < .13) b += rnd(180, 480); // reading ahead
  return Math.min(950, Math.max(60, b * 1.14 * Math.exp(gauss() * .24)));
}

type Act = { d: number; k: "t" | "b"; ch?: string };
/* a list of keystrokes for one sentence: {d: wait before it, k: "t" type | "b" backspace, ch} */
function plan(s: string, mistakes: number): Act[] {
  const cand: number[] = []; for (let i = 6; i < s.length - 3; i++) if (/[a-z]/.test(s[i]) && /[a-z]/.test(s[i - 1])) cand.push(i);
  const errs = new Map<number, string>();
  for (let n = 0; n < mistakes && cand.length; n++) {
    const i = cand[Math.floor(Math.random() * cand.length)];
    if (![...errs.keys()].some((j) => Math.abs(j - i) < 10)) errs.set(i, ["near", "near", "late", "swap", "double"][Math.floor(Math.random() * 5)]);
  }
  const A: Act[] = []; let prev: string | null = null, i = 0;
  const type = (ch: string) => { A.push({ d: gap(prev, ch), k: "t", ch }); prev = ch; };
  const back = (n: number) => { A.push({ d: rnd(260, 480), k: "b" }); for (let j = 1; j < n; j++) A.push({ d: rnd(80, 120), k: "b" }); prev = null; };
  while (i < s.length) {
    const c = s[i]; let kind = errs.get(i);
    if (kind) {
      errs.delete(i);
      if (kind === "swap" && !/[a-z]/.test(s[i + 1] || "") || s[i + 1] === c) kind = "near";
      if (kind === "swap") { type(s[i + 1]); type(c); let n = 2; if (Math.random() < .5 && s[i + 2]) { type(s[i + 2]); n++; } back(n); }
      else if (kind === "double") { type(c); type(c); back(1); i++; }
      else {
        type(NEAR[c] || "x"); let n = 1; const more = kind === "late" ? 2 + Math.floor(Math.random() * 2) : Math.random() < .5 ? 1 : 0;
        for (let j = 1; j <= more && i + j < s.length; j++) { type(s[i + j]); n++; } back(n);
      }
      continue;
    }
    type(c); i++;
  }
  return A;
}

export function startDemo(): () => void {
  const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const kEl: Record<string, HTMLElement> = {};
  document.querySelectorAll<HTMLElement>("#dKb .key").forEach((k) => (kEl[k.dataset.id!] = k));
  const timers = new Set<ReturnType<typeof setTimeout>>();
  const later = (fn: () => void, ms: number) => { const t = setTimeout(() => { timers.delete(t); fn(); }, ms); timers.add(t); return t; };

  function keysFor(ch: string) {
    if (ch === " ") return ["space"];
    const lo = ch.toLowerCase();
    if (kEl[lo]) return lo === ch ? [lo] : [lo, LEFT.has(lo) ? "shr" : "shl"];
    for (const b in SHIFTED) if (SHIFTED[b] === ch) return [b, LEFT.has(b) ? "shr" : "shl"];
    return [];
  }
  function press(ids: string[], ok: boolean) {
    const [main, sh] = ids.map((id) => kEl[id]), hold = rnd(70, 115);
    if (sh) { sh.classList.add("down"); later(() => sh.classList.remove("down"), hold + 70); }
    if (!main) return;
    main.classList.add("down"); if (!ok) main.classList.add("bad");
    later(() => main.classList.remove("down"), hold);
    if (!ok) later(() => main.classList.remove("bad"), 300);
  }
  const dText = $("dText"), dCaret = $("dCaret"), dLine = $("dLine"), dView = $("dView"), dWpm = $("dWpm"), dAcc = $("dAcc"), dCnt = $("dCnt"), dProg = $("dProg"), dStep = $("dStep"), dChip = $("dChip"), dKey = $("dKey"), dFin = $("dFin"), demo = $("demo");
  let si = 0, s = "", acts: Act[] = [], ai = 0, buf: string[] = [], spans: HTMLElement[] = [], timer: ReturnType<typeof setTimeout> | 0 = 0, idle: ReturnType<typeof setTimeout> | 0 = 0, running = false, vis = false, okN = 0, badN = 0, keyN = 0, doneChars = 0, active = 0, dead = false;

  function begin(fresh: boolean) {
    s = SENT[si]; acts = plan(s, si === 0 ? 1 : Math.random() < .6 ? 1 : 0); ai = 0; buf = [];
    dText.innerHTML = [...s].map(() => '<span class="c"></span>').join(""); spans = [...dText.children] as HTMLElement[];
    dStep.textContent = String(si + 1); render();
    if (fresh) { dLine.classList.remove("in"); void dLine.offsetWidth; dLine.classList.add("in"); }
  }
  function render() {
    let good = 0;
    for (let p = 0; p < s.length; p++) {
      const el = spans[p]; let cls = "c", tx = s[p];
      if (p < buf.length) { if (buf[p] === s[p]) { cls = "c ok"; good++; } else { cls = "c bad"; tx = buf[p] === " " ? "·" : buf[p]; } }
      if (el.className !== cls) el.className = cls; if (el.textContent !== tx) el.textContent = tx;
    }
    place();
    // the next key: backspace while a mistake is on screen, else the next character
    const wrong = buf.some((w, p) => w !== s[p]), c = s[buf.length], ids = wrong ? ["bk"] : c == null ? [] : keysFor(c);
    document.querySelectorAll<HTMLElement>("#dKb .key.next").forEach((k) => { if (!ids.includes(k.dataset.id!)) k.classList.remove("next"); });
    ids.forEach((id) => kEl[id] && kEl[id].classList.add("next"));
    const f = wrong ? "p" : c == null ? "" : c === " " ? "t" : KF[c.toLowerCase()] || "p";
    dChip.style.setProperty("--fc", f ? "var(--f-" + FNAME[f] + ")" : "var(--ok)");
    dKey.textContent = wrong ? "delete" : c == null ? "✓" : c === " " ? "space" : c !== c.toLowerCase() ? "⇧ " + c : c.toUpperCase();
    dFin.textContent = c == null && !wrong ? "Clean" : f === "t" ? "Right thumb" : (wrong ? "Right" : handOf(c) === "L" ? "Left" : "Right") + " " + FNAME[f];
    (dChip.querySelector(".w") as HTMLElement).hidden = (c == null && !wrong) || f === "t";
    // stats
    const mins = active / 60000;
    dWpm.textContent = active > 2500 ? String(Math.round((doneChars + good) / 5 / mins)) : "–";
    dAcc.textContent = (okN + badN ? Math.round(okN / (okN + badN) * 100) : 100) + "%";
    dCnt.textContent = String(keyN);
    dProg.style.width = Math.round(good / s.length * 100) + "%";
  }
  function place() {
    const n = buf.length, last = spans[spans.length - 1], x = n < spans.length ? spans[n].offsetLeft : last.offsetLeft + last.offsetWidth;
    dCaret.style.transform = "translateX(" + x + "px)";
    const W = dView.clientWidth, shift = Math.max(0, Math.min(x - W * .62, dLine.offsetWidth - W + 6));
    dLine.style.transform = shift > 0 ? "translateX(" + (-shift) + "px)" : ""; dView.classList.toggle("shifted", shift > 0);
  }
  function act(a: Act) {
    if (a.k === "t") { buf.push(a.ch!); keyN++; const ok = a.ch === s[buf.length - 1]; ok ? okN++ : badN++; press(keysFor(a.ch!), ok); }
    else { buf.pop(); press(["bk"], true); }
    demo.classList.add("typing"); if (idle) clearTimeout(idle); idle = setTimeout(() => demo.classList.remove("typing"), 650);
    render();
  }
  function loop() {
    if (dead) return;
    if (!vis || document.hidden) { running = false; return; }
    running = true;
    if (ai >= acts.length) { // sentence finished: a breath, then the next one
      timer = later(() => { if (!vis || document.hidden) { running = false; return; } doneChars += s.length; si = (si + 1) % SENT.length; begin(true); loop(); }, 1500); return;
    }
    const a = acts[ai];
    timer = later(() => { if (!vis || document.hidden) { running = false; return; } if (ai > 0) active += a.d; act(a); ai++; loop(); }, a.d);
  }
  function still() { // reduced motion: one calm frame
    si = 0; begin(false); buf = [...s.slice(0, 15)]; okN = keyN = 15; active = 0; render(); dWpm.textContent = "62";
  }

  const cleanups: (() => void)[] = [];
  begin(false);
  if (REDUCED) still();
  else {
    const io = new IntersectionObserver((es) => { vis = es[0].isIntersecting; if (vis && !running) loop(); }, { threshold: .2 });
    io.observe(demo); cleanups.push(() => io.disconnect());
    const onVis = () => { if (!document.hidden && vis && !running) loop(); };
    document.addEventListener("visibilitychange", onVis); cleanups.push(() => document.removeEventListener("visibilitychange", onVis));
    document.fonts && document.fonts.ready.then(() => { if (!dead) place(); });
  }
  addEventListener("resize", place); cleanups.push(() => removeEventListener("resize", place));
  return () => { dead = true; timers.forEach(clearTimeout); timers.clear(); if (idle) clearTimeout(idle); cleanups.forEach((f) => f()); };
}
