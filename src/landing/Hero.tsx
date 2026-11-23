import { Demo } from "./Demo";
import { v } from "./util";

const ARROW = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>;

const KEYS: { c: string; s: string; k: string }[] = [
  { c: "fk hide-m", s: "--x:4%;--y:150px;--s:100px;--s0:100px;--r:-14deg;--d:9s", k: "A" },
  { c: "fk", s: "--xm:3%;--ym:430px;--x:15%;--y:410px;--s:66px;--s0:66px;--r:9deg;--b:1.5px;--d:11s;--dl:-3s;--o:.85", k: "S" },
  { c: "fk hide-m", s: "--x:2.5%;--y:560px;--s:84px;--s0:84px;--r:-7deg;--b:4px;--d:12s;--dl:-6s;--o:.75", k: "D" },
  { c: "fk b", s: "--xm:4%;--ym:74px;--x:19%;--y:96px;--s:72px;--s0:72px;--r:8deg;--d:10s;--dl:-2s", k: "F" },
  { c: "fk b", s: "--xm:84%;--ym:70px;--x:83%;--y:104px;--s:88px;--s0:88px;--r:12deg;--d:10s;--dl:-5s", k: "J" },
  { c: "fk", s: "--xm:86%;--ym:440px;--x:91%;--y:370px;--s:104px;--s0:104px;--r:-10deg;--d:9s;--dl:-1s", k: "K" },
  { c: "fk hide-m", s: "--x:79%;--y:520px;--s:62px;--s0:62px;--r:14deg;--b:2px;--d:13s;--dl:-8s;--o:.85", k: "L" },
  { c: "fk hide-m", s: "--x:93%;--y:610px;--s:60px;--s0:60px;--r:-8deg;--b:3.5px;--d:11s;--dl:-4s;--o:.7", k: ";" },
];

export function Hero() {
  return (
    <section className="hero live" id="top" aria-labelledby="h1">
      <div className="fkeys" aria-hidden="true">
        {KEYS.map((k) => <div key={k.k} className={k.c} style={v(k.s)}><span>{k.k}</span></div>)}
      </div>
      <a className="badge rv" href="/app/">Free · no sign-up · runs in your browser <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9.5 6 6 6-6 6" /></svg></a>
      <h1 id="h1" className="rv" style={v("--dl:.08s")}>Type with all ten fingers. Without looking.</h1>
      <p className="sub rv" style={v("--dl:.16s")}>Short daily lessons that adapt to you. Practice built around your weakest keys, right in your browser.</p>
      <div className="cta-row rv" style={v("--dl:.24s")}>
        <a className="btn lg" href="/app/">Start practising {ARROW}</a>
        <a className="btn lg quiet" href="#features">See how it works</a>
      </div>
      <Demo />
    </section>
  );
}
