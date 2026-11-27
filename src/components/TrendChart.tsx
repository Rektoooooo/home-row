/* Speed trend: last 30 days, practice line + test dots, crosshair and tooltip following the pointer (legacy trendChart + attachChart). */
import { useState } from "react";
import { S, C } from "@/core/state";
import { addDays, dateKey, dayWpm, dLabel } from "@/core/stats";
import { t, monthShort, speed, speedUnit } from "@/i18n";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const niceStep = (m: number, maxTicks: number) => { for (const s of [10, 20, 25, 50, 100, 200]) if (Math.ceil(m / s) <= maxTicks) return s; return 200; };
const W = 640, H = 240, L = 38, R = 56, T = 14, B = 28, PW = W - L - R, PH = H - T - B;

export function TrendChart() {
  const [hot, setHot] = useState<{ x: number; y: number; text: string } | null>(null);
  const today = new Date(), days: Date[] = [];
  for (let i = 29; i >= 0; i--) days.push(addDays(today, -i));
  const prac = days.map(d => dayWpm(S.days[dateKey(d)]));
  const tests: number[][] = days.map(() => []);
  C().tests.forEach((x: any) => { const k = dateKey(new Date(x.ts)); const i = days.findIndex(d => dateKey(d) === k); if (i >= 0) tests[i].push(x.wpm); });
  const have = prac.filter(v => v != null).length;
  const vals = [...prac.filter(v => v != null) as number[], ...tests.flat()], mxv = Math.max(20, ...vals), step = niceStep(mxv, 5), ymax = Math.ceil(mxv / step) * step;
  const X = (i: number) => L + i / 29 * PW, Y = (v: number) => T + PH - v / ymax * PH;
  const grid: React.ReactNode[] = [];
  for (let v = 0; v <= ymax; v += step) grid.push(<g key={"g" + v}><line className="grid" x1={L} x2={W - R} y1={Y(v)} y2={Y(v)} /><text x={L - 8} y={Y(v) + 4} textAnchor="end">{speed(v)}</text></g>);
  for (let i = 29; i >= 0; i -= 7) grid.push(<text key={"x" + i} x={X(i)} y={H - 8} textAnchor={i === 29 ? "end" : "middle"}>{t("{d} {mon}", { d: days[i].getDate(), mon: monthShort(days[i].getMonth()) })}</text>);
  let line = "", lastI = -1;
  prac.forEach((v, i) => { if (v == null) return; line += (line ? "L" : "M") + X(i).toFixed(1) + " " + Y(v).toFixed(1) + " "; lastI = i; });
  const pts: { x: number; y: number; text: string }[] = [];
  days.forEach((d, i) => {
    const a: string[] = [];
    if (prac[i] != null) a.push(t("{s} {unit} practice", { s: speed(prac[i]!), unit: speedUnit() }));
    if (tests[i].length) a.push(t("{s} {unit} test", { s: tests[i].map(v => speed(v)).join(", "), unit: speedUnit() }));
    if (a.length) pts.push({ x: X(i), y: Y(prac[i] != null ? prac[i]! : tests[i][0]), text: dLabel(d) + " · " + a.join(" · ") });
  });
  const empty = have < 2;
  const move = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!pts.length) return;
    const r = e.currentTarget.getBoundingClientRect(), vx = (e.clientX - r.left) / r.width * W;
    let best = pts[0]; for (const p of pts) if (Math.abs(p.x - vx) < Math.abs(best.x - vx)) best = p;
    setHot(best);
  };
  return (
    <>
      <div className="legrow">
        <span><svg width="26" height="10" viewBox="0 0 26 10" aria-hidden="true" style={{ display: "inline-block", verticalAlign: "middle", marginRight: 6 }}><path d="M1 5h24" stroke="var(--fg-2)" strokeWidth="2" strokeLinecap="round" /><circle cx="13" cy="5" r="3.5" fill="var(--surface)" stroke="var(--fg-2)" strokeWidth="2" /></svg>{t("Practice and lessons")}</span>
        <span><svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" style={{ display: "inline-block", verticalAlign: "middle", marginRight: 6 }}><circle cx="6" cy="6" r="4" fill="var(--f-ring)" stroke="var(--surface)" strokeWidth="2" /></svg>{t("chip|Tests")}</span>
      </div>
      <div className="chart-wrap">
        <svg className="chart" id="trend" viewBox={`0 0 ${W} ${H}`} role="img" style={empty ? { opacity: 0.45 } : undefined}
          aria-label={empty ? t("Line chart of your daily speed over the last 30 days. Not enough practice days yet.") : t("Line chart of your daily speed over the last 30 days. {n} practice days recorded.", { n: have })}
          onPointerMove={move} onPointerDown={move} onPointerLeave={() => setHot(null)}>
          {grid}
          <path className="ln" d={line} />
          {prac.map((v, i) => v == null ? null : <circle key={"p" + i} className="dot-p" cx={X(i)} cy={Y(v)} r={4} />)}
          {tests.map((a, i) => a.map((v, j) => <circle key={"t" + i + "-" + j} className="dot-t" cx={X(i)} cy={Y(v)} r={4} />))}
          {lastI >= 0 ? <text className="lbl" x={X(lastI) + 9} y={Y(prac[lastI]!) + 4}>{speed(prac[lastI]!)}</text> : null}
          <line className="cross" id="tcross2" y1={T} y2={T + PH} x1={hot ? hot.x : 0} x2={hot ? hot.x : 0} style={{ display: hot ? "block" : "none" }} />
        </svg>
        {empty ? <div className="chart-empty"><p>{t("Practise on two different days to see your speed trend.")}</p></div> : null}
        <Tooltip open={!!hot}>
          <TooltipTrigger asChild><span className="chart-anchor" style={{ left: hot ? hot.x / W * 100 + "%" : 0, top: hot ? hot.y / H * 100 + "%" : 0 }} aria-hidden="true" /></TooltipTrigger>
          <TooltipContent side="top" sideOffset={8}>{hot ? hot.text : ""}</TooltipContent>
        </Tooltip>
      </div>
    </>
  );
}
