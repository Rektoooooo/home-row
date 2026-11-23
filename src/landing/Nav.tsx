import { useEffect, useRef, useState } from "react";

const LINKS: [string, string][] = [["#features", "Features"], ["#practice", "Practice"], ["#progress", "Progress"], ["#coach", "Coach"]];

export function Nav() {
  const [stuck, setStuck] = useState(false);
  const [open, setOpen] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);
  const openRef = useRef(false);
  openRef.current = open;

  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 24);
    addEventListener("scroll", onScroll, { passive: true }); onScroll();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && openRef.current) { setOpen(false); btn.current?.focus(); } };
    addEventListener("keydown", onKey);
    return () => { removeEventListener("scroll", onScroll); removeEventListener("keydown", onKey); };
  }, []);

  return (
    <header className={"nav" + (stuck ? " stuck" : "")} id="nav">
      <div className="nav-in">
        <a className="brand" href="#top" aria-label="Home Row, back to top"><img src="/assets/icon.svg" width="32" height="32" alt="" />Home Row</a>
        <nav aria-label="Main"><ul className="links">
          {LINKS.map(([h, t]) => <li key={h}><a href={h}>{t}</a></li>)}
        </ul></nav>
        <div className="nav-r">
          <a className="btn sm" href="/app/">Start practising</a>
          <button ref={btn} className="menu-btn" id="menuBtn" type="button" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} aria-controls="sheet" onClick={() => setOpen((o) => !o)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M4 8h16M4 16h16" /></svg></button>
        </div>
        <div className={"sheet" + (open ? " open" : "")} id="sheet" onClick={(e) => { if ((e.target as HTMLElement).closest("a")) setOpen(false); }}>
          {LINKS.map(([h, t]) => <a key={h} href={h}>{t}</a>)}
        </div>
      </div>
    </header>
  );
}
