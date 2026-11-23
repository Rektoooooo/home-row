/* TODAY'S SESSION: warm-up → lesson → practice → test/review with the session bar, the per-step summaries and the "Session done" screen.
   Ported from legacy/src/app7.js. The session lives in memory only (the Learn tab remounts on any route change, which ends it). */
import { useState, type ReactNode } from "react";
import { Check, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Btn, Cap, ENTER, Panel, Pstat } from "@/components/parts";
import { S } from "@/core/state";
import { LESSONS, charInfo } from "@/core/data";
import { minutesToday, pctTxt, poolLetters, streak } from "@/core/stats";
import { buildSteps, mostImproved, predictFocus, sumRes, type Session, type SessionStep } from "@/core/flows";
import { useEscape } from "@/lib/escape";
import { Screen } from "@/lib/screen";
import { LessonFlow } from "@/views/Learn";
import { AdaptiveRound } from "@/views/Practice";
import { TestRun } from "@/views/Test";
import { cn } from "@/lib/utils";
import "@/styles/drills.css";

/* desktop: name + step pills; mobile: "Step i of n · label" + segment bar; noEnd hides the End button (summary screens have their own) */
export function SessionBar({ sess, noEnd, onEnd }: { sess: Session; noEnd?: boolean; onEnd: () => void }) {
  const n = sess.steps.length, i = Math.min(sess.i, n - 1);
  return (
    <div className={cn("sbar", noEnd && "noend")} role="navigation" aria-label="Today's session">
      <span className="sname sb-desk">Today's session</span>
      <span className="spills sb-desk">
        {sess.steps.map((s, k) => (
          <span key={k} className={cn("spill", k < sess.i ? "done" : k === sess.i && "cur")} aria-current={k === sess.i ? "step" : undefined}>
            {k < sess.i ? <Check size={10} strokeWidth={2} aria-hidden="true" style={{ marginRight: 5 }} /> : null}{s.label}
          </span>
        ))}
      </span>
      <div className="sb-mob"><span className="t">Step {i + 1} of {n} · {sess.steps[i].label}</span><span className="segs" aria-hidden="true">{sess.steps.map((_, k) => <i key={k} className={k < sess.i ? "d" : undefined} />)}</span></div>
      <Btn variant="ghost" size="sm" className="sx" aria-label="End session" tabIndex={noEnd ? -1 : undefined} aria-hidden={noEnd || undefined} onClick={onEnd}><X aria-hidden="true" /><span className="sx-t">End session</span></Btn>
    </div>
  );
}

type Scr =
  | { k: "lesson" | "round" | "test" | "more"; id: number; d?: undefined }
  | { k: "between"; id: number; st: SessionStep; r: any; nx: SessionStep; d?: undefined }
  | { k: "done"; d: any };
let ids = 0;

/* runSessionStep: the screen for step sess.i (steps with an empty practice pool are skipped) */
function runStep(sess: Session): Scr {
  const st = sess.steps[sess.i];
  if (!st) return doneScreen(sess);
  sess.round = 0; sess.rs = [];
  if (st.id === "lesson") return { k: "lesson", id: ++ids };
  if (st.id === "test") return { k: "test", id: ++ids };
  if (!poolLetters().length) { sess.i++; return runStep(sess); }
  return { k: "round", id: ++ids };
}
/* stepFinished: add the step to the totals, then the summary screen (or the end) */
function stepFinished(sess: Session): Scr {
  const st = sess.steps[sess.i], r = sumRes(sess.rs);
  sess.all.push(...sess.rs); sess.i++;
  const nx = sess.steps[sess.i];
  if (!nx) return doneScreen(sess);
  return { k: "between", id: ++ids, st, r, nx };
}
function doneScreen(sess: Session): Scr {
  const all = sumRes(sess.all), m = minutesToday(), g = S.settings.goal, st = streak(), best = mostImproved(sess.focus);
  return { k: "done", d: { all, m, g, st, best, more: m < g && poolLetters().length > 0 } };
}

function UpNext({ st, sess }: { st: SessionStep; sess: Session }) {
  let inner: ReactNode;
  if (st.id === "lesson") {
    const L = LESSONS[st.n! - 1];
    inner = <><span className="caps">{L.shift ? <Cap size="xs" finger="LP">shift</Cap> : (L.keys as string[]).map(k => <Cap key={k} size="xs" k={k} finger={(charInfo(k) || { key: { f: "TH" } }).key.f} />)}</span><span className="txt2">Lesson {st.n} · {L.title}</span></>;
  } else if (st.id === "test") inner = <span className="txt2">60 seconds</span>;
  else {
    const f = predictFocus(sess.focus.map(x => x.focus));
    inner = <>{f ? <span className="caps">{[...f].map((c, i) => <Cap key={i} size="xs" k={c} />)}</span> : null}<span className="txt2">{st.rounds}{st.rounds === 1 ? " round" : " rounds"}</span></>;
  }
  return <div className="upnext"><span className="label">Up next</span>{inner}</div>;
}

function Between({ scr, sess, onContinue, onEnd }: { scr: Extract<Scr, { k: "between" }>; sess: Session; onContinue: () => void; onEnd: () => void }) {
  return (
    <div className="result">
      <Panel eyebrow={"Step " + sess.i + " of " + sess.steps.length} title={<>{scr.st.label} done</>}
        stats={<><Pstat num={Math.round(scr.r.wpm)} label="WPM" /><Pstat num={pctTxt(scr.r.acc)} label="Accuracy" /></>} statsCls="c2"
        foot={<><Btn variant="ghost" onClick={onEnd}><X aria-hidden="true" />End session</Btn><Btn primary hint={ENTER} onClick={onContinue}>Continue</Btn></>}>
        <UpNext st={scr.nx} sess={sess} />
      </Panel>
    </div>
  );
}

function Done({ d, onBack, onMore }: { d: any; onBack: () => void; onMore: () => void }) {
  useEscape(onBack);
  const { all, m, g, st, best } = d;
  return (
    <div className="result">
      <Panel eyebrow="Today's session" title="Session done" msg={best ? <>Most improved: <b>{best.focus.toUpperCase()}</b>, {best.before} → {best.after} WPM.</> : undefined}
        stats={<><Pstat num={all.ms ? Math.round(all.wpm) : "–"} label="Average WPM" /><Pstat num={all.presses ? Math.round(all.acc * 100) + "%" : "–"} label="Average accuracy" /><Pstat num={st + " day" + (st === 1 ? "" : "s")} label="Streak" /></>} statsCls="c3"
        foot={<>{d.more ? <Btn variant="outline" onClick={onMore}>One more practice round</Btn> : null}<Btn primary hint={ENTER} onClick={onBack}>Back to Learn</Btn></>}>
        <div>
          <div className="label" style={{ display: "flex", justifyContent: "space-between" }}><span>Practised today</span><span>{Math.floor(m)} of {g} min</span></div>
          <Progress className="bar bg-sunken mt-2 h-1.5 max-w-none" value={Math.min(100, m / g * 100)} aria-hidden="true" />
        </div>
      </Panel>
    </div>
  );
}

export function SessionFlow({ onExit }: { onExit: () => void }) {
  const [init] = useState(() => { const sess: Session = { steps: buildSteps() as SessionStep[], i: 0, round: 0, rs: [], all: [], focus: [] }; return { sess, scr: runStep(sess) }; });
  const sess = init.sess;
  const [scr, setScr] = useState<Scr>(init.scr);
  const bar = <SessionBar sess={sess} onEnd={onExit} />;

  if (scr.k === "lesson") {
    const st = sess.steps[sess.i];
    return <LessonFlow key={scr.id} n0={st.n!} onExit={onExit} session={{ bar, onResult: agg => { sess.rs = [agg]; }, onContinue: () => setScr(stepFinished(sess)) }} />;
  }
  if (scr.k === "round") {
    const st = sess.steps[sess.i];
    return <>{bar}<AdaptiveRound key={scr.id} onBack={onExit}
      o={{ avoid: sess.focus.map(f => f.focus), crumb: st.label + (st.rounds! > 1 ? " " + (sess.round + 1) + " of " + st.rounds : ""), back: onExit }}
      onDone={(res, info) => { sess.rs.push(res); sess.focus.push(info); sess.round++; setScr(sess.round < st.rounds! ? { k: "round", id: ++ids } : stepFinished(sess)); }} /></>;
  }
  if (scr.k === "test") return <>{bar}<TestRun key={scr.id} dur={60} o={{ pool: "c200", caps: false, punct: false, nums: false }} onBack={onExit} onDone={res => { sess.rs.push(res); setScr(stepFinished(sess)); }} /></>;
  if (scr.k === "more") return <AdaptiveRound key={scr.id} o={{}} onBack={onExit} onDone={onExit} />;
  if (scr.k === "between") return <div key={"b" + scr.id}><Screen kind="session" /><SessionBar sess={sess} noEnd onEnd={onExit} /><Between scr={scr} sess={sess} onContinue={() => setScr(runStep(sess))} onEnd={onExit} /></div>;
  return <div key="done"><Screen kind="session" /><Done d={scr.d} onBack={onExit} onMore={() => setScr({ k: "more", id: ++ids })} /></div>;
}
