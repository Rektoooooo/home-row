import { v } from "./util";

const FMAP: Record<string, string> = { q: "p", a: "p", z: "p", w: "r", s: "r", x: "r", e: "m", d: "m", c: "m", r: "i", f: "i", v: "i", t: "i", g: "i", b: "i", y: "i", h: "i", n: "i", u: "i", j: "i", m: "i", i: "m", k: "m", ",": "m", o: "r", l: "r", ".": "r", p: "p", ";": "p", "/": "p" };
const KROWS = ["qwertyuiop", "asdfghjkl;", "zxcvbnm,./"];
const ORDER = "fjdksla;ghruewioqptyvmc,x.z/bn".split("");

function CourseKeyboard() {
  return (
    <div className="kb course" id="kbCourse" aria-hidden="true">
      {KROWS.map((r, ri) => (
        <div className="kr" style={v("--o:" + ri)} key={ri}>
          {[...r].map((c) => <span className={"k" + ("fj".includes(c) ? " hm" : "")} data-k={c} data-f={FMAP[c]} style={v("--i:" + ORDER.indexOf(c))} key={c}>{c}</span>)}
        </div>
      ))}
      <div className="kr" style={v("--o:5")}><span className="k sp" data-k=" " data-f="t"></span></div>
    </div>
  );
}

const DOTS = Array.from({ length: 22 }, (_, i) => i);
const KEYS_LIST: { fc: string; k: string; w: string; t: string; weak?: boolean }[] = [
  { fc: "middle", k: "k", w: "38%", t: "23 WPM · 61%", weak: true },
  { fc: "pinky", k: "p", w: "58%", t: "31 WPM · 78%" },
  { fc: "ring", k: "s", w: "82%", t: "44 WPM · 93%" },
  { fc: "middle", k: "e", w: "95%", t: "52 WPM · 98%" },
];
const svgA = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinejoin: "round", strokeLinecap: "round" } as const;

export function Features() {
  return (
    <section className="band" id="features" aria-labelledby="featuresh">
      <div className="rail" style={{ paddingTop: 88, paddingBottom: 88 }}>
        <h2 className="sr" id="featuresh">Features</h2>
        <div className="cards">
          <article className="rv">
            <div className="fc-art fc-1 live" role="img" aria-label="A keyboard whose keys light up one by one in finger colours, like the course map">
              <span className="chip" aria-hidden="true">Lesson 7 <span className="mono">· E and I</span></span>
              <CourseKeyboard />
              <div className="dots" aria-hidden="true">{DOTS.map((n) => <i style={v("--n:" + n)} key={n}></i>)}</div>
            </div>
            <p className="fc-cap"><b>22 lessons</b> From the home row to numbers. Two new keys at a time.</p>
          </article>
          <article className="rv" style={v("--dl:.09s")}>
            <div className="fc-art fc-2 live" role="img" aria-label="A list of keys with strength bars, weakest first: K at 23 WPM and 61 percent, P, S and E">
              <span className="chip" aria-hidden="true">Your keys</span>
              <div className="klist" aria-hidden="true">
                {KEYS_LIST.map((r, n) => (
                  <div className="kro" style={v("--fc:var(--f-" + r.fc + ");--n:" + n)} key={r.k}><span className="kcap">{r.k}</span><div className="bar"><i style={v("--w:" + r.w + ";--n:" + n)}></i></div><small>{r.t}{r.weak && <span className="tag">weakest</span>}</small></div>
                ))}
              </div>
            </div>
            <p className="fc-cap"><b>Adaptive practice</b> Every round is built around your weakest key or letter pair.</p>
          </article>
          <article className="rv" style={v("--dl:.18s")}>
            <div className="fc-art fc-3 live" role="img" aria-label="A level bar showing Level 4, a streak flame and three achievement medals">
              <div className="lvl-box" aria-hidden="true"><div className="lvl-top">Level 4<span>68% to Level 5</span></div><div className="bar"><i></i></div></div>
              <span className="streak" aria-hidden="true"><svg viewBox="0 0 24 24"><defs><linearGradient id="flg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFD66B" /><stop offset=".55" stopColor="#FF8A3D" /><stop offset="1" stopColor="#EE4B2B" /></linearGradient></defs><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" fill="url(#flg)" /><path d="M12 21.2a3.4 3.4 0 0 1-3.4-3.4c0-1.5 1-2.5 1.9-3.4.3 1.2 1 1.9 1.9 2.1.2-1.3 0-2.6-.5-3.6 2 1 3.4 2.9 3.4 4.9a3.4 3.4 0 0 1-3.3 3.4z" fill="#FFE7A1" /></svg>5-day streak</span>
              <div className="meds" aria-hidden="true">
                <span className="med" style={v("--fc:var(--f-index);--n:0")}><svg {...svgA}><path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 17l-5.2 2.7 1-5.9L3.5 9.7l5.9-.8z" /></svg></span>
                <span className="med" style={v("--fc:var(--f-pinky);--n:1")}><svg {...svgA}><path d="M13 3 5 13.5h6L10 21l8-10.5h-6z" /></svg></span>
                <span className="med" style={v("--fc:var(--f-middle);--n:2")}><svg {...svgA}><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4" /></svg></span>
              </div>
            </div>
            <p className="fc-cap"><b>Levels, streaks and badges</b> A weekly recap shows how far you've come.</p>
          </article>
        </div>
      </div>
    </section>
  );
}
