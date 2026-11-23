import { v } from "./util";

const FINGERS = ["pinky", "ring", "middle", "index", "index", "middle", "ring", "pinky"];
const ROWS: { a: string; d: string; k: string[]; dl?: string }[] = [
  { a: "Start or continue", d: "Move on without reaching for the mouse", k: ["Enter"] },
  { a: "Restart", d: "Try the lesson again from the top", k: ["Esc"], dl: "--dl:.05s" },
  { a: "Fix a mistake", d: "Step back and type it right", k: ["Backspace"], dl: "--dl:.1s" },
  { a: "Delete a word", d: "Take back a whole word at once", k: ["Option", "Backspace"], dl: "--dl:.15s" },
];

export function Shortcuts() {
  return (
    <section className="band kband" aria-labelledby="kbh">
      <div className="rail">
        <div>
          <h2 className="h2 rv" id="kbh">Made for the keyboard.</h2>
          <p className="lead rv" style={v("--dl:.06s;margin-top:18px")}>No mouse needed, so your hands never leave the home row.</p>
          <div className="hands rv" style={v("--dl:.12s")}><span className="hr-strip" aria-hidden="true">{FINGERS.map((f, i) => <i key={i} style={v("--fc:var(--f-" + f + ")")}></i>)}</span></div>
        </div>
        <ul className="srows">
          {ROWS.map((r) => (
            <li className="rv" style={r.dl ? v(r.dl) : undefined} key={r.a}><span className="a">{r.a}</span><span className="d">{r.d}</span><span className="kk">{r.k.map((k) => <kbd key={k}>{k}</kbd>)}</span></li>
          ))}
        </ul>
      </div>
    </section>
  );
}
