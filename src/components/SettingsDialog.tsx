/* Settings (legacy p1.html #settings + app4.js wireSettings): a shadcn Dialog with segmented ToggleGroups, Switches and an in-dialog
   reset confirmation. Every control writes S.settings, stamps settingsAt and saves, exactly like legacy settingChanged(). */
import { useEffect, useState, useSyncExternalStore } from "react";
import { X } from "lucide-react";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Seg } from "@/views/Practice";
import { S } from "@/core/state";
import { resetAll, settingChanged } from "@/core/store";
import { soundPreview } from "@/core/sound";
import { weeklyView } from "@/ui/weekly";
import { subscribeWeekly, weeklyVersion } from "@/ui/celebrate";
import { weeklyRun, WK, syncWeeklyUI } from "@/core/sync";
import { currentExercise } from "@/ui/engine";
import { rebuildKeyboards } from "@/ui/keyboard";
import { showWelcome } from "@/ui/welcome";
import { useProgress, useSaveStatus } from "@/lib/progress";
import { reroute } from "@/lib/route";
import { setThemePref, useThemePref, type ThemePref } from "@/lib/theme";

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="sgroup"><h3 className="label">{title}</h3>{children}</section>;
}
function Field({ id, label, hint, children }: { id: string; label: string; hint?: string; children: React.ReactNode }) {
  return <div className="fld"><span className="t" id={id}>{label}</span>{children}{hint ? <span className="hintx">{hint}</span> : null}</div>;
}
function Row({ id, label, hint, checked, onChange }: { id: string; label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="sw">
      <label htmlFor={id}><b>{label}</b>{hint ? <span className="hintx">{hint}</span> : null}</label>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

const set = (k: string, v: any) => { S.settings[k] = v; settingChanged(); };

export function SettingsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  useProgress();
  const st = S.settings, theme = useThemePref(), save = useSaveStatus();
  const [confirm, setConfirm] = useState(false);
  useSyncExternalStore(subscribeWeekly, weeklyVersion);
  useEffect(() => { if (open) setConfirm(false); }, [open]);
  const wk = weeklyView();
  return (
    <Dialog open={open} onOpenChange={o => { onOpenChange(o); if (!o) currentExercise()?.refreshHints?.(); }}>
      <DialogContent id="settings" showCloseButton={false} aria-describedby="set-desc"
        className="dlg flex w-[min(540px,calc(100vw-24px))] max-h-[calc(100vh-48px)] flex-col gap-0 overflow-hidden rounded-[18px] bg-surface p-0 text-fg ring-0 sm:max-w-[540px]">
        <div className="dlg-head">
          <DialogTitle className="font-heading text-[22px] leading-tight font-bold">Settings</DialogTitle>
          <DialogClose asChild><Button variant="ghost" size="icon" aria-label="Close settings" className="text-fg-2"><X aria-hidden="true" className="size-5" /></Button></DialogClose>
        </div>
        <DialogDescription id="set-desc" className="sr-only">Typing, goals, keyboard and progress settings.</DialogDescription>
        <div className="dlg-body">
          <Group title="Appearance">
            <Field id="lbl-set-theme" label="Theme" hint="System follows your Mac, or claude.ai's own setting. Saved in this browser.">
              <Seg label="Theme" value={theme} options={[["system", "System"], ["light", "Light"], ["dark", "Dark"]]} onChange={v => setThemePref(v as ThemePref)} />
            </Field>
          </Group>
          <Separator />
          <Group title="Typing">
            <Field id="lbl-set-hints" label="Keyboard hints">
              <Seg label="Keyboard hints" value={st.hints} options={[["always", "Always"], ["hesitate", "When I hesitate"], ["hidden", "Hidden"]]} onChange={v => set("hints", v)} />
            </Field>
            <Row id="set-stop" label="Stop on mistakes" hint="The cursor waits until you press the right key." checked={!!st.stop} onChange={v => set("stop", v)} />
            <Field id="lbl-set-soundpack" label="Key sound" hint="Made in your browser. No audio files.">
              <Seg label="Key sound" value={st.soundPack} options={[["off", "Off"], ["soft", "Soft"], ["cream", "Creamy"], ["click", "Clicky"], ["type", "Typewriter"]]}
                onChange={v => { S.settings.soundPack = v; S.settings.sound = v !== "off"; settingChanged(); soundPreview(v); }} onReclick={() => soundPreview(st.soundPack)} />
            </Field>
          </Group>
          <Separator />
          <Group title="Goals">
            <Field id="lbl-set-goal" label="Daily goal">
              <Seg label="Daily goal" value={String(st.goal)} options={[["10", "10 min"], ["15", "15 min"], ["20", "20 min"], ["30", "30 min"]]} onChange={v => set("goal", +v)} />
            </Field>
            <Field id="lbl-set-target" label="Target speed" hint="Words per minute. Used for key strength and Practice.">
              <Seg label="Target speed" value={String(st.target)} options={[["20", "20"], ["25", "25"], ["30", "30"], ["35", "35"], ["40", "40"]]} onChange={v => set("target", +v)} />
            </Field>
            <Field id="lbl-set-pace" label="Pace caret" hint="A faint second cursor moves at a steady pace in Practice and Test. Try to keep up with it.">
              <Seg label="Pace caret" value={st.pace} options={[["off", "Off"], ["target", "Target"], ["best", "Best"]]} onChange={v => set("pace", v)} />
            </Field>
          </Group>
          <Separator />
          <Group title="Keyboard">
            <Field id="lbl-set-layout" label="Keyboard shape">
              <Seg label="Keyboard shape" value={st.layout} options={[["iso", "ISO"], ["ansi", "ANSI"]]} onChange={v => { set("layout", v); rebuildKeyboards(); }} />
            </Field>
          </Group>
          <Separator />
          <Group title="Lessons">
            <Row id="set-unlock" label="Unlock all lessons" checked={!!st.unlockAll} onChange={v => set("unlockAll", v)} />
          </Group>
          <Separator />
          <Group title="Progress">
            <p className="small muted save-line" id="save-status" aria-live="polite">{save}</p>
            {confirm ? (
              <div className="confirm" id="reset-confirm">
                <p>This erases all lessons, key stats and history, here and in your account.</p>
                <div className="actions">
                  <Button variant="destructive" size="sm" id="set-reset-yes" onClick={() => { resetAll(); setConfirm(false); onOpenChange(false); currentExercise()?.refreshHints?.(); reroute(); }}>Yes, erase everything</Button>
                  <Button variant="ghost" size="sm" id="set-reset-no" onClick={() => setConfirm(false)}>Keep my progress</Button>
                </div>
              </div>
            ) : <div id="reset-zone"><Button variant="outline" size="sm" id="set-reset" onClick={() => setConfirm(true)}>Reset progress</Button></div>}
          </Group>
          <Separator />
          <Group title="Coach">
            {wk.available ? (
              <div id="set-coach-on">
                <Row id="set-weekly" label="Weekly coach" hint="The first time you open Home Row each week, Claude reviews your last week and writes one fresh lesson. Uses your Claude usage."
                  checked={!!st.weekly} onChange={v => { set("weekly", v); if (v) weeklyRun({ force: true }); else { WK.msg = ""; syncWeeklyUI(); } }} />
                <p className="small muted" id="set-weekly-msg" role="status" aria-live="polite">{wk.msg}</p>
              </div>
            ) : <p className="small muted" id="set-coach-off">{wk.off}</p>}
          </Group>
          <Separator />
          <Group title="About">
            <div><Button variant="outline" size="sm" id="set-welcome" onClick={() => { onOpenChange(false); showWelcome(1); }}>Show the welcome again</Button></div>
          </Group>
        </div>
      </DialogContent>
    </Dialog>
  );
}
