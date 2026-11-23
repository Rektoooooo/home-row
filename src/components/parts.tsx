/* Shared screen primitives (legacy app4.js): panel, pstat, button with key hint, status chip, stars, big key caps. */
import { type ReactNode, type ComponentProps } from "react";
import { Check, CircleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { fcol, charInfo } from "@/core/data";

export const ENTER = "↵";

/* Button with an optional key hint (↵ / esc) and the [data-primary] marker the Enter key looks for */
export function Btn({ hint, primary, children, ...p }: ComponentProps<typeof Button> & { hint?: string; primary?: boolean }) {
  return (
    <Button type="button" data-primary={primary ? "" : undefined} {...p}>
      {children}{hint ? <span className="kh" aria-hidden="true">{hint}</span> : null}
    </Button>
  );
}

export function Pstat({ num, label, sub, lead }: { num: ReactNode; label: string; sub?: string; lead?: boolean }) {
  return <div className={cn("pstat", lead && "lead")}><span className="num">{num}</span><span className="label">{label}</span>{sub ? <span className="sub">{sub}</span> : null}</div>;
}

/* panel: eyebrow, title, status chip, message, stats grid, body, footer. Built on the shadcn Card. */
export function Panel({ eyebrow, title, status, msg, stats, statsCls, children, foot, wide, flat }: {
  eyebrow: ReactNode; title?: ReactNode; status?: ReactNode; msg?: ReactNode; stats?: ReactNode; statsCls?: string; children?: ReactNode; foot?: ReactNode; wide?: boolean; flat?: boolean;
}) {
  return (
    <Card className={cn("panel", wide && "wide", flat && "flat")}>
      <div className="panel-body">
        <div className="panel-head"><div><span className="label">{eyebrow}</span>{title ? <h1>{title}</h1> : null}</div>{status}</div>
        {msg ? <p className="msg">{msg}</p> : null}
        {stats ? <div className={cn("pstats", statsCls)}>{stats}</div> : null}
        {children}
      </div>
      {foot ? <div className="panel-foot">{foot}</div> : null}
    </Card>
  );
}

export function StatusChip({ ok, label }: { ok: boolean; label?: string }) {
  return ok
    ? <Badge variant="secondary" className="status ok h-auto gap-1.5 px-2.5 py-1 font-heading text-[13px] leading-tight font-semibold text-fg"><Check size={14} strokeWidth={2} className="text-ok" aria-hidden="true" />{label ?? "Passed"}</Badge>
    : <Badge variant="outline" className="status bad h-auto gap-1.5 border-0 bg-transparent px-2.5 py-1 font-heading text-[13px] leading-tight font-semibold text-error shadow-[inset_0_0_0_1.5px_var(--error)]"><CircleAlert size={14} strokeWidth={2} aria-hidden="true" />Not passed yet</Badge>;
}

const STAR = "M12 2.5l3 6.4 7 .8-5.2 4.8 1.5 6.9L12 17.7 5.7 21.4l1.5-6.9L2 9.7l7-.8z";
export function Stars({ n, size, pop }: { n: number; size: number; pop?: boolean }) {
  return (
    <span className={"stars" + (pop ? " pp" : "")} role="img" aria-label={n + " of 3 stars"}>
      {[1, 2, 3].map(i => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" className={i <= n ? "star-on" : "star-off"} style={{ "--i": i - 1 } as any} aria-hidden="true"><path d={STAR} strokeWidth="1.6" strokeLinejoin="round" /></svg>
      ))}
    </span>
  );
}

/* a keycap in its finger colour: "bigcap", "bigcap md", "bigcap sm", "bigcap xs" */
export function Cap({ k, size, children, finger }: { k?: string; size?: "md" | "sm" | "xs"; children?: ReactNode; finger?: string }) {
  const i = k ? (charInfo(k) || charInfo(k.toUpperCase())) : null;
  return <span className={cn("bigcap", size)} style={{ "--fc": fcol(finger || (i ? i.key.f : "TH")) } as any}>{children ?? (k || "").toUpperCase()}</span>;
}
