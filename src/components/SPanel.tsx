/* Section panel used by Progress and Coach: the legacy panel() with its heading level (h2 / h3 with class "pt"), built on the shadcn Card.
   parts.tsx Panel always renders an h1; these screens need real h2/h3 headings. */
import { type ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function SPanel({ eyebrow, title, tag, status, msg, stats, statsCls, children, foot, flat = true }: {
  eyebrow: ReactNode; title?: ReactNode; tag?: "h1" | "h2" | "h3"; status?: ReactNode; msg?: ReactNode; stats?: ReactNode; statsCls?: string; children?: ReactNode; foot?: ReactNode; flat?: boolean;
}) {
  const H = (tag || "h1") as "h1" | "h2" | "h3";
  return (
    <Card className={cn("panel", flat && "flat")}>
      <div className="panel-body">
        <div className="panel-head"><div><span className="label">{eyebrow}</span>{title ? <H className={tag ? "pt" : undefined}>{title}</H> : null}</div>{status}</div>
        {msg ? <p className="msg">{msg}</p> : null}
        {stats ? <div className={cn("pstats", statsCls)}>{stats}</div> : null}
        {children}
      </div>
      {foot ? <div className="panel-foot">{foot}</div> : null}
    </Card>
  );
}
