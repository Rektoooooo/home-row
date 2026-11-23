/* The typing stage: stage bar (Back / crumb / Restart), live stats, sheet, tip, hint pill, keyboard + hands.
   Markup is rendered once; the imperative engine (ui/engine.ts) drives everything inside it. */
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, RotateCcw } from "lucide-react";
import { Btn } from "@/components/parts";
import { Screen } from "@/lib/screen";
import { createExercise, stopExercise, focusSink, currentExercise } from "@/ui/engine";

export interface StageOpts {
  crumb: string; text: string; mode: "stop" | "free"; focus?: string[] | null; pace?: number; code?: boolean; more?: () => string | null;
  timeLimit?: number; noKb?: boolean; noStats?: boolean; delay?: number; onFinish: (res: any) => void; onBack?: () => void;
}

function Stage({ opts, onRestart }: { opts: StageOpts; onRestart: () => void }) {
  const root = useRef<HTMLElement>(null), tip = useRef<HTMLDivElement>(null);
  const latest = useRef(opts); latest.current = opts;
  useEffect(() => {
    const o = latest.current;
    createExercise({ ...o, onRestart, onFinish: (r: any) => latest.current.onFinish(r) }, root.current!);
    return () => stopExercise();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const o = opts;
  return (
    <section className="stage" id="stage" ref={root}>
      <div className="stage-bar">
        <Btn variant="ghost" size="sm" onClick={() => o.onBack?.()}><ChevronLeft aria-hidden="true" />Back</Btn>
        <div className="crumb">{o.crumb}</div>
        <Btn variant="outline" size="sm" onClick={() => currentExercise()?.restart()}><RotateCcw aria-hidden="true" />Restart<span className="kh" aria-hidden="true">esc</span></Btn>
      </div>
      <div className="live">
        <div className="stat"><span className="num" id="l-wpm">0</span><span className="label">WPM</span></div>
        <div className="stat"><span className="num" id="l-acc">100%</span><span className="label">Accuracy</span></div>
        <div className="stat"><span className="num" id="l-prog">0</span><span className="label" id="l-prog-l">Typed</span></div>
        {o.pace ? <div className="stat pace" title="The faint second cursor moves at this speed"><i className="gb" aria-hidden="true" /><span className="label">Pace</span><span className="num" id="l-pace">{Math.round(o.pace)}</span><span className="label">WPM</span></div> : null}
      </div>
      <div className="sheet" id="sheet">
        <div className="vp" id="vp"><div className="txt" id="txt" /></div>
        <div className="pause" id="pause" hidden role="button" tabIndex={0}>Paused. Click here or press any key to continue.</div>
      </div>
      <div className="tip" id="tip" hidden ref={tip}>
        <p id="tip-t" />
        <Btn variant="outline" size="sm" onClick={() => { if (tip.current) tip.current.hidden = true; if (currentExercise()) focusSink(); }}>Got it</Btn>
      </div>
      <div className="hint" id="hint" aria-live="off" />
      <div className="kbwrap" id="kbwrap"><svg className="kb" id="kb" role="img" aria-label="Keyboard" /><svg className="hands" id="hands" role="img" aria-label="Hands" /></div>
    </section>
  );
}

/* Restart (button or Esc) remounts the stage with the same options, like legacy mountStage(o) */
export function TypingStage({ opts }: { opts: StageOpts }) {
  const [nonce, setNonce] = useState(0);
  return <><Screen kind="stage" /><Stage key={nonce} opts={opts} onRestart={() => setNonce(n => n + 1)} /></>;
}
