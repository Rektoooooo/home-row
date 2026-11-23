import { ShareCard } from "./ShareCard";
import { v } from "./util";

const ico = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export function Progress() {
  return (
    <section className="band" id="progress" aria-labelledby="progressh">
      <div className="rail">
        <div className="two">
          <div className="rv">
            <div className="cardwrap"><span className="example">Example</span><ShareCard /></div>
            <p className="excap">An example card. Yours shows your own result.</p>
          </div>
          <div>
            <span className="eyebrow rv">Progress</span>
            <h2 className="h2 rv" id="progressh" style={v("margin-top:16px;--dl:.06s")}>Progress you can see.</h2>
            <ul className="flist">
              <li className="rv" style={v("--fc:var(--f-pinky);--dl:.1s")}><span className="ico" aria-hidden="true"><svg {...ico}><path d="M4 19V9M10 19V5M16 19v-7M21 19H3" /></svg></span><div><b>Levels that keep you going</b><span>Every session fills your level bar a little more.</span></div></li>
              <li className="rv" style={v("--fc:var(--f-index);--dl:.15s")}><span className="ico" aria-hidden="true"><svg {...ico}><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" /></svg></span><div><b>A daily streak</b><span>Practise a little each day and watch the days add up.</span></div></li>
              <li className="rv" style={v("--fc:var(--f-middle);--dl:.2s")}><span className="ico" aria-hidden="true"><svg {...ico}><circle cx="12" cy="9" r="5.5" /><path d="m8.5 14 -1.5 7 5-2.5 5 2.5-1.5-7" /></svg></span><div><b>21 achievements</b><span>Small milestones to unlock along the way.</span></div></li>
              <li className="rv" style={v("--fc:var(--f-ring);--dl:.25s")}><span className="ico" aria-hidden="true"><svg {...ico}><rect x="3.5" y="5" width="17" height="15" rx="3" /><path d="M3.5 10h17M8 3v4M16 3v4" /></svg></span><div><b>A weekly recap and a share card</b><span>See how far you've come, and share a result as an image.</span></div></li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
