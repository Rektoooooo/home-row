import { Fragment, useEffect, useRef, useState } from "react";
import { Header } from "@/components/Header";
import { SettingsDialog } from "@/components/SettingsDialog";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { LearnFlow } from "@/views/Learn";
import { PracticeView } from "@/views/Practice";
import { TestView } from "@/views/Test";
import { ProgressView } from "@/views/Progress";
import { CoachView } from "@/views/Coach";
import { GuideView } from "@/views/Guide";
import { useRoute } from "@/lib/route";
import { installEngine } from "@/ui/engine";
import { Welcome } from "@/components/Welcome";
import { ShareDialog } from "@/components/ShareDialog";
import { MoveDialog } from "@/components/MoveDialog";
import { TestRun } from "@/views/Test";
import { watchCelebrate } from "@/ui/celebrate";
import { t } from "@/i18n";
import { useLang } from "@/i18n/react";
import { useWelcome, wlAbandonCheck, wlCheckBack, wlCheckDone } from "@/ui/welcome";

const CHECK_CFG = { pool: "c200", caps: false, punct: false, nums: false };

const VIEWS: Record<string, () => React.JSX.Element> = { practice: PracticeView, test: TestView, progress: ProgressView, coach: CoachView, guide: GuideView };

export function App() {
  const { tab, nonce } = useRoute();
  const lang = useLang();
  const [settings, setSettings] = useState(false);
  const [touch, setTouch] = useState(() => { try { return matchMedia("(pointer: coarse)").matches; } catch (e) { return false; } });
  const sink = useRef<HTMLTextAreaElement>(null);
  useEffect(() => installEngine(sink.current!), []);
  /* the touch note goes away on the first key press */
  useEffect(() => { const f = () => setTouch(false); document.addEventListener("keydown", f, { once: true }); return () => document.removeEventListener("keydown", f); }, []);
  useEffect(() => { window.scrollTo(0, 0); }, [tab, nonce]);
  useEffect(() => watchCelebrate(), []);
  /* the welcome's typing check takes over the main area; leaving the screen by any route abandons it */
  const wel = useWelcome();
  useEffect(() => { wlAbandonCheck(); }, [tab, nonce]);
  return (
    <div className="hr-shell" id="app">
      <Header onSettings={() => setSettings(true)} />
      <div className="col">
        {touch ? <div className="note" id="touch-note"><span>{t("Touch typing needs a physical keyboard. Connect one to practise here.")}</span><Button variant="outline" size="sm" onClick={() => setTouch(false)}>{t("button|Dismiss")}</Button></div> : null}
        <main id="view" tabIndex={-1}>
          {/* key={lang}: the views (and their imperative keyboards and engines) remount when the language changes; the header and dialogs just re-render */}
          <Fragment key={lang}>
            {wel.checking ? <TestRun key="wl-check" dur={60} o={CHECK_CFG} crumb={t("Welcome · Typing check")} baseline onBack={wlCheckBack} onDone={wlCheckDone} /> :
            tab === "learn" ? <LearnFlow key={"learn" + nonce} /> : (() => { const V = VIEWS[tab]; return <V key={tab + nonce} />; })()}
          </Fragment>
        </main>
      </div>
      <textarea id="sink" ref={sink} aria-label={t("Typing input")} autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false} tabIndex={-1} />
      <SettingsDialog open={settings} onOpenChange={setSettings} />
      <Welcome />
      <ShareDialog />
      <MoveDialog />
      <Toaster position="bottom-right" visibleToasts={3} duration={4500} />
    </div>
  );
}
