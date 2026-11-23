import { v } from "./util";

export function Intro() {
  return (
    <section className="band intro" aria-labelledby="introh">
      <div className="rail">
        <div className="rv"><span className="eyebrow" id="introh">How it works</span></div>
        <div className="big">
          <p className="rv" style={v("--dl:.06s")}><b>Fifteen minutes a day</b> is enough. Home Row starts with F and J, adds two keys per lesson, and watches every press, so practice always aims at the key that slows you down.</p>
          <p className="rv" style={v("--dl:.12s")}><b>Nothing to install, nothing to pay.</b> It's free, needs no sign-up, and runs in your browser. Your progress is saved in this browser.</p>
        </div>
      </div>
    </section>
  );
}
