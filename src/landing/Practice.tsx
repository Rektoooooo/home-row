import { useRef, useState } from "react";
import { v } from "./util";

const TABS = [
  { id: "real", label: "Real text" },
  { id: "code", label: "Code" },
  { id: "own", label: "Your text" },
] as const;

export function Practice() {
  const [cur, setCur] = useState(0);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const pick = (i: number, focus?: boolean) => { setCur(i); if (focus) refs.current[i]?.focus(); };
  const onKey = (e: React.KeyboardEvent, i: number) => {
    const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (e.key === "Home") { e.preventDefault(); pick(0, true); }
    else if (e.key === "End") { e.preventDefault(); pick(2, true); }
    else if (d) { e.preventDefault(); pick((i + d + TABS.length) % TABS.length, true); }
  };
  const on = (i: number) => "pane" + (cur === i ? " on" : "");
  return (
    <section className="band" id="practice" aria-labelledby="practiceh">
      <div className="rail center">
        <h2 className="h2 rv" id="practiceh">Made for real typing.</h2>
        <p className="lead rv" style={v("--dl:.06s;margin-top:18px")}>Timed tests of 15, 30, 60 and 120 seconds, plus three ways to practise on something you actually use.</p>
        <div className="seg rv" role="tablist" aria-label="Practice modes" style={v("--dl:.12s")}>
          {TABS.map((t, i) => (
            <button key={t.id} ref={(el) => { refs.current[i] = el; }} role="tab" id={"tab-" + t.id} aria-selected={cur === i} aria-controls={"pane-" + t.id} tabIndex={cur === i ? 0 : -1} type="button" onClick={() => pick(i)} onKeyDown={(e) => onKey(e, i)}>{t.label}</button>
          ))}
        </div>
        <div className="pwrap rv" style={v("--dl:.18s")}>
          <div className={on(0)} id="pane-real" role="tabpanel" aria-labelledby="tab-real" tabIndex={0}>
            <div className="mock"><div className="mock-h"><span className="ey">Real text · Small steps</span><span className="pill">40 short passages</span></div>
              <div className="mock-b"><p className="prose" aria-label="Sample passage: Good habits are built in small steps. Ten minutes a day may not feel like much, but after a month it adds up to five hours of real practice."><span className="t">Good habits are built in small steps. Ten minutes a day may not feel</span><span className="cr"></span>{" like much, but after a month it adds up to five hours of real practice."}</p></div></div>
            <p className="pdesc">Short passages of everyday writing, so you practise real words, capitals and punctuation.</p>
          </div>
          <div className={on(1)} id="pane-code" role="tabpanel" aria-labelledby="tab-code" tabIndex={0}>
            <div className="mock"><div className="mock-h"><span className="ey">Code · Swift · Average</span><span className="pill">25 snippets</span></div>
              <div className="mock-b"><div className="code" role="img" aria-label="A Swift snippet. Each line ends with an Enter marker and the indentation is typed for you."><span className="cl"><span className="t">{"func average(_ values: [Double]) -> Double {"}</span><span className="nl">{" ↵"}</span></span><span className="cl"><span className="ind">{"    "}</span><span className="t">{"guard !values.isEmpty else { return 0 }"}</span><span className="nl">{" ↵"}</span></span><span className="cl"><span className="ind">{"    "}</span><span className="t">{"return values.reduce(0, +)"}</span><span className="cr"></span>{" / Double(values.count)"}<span className="nl">{" ↵"}</span></span><span className="cl">{"}"}</span></div>
              <p className="pnote">JavaScript · Python · Swift · CSS · SQL · shell</p></div></div>
            <p className="pdesc">Enter makes a new line and the indentation is typed for you, so you can focus on the symbols.</p>
          </div>
          <div className={on(2)} id="pane-own" role="tabpanel" aria-labelledby="tab-own" tabIndex={0}>
            <div className="mock"><div className="mock-h"><span className="ey">Your text</span><span className="pill">Paste anything</span></div>
              <div className="mock-b"><div className="paste" aria-hidden="true"><span className="ph">Paste an email, an essay, a chapter of your favourite book…</span></div>
              <div className="keep"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2.5" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>Kept in this browser only.</div></div></div>
            <p className="pdesc">Practise on your own words, the ones you really type every day.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
