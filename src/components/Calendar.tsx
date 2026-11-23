/* Practice calendar: last 12 weeks, Monday-first columns, one focusable cell per day with a tooltip (legacy calendarSVG). */
import { S } from "@/core/state";
import { addDays, dateKey, dLabel, MON } from "@/core/stats";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const fill = (pct: number) => ({ fill: `color-mix(in oklab,var(--f-middle) ${pct}%,var(--surface-2))` });

export function Calendar() {
  const today = new Date(), idx = (today.getDay() + 6) % 7, start = addDays(today, -(idx + 77)), P = 17, LW = 30, TH = 16;
  const months: { c: number; m: number }[] = [];
  let prevM = -1;
  for (let c = 0; c < 12; c++) { const d0 = addDays(start, c * 7); if (d0.getMonth() !== prevM) { prevM = d0.getMonth(); months.push({ c, m: prevM }); } }
  const goal = S.settings.goal, tk = dateKey(today), cells: React.ReactNode[] = [];
  for (let i = 0; i < 84; i++) {
    const d = addDays(start, i); if (d > today) break;
    const c = Math.floor(i / 7), r = i % 7, key = dateKey(d), rec = S.days[key], min = rec ? rec.ms / 60000 : 0;
    const pct = min <= 0 ? 0 : min < 5 ? 30 : min < goal ? 55 : 85;
    const w = rec && rec.ms > 0 ? Math.round(rec.chars / 5 / (rec.ms / 60000)) : null;
    const tip = dLabel(d) + " · " + (min > 0 ? Math.round(min) + " min" + (w ? " · " + w + " WPM" : "") : "no practice");
    cells.push(
      <Tooltip key={key}>
        <TooltipTrigger asChild><rect x={LW + c * P} y={TH + r * P} width={14} height={14} rx={3} style={fill(pct)} tabIndex={0} aria-label={tip} data-tip={tip} /></TooltipTrigger>
        <TooltipContent>{tip}</TooltipContent>
      </Tooltip>,
    );
    if (key === tk) cells.push(<rect key={"t" + key} className="today" x={LW + c * P - 1} y={TH + r * P - 1} width={16} height={16} rx={4} />);
  }
  return (
    <>
      <svg className="cal" viewBox={`0 0 ${LW + 12 * P} ${TH + 7 * P}`} role="img" aria-label="Practice calendar for the last 12 weeks">
        {months.map(({ c, m }) => <text key={c} x={LW + c * P} y={10}>{MON[m]}</text>)}
        {([[0, "Mon"], [2, "Wed"], [4, "Fri"]] as const).map(([r, t]) => <text key={t} x={0} y={TH + r * P + 10}>{t}</text>)}
        {cells}
      </svg>
      <div className="cal-leg"><span>Less</span>
        <svg width="64" height="14" viewBox="0 0 64 14" aria-hidden="true">{[0, 30, 55, 85].map((p, i) => <rect key={p} x={i * 17} width={14} height={14} rx={3} style={fill(p)} />)}</svg>
        <span>More</span></div>
    </>
  );
}
