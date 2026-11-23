/* TYPING ENGINE: imperative, ported from legacy/src/app3.js (createExercise + the sink and global key handling).
   It works on DOM refs inside the stage root (text, viewport, caret, pace ghost, pause overlay, hint, keyboard, hands) so
   nothing re-renders per keystroke. <TypingStage> renders the markup and calls createExercise; installEngine() registers
   the global listeners once. */
import { S } from "@/core/state";
import { save } from "@/core/store";
import { DEAD, FING, LAY, CM, charInfo, reach, fcol, esc, idsFor } from "@/core/data";
import { wpmCalc, applyKeyEvents, addDay, learnedChars } from "@/core/stats";
import { audio, actx, keySound } from "@/core/sound";
import { makeKeyboard, makeHands } from "./keyboard";

export const reduceMotion = () => typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

/* the screen currently shown: which function Esc runs outside a stage (UI.escape in legacy) */
export const nav: { escape: null | (() => void) } = { escape: null };
export const PACE_LIVE = new Set<any>();
let EX: any = null, czechShown = false, lastComp: any = null, sinkEl: HTMLTextAreaElement | null = null;
export const currentExercise = () => EX;

const TIPS: any = {
  dead: "Your U.S. International layout treats ' and \" as accent keys. Press Space after them to type the mark on its own; the app accepts that. Or switch to the ABC or U.S. layout while you practise.",
  czech: "Your Czech keyboard is active. Switch the input source back to U.S. to match this course.",
};

function hintHTML(ch: string) {
  if (ch === "\n") return '<span class="dot" style="--fc:' + fcol("RP") + '"></span><b>Enter</b> · ' + FING.RP.n + ', new line';
  const i = charInfo(ch); if (!i) return "";
  const lay = LAY(); const lbl = ch === " " ? "Space" : esc(ch);
  if (ch === " ") return "<b>Space</b> · either thumb";
  const k = i.key, f = FING[k.f], r = reach(k.id);
  const where = r.home ? "home key" : "reach " + r.phrase + " from " + esc(r.from);
  const dot = '<span class="dot" style="--fc:' + fcol(k.f) + '"></span>';
  if (i.shift) {
    const sf = FING[lay.byId[i.shiftId].f];
    return dot + "<b>" + lbl + "</b> · hold " + (i.shiftId === "ShiftLeft" ? "left" : "right") + " Shift with your " + sf.n + ", then " + f.n + ", " + where;
  }
  return dot + "<b>" + lbl.toUpperCase().replace("&AMP;", "&amp;") + "</b> · " + f.n + ", " + where;
}

export function focusSink() { try { sinkEl?.focus({ preventScroll: true }); } catch (e) {} }
export function stopExercise() {
  if (EX) { EX.destroy(); EX = null; }
  try { sinkEl?.blur(); } catch (e) {}
}

/* o: {crumb,text,mode:"stop"|"free",focus,pace,code,more,timeLimit,noKb,noStats,delay,onFinish,onRestart} ; root: the .stage section */
export function createExercise(o: any, root: HTMLElement) {
  stopExercise();
  const q = (id: string) => root.querySelector("#" + id) as HTMLElement;
  let text: string = o.text, N = text.length; const free = o.mode === "free";
  const marks: number[] = new Array(N).fill(0), missed: number[] = new Array(N).fill(0), firstDone: number[] = new Array(N).fill(0), firstMiss: number[] = new Array(N).fill(0);
  const E: any = { o, text, pos: 0, auto: 0, presses: 0, correct: 0, ok: 0, started: false, paused: false, done: false, seg: 0, act: 0, last: 0, missBy: {}, ev: [], reveal: false, lastCode: "", lastCodeT: 0 };
  const txt = q("txt"), vp = q("vp"), pauseEl = q("pause"), hintEl = q("hint"), kbwrap = q("kbwrap");
  const kb = makeKeyboard(q("kb") as unknown as SVGSVGElement, "stage"), hands = makeHands(q("hands") as unknown as SVGSVGElement);
  /* only the keys this text uses stay bright on the keyboard */
  const used = new Set<string>();
  const focusKeys = (s: string) => { [...s].forEach(ch => { if (ch !== "\n") used.add(ch); }); const ids = idsFor([...used]) as string[]; if (/\n/.test(s) || o.code) ids.push("Enter"); kb.set({ learned: [...new Set(kb.st.learned.concat(ids))] }); kb.svg.classList.add("focus"); };
  /* bright: the keys you know (in a lesson, its keys so far) plus anything the text uses */
  focusKeys(text + (o.focus || [...learnedChars()]).join(""));
  /* render text */
  let html = "";
  /* o.code: one block per line; a newline is its own .c.nl cell, leading spaces are .c.ind. xc keeps those extra classes through paint() */
  const xc: string[] | null = o.code ? [] : null, rows = o.code ? 6 : 3;
  if (o.code) {
    vp.classList.add("code");
    text.split("\n").forEach((ln, li, all) => {
      const ind = /^ */.exec(ln)![0].length;
      html += '<div class="ln">' + '<span class="c ind"> </span>'.repeat(ind);
      for (let i = 0; i < ind; i++) xc!.push(" ind");
      ln.slice(ind).split(/(?<= )/).forEach(w => { if (!w) return; html += '<span class="w">' + [...w].map(ch => { xc!.push(""); return '<span class="c">' + esc(ch) + '</span>'; }).join("") + "</span>"; });
      if (li < all.length - 1) { html += '<span class="c nl">↵</span>'; xc!.push(" nl"); }
      html += '</div>';
    });
  } else text.split(/(?<= )/).forEach(w => { html += '<span class="w">' + [...w].map(ch => '<span class="c">' + esc(ch) + '</span>').join("") + "</span>"; });
  txt.innerHTML = html;
  const cs = [...txt.querySelectorAll(".c")] as HTMLElement[];
  const caret = document.createElement("span"); caret.className = "caret idle"; txt.appendChild(caret);
  const hintsMode = () => S.settings.hints;
  let idleT: any = 0, revealT: any = 0, lineH = 0, caretY: number | null = null;
  const elapsed = (now: number) => E.act + (E.started && !E.paused ? now - E.seg : 0);
  const chars = () => free ? E.ok : E.pos - E.auto;
  /* pace caret: a faint ghost that moves at a steady WPM, driven by rAF while the exercise runs */
  const paceWpm = o.pace || 0; let paceRaf = 0, paceT: any = 0;
  const ghost = paceWpm ? document.createElement("span") : null;
  if (ghost) { ghost.className = "pacegh"; ghost.hidden = true; txt.insertBefore(ghost, caret); }
  E.ghostPos = () => Math.max(0, Math.min(N - 1, Math.floor(elapsed(performance.now()) * paceWpm * 5 / 60000)));
  function paceTick() {
    paceRaf = 0; paceT = 0;
    if (!ghost || E.done || E.paused || !E.started) { PACE_LIVE.delete(E); return; }
    const el = cs[E.ghostPos()];
    if (el) { ghost.style.transform = "translate(" + el.offsetLeft + "px," + el.offsetTop + "px)"; ghost.hidden = false; }
    if (reduceMotion()) paceT = setTimeout(paceTick, 250); else paceRaf = requestAnimationFrame(paceTick);
  }
  function startPace() { if (!ghost || paceRaf || paceT || E.done) return; PACE_LIVE.add(E); paceTick(); }
  function stopPace() { cancelAnimationFrame(paceRaf); clearTimeout(paceT); paceRaf = 0; paceT = 0; PACE_LIVE.delete(E); }
  E.secs = []; E.missAt = [];
  function extend() {
    const add = o.more && o.more(); if (!add) return;
    const tmp = document.createElement("div"); let h = "";
    add.split(/(?<= )/).forEach((w: string) => { h += '<span class="w">' + [...w].map(ch => '<span class="c">' + esc(ch) + '</span>').join("") + "</span>"; });
    tmp.innerHTML = h; [...tmp.children].forEach(n => txt.insertBefore(n, caret));
    cs.length = 0; cs.push(...(txt.querySelectorAll(".c") as unknown as HTMLElement[]));
    for (let i = 0; i < add.length; i++) { marks.push(0); missed.push(0); firstDone.push(0); firstMiss.push(0); }
    text += add; N = text.length; E.text = text;
    focusKeys(add);
  }
  function placeCaret() {
    const el = cs[Math.min(E.pos, N - 1)]; if (!el) return;
    lineH = vp.clientHeight / rows;
    const x = el.offsetLeft + (E.pos >= N ? el.offsetWidth : 0), y = el.offsetTop;
    if (o.code) { const r = x + el.offsetWidth + 24; if (r > vp.scrollLeft + vp.clientWidth) vp.scrollLeft = r - vp.clientWidth; else if (x < vp.scrollLeft + 8) vp.scrollLeft = Math.max(0, x - 24); }
    /* glides along a line (CSS transition); a line change jumps so it never swoops across the text */
    if (y !== caretY && caretY != null) { caret.style.transition = "none"; caret.style.transform = "translate(" + x + "px," + y + "px)"; void caret.offsetWidth; caret.style.transition = ""; }
    else caret.style.transform = "translate(" + x + "px," + y + "px)";
    caretY = y;
    const line = Math.round(y / lineH), sc = Math.max(0, line - (o.code ? rows - 2 : 1));
    txt.style.transform = "translateY(" + (-sc * lineH) + "px)";
    if (!reduceMotion()) { caret.classList.remove("idle"); clearTimeout(idleT); idleT = setTimeout(() => caret.classList.add("idle"), 600); }
    else caret.classList.remove("idle");
  }
  const enterInfo = () => { const k = LAY().byId.Enter; return k ? { key: k, shift: false, shiftId: null, ids: [k.id], fingers: [k.f] } : null; };
  function showNext() {
    const mode = hintsMode();
    const hide = mode === "hidden" || o.noKb; kbwrap.hidden = hide; hintEl.hidden = hide;
    const lab = (i: any, show: boolean) => { const t = i && show ? "Next key " + (text[E.pos] === " " ? "Space" : text[E.pos] === "\n" ? "Enter" : text[E.pos].toUpperCase()) + ", " + (i.shift ? "with Shift, " : "") + FING[i.key.f].n : "Keyboard"; q("kb").setAttribute("aria-label", t); q("hands").setAttribute("aria-label", i && show ? "Use your " + i.fingers.map((f: string) => FING[f].n).join(" and your ") : "Hands"); };
    if (E.pos >= N) { kb.set({ next: [] }); hands.set([]); hintEl.innerHTML = ""; return; }
    const i = text[E.pos] === "\n" ? enterInfo() : charInfo(text[E.pos]), show = mode === "always" || (mode === "hesitate" && E.reveal);
    lab(i, show);
    if (!i || !show) { kb.set({ next: [] }); hands.set(text[E.pos] === " " && show ? ["TH"] : []); hintEl.innerHTML = show && i ? hintHTML(text[E.pos]) : ""; if (!i) return; return; }
    kb.set({ next: i.ids }); hands.set(i.fingers); hintEl.innerHTML = hintHTML(text[E.pos]);
  }
  function armReveal() {
    clearTimeout(revealT); E.reveal = false;
    if (hintsMode() === "hesitate") revealT = setTimeout(() => { E.reveal = true; showNext(); }, 1200);
  }
  function live(now: number) {
    const ms = elapsed(now);
    q("l-wpm").textContent = ms > 2000 ? String(Math.round(wpmCalc(chars(), ms))) : "0";
    q("l-acc").textContent = (E.presses ? Math.round(E.correct / E.presses * 100) : 100) + "%";
    if (o.timeLimit) { const s = Math.floor(Math.min(ms, o.timeLimit) / 1000); while (E.secs.length < s) E.secs.push(chars()); }
    if (o.timeLimit) { q("l-prog").textContent = Math.max(0, Math.ceil((o.timeLimit - ms) / 1000)) + "s"; q("l-prog-l").textContent = "Time left"; }
    else { q("l-prog").textContent = E.pos + " / " + N; q("l-prog-l").textContent = "Typed"; }
  }
  function paint(i: number) {
    const el = cs[i], m = marks[i]; el.className = "c" + (xc ? xc[i] : "") + (m === 1 ? " ok" : m === 2 ? " fx" : m === 3 ? " bad" : m === 4 ? " auto" : "");
  }
  function showTip(k: string) { const t = q("tip"); if (!t) return; q("tip-t").textContent = TIPS[k]; t.hidden = false; }
  function accept(ch: string, now: number) {
    if (!E.started) { E.started = true; E.seg = now; startPace(); }
    const exp = text[E.pos], hit = ch === exp, dt = E.presses > 0 ? now - E.last : null;
    E.presses++; E.last = now;
    if (!firstDone[E.pos]) {
      firstDone[E.pos] = 1;
      firstMiss[E.pos] = hit ? 0 : 1;
      E.ev.push({ c: exp, miss: !hit, dt: hit && dt != null && dt < 3000 ? dt : null, pc: E.pos > 0 ? text[E.pos - 1] : "", pmiss: E.pos > 0 ? !!firstMiss[E.pos - 1] : false });
      if (!hit) { const k = exp.toLowerCase(); E.missBy[k] = (E.missBy[k] || 0) + 1; }
    }
    if (!hit) E.missAt.push(Math.floor(elapsed(now) / 1000) + 1);
    if (!hit && /[ěščřžýáíéůú]/.test(ch) && !/[ěščřžýáíéůú]/.test(exp) && !czechShown) { czechShown = true; showTip("czech"); }
    if (hit) E.correct++; keySound(hit ? (exp === " " ? "space" : "key") : "error");
    if (hit || free) {
      marks[E.pos] = hit ? (missed[E.pos] ? 2 : 1) : 3; if (free && !hit) missed[E.pos] = 1; if (marks[E.pos] === 1 || marks[E.pos] === 2) { if (free) E.ok += marks[E.pos] === 1 ? 1 : 0; }
      paint(E.pos); E.pos++;
      if (o.code && exp === "\n") while (E.pos < N && text[E.pos] === " " && xc![E.pos] === " ind") { marks[E.pos] = 4; firstDone[E.pos] = 1; E.auto++; paint(E.pos); E.pos++; }
      if (hit) armReveal(); else { E.reveal = true; }
    } else {
      marks[E.pos] = 3; missed[E.pos] = 1; paint(E.pos);
      const el = cs[E.pos]; if (!reduceMotion()) { el.classList.remove("shake"); void el.offsetWidth; el.classList.add("shake"); }
      E.reveal = true; clearTimeout(revealT);
    }
    if (!hit) { const mi = (performance.now() - E.lastCodeT < 300 && E.lastCode && LAY().byId[E.lastCode]) ? E.lastCode : (CM()[ch] && CM()[ch].id); if (mi) kb.err(mi); }
  }
  E.type = function (str: string, fromComp?: boolean) {
    if (E.done || E.paused) return;
    const arr = [...(o.code ? str.replace(/\r\n?/g, "\n") : str)].filter(c => c !== "\r" && c !== "\t" && (c !== "\n" || o.code));
    const now = performance.now();
    if (fromComp && arr.length === 1 && DEAD.includes(arr[0]) && text[E.pos] === arr[0] && text[E.pos + 1] === " " && E.pos + 1 < N) {
      accept(arr[0], now); if (E.pos < N && text[E.pos] === " ") accept(" ", now);
    } else for (const ch of arr) { if (E.pos >= N) break; accept(ch, now); }
    afterInput(now);
  };
  function afterInput(now: number) {
    if (o.more && E.pos > N - 40) extend();
    placeCaret(); showNext(); live(now);
    if (E.pos >= N) finish(now);
  }
  E.back = function (word?: boolean) {
    if (!free || E.done || E.pos === 0) return;
    let to = E.pos - 1;
    if (word) { to = E.pos; while (to > 0 && text[to - 1] === " ") to--; while (to > 0 && text[to - 1] !== " " && !(o.code && text[to - 1] === "\n")) to--; }
    if (o.code) { if (to >= E.pos) to = E.pos - 1; while (to > 0 && marks[to] === 4) to--; } /* auto indentation goes with its newline */
    while (E.pos > to) { E.pos--; if (marks[E.pos] === 1) E.ok--; if (marks[E.pos] === 4) E.auto--; marks[E.pos] = 0; paint(E.pos); }
    placeCaret(); showNext(); live(performance.now());
  };
  E.flash = (code: string) => { E.lastCode = code; E.lastCodeT = performance.now(); kb.press(code); };
  E.deadTip = () => { if (!S.seenTips.deadKey) { S.seenTips.deadKey = true; showTip("dead"); save(); } };
  E.pause = function () {
    if (E.done || E.paused) return;
    if (E.started) E.act += performance.now() - E.seg;
    E.paused = true; pauseEl.hidden = false; stopPace();
  };
  E.resume = function () {
    if (E.done || !E.paused) return;
    E.paused = false; E.seg = performance.now(); pauseEl.hidden = true; if (E.started) startPace();
  };
  E.refreshHints = () => { armReveal(); showNext(); };
  E.restart = () => { if (o.onRestart) o.onRestart(); };
  function finish(now: number) {
    if (E.done) return;
    let ms = elapsed(now); if (o.timeLimit) ms = Math.min(ms, o.timeLimit);
    if (o.timeLimit) { const s = Math.floor(o.timeLimit / 1000); while (E.secs.length < s) E.secs.push(chars()); }
    E.done = true; window.removeEventListener("resize", onResize); stopPace(); if (ghost) ghost.hidden = true; clearInterval(tick); clearTimeout(revealT); clearTimeout(idleT);
    caret.classList.remove("idle");
    const res = { ms, chars: chars(), presses: E.presses, correct: E.correct, wpm: wpmCalc(chars(), ms), raw: wpmCalc(E.presses, ms), acc: E.presses ? E.correct / E.presses : 1, missBy: E.missBy, len: N, secs: E.secs.slice(), missAt: E.missAt.slice(), mistakes: E.presses - E.correct };
    if (!o.noStats) { applyKeyEvents(E.ev); addDay(ms, res.chars, E.presses, E.correct); }
    try { sinkEl?.blur(); } catch (e) {}
    setTimeout(() => { if (EX === E && o.onFinish) o.onFinish(res); save(); }, o.delay == null ? 350 : o.delay);
  }
  E.finish = () => finish(performance.now());
  const onResize = () => { if (!E.done) placeCaret(); }; window.addEventListener("resize", onResize);
  E.destroy = () => { window.removeEventListener("resize", onResize); stopPace(); clearInterval(tick); clearTimeout(revealT); clearTimeout(idleT); kb.destroy(); E.done = true; root.removeEventListener("click", onRootClick); pauseEl.removeEventListener("click", onPauseClick); };
  const tick = setInterval(() => { if (E.done) return; const now = performance.now(); live(now); if (o.timeLimit && E.started && !E.paused && elapsed(now) >= o.timeLimit) finish(now); }, 250);
  const onRootClick = (e: Event) => { if ((e.target as HTMLElement).closest("button")) return; if (E.paused) E.resume(); focusSink(); };
  const onPauseClick = () => { E.resume(); focusSink(); };
  root.addEventListener("click", onRootClick);
  pauseEl.addEventListener("click", onPauseClick);
  EX = E;
  if (sinkEl) { sinkEl.value = ""; focusSink(); }
  placeCaret(); showNext(); live(performance.now()); armReveal();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (EX === E) placeCaret(); });
  return E;
}

/* a modal dialog (Radix) or a native <dialog> is open: typing and the global keys are off */
const dialogOpen = () => !!document.querySelector('[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"], dialog[open]');

/* sink + global key handling (registered once). Returns the cleanup. */
export function installEngine(sink: HTMLTextAreaElement) {
  sinkEl = sink;
  const onInput = (e: Event) => {
    if ((e as InputEvent).isComposing) return;
    const v = sink.value; sink.value = ""; if (!EX || !v) return;
    if (lastComp && performance.now() - lastComp.t < 60 && v === lastComp.s) { lastComp = null; return; }
    EX.type(v, false);
  };
  const onCompEnd = (e: CompositionEvent) => {
    const v = sink.value || e.data || ""; sink.value = ""; if (!EX || !v) return;
    lastComp = { s: v, t: performance.now() }; EX.type(v, true);
  };
  const onFocus = () => { if (EX && EX.paused) EX.resume(); };
  const onBlur = () => {
    if (!EX || EX.done) return;
    setTimeout(() => { if (!EX || EX.done) return; const a = document.activeElement as HTMLElement | null; if (a && a !== sink && a.closest && a.closest(".stage-bar")) return; EX.pause(); }, 0);
  };
  const onVis = () => { if (document.hidden && EX && !EX.done) EX.pause(); };
  const onKey = (e: KeyboardEvent) => {
    /* a dialog that just closed on this Escape has already handled it (Radix prevents the default) */
    if (dialogOpen() || (e.key === "Escape" && e.defaultPrevented)) return;
    if (S.settings.soundPack !== "off" && !actx) audio();
    if (EX && !EX.done) {
      if (EX.paused) { if (!["Shift", "Control", "Alt", "Meta", "CapsLock"].includes(e.key)) { EX.resume(); focusSink(); } if (e.key === "Escape" || e.key === "Tab") e.preventDefault(); return; }
      if (e.code) EX.flash(e.code);
      if (e.key === "Dead") EX.deadTip();
      if (e.key === "Escape") { e.preventDefault(); EX.restart(); return; }
      if (e.key === "Tab") { e.preventDefault(); return; }
      if (e.key === "Backspace") { e.preventDefault(); EX.back(e.altKey); return; }
      if (e.target !== sink && !e.metaKey && !e.ctrlKey && e.key.length === 1) focusSink();
      return;
    }
    if (e.key === "Enter" && !(e.target as HTMLElement).closest?.("button,a,input,select,textarea,summary,dialog,[role=dialog]")) {
      const p = document.querySelector("#view [data-primary]") as HTMLElement | null; if (p) { e.preventDefault(); p.click(); }
    } else if (e.key === "Escape" && nav.escape) { nav.escape(); }
  };
  sink.addEventListener("input", onInput); sink.addEventListener("compositionend", onCompEnd);
  sink.addEventListener("focus", onFocus); sink.addEventListener("blur", onBlur);
  document.addEventListener("visibilitychange", onVis); document.addEventListener("keydown", onKey);
  return () => {
    sink.removeEventListener("input", onInput); sink.removeEventListener("compositionend", onCompEnd);
    sink.removeEventListener("focus", onFocus); sink.removeEventListener("blur", onBlur);
    document.removeEventListener("visibilitychange", onVis); document.removeEventListener("keydown", onKey);
    if (sinkEl === sink) sinkEl = null;
  };
}
