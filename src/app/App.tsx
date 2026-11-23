import { useEffect, useRef, useState } from "react";
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

const VIEWS: Record<string, () => React.JSX.Element> = { practice: PracticeView, test: TestView, progress: ProgressView, coach: CoachView, guide: GuideView };

export function App() {
  const { tab, nonce } = useRoute();
  const [settings, setSettings] = useState(false);
  const [touch, setTouch] = useState(() => { try { return matchMedia("(pointer: coarse)").matches; } catch (e) { return false; } });
  const sink = useRef<HTMLTextAreaElement>(null);
  useEffect(() => installEngine(sink.current!), []);
  /* the touch note goes away on the first key press */
  useEffect(() => { const f = () => setTouch(false); document.addEventListener("keydown", f, { once: true }); return () => document.removeEventListener("keydown", f); }, []);
  useEffect(() => { window.scrollTo(0, 0); }, [tab, nonce]);
  return (
    <div className="hr-shell" id="app">
      <Header onSettings={() => setSettings(true)} />
      <div className="col">
        {touch ? <div className="note" id="touch-note"><span>Touch typing needs a physical keyboard. Connect one to practise here.</span><Button variant="outline" size="sm" onClick={() => setTouch(false)}>Dismiss</Button></div> : null}
        <main id="view" tabIndex={-1}>
          {tab === "learn" ? <LearnFlow key={"learn" + nonce} /> : (() => { const V = VIEWS[tab]; return <V key={tab + nonce} />; })()}
        </main>
      </div>
      <textarea id="sink" ref={sink} aria-label="Typing input" autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false} tabIndex={-1} />
      <SettingsDialog open={settings} onOpenChange={setSettings} />
      {/* TODO(phase5): welcome flow, move-from-old-address dialog, toasts, confetti, sounds UI */}
      <Toaster />
    </div>
  );
}
