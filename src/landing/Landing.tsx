import { useEffect } from "react";
import "@/styles/landing.css";
import { Nav } from "./Nav";
import { Hero } from "./Hero";
import { Intro } from "./Intro";
import { Features } from "./Features";
import { Practice } from "./Practice";
import { Sounds } from "./Sounds";
import { Progress } from "./Progress";
import { Coach } from "./Coach";
import { Shortcuts } from "./Shortcuts";
import { Closing } from "./Closing";
import { Footer } from "./Footer";

export function Landing() {
  /* reveal once, and play animations only while visible (the legacy `html.js` pattern: .rv is only hidden when JS runs) */
  useEffect(() => {
    const rio = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); rio.unobserve(e.target); } }), { rootMargin: "0px 0px -6% 0px", threshold: .05 });
    document.querySelectorAll(".rv").forEach((el) => rio.observe(el));
    const vio = new IntersectionObserver((es) => es.forEach((e) => e.target.classList.toggle("vis", e.isIntersecting)), { rootMargin: "60px" });
    document.querySelectorAll(".live").forEach((el) => vio.observe(el));
    return () => { rio.disconnect(); vio.disconnect(); };
  }, []);
  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <div className="frame">
        <Nav />
        <main id="main">
          <Hero />
          <Intro />
          <Features />
          <Practice />
          <Sounds />
          <Progress />
          <Coach />
          <Shortcuts />
          <Closing />
        </main>
        <Footer />
      </div>
    </>
  );
}
