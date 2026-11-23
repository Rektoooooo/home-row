import { v } from "./util";

export function Coach() {
  return (
    <section className="band" id="coach" aria-labelledby="coachh">
      <div className="rail">
        <div className="two rev">
          <div className="copy">
            <span className="eyebrow rv">Coach</span>
            <h2 className="h2 rv" id="coachh" style={v("margin-top:16px;--dl:.06s")}>A coach that knows your keys.</h2>
            <p className="lead rv" style={v("margin-top:20px;--dl:.1s")}>Copy your progress into a Claude chat. Claude reads your weakest keys and letter pairs and writes short lessons just for you. Paste the reply back and they are ready to start.</p>
            <ol className="num">
              <li className="rv" style={v("--dl:.14s")}><span><b>Copy your progress</b> with one tap in the app.</span></li>
              <li className="rv" style={v("--dl:.18s")}><span><b>Paste it into a Claude chat.</b> Claude looks at your weakest keys.</span></li>
              <li className="rv" style={v("--dl:.22s")}><span><b>Paste Claude's reply into the app.</b> The lessons appear in the Coach tab, ready to start.</span></li>
            </ol>
          </div>
          <div className="coachbox rv" style={v("--dl:.12s")}>
            <div className="panel" role="group" aria-label="Example of a lesson written by Claude">
              <div className="ey">From Claude</div>
              <h3>K without misses</h3>
              <p className="why">Your K slips most often, at 61% accuracy. These steps drill it with the keys around it.</p>
              <div className="steps" aria-hidden="true"><div><i>Step 1</i>dk kd dk kd</div><div><i>Step 2</i>kid kit kiss</div><div><i>Step 3</i>a kind king</div></div>
              <div className="acts"><a className="btn sm" href="/app/">Start</a></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
