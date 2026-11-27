/* LEARN: Today card, Course map, Lessons list, lesson intro, the 3-step run, step summaries and lesson results.
   Ported from legacy/src/app4.js (renderLearn, openIntro, startLesson, runStep, stepDone, showResults). */
import { lessonTitle, stageName, stepName } from "@/core/data";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Check, ChevronLeft, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Btn, Cap, ENTER, Panel, Pstat, Stars, StatusChip } from "@/components/parts";
import { Keyboard, Hands } from "@/components/Keyboard";
import { TypingStage } from "@/components/TypingStage";
import { S, C } from "@/core/state";
import { FING, LAY, LESSONS, STEP_NAMES, WL, CO, charInfo, idsFor, reach } from "@/core/data";
import { genLesson, ctx } from "@/core/generate";
import { applyLessonResult, lessonDone, learnedChars, minutesToday, nextLessonN, pctTxt, streak, unlocked, weakestKey } from "@/core/stats";
import { levelInfo, rewardsLesson } from "@/core/rewards";
import { useProgress } from "@/lib/progress";
import { useEscape } from "@/lib/escape";
import { navigate, takePending } from "@/lib/route";
import { reduceMotion } from "@/ui/engine";
import { countUp } from "@/ui/countup";
import { Screen } from "@/lib/screen";
import { cn } from "@/lib/utils";
import { SessionFlow } from "@/views/Session";
import { t, tn, tx, num, pct, list, finger, reachText, speed, speedUnit } from "@/i18n";
import { bold, NB } from "@/lib/bold";

/* bars grow from 0 on a fresh screen (not under reduced motion) */
function useGrown(v: number) {
  const [x, setX] = useState(reduceMotion() ? v : 0);
  useEffect(() => { const id = requestAnimationFrame(() => requestAnimationFrame(() => setX(v))); return () => cancelAnimationFrame(id); }, [v]);
  return x;
}

function LevelRow() {
  const L = levelInfo(), left = L.need - L.into, v = useGrown(L.pct);
  return (
    <div className="lvl"><span className="lvl-n">{t("Level {n}", { n: L.level })}</span><Progress className="bar bg-sunken" value={v} aria-hidden="true" /><span className="lvl-t">{tn(left, "{n} word to level {next}", "{n} words to level {next}", { next: L.level + 1 })}</span></div>
  );
}

function IntroLine({ ch }: { ch: string }) {
  const i = charInfo(ch); if (!i) return null;
  const k = i.key, r = reach(k.id), show = ch.toUpperCase();
  if (i.pre) { /* ó ď ť ň: the accent key first, then the letter */
    const p = i.pre, v = { key: <strong>{ch}</strong>, acc: <strong>{p.shift ? p.key.sh : p.key.base}</strong>, pf: finger(p.key.f, "ins"), base: k.base.toUpperCase(), f: finger(k.f, "ins") };
    return <>{p.shift ? tx("{key} · Hold Shift and press the accent key with your {pf} for {acc}, let go, then press {base} with your {f}.", v) : tx("{key} · Press the accent key {acc} with your {pf}, let go, then press {base} with your {f}.", v)}</>;
  }
  if (i.shift) {
    const left = i.shiftId === "ShiftLeft", sf = finger(LAY().byId[i.shiftId].f, "ins"), base = k.base.toUpperCase(), v = { key: <strong>{ch}</strong>, base, sf, f: finger(k.f, "ins") };
    return <>{left ? tx("{key} · Shift + {base}. Hold left Shift with your {sf}, then press {base} with your {f}.", v) : tx("{key} · Shift + {base}. Hold right Shift with your {sf}, then press {base} with your {f}.", v)}</>;
  }
  if (r.home) { const v = { key: <strong>{show}</strong>, f: finger(k.f) }; return <>{k.id === "KeyF" || k.id === "KeyJ" ? tx("{key} · {f}. This is a home key. Rest the finger here. Feel the bump.", v) : tx("{key} · {f}. This is a home key. Rest the finger here.", v)}</>; }
  return <>{tx("{key} · {f}. From {from}, reach {phrase} and come back.", { key: <strong>{show}</strong>, f: finger(k.f), from: r.from, phrase: reachText(r.phrase) })}</>;
}

function Intro({ n, onStart, onBack }: { n: number; onStart: () => void; onBack: () => void }) {
  const L = LESSONS[n - 1];
  const ids: string[] = L.shift ? ["ShiftLeft", "ShiftRight"] : idsFor(L.keys) as string[];
  const fingers = [...new Set(ids.map(id => LAY().byId[id]).filter(Boolean).map((k: any) => k.f))] as string[];
  const hk = [...(CO.home as string)].map(c => c.toUpperCase());
  const extra = n === 1 ? t("Rest your left fingers on {left} and your right fingers on {right}. Feel the bumps on F and J. Thumbs rest on the space bar.", { left: hk.slice(0, 4).join(" "), right: hk.slice(4).join(" ") }) :
    L.shift ? t("Capitals use the Shift key on the opposite hand. Press and hold Shift, tap the letter, then let go of both.") + (CO.id === "cs" ? " " + t("Capitals with an accent: the accent key first, then Shift + the letter. ˇ then Shift + C gives Č, ´ then Shift + A gives Á.") : "") :
    L.dead ? t("These letters have no key of their own. Press the accent key (´, or ˇ with Shift), let go, then press the letter. Nothing shows until the letter comes.") :
    L.digits && CO.id === "cs" ? t("On the Czech keyboard the number row types letters. Hold Shift for digits, on the other hand as with capitals.") :
    L.punct && CO.id === "en" ? t("The apostrophe and quote keys are accent keys on your U.S. International layout. When one comes before a space, press the mark and then Space. The app accepts that.") : "";
  useEscape(onBack);
  let lines;
  if (L.review) lines = <li><p>{t("No new keys. This lesson mixes everything you know so far, with extra weight on your slower keys.")}</p></li>;
  else if (L.shift) lines = [["ShiftLeft", t("Left Shift"), t("Hold it with your left pinky for capitals typed with your right hand.")], ["ShiftRight", t("Right Shift"), t("Hold it with your right pinky for capitals typed with your left hand.")]]
    .map(x => <li key={x[0]}><Cap size="md" finger={LAY().byId[x[0]].f}>shift</Cap><p><strong>{x[1]}</strong> · {x[2]}</p></li>);
  else lines = L.keys.map((ch: string) => <li key={ch}><Cap k={ch} size="md" /><p><IntroLine ch={ch} /></p></li>);
  return (
    <div className="intro">
      <Panel eyebrow={stageName(L.stage)} title={t("Lesson {n} · {title}", { n, title: lessonTitle(L) })} msg={extra || undefined}
        foot={<><Btn variant="ghost" onClick={() => navigate("learn")}><ChevronLeft aria-hidden="true" />{t("button|Back to lessons")}</Btn><Btn primary hint={ENTER} onClick={onStart}>{t("button|Start lesson")}</Btn></>}>
        <ul className="keylist">{lines}</ul>
      </Panel>
      <div className="kbwrap" style={{ width: "100%" }}><Keyboard mode="stage" id="kb" next={ids} /><Hands id="hands" fingers={fingers} /></div>
    </div>
  );
}

function LessonRow({ l, nx, onOpen }: { l: any; nx: number; onOpen: (n: number) => void }) {
  const r = C().lessons[l.n], lock = !unlocked(l.n), isNext = l.n === nx, done = lessonDone(l.n);
  const keyTxt = l.shift ? t("Both Shift keys") : l.review ? t("Mixed review") : list((l.keys.map((k: string) => (charInfo(k) || { key: { f: "TH" } }).key.f) as string[]).filter((v: string, i: number, a: string[]) => a.indexOf(v) === i).map(f => finger(f)));
  return (
    <button className={cn("lrow", lock && "locked", isNext && "next")} type="button" data-n={l.n} aria-disabled={lock || undefined} onClick={lock ? undefined : () => onOpen(l.n)}>
      <span className="lnum">{l.n}{done ? <span className="ckb"><Check size={10} strokeWidth={2} aria-hidden="true" /></span> : null}</span>
      <span className="ltitle">{lessonTitle(l)}{isNext ? <Badge className="upchip ml-2 inline-flex h-auto rounded-full px-2 py-0.5 align-[2px] font-heading text-[11px] leading-[1.4] font-semibold tracking-[.04em] uppercase">{t("chip|Up next")}</Badge> : null}</span>
      <span className="lsub">{lock ? t("Pass lesson {n} to unlock", { n: l.n - 1 }) : keyTxt}</span>
      <span className="lmeta">
        {lock ? <Lock className="lock" role="img" aria-label={t("Locked")} strokeWidth={2} /> : <>
          <Stars n={r ? r.stars : 0} size={16} />
          {r && r.attempts ? <><span>{speed(r.wpm)} {speedUnit()}</span><span>{pct(Math.round(r.acc * 100) + "%")}</span></> : <span className="muted">{t("Not started")}</span>}
        </>}
      </span>
    </button>
  );
}

function LearnList({ onOpen, onSession }: { onOpen: (n: number) => void; onSession: () => void }) {
  const nx = nextLessonN(), L = nx ? LESSONS[nx - 1] : null, m = minutesToday(), g = S.settings.goal, st = streak(), wk = weakestKey() as string | null;
  const bar = useGrown(Math.min(100, m / g * 100));
  const lc = learnedChars(), ids = new Set(idsFor([...lc]) as string[]);
  if (lessonDone(CO.capsN)) { ids.add("ShiftLeft"); ids.add("ShiftRight"); }
  const up: string[] = L ? (L.shift ? ["ShiftLeft", "ShiftRight"] : idsFor(L.keys) as string[]) : [];
  const cnt: Record<string, { d: number; t: number }> = {};
  LESSONS.forEach(l => { const c = cnt[l.stage] || (cnt[l.stage] = { d: 0, t: 0 }); c.t++; if (lessonDone(l.n)) c.d++; });
  let stage = "";
  return (
    <>
      <h1 className="vh">{t("tab|Learn")}</h1>
      <Card className="today p-6 max-[560px]:p-[18px]">
        <div>
          <span className="label">{t("heading|Today")}</span>
          {L ? <h1>{t("Lesson {n} · {title}", { n: nx, title: lessonTitle(L) })}</h1> : <h1>{t("All lessons passed")}</h1>}
          <div className="today-stats">
            <span>{tx("{m} of {g} min today", { m: <b>{Math.floor(m)}</b>, g })}</span>
            <span>{bold(tn(st, "{n} day streak", "{n} days streak", { n: NB }), st)}</span>
            {wk ? <span>{tx("Weakest key: {key}", { key: <a href="#practice" style={{ color: "inherit" }}><b>{wk.toUpperCase()}</b></a> })}</span> : null}
          </div>
          <Progress className="bar bg-sunken mt-3.5 h-1.5 max-w-[380px]" value={bar} aria-hidden="true" />
          <LevelRow />
        </div>
        <div className="today-act">
          <div className="actions">
            <Btn primary hint={ENTER} onClick={onSession}>{t("button|Start today's session")}</Btn>
            {L ? <Btn variant="outline" onClick={() => onOpen(nx)}>{t("Lesson {n} only", { n: nx })}</Btn> : <Btn variant="outline" onClick={() => onOpen(1)}>{t("button|Repeat lesson 1")}</Btn>}
          </div>
          <p className="small muted" style={{ marginTop: 10 }}>{t("About 10 minutes: warm-up, lesson, practice, test.")}</p>
        </div>
      </Card>
      <section className="section"><h2>{t("heading|Course map")}</h2>
        <Card className="map-card mt-3"><Keyboard mode="map" id="map-kb" label={t("Keyboard showing the keys you have learned")} learned={[...ids]} upnext={up.filter(x => !ids.has(x))} /><p className="small muted cap">{t("Keys you know light up as you learn them.")}</p></Card>
      </section>
      <section className="section"><h2>{t("heading|Lessons")}</h2>
        {LESSONS.map(l => {
          const head = l.stage !== stage ? (stage = l.stage, <div className="stage-h" key={"h" + l.n}><h3>{stageName(stage)}</h3><span className="scount">{t("{d} of {total} passed", { d: cnt[stage].d, total: cnt[stage].t })}</span></div>) : null;
          return <div key={l.n} style={{ display: "contents" }}>{head}<LessonRow l={l} nx={nx} onOpen={onOpen} /></div>;
        })}
      </section>
    </>
  );
}

/* ---- the run: 3 steps of generated text ---- */
/* the active course's word set (rebuilt when the course changes) */
let WLSET: Set<string> | null = null, WLSRC: string[] | null = null;
const wlSet = () => { if (WLSRC !== WL) { WLSRC = WL; WLSET = new Set(WL); } return WLSET!; };
function stepNames(texts: string[]) {
  const ws = texts[2].split(" "), real = ws.filter(w => wlSet().has([...w.toLowerCase()].filter(c => CO.letterRe.test(c)).join(""))).length;
  return [STEP_NAMES[0], STEP_NAMES[1], real < ws.length / 2 ? "Rhythm" : "Words"]; /* English ids; shown through stepName() */
}
interface Run { n: number; step: number; texts: string[]; names: string[]; agg: { ms: number; chars: number; presses: number; correct: number; missBy: Record<string, number> }; }
type Screen = { k: "intro"; n: number } | { k: "stage"; id: number } | { k: "summary"; res: any; s: number } | { k: "results"; r: any };

function StepDone({ run, res, s, onNext, onEsc }: { run: Run; res: any; s: number; onNext: () => void; onEsc: () => void }) {
  const N = run.texts.length, n = run.n;
  useEscape(onEsc);
  useEffect(() => { countUp(); }, []);
  return (
    <div className="result">
      <Panel eyebrow={t("Lesson {n} · step {s} of {N}", { n, s, N })} title={t("{name} done", { name: stepName(run.names[s - 1]) })}
        stats={<><Pstat num={speed(res.wpm)} label={speedUnit()} /><Pstat num={pctTxt(res.acc)} label={t("Accuracy")} /></>} statsCls="c2"
        foot={<><Btn variant="ghost" onClick={() => navigate("learn")}><ChevronLeft aria-hidden="true" />{t("button|Back to lessons")}</Btn><Btn primary hint={ENTER} onClick={onNext}>{t("button|Next step")}</Btn></>}>
        <div className="upnext"><span className="label">{t("chip|Up next")}</span><span className="txt2">{t("Step {n} · {name}", { n: s + 1, name: stepName(run.names[s]) })}</span></div>
      </Panel>
    </div>
  );
}

function Results({ r, onAgain, onNext, inSession, onContinue }: { r: any; onAgain: () => void; onNext: () => void; inSession?: boolean; onContinue?: () => void }) {
  const { n, L, passed, stars, wpm, acc, pk, time, last } = r;
  useEffect(() => { countUp(); }, []);
  const msg = passed ? (last ? t("You finished the course.") : t("Lesson {n} is unlocked.", { n: n + 1 })) : t("Accuracy {acc}. You need 95% to pass. Slow down a little and keep your eyes on the screen.", { acc: pctTxt(acc) });
  const again = <Btn variant="outline" onClick={onAgain}>{t("button|Try again")}</Btn>;
  const foot = inSession ? <>{again}<Btn primary hint={ENTER} onClick={onContinue}>{t("button|Continue session")}</Btn></> : passed
    ? (last ? <>{again}<Btn primary hint={ENTER} onClick={() => navigate("learn")}>{t("button|Back to lessons")}</Btn></> : <>{again}<Btn primary hint={ENTER} onClick={onNext}>{t("button|Next lesson")}</Btn></>)
    : <><Btn variant="outline" onClick={() => navigate("learn")}>{t("button|Back to lessons")}</Btn><Btn primary hint={ENTER} onClick={onAgain}>{t("button|Try again")}</Btn></>;
  return (
    <div className="result">
      <Panel eyebrow={t("Lesson {n} · {stage}", { n, stage: stageName(L.stage) })} title={lessonTitle(L)} status={<StatusChip ok={passed} />} msg={msg}
        stats={<><Pstat num={speed(wpm)} label={speedUnit()} sub={t("target {n}", { n: speed(L.wpm) })} /><Pstat num={pctTxt(acc)} label={t("Accuracy")} sub={t("needs 95%")} /><Pstat num={time} label={t("Time")} /></>} foot={foot}>
        {passed ? <div className="stars-lg"><Stars n={stars} size={36} pop /></div> : null}
        {pk.length ? <div><span className="label">{t("Keys to watch")}</span><div className="pkrow" style={{ marginTop: 10 }}>
          {pk.map(([k, c]: [string, number]) => <span className="pk" key={k}><Cap k={k} size="sm">{k === " " ? "space" : k.toUpperCase()}</Cap>{tn(c, "{n} miss", "{n} misses")}</span>)}
        </div></div> : null}
      </Panel>
    </div>
  );
}

/* the session wiring a lesson step needs: the bar above every screen, the lesson's aggregate for the step summary, and "Continue session" */
export interface LessonSession { bar: ReactNode; onResult: (agg: { ms: number; chars: number; presses: number; correct: number }) => void; onContinue: () => void }

/* intro → 3 steps → results for one lesson; also the "Lesson" step of today's session (legacy openIntro/startLesson/runStep/stepDone/showResults) */
export function LessonFlow({ n0, session, onExit }: { n0: number; session?: LessonSession; onExit: () => void }) {
  const [screen, setScreen] = useState<Screen>({ k: "intro", n: n0 });
  const run = useRef<Run | null>(null), ids = useRef(0);
  const openIntro = (n: number) => setScreen({ k: "intro", n });
  const runStage = () => setScreen({ k: "stage", id: ++ids.current });
  const startLesson = (n: number) => {
    const texts = genLesson(n) as string[];
    run.current = { n, step: 1, texts, names: stepNames(texts), agg: { ms: 0, chars: 0, presses: 0, correct: 0, missBy: {} } };
    runStage();
  };
  const showResults = () => {
    const rn = run.current!, n = rn.n, L = LESSONS[n - 1], a = rn.agg;
    const out = applyLessonResult(n, a);
    rewardsLesson(out.celebrate);
    session?.onResult({ ms: a.ms, chars: a.chars, presses: a.presses, correct: a.correct });
    const pk = Object.entries(a.missBy).sort((x, y) => y[1] - x[1]).slice(0, 3);
    const sec = Math.round(a.ms / 1000), time = Math.floor(sec / 60) + ":" + String(sec % 60).padStart(2, "0");
    setScreen({ k: "results", r: { n, L, passed: out.passed, stars: out.stars, wpm: out.wpm, acc: out.acc, pk, time, last: n === LESSONS.length } });
  };
  const stepDone = (res: any) => {
    const rn = run.current!, a = rn.agg;
    a.ms += res.ms; a.chars += res.chars; a.presses += res.presses; a.correct += res.correct;
    for (const k in res.missBy) a.missBy[k] = (a.missBy[k] || 0) + res.missBy[k];
    if (rn.step < rn.texts.length) setScreen({ k: "summary", res, s: rn.step });
    else showResults();
  };
  const bar = session?.bar ?? null;

  if (screen.k === "stage") {
    const rn = run.current!, N = rn.texts.length;
    return <>{bar}<TypingStage key={screen.id + "-" + rn.step} opts={{
      crumb: t("Lesson {n} · Step {s} of {N} · {name}", { n: rn.n, s: rn.step, N, name: stepName(rn.names[rn.step - 1]) }), text: rn.texts[rn.step - 1], mode: S.settings.stop ? "stop" : "free",
      focus: [...ctx(rn.n).all], onFinish: stepDone, onBack: () => navigate("learn"),
    }} /></>;
  }
  if (screen.k === "intro") return <div key={"intro" + screen.n}><Screen kind="intro" />{bar}<Intro n={screen.n} onBack={onExit} onStart={() => startLesson(screen.n)} /></div>;
  if (screen.k === "summary") return <div key={"sum" + screen.s}><Screen kind="summary" />{bar}<StepDone run={run.current!} res={screen.res} s={screen.s} onNext={() => { run.current!.step++; runStage(); }} onEsc={onExit} /></div>;
  const r = screen.r;
  return <div key="results"><Screen kind="results" />{bar}<ResultsScreen r={r} inSession={!!session} onContinue={session?.onContinue} onAgain={() => startLesson(r.n)} onNext={() => openIntro(r.n + 1)} onEsc={onExit} /></div>;
}

type Top = { k: "list" } | { k: "lesson"; n: number } | { k: "session" };
export function LearnFlow() {
  useProgress();
  const [top, setTop] = useState<Top>(() => { const p = takePending(); return p ? { k: "lesson", n: p } : { k: "list" }; });
  const toList = useCallback(() => setTop({ k: "list" }), []);
  if (top.k === "lesson") return <LessonFlow n0={top.n} onExit={toList} />;
  if (top.k === "session") return <SessionFlow onExit={toList} />;
  return <div key="list"><Screen kind="learn" /><LearnList onOpen={n => setTop({ k: "lesson", n })} onSession={() => setTop({ k: "session" })} /></div>;
}

function ResultsScreen(p: { r: any; onAgain: () => void; onNext: () => void; onEsc: () => void; inSession: boolean; onContinue?: () => void }) {
  useEscape(p.onEsc);
  return <Results r={p.r} onAgain={p.onAgain} onNext={p.onNext} inSession={p.inSession} onContinue={p.onContinue} />;
}
