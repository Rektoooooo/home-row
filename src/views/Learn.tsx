/* LEARN: Today card, Course map, Lessons list, lesson intro, the 3-step run, step summaries and lesson results.
   Ported from legacy/src/app4.js (renderLearn, openIntro, startLesson, runStep, stepDone, showResults). */
import { useCallback, useEffect, useRef, useState } from "react";
import { Check, ChevronLeft, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Btn, Cap, ENTER, Panel, Pstat, Stars, StatusChip } from "@/components/parts";
import { Keyboard, Hands } from "@/components/Keyboard";
import { TypingStage } from "@/components/TypingStage";
import { S } from "@/core/state";
import { FING, LAY, LESSONS, STEP_NAMES, WL, charInfo, idsFor, reach } from "@/core/data";
import { genLesson, ctx } from "@/core/generate";
import { applyLessonResult, lessonDone, learnedChars, minutesToday, nextLessonN, pctTxt, streak, unlocked, weakestKey } from "@/core/stats";
import { levelInfo, rewardsLesson } from "@/core/rewards";
import { useProgress } from "@/lib/progress";
import { useEscape } from "@/lib/escape";
import { navigate, takePending } from "@/lib/route";
import { reduceMotion } from "@/ui/engine";
import { countUp } from "@/ui/countup";
import { cn } from "@/lib/utils";

/* bars grow from 0 on a fresh screen (not under reduced motion) */
function useGrown(v: number) {
  const [x, setX] = useState(reduceMotion() ? v : 0);
  useEffect(() => { const id = requestAnimationFrame(() => requestAnimationFrame(() => setX(v))); return () => cancelAnimationFrame(id); }, [v]);
  return x;
}

function LevelRow() {
  const L = levelInfo(), left = L.need - L.into, v = useGrown(L.pct);
  return (
    <div className="lvl"><span className="lvl-n">Level {L.level}</span><Progress className="bar bg-sunken" value={v} aria-hidden="true" /><span className="lvl-t">{left} {left === 1 ? "word" : "words"} to level {L.level + 1}</span></div>
  );
}

function IntroLine({ ch }: { ch: string }) {
  const i = charInfo(ch); if (!i) return null;
  const k = i.key, f = FING[k.f], r = reach(k.id), show = ch.toUpperCase();
  if (i.shift) {
    const sn = i.shiftId === "ShiftLeft" ? "left" : "right", sf = FING[LAY().byId[i.shiftId].f].n, base = k.base.toUpperCase();
    return <><strong>{ch}</strong> · Shift + {base}. Hold {sn} Shift with your {sf}, then press {base} with your {f.n}.</>;
  }
  if (r.home) { const bump = (k.id === "KeyF" || k.id === "KeyJ") ? " Feel the bump." : ""; return <><strong>{show}</strong> · {f.n}. This is a home key. Rest the finger here.{bump}</>; }
  return <><strong>{show}</strong> · {f.n}. From {r.from}, reach {r.phrase} and come back.</>;
}

function Intro({ n, onStart, onBack }: { n: number; onStart: () => void; onBack: () => void }) {
  const L = LESSONS[n - 1];
  const ids: string[] = L.shift ? ["ShiftLeft", "ShiftRight"] : idsFor(L.keys) as string[];
  const fingers = [...new Set(ids.map(id => LAY().byId[id]).filter(Boolean).map((k: any) => k.f))] as string[];
  const extra = n === 1 ? "Rest your left fingers on A S D F and your right fingers on J K L ;. Feel the bumps on F and J. Thumbs rest on the space bar." :
    L.shift ? "Capitals use the Shift key on the opposite hand. Press and hold Shift, tap the letter, then let go of both." :
    L.punct ? "The apostrophe and quote keys are accent keys on your U.S. International layout. When one comes before a space, press the mark and then Space. The app accepts that." : "";
  useEscape(onBack);
  let lines;
  if (L.review) lines = <li><p>No new keys. This lesson mixes everything you know so far, with extra weight on your slower keys.</p></li>;
  else if (L.shift) lines = [["ShiftLeft", "Left Shift", "Hold it with your left pinky for capitals typed with your right hand."], ["ShiftRight", "Right Shift", "Hold it with your right pinky for capitals typed with your left hand."]]
    .map(x => <li key={x[0]}><Cap size="md" finger={LAY().byId[x[0]].f}>shift</Cap><p><strong>{x[1]}</strong> · {x[2]}</p></li>);
  else lines = L.keys.map((ch: string) => <li key={ch}><Cap k={ch} size="md" /><p><IntroLine ch={ch} /></p></li>);
  return (
    <div className="intro">
      <Panel eyebrow={L.stage} title={<>Lesson {n} · {L.title}</>} msg={extra || undefined}
        foot={<><Btn variant="ghost" onClick={() => navigate("learn")}><ChevronLeft aria-hidden="true" />Back to lessons</Btn><Btn primary hint={ENTER} onClick={onStart}>Start lesson</Btn></>}>
        <ul className="keylist">{lines}</ul>
      </Panel>
      <div className="kbwrap" style={{ width: "100%" }}><Keyboard mode="stage" id="kb" next={ids} /><Hands id="hands" fingers={fingers} /></div>
    </div>
  );
}

function LessonRow({ l, nx, onOpen }: { l: any; nx: number; onOpen: (n: number) => void }) {
  const r = S.lessons[l.n], lock = !unlocked(l.n), isNext = l.n === nx, done = lessonDone(l.n);
  const keyTxt = l.shift ? "Both Shift keys" : l.review ? "Mixed review" : (l.keys.map((k: string) => FING[(charInfo(k) || { key: { f: "TH" } }).key.f].n) as string[]).filter((v: string, i: number, a: string[]) => a.indexOf(v) === i).join(" and ");
  return (
    <button className={cn("lrow", lock && "locked", isNext && "next")} type="button" data-n={l.n} aria-disabled={lock || undefined} onClick={lock ? undefined : () => onOpen(l.n)}>
      <span className="lnum">{l.n}{done ? <span className="ckb"><Check size={10} strokeWidth={2} aria-hidden="true" /></span> : null}</span>
      <span className="ltitle">{l.title}{isNext ? <Badge className="upchip ml-2 inline-flex h-auto rounded-full px-2 py-0.5 align-[2px] font-heading text-[11px] leading-[1.4] font-semibold tracking-[.04em] uppercase">Up next</Badge> : null}</span>
      <span className="lsub">{lock ? "Pass lesson " + (l.n - 1) + " to unlock" : keyTxt}</span>
      <span className="lmeta">
        {lock ? <Lock className="lock" role="img" aria-label="Locked" strokeWidth={2} /> : <>
          <Stars n={r ? r.stars : 0} size={16} />
          {r && r.attempts ? <><span>{Math.round(r.wpm)} WPM</span><span>{Math.round(r.acc * 100)}%</span></> : <span className="muted">Not started</span>}
        </>}
      </span>
    </button>
  );
}

function LearnList({ onOpen, onSession }: { onOpen: (n: number) => void; onSession: (nx: number) => void }) {
  const nx = nextLessonN(), L = nx ? LESSONS[nx - 1] : null, m = minutesToday(), g = S.settings.goal, st = streak(), wk = weakestKey() as string | null;
  const bar = useGrown(Math.min(100, m / g * 100));
  const lc = learnedChars(), ids = new Set(idsFor([...lc]) as string[]);
  if (lessonDone(19)) { ids.add("ShiftLeft"); ids.add("ShiftRight"); }
  const up: string[] = L ? (L.shift ? ["ShiftLeft", "ShiftRight"] : idsFor(L.keys) as string[]) : [];
  const cnt: Record<string, { d: number; t: number }> = {};
  LESSONS.forEach(l => { const c = cnt[l.stage] || (cnt[l.stage] = { d: 0, t: 0 }); c.t++; if (lessonDone(l.n)) c.d++; });
  let stage = "";
  return (
    <>
      <h1 className="vh">Learn</h1>
      <Card className="today p-6 max-[560px]:p-[18px]">
        <div>
          <span className="label">Today</span>
          {L ? <h1>Lesson {nx} · {L.title}</h1> : <h1>All lessons passed</h1>}
          <div className="today-stats">
            <span><b>{Math.floor(m)}</b> of {g} min today</span>
            <span><b>{st}</b> day{st === 1 ? "" : "s"} streak</span>
            {wk ? <span>Weakest key: <a href="#practice" style={{ color: "inherit" }}><b>{wk.toUpperCase()}</b></a></span> : null}
          </div>
          <Progress className="bar bg-sunken mt-3.5 h-1.5 max-w-[380px]" value={bar} aria-hidden="true" />
          <LevelRow />
        </div>
        <div className="today-act">
          <div className="actions">
            {/* TODO(phase4): Today's session; for now it opens the next lesson */}
            <Btn primary hint={ENTER} onClick={() => onSession(nx || 1)}>Start today's session</Btn>
            {L ? <Btn variant="outline" onClick={() => onOpen(nx)}>Lesson {nx} only</Btn> : <Btn variant="outline" onClick={() => onOpen(1)}>Repeat lesson 1</Btn>}
          </div>
          <p className="small muted" style={{ marginTop: 10 }}>About 10 minutes: warm-up, lesson, practice, test.</p>
        </div>
      </Card>
      <section className="section"><h2>Course map</h2>
        <Card className="map-card mt-3"><Keyboard mode="map" id="map-kb" label="Keyboard showing the keys you have learned" learned={[...ids]} upnext={up.filter(x => !ids.has(x))} /><p className="small muted cap">Keys you know light up as you learn them.</p></Card>
      </section>
      <section className="section"><h2>Lessons</h2>
        {LESSONS.map(l => {
          const head = l.stage !== stage ? (stage = l.stage, <div className="stage-h" key={"h" + l.n}><h3>{stage}</h3><span className="scount">{cnt[stage].d} of {cnt[stage].t} passed</span></div>) : null;
          return <div key={l.n} style={{ display: "contents" }}>{head}<LessonRow l={l} nx={nx} onOpen={onOpen} /></div>;
        })}
      </section>
    </>
  );
}

/* ---- the run: 3 steps of generated text ---- */
const WLSET = new Set(WL as string[]);
function stepNames(texts: string[]) {
  const t = texts[2].split(" "), real = t.filter(w => WLSET.has(w.replace(/[^A-Za-z]/g, "").toLowerCase())).length;
  return [STEP_NAMES[0], STEP_NAMES[1], real < t.length / 2 ? "Rhythm" : "Words"];
}
interface Run { n: number; step: number; texts: string[]; names: string[]; agg: { ms: number; chars: number; presses: number; correct: number; missBy: Record<string, number> }; }
type Screen = { k: "list" } | { k: "intro"; n: number } | { k: "stage"; id: number } | { k: "summary"; res: any; s: number } | { k: "results"; r: any };

function StepDone({ run, res, s, onNext, onEsc }: { run: Run; res: any; s: number; onNext: () => void; onEsc: () => void }) {
  const N = run.texts.length, n = run.n;
  useEscape(onEsc);
  useEffect(() => { countUp(); }, []);
  return (
    <div className="result">
      <Panel eyebrow={<>Lesson {n} · step {s} of {N}</>} title={<>{run.names[s - 1]} done</>}
        stats={<><Pstat num={Math.round(res.wpm)} label="WPM" /><Pstat num={pctTxt(res.acc)} label="Accuracy" /></>} statsCls="c2"
        foot={<><Btn variant="ghost" onClick={() => navigate("learn")}><ChevronLeft aria-hidden="true" />Back to lessons</Btn><Btn primary hint={ENTER} onClick={onNext}>Next step</Btn></>}>
        <div className="upnext"><span className="label">Up next</span><span className="txt2">Step {s + 1} · {run.names[s]}</span></div>
      </Panel>
    </div>
  );
}

function Results({ r, onAgain, onNext }: { r: any; onAgain: () => void; onNext: () => void }) {
  const { n, L, passed, stars, wpm, acc, pk, time, last } = r;
  useEffect(() => { countUp(); }, []);
  const msg = passed ? (last ? "You finished the course." : "Lesson " + (n + 1) + " is unlocked.") : "Accuracy " + pctTxt(acc) + ". You need 95% to pass. Slow down a little and keep your eyes on the screen.";
  const again = <Btn variant="outline" onClick={onAgain}>Try again</Btn>;
  const foot = passed
    ? (last ? <>{again}<Btn primary hint={ENTER} onClick={() => navigate("learn")}>Back to lessons</Btn></> : <>{again}<Btn primary hint={ENTER} onClick={onNext}>Next lesson</Btn></>)
    : <><Btn variant="outline" onClick={() => navigate("learn")}>Back to lessons</Btn><Btn primary hint={ENTER} onClick={onAgain}>Try again</Btn></>;
  return (
    <div className="result">
      <Panel eyebrow={<>Lesson {n} · {L.stage}</>} title={L.title} status={<StatusChip ok={passed} />} msg={msg}
        stats={<><Pstat num={Math.round(wpm)} label="WPM" sub={"target " + L.wpm} /><Pstat num={pctTxt(acc)} label="Accuracy" sub="needs 95%" /><Pstat num={time} label="Time" /></>} foot={foot}>
        {passed ? <div className="stars-lg"><Stars n={stars} size={36} pop /></div> : null}
        {pk.length ? <div><span className="label">Keys to watch</span><div className="pkrow" style={{ marginTop: 10 }}>
          {pk.map(([k, c]: [string, number]) => <span className="pk" key={k}><Cap k={k} size="sm">{k === " " ? "space" : k.toUpperCase()}</Cap>{c} {c === 1 ? "miss" : "misses"}</span>)}
        </div></div> : null}
      </Panel>
    </div>
  );
}

export function LearnFlow() {
  useProgress();
  const [screen, setScreen] = useState<Screen>(() => { const p = takePending(); return p ? { k: "intro", n: p } : { k: "list" }; });
  const run = useRef<Run | null>(null), ids = useRef(0);
  const toList = useCallback(() => setScreen({ k: "list" }), []);
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

  if (screen.k === "stage") {
    const rn = run.current!, N = rn.texts.length;
    return <TypingStage key={screen.id + "-" + rn.step} opts={{
      crumb: "Lesson " + rn.n + " · Step " + rn.step + " of " + N + " · " + rn.names[rn.step - 1], text: rn.texts[rn.step - 1], mode: S.settings.stop ? "stop" : "free",
      focus: [...ctx(rn.n).all], onFinish: stepDone, onBack: () => navigate("learn"),
    }} />;
  }
  if (screen.k === "intro") return <div key={"intro" + screen.n} className="view-in"><Intro n={screen.n} onBack={toList} onStart={() => startLesson(screen.n)} /></div>;
  if (screen.k === "summary") return <div key={"sum" + screen.s} className="view-in"><StepDone run={run.current!} res={screen.res} s={screen.s} onNext={() => { run.current!.step++; runStage(); }} onEsc={toList} /></div>;
  if (screen.k === "results") return <div key="results" className="view-in"><ResultsScreen r={screen.r} onAgain={() => startLesson(screen.r.n)} onNext={() => openIntro(screen.r.n + 1)} onEsc={toList} /></div>;
  return <div key="list" className="view-in"><LearnList onOpen={openIntro} onSession={openIntro} /></div>;
}

function ResultsScreen(p: { r: any; onAgain: () => void; onNext: () => void; onEsc: () => void }) {
  useEscape(p.onEsc);
  return <Results r={p.r} onAgain={p.onAgain} onNext={p.onNext} />;
}
