/* App header: frosted sticky bar with the brand, the section Tabs (shadcn), the streak and today pills (Badge) and Settings. */
import { BookOpen, Target, Timer, ChartLine, Sparkles, Compass, Settings } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Logo } from "@/components/Logo";
import { S } from "@/core/state";
import { minutesToday, streak } from "@/core/stats";
import { flameSVG } from "@/core/rewards";
import { useProgress } from "@/lib/progress";
import { TABS, type Tab, navigate, useRoute } from "@/lib/route";
import { t } from "@/i18n";
import { useLang } from "@/i18n/react";

const ICONS: Record<Tab, typeof BookOpen> = { learn: BookOpen, practice: Target, test: Timer, progress: ChartLine, coach: Sparkles, guide: Compass };
const LABELS: Record<Tab, () => string> = { learn: () => t("tab|Learn"), practice: () => t("tab|Practice"), test: () => t("tab|Test"), progress: () => t("tab|Progress"), coach: () => t("tab|Coach"), guide: () => t("tab|Guide") };

function Flame() {
  useProgress();
  const n = streak(), m = minutesToday(), lit = m >= 1, hide = n === 0 && m === 0;
  if (hide) return null;
  const lab = n === 0 ? t("No streak yet. Practise today to start one.") : lit ? t("{n}-day streak", { n }) : t("{n}-day streak. Practise today to keep it.", { n });
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant="outline" role="img" aria-label={lab} id="flame"
          className={"flame h-8 gap-1 rounded-full border-0 py-0 pr-[11px] pl-[9px] font-heading text-sm font-semibold tabular-nums max-[420px]:pr-1 max-[420px]:pl-0.5 " +
            (lit ? "lit text-fg bg-[color-mix(in_oklab,#FF8A3D_12%,var(--surface))] shadow-[0_0_0_1px_color-mix(in_oklab,#FF8A3D_35%,var(--line))]" : "text-mute bg-surface shadow-[0_0_0_1px_var(--line)]")}>
          <span className="flex" dangerouslySetInnerHTML={{ __html: flameSVG(lit) }} /><span aria-hidden="true">{n}</span>
        </Badge>
      </TooltipTrigger>
      <TooltipContent>{lab}</TooltipContent>
    </Tooltip>
  );
}

const RING_C = 2 * Math.PI * 11;
function TodayRing() {
  useProgress();
  const m = minutesToday(), g = S.settings.goal, f = Math.min(1, m / g);
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant="outline" id="ring-w" className="ring-w h-8 gap-[7px] rounded-full border-0 bg-surface py-0 pr-3 pl-[7px] font-heading text-[13.5px] font-medium text-fg-2 shadow-[0_0_0_1px_var(--line)] max-[480px]:pr-2.5 max-[480px]:pl-1.5 [&>svg]:size-5!">
          <svg width="20" height="20" viewBox="0 0 28 28" aria-hidden="true">
            <circle cx="14" cy="14" r="11" fill="none" stroke="var(--sunken)" strokeWidth="4" />
            <circle id="ring-arc" cx="14" cy="14" r="11" fill="none" stroke="var(--fg)" strokeWidth="4" strokeLinecap="round" strokeDasharray={`${(f * RING_C).toFixed(1)} ${RING_C.toFixed(1)}`} transform="rotate(-90 14 14)" style={{ transition: "stroke-dasharray 300ms ease-out" }} />
          </svg>
          <span id="ring-t">{t("{m} / {g} min", { m: Math.floor(m), g })}</span>
        </Badge>
      </TooltipTrigger>
      <TooltipContent>{t("Practice today against your daily goal")}</TooltipContent>
    </Tooltip>
  );
}

export function Header({ onSettings }: { onSettings: () => void }) {
  const { tab } = useRoute();
  useLang();
  return (
    <header className="top sticky top-[env(safe-area-inset-top,0px)] z-[11] border-b border-line bg-[color-mix(in_oklab,var(--bg)_80%,transparent)] backdrop-blur-[14px] backdrop-saturate-150">
      <div className="top-in mx-auto flex min-h-[62px] max-w-[1080px] flex-wrap items-center gap-x-4 gap-y-2 max-[900px]:min-h-0 max-[900px]:py-2.5">
        <a href="#learn" className="brand order-1 flex items-center gap-[9px] font-heading text-lg font-bold tracking-[-.01em] text-inherit no-underline" aria-label={t("Home Row, go to Learn")}>
          <span className="brand-mark inline-flex flex-none" aria-hidden="true"><Logo size={30} /></span>
          <span className="brand-name max-[480px]:hidden">Home Row</span>
        </a>
        <Tabs value={tab} activationMode="manual" className="order-2 mx-auto max-[900px]:order-4 max-[900px]:mx-0 max-[900px]:basis-full">
          <nav aria-label={t("Sections")} className="contents">
            <TabsList className="h-auto group-data-horizontal/tabs:h-auto w-fit gap-0.5 rounded-xl bg-muted p-1 shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--fg)_4%,transparent)] max-[900px]:w-full">
              {TABS.map(k => {
                const Icon = ICONS[k];
                return (
                  <TabsTrigger key={k} value={k} data-tab={k} aria-current={tab === k ? "page" : undefined}
                    className="tab h-[34px] flex-none gap-[7px] rounded-lg border-0 px-3 font-heading text-[14.5px] leading-none font-medium text-mute hover:text-fg data-active:bg-surface data-active:text-fg data-active:shadow-[0_0_0_1px_var(--line),0_1px_3px_color-mix(in_oklab,var(--shade)_12%,transparent)] dark:data-active:border-transparent dark:data-active:bg-surface focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-fg max-[900px]:min-w-0 max-[900px]:flex-1 max-[480px]:px-1 max-[480px]:text-[13.5px]"
                    onClick={() => navigate(k)}>
                    <Icon aria-hidden="true" className="size-4 max-[1100px]:hidden min-[600px]:max-[900px]:block" />
                    <span>{LABELS[k]()}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </nav>
        </Tabs>
        <div className="top-r order-3 flex items-center gap-2 max-[900px]:ml-auto">
          <Flame />
          <TodayRing />
          <Button variant="ghost" size="icon" id="open-settings" aria-label={t("Settings")} className="size-[34px] text-fg-2" onClick={onSettings}><Settings aria-hidden="true" className="size-[19px]" /></Button>
        </div>
      </div>
    </header>
  );
}
