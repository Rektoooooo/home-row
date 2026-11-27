/* The 6-step welcome (legacy/src/app9.js): full screen, keyboard first, header and page inert behind it.
   Cards are shadcn ToggleGroup radios in the legacy look; the typing check itself runs in <App> (isolated test). */
import { useEffect, useRef } from "react";
import { ChevronLeft, Clock, MessageSquare, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Btn, ENTER, Pstat } from "@/components/parts";
import { Logo } from "@/components/Logo";
import { reduceMotion } from "@/ui/engine";
import { t, tn, pct, speed, speedUnit, speedTxt, LANG, setLang } from "@/i18n";
import { useLang } from "@/i18n/react";
import { CO, LESSONS } from "@/core/data";
import { useWelcome, wlCheck, wlFinish, wlPick, wlStep, wlCourse } from "@/ui/welcome";

const goals = (): [number, string][] => [[10, t("Casual")], [15, t("Regular")], [20, t("Serious")], [30, t("Intense")]];
/* the three stretches of the active course: home row, the other letters, then capitals, punctuation and numbers
   (English 1–6, 7–17, 18–22; Czech 1–6, 7–24, 25–29) */
const span = (a: number, b: number) => t("lessons {a}–{b}", { a, b });
const stages = (): [string, string, number, string][] => [[t("stage|Home row"), span(1, 6), .2, "--f-index"], [t("stage|All letters"), span(7, CO.allN - 1), .5, "--f-middle"], [t("stage|Capitals, punctuation and numbers"), span(CO.allN, LESSONS.length), .3, "--f-pinky"]];
const HOURS = 12;
const sounds = (): [string, string, string][] => [["soft", t("Soft"), t("Quiet and gentle")], ["cream", t("Creamy"), t("Deep, smooth thock")], ["click", t("Clicky"), t("Crisp and snappy")], ["type", t("Typewriter"), t("Old-school clack")]];
const SPK = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/></svg>';
const dur = (n: number) => n >= 14 ? tn(Math.round(n / 7), "about {n} week", "about {n} weeks") : tn(n, "about {n} day", "about {n} days");
const days = (share: number, goal: number) => Math.max(1, Math.round(HOURS * share * 60 / goal));

/* mini keyboard drawings: the highlighted keys are the ones that tell ISO and ANSI apart */
function kbSvg(iso: boolean) {
  const u = 18, g = 1, R = (x: number, w: number, r: number, hl?: boolean) => '<rect class="mk' + (hl ? " hl" : "") + '" x="' + (x * u + g) + '" y="' + (r * 20 + g) + '" width="' + (w * u - 2 * g) + '" height="' + (18 - 2 * g) + '" rx="3"/>';
  let h = "", x;
  h += R(0, 1.5, 0); for (x = 1.5; x < 13.5; x++) h += R(x, 1, 0);
  if (iso) { const a = 13.5 * u + g, b = 15 * u - g, c = 13.75 * u + g, t = g, m = 38 - g; h += '<path class="mk hl" d="M' + a + ' ' + t + 'H' + b + 'V' + m + 'H' + c + 'V' + (18 - g) + 'H' + a + 'Z"/>'; } else h += R(13.5, 1.5, 0);
  h += R(0, 1.75, 1); for (x = 1.75; x < (iso ? 13.75 : 12.75); x++) h += R(x, 1, 1);
  if (!iso) h += R(12.75, 2.25, 1, true);
  if (iso) { h += R(0, 1.25, 2, true) + R(1.25, 1, 2, true); for (x = 2.25; x < 12.25; x++) h += R(x, 1, 2); } else { h += R(0, 2.25, 2, true); for (x = 2.25; x < 12.25; x++) h += R(x, 1, 2); }
  h += R(12.25, 2.75, 2);
  return '<svg class="wl-kb" viewBox="0 0 ' + (15 * u) + ' 58" aria-hidden="true" focusable="false">' + h + '</svg>';
}

/* Radix only reports the toggle; the choice is set by the card's click (so a second click on the same sound replays it) */
function Cards({ value, className, children }: { value: string; className: string; children: React.ReactNode }) {
  return <ToggleGroup type="single" role="radiogroup" aria-labelledby="wl-title" value={value} onValueChange={() => {}} spacing={0} className={className}>{children}</ToggleGroup>;
}
function Card({ g, v, children, off }: { g: "layout" | "goal" | "sound" | "course"; v: string; children: React.ReactNode; off?: boolean }) {
  return (
    <ToggleGroupItem value={v} className={off ? "wl-off" : "wl-card"}
      onClick={e => {
        wlPick(g, g === "goal" ? +v : v);
        if (g === "sound" && v !== "off" && !reduceMotion()) { const el = e.currentTarget; el.classList.remove("playing"); void el.offsetWidth; el.classList.add("playing"); }
      }}>
      {children}
    </ToggleGroupItem>
  );
}

function Foot({ step, primary, extra, onNext }: { step: number; primary: string; extra?: React.ReactNode; onNext: () => void }) {
  return (
    <div className="wl-foot">
      <Button variant="ghost" className="back" hidden={step === 1} onClick={() => wlStep(step - 1)}><ChevronLeft aria-hidden="true" />{t("button|Back")}</Button>
      {extra}
      <Btn primary hint={ENTER} onClick={onNext}>{primary}</Btn>
    </div>
  );
}

export function Welcome() {
  useLang();
  const w = useWelcome(), root = useRef<HTMLDivElement>(null), title = useRef<HTMLHeadingElement>(null);
  const { open, step } = w;
  /* inert page + scroll lock + captured keys while open */
  useEffect(() => {
    if (!open) return;
    const nodes = [document.querySelector("header.top"), document.querySelector(".col")] as (HTMLElement | null)[];
    nodes.forEach(n => n?.setAttribute("inert", ""));
    document.documentElement.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      e.stopPropagation();
      const el = e.target as HTMLElement, radio = el.closest?.('[role="radio"]');
      if (e.key === "Enter") {
        if (el.closest?.("button") && !radio) return;
        e.preventDefault(); (root.current?.querySelector("[data-primary]") as HTMLElement | null)?.click();
      } else if (/^Arrow(Left|Right|Up|Down)$/.test(e.key)) {
        /* arrows move within the focused group, otherwise within the step's last group (the keyboard shape on step 2) */
        const groups = [...(root.current?.querySelectorAll('[role="radiogroup"]') || [])] as HTMLElement[];
        const grp = (el.closest?.('[role="radiogroup"]') as HTMLElement | null) || groups[groups.length - 1];
        const rs = [...(grp?.querySelectorAll('[role="radio"]') || [])] as HTMLElement[]; if (!rs.length) return;
        e.preventDefault();
        const cur = Math.max(0, rs.findIndex(r => r.getAttribute("aria-checked") === "true")), d = /Right|Down/.test(e.key) ? 1 : -1;
        const n = rs[(cur + d + rs.length) % rs.length]; n.click(); n.focus();
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      nodes.forEach(n => n?.removeAttribute("inert"));
      document.documentElement.style.overflow = "";
    };
  }, [open]);
  useEffect(() => { if (!open) return; title.current?.focus({ preventScroll: true }); if (root.current) root.current.scrollTop = 0; }, [open, step]);
  if (!open) return null;

  const next = () => { if (step < 5) wlStep(step + 1); else if (step === 5) wlCheck(); else wlFinish("lesson"); };
  const h1 = (s: string) => <h1 id="wl-title" tabIndex={-1} ref={title}>{s}</h1>;
  let body: React.ReactNode;
  if (step === 1) {
    body = <>
      <div className="wl-logo"><Logo size={72} /></div>{h1(t("Learn to type with all ten fingers"))}
      <p className="wl-lead">{t("Short daily lessons that adapt to you. No looking at the keyboard.")}</p>
      <ul className="wl-rows">{[[Clock, t("About 15 minutes a day")], [Target, t("Practice built around your weakest keys")], [MessageSquare, t("Claude can coach you and write lessons for you")]].map(([I, s]: any) => <li key={s}><span className="wl-ic"><I size={20} aria-hidden="true" /></span>{s}</li>)}</ul>
      <Foot step={1} primary={t("button|Get started")} onNext={next} />
    </>;
  } else if (step === 2) {
    body = <>
      {h1(t("Which keyboard do you have?"))}<p className="wl-lead">{t("Pick the layout your computer types with. Each one has its own course.")}</p>
      <Cards value={wlCourse()} className="wl-cards wl-goals wl-course">
        <Card g="course" v="en"><span className="big sm">U.S.</span><span className="nm">{t("English course")}</span></Card>
        <Card g="course" v="cs-qwertz"><span className="big sm">{t("Czech QWERTZ")}</span><span className="nm">{t("Czech course")}</span></Card>
        <Card g="course" v="cs-qwerty"><span className="big sm">{t("Czech QWERTY")}</span><span className="nm">{t("Czech course")}</span></Card>
      </Cards>
      <p className="wl-lead">{t("Look at the Enter key. It sets the shape of the keyboard on screen.")}</p>
      <Cards value={w.layout} className="wl-cards kbc">
        <Card g="layout" v="iso"><span dangerouslySetInnerHTML={{ __html: kbSvg(true) }} /><span className="big">ISO</span><span className="cap">{t("Tall Enter key, common in Europe")}</span></Card>
        <Card g="layout" v="ansi"><span dangerouslySetInnerHTML={{ __html: kbSvg(false) }} /><span className="big">ANSI</span><span className="cap">{t("Wide Enter key, common in the US")}</span></Card>
      </Cards>
      <Foot step={2} primary={t("button|Continue")} onNext={next} />
    </>;
  } else if (step === 3) {
    body = <>
      {h1(t("How much time each day?"))}<p className="wl-lead">{t("You can change this later in Settings.")}</p>
      <Cards value={String(w.goal)} className="wl-cards wl-goals">
        {goals().map(g => <Card key={g[0]} g="goal" v={String(g[0])}><span className="big">{g[0]}<small>{t("unit|min")}</small></span><span className="nm">{g[1]}</span>{g[0] === 15 ? <span className="wl-tag">{t("chip|Recommended")}</span> : null}</Card>)}
      </Cards>
      <Foot step={3} primary={t("button|Continue")} onNext={next} />
    </>;
  } else if (step === 4) {
    body = <>
      {h1(t("Pick your key sound"))}<p className="wl-lead">{t("Every key makes a quiet sound as you type. Tap one to hear it. You can change it later in Settings.")}</p>
      <Cards value={w.sound} className="wl-rg">
        <div className="wl-cards wl-goals wl-sounds">
          {sounds().map(s => <Card key={s[0]} g="sound" v={s[0]}><span className="wl-spk" dangerouslySetInnerHTML={{ __html: SPK }} /><span className="big sm">{s[1]}</span><span className="nm">{s[2]}</span>{s[0] === "cream" ? <span className="wl-tag">{t("chip|Recommended")}</span> : null}</Card>)}
        </div>
        <Card g="sound" v="off" off>{t("No sound")}</Card>
      </Cards>
      <Foot step={4} primary={t("button|Continue")} onNext={next} />
    </>;
  } else if (step === 5) {
    body = <>
      {h1(t("A quick typing check"))}<p className="wl-lead">{t("Type for one minute the way you type today. It gives us your starting speed and doesn't count towards your stats.")}</p>
      <div className="wl-note"><span className="wl-ic"><Clock size={20} aria-hidden="true" /></span><div><b>{t("60 seconds")}</b><span>{t("Common words, no capitals or punctuation")}</span></div></div>
      <Foot step={5} primary={t("button|Start the check")} onNext={next} extra={<Button variant="ghost" onClick={() => wlStep(6)}>{t("button|Skip this step")}</Button>} />
    </>;
  } else {
    const g = w.goal, N = Math.max(1, Math.round(HOURS * 60 / g / 7)), r = w.res;
    body = <>
      {h1(t("Your plan"))}
      {r ? <div className="pstats c2"><Pstat num={speed(r.wpm)} label={speedUnit()} sub={t("Your starting speed")} /><Pstat num={pct(Math.round(r.acc * 100) + "%")} label={t("Accuracy")} /></div> : null}
      <p className="wl-head2">{tn(N, "Touch typing at {target} in about {n} week", "Touch typing at {target} in about {n} weeks", { target: speedTxt(30) })}</p>
      <ol className="wl-road">{stages().map(s => <li key={s[0]} style={{ "--fc": "var(" + s[3] + ")" } as any}><span className="dt" /><span className="st">{s[0]} <span>· {s[1]}</span></span><span className="du">{dur(days(s[2], g))}</span></li>)}</ol>
      <p className="wl-small">{t("A rough estimate based on about {hours} hours of practice at {g} minutes a day. Everyone learns at their own pace.", { hours: HOURS, g })}</p>
      <div className="wl-foot">
        <Button variant="ghost" className="back" onClick={() => wlStep(5)}><ChevronLeft aria-hidden="true" />{t("button|Back")}</Button>
        <Button variant="ghost" onClick={() => wlFinish("learn")}>{t("button|Go to Learn")}</Button>
        <Btn primary hint={ENTER} onClick={() => wlFinish("lesson")}>{t("button|Start lesson 1")}</Btn>
      </div>
    </>;
  }
  return (
    <div className="welcome" role="dialog" aria-modal="true" aria-labelledby="wl-title" ref={root}>
      <div className="wl-top">
        <span className="brand-mark"><Logo size={30} /></span>
        <div className="wl-dots" role="img" aria-label={t("Step {step} of 6", { step })}>{[1, 2, 3, 4, 5, 6].map(i => <i key={i} className={i < step ? "done" : i === step ? "cur" : ""} />)}</div>
        <span className="wl-topr">
          <Button variant="ghost" size="sm" lang={LANG === "cs" ? "en" : "cs"} onClick={() => setLang(LANG === "cs" ? "en" : "cs")}>{LANG === "cs" ? "English" : "Čeština"}</Button>
          <Button variant="ghost" size="sm" onClick={() => wlFinish("learn")}>{t("button|Skip")}</Button>
        </span>
      </div>
      <div className="wl-main"><div className="wl-col"><div className="wl-step" key={step}>{body}</div></div></div>
    </div>
  );
}
