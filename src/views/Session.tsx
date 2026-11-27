/* TODAY'S SESSION: warm-up → lesson → practice → test/review with the session bar, the per-step summaries and the "Session done" screen.
   Ported from legacy/src/app7.js. The session lives in memory only (the Learn tab remounts on any route change, which ends it). */
import { lessonTitle } from "@/core/data";
import { useState, type ReactNode } from "react";
import { Check, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Btn, Cap, ENTER, Panel, Pstat } from "@/components/parts";
import { S } from "@/core/state";
import { LESSONS, charInfo } from "@/core/data";
import { minutesToday, pctTxt, poolLetters, streak, stepLabel } from "@/core/stats";
import { t, tn, tx, speed, speedUnit, pct } from "@/i18n";
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
    <div className={cn("sbar", noEnd && "noend")} role="navigation" aria-label={t("Today's session")}>
      <span className="sname sb-desk">{t("Today's session")}</span>
      <span className="spills sb-desk">
        {sess.steps.map((s, k) => (
          <span key={k} className={cn("spill", k < sess.i ? "done" : k === sess.i && "cur")} aria-current={k === sess.i ? "step" : undefined}>
            {k < sess.i ? <Check size={10} strokeWidth={2} aria-hidden="true" style={{ marginRight: 5 }} /> : null}{stepLabel(s)}
          </span>
        ))}
      </span>
      <div className="sb-mob"><span className="t">{t("Step {i} of {n} · {label}", { i: i + 1, n, label: stepLabel(sess.steps[i]) })}</span><span className="segs" aria-hidden="true">{sess.steps.map((_, k) => <i key={k} className={k < sess.i ? "d" : undefined} />)}</span></div>
      <Btn variant="ghost" size="sm" className="sx" aria-label={t("End session")} tabIndex={noEnd ? -1 : undefined} aria-hidden={noEnd || undefined} onClick={onEnd}><X aria-hidden="true" /><span className="sx-t">{t("button|End session")}</span></Btn>
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
    inner = <><span className="caps">{L.shift ? <Cap size="xs" finger="LP">shift</Cap> : (L.keys as string[]).map(k => <Cap key={k} size="xs" k={k} finger={(charInfo(k) || { key: { f: "TH" } }).key.f} />)}</span><span className="txt2">{t("Lesson {n} · {title}", { n: st.n!, title: lessonTitle(L) })}</span></>;
  } else if (st.id === "test") inner = <span className="txt2">{t("60 seconds")}</span>;
  else {
    const f = predictFocus(sess.focus.map(x => x.focus));
    inner = <>{f ? <span className="caps">{[...f].map((c, i) => <Cap key={i} size="xs" k={c} />)}</span> : null}<span className="txt2">{tn(st.rounds!, "{n} round", "{n} rounds")}</span></>;
  }
  return <div className="upnext"><span className="label">{t("chip|Up next")}</span>{inner}</div>;
}

function Between({ scr, sess, onContinue, onEnd }: { scr: Extract<Scr, { k: "between" }>; sess: Session; onContinue: () => void; onEnd: () => void }) {
  return (
    <div className="result">
      <Panel eyebrow={t("Step {i} of {n}", { i: sess.i, n: sess.steps.length })} title={t("{name} done", { name: stepLabel(scr.st) })}
        stats={<><Pstat num={speed(scr.r.wpm)} label={speedUnit()} /><Pstat num={pctTxt(scr.r.acc)} label={t("Accuracy")} /></>} statsCls="c2"
        foot={<><Btn variant="ghost" onClick={onEnd}><X aria-hidden="true" />{t("button|End session")}</Btn><Btn primary hint={ENTER} onClick={onContinue}>{t("button|Continue")}</Btn></>}>
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
      <Panel eyebrow={t("Today's session")} title={t("Session done")} msg={best ? tx("Most improved: {key}, {before} → {after} {unit}.", { key: <b>{best.focus.toUpperCase()}</b>, before: speed(best.before), after: speed(best.after), unit: speedUnit() }) : undefined}
        stats={<><Pstat num={all.ms ? speed(all.wpm) : "–"} label={t("Average {unit}", { unit: speedUnit() })} /><Pstat num={all.presses ? pct(Math.round(all.acc * 100) + "%") : "–"} label={t("Average accuracy")} /><Pstat num={tn(st, "{n} day", "{n} days")} label={t("label|Streak")} /></>} statsCls="c3"
        foot={<>{d.more ? <Btn variant="outline" onClick={onMore}>{t("button|One more practice round")}</Btn> : null}<Btn primary hint={ENTER} onClick={onBack}>{t("button|Back to Learn")}</Btn></>}>
        <div>
          <div className="label" style={{ display: "flex", justifyContent: "space-between" }}><span>{t("Practised today")}</span><span>{t("{m} of {g} min", { m: Math.floor(m), g })}</span></div>
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
      o={{ avoid: sess.focus.map(f => f.focus), crumb: st.rounds! > 1 ? t("{label} {i} of {n}", { label: stepLabel(st), i: sess.round + 1, n: st.rounds! }) : stepLabel(st), back: onExit }}
      onDone={(res, info) => { sess.rs.push(res); sess.focus.push(info); sess.round++; setScr(sess.round < st.rounds! ? { k: "round", id: ++ids } : stepFinished(sess)); }} /></>;
  }
  if (scr.k === "test") return <>{bar}<TestRun key={scr.id} dur={60} o={{ pool: "c200", caps: false, punct: false, nums: false }} onBack={onExit} onDone={res => { sess.rs.push(res); setScr(stepFinished(sess)); }} /></>;
  if (scr.k === "more") return <AdaptiveRound key={scr.id} o={{}} onBack={onExit} onDone={onExit} />;
  if (scr.k === "between") return <div key={"b" + scr.id}><Screen kind="session" /><SessionBar sess={sess} noEnd onEnd={onExit} /><Between scr={scr} sess={sess} onContinue={() => setScr(runStep(sess))} onEnd={onExit} /></div>;
  return <div key="done"><Screen kind="session" /><Done d={scr.d} onBack={onExit} onMore={() => setScr({ k: "more", id: ++ids })} /></div>;
}
