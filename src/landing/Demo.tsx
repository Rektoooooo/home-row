import { memo, useEffect } from "react";
import { startDemo } from "./demo/engine";
import { DROWS, KF, FNAME, SENT, SHIFTED, keyParts } from "./demo/data";
import { v } from "./util";

/* The key the demo starts on (sentence 1, "E": shift + e), so the prerendered page already shows a lit key. */
const FIRST = SENT[0][0];
const NEXT = new Set(["e", "shr"]);

function Key({ def }: { def: (typeof DROWS)[number][number] }) {
  const { l, w, c, id, f, hm } = keyParts(def);
  const dual = c.includes("dual");
  const lg = dual ? (<><i>{SHIFTED[l]}</i><i>{l}</i></>) : /[a-z]/.test(l) && l.length === 1 ? l.toUpperCase() : l;
  return (
    <span className={"key " + c + (hm ? " hm" : "") + (NEXT.has(id) ? " next" : "")} data-id={id} data-f={f} style={v("--w:" + w)}>
      <span className="lg">{lg}</span>
    </span>
  );
}

/* Prerendered at rest; startDemo() then drives it through the DOM, so this component never re-renders. */
export const Demo = memo(function Demo() {
  useEffect(() => startDemo(), []);
  return (
    <div className="demo rv" style={v("--dl:.32s")} id="demo" role="img" aria-label="Animated preview of Home Row: a sentence is typed at a natural pace, with a few mistakes that get fixed with backspace, while the keys light up on a keyboard">
      <div className="tcard" aria-hidden="true">
        <div className="tc-top">
          <div className="tc-ey">Real text · <span id="dStep">1</span> of 4</div>
          <div className="fchip" id="dChip" style={v("--fc:var(--f-" + FNAME[KF[FIRST.toLowerCase()]] + ")")}><i></i><kbd id="dKey">{"⇧ " + FIRST}</kbd><span><span id="dFin">Left middle</span><span className="w"> finger</span></span></div>
        </div>
        <div className="tview" id="dView"><div className="tline" id="dLine"><span className="tcaret" id="dCaret"></span><span id="dText">{[...SENT[0]].map((ch, i) => <span className="c" key={i}>{ch}</span>)}</span></div></div>
        <div className="stats">
          <div className="st"><b id="dWpm">–</b><span>WPM</span></div>
          <div className="st"><b id="dAcc">100%</b><span>Accuracy</span></div>
          <div className="st"><b id="dCnt">0</b><span>Typed</span></div>
          <div className="prog"><i id="dProg"></i></div>
        </div>
      </div>
      <div className="deck" aria-hidden="true"><div className="plate" id="dKb">{DROWS.map((r, i) => <div className="krow" key={i}>{r.map((k, j) => <Key def={k} key={j} />)}</div>)}</div></div>
    </div>
  );
});
