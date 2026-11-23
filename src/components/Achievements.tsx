/* Achievements grid (21 badges): earned / locked, earned date, "New" dot for the last 24 h, description tooltip (legacy achHTML). */
import { ACH, ACOL, aico } from "@/core/rewards";
import { S } from "@/core/state";
import { own } from "@/core/store";
import { MON } from "@/core/stats";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const fmtEarned = (ts: number) => { const d = new Date(ts); return d.getDate() + " " + MON[d.getMonth()]; };

/* aico() returns a constant SVG string from the app's own icon table (no user data) */
export function Medal({ icon, size = 24 }: { icon: string; size?: number }) {
  return <span className="medal" dangerouslySetInnerHTML={{ __html: aico(icon, size) }} />;
}

export function Achievements() {
  const n = ACH.filter(a => own(S.ach, a.id)).length, now = Date.now();
  return (
    <section className="sect-gap">
      <div className="stage-h" style={{ marginTop: 0 }}><h2>Achievements</h2><span className="scount">{n} of {ACH.length}</span></div>
      <ul className="ach-grid">
        {ACH.map(a => {
          const on = own(S.ach, a.id), ts = S.ach[a.id], fresh = on && now - ts < 864e5;
          return (
            <Tooltip key={a.id}>
              <TooltipTrigger asChild>
                <li className={"ach " + (on ? "on" : "off")} tabIndex={0} data-tip={a.desc} style={{ "--ac": "var(" + ACOL[a.cat] + ")" } as React.CSSProperties}>
                  {fresh ? <i className="ach-new" title="New"><span className="vh">New</span></i> : null}
                  <Medal icon={a.icon} />
                  <span className="ach-t">{a.title}</span>
                  <span className="ach-s">{on ? "Earned " + fmtEarned(ts) : a.desc}</span>
                </li>
              </TooltipTrigger>
              <TooltipContent>{a.desc}</TooltipContent>
            </Tooltip>
          );
        })}
      </ul>
    </section>
  );
}
