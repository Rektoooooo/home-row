/* Settings (legacy p1.html #settings + app4.js wireSettings): a shadcn Dialog with segmented ToggleGroups, Switches and an in-dialog
   reset confirmation. Every control writes S.settings, stamps settingsAt and saves, exactly like legacy settingChanged(). */
import { useEffect, useState, useSyncExternalStore } from "react";
import { X } from "lucide-react";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Seg } from "@/views/Practice";
import { S, SC, COURSE } from "@/core/state";
import { resetAll, resetCourse, settingChanged } from "@/core/store";
import { switchCourse, setCsLayout } from "@/core/course";
import { soundPreview } from "@/core/sound";
import { weeklyView } from "@/ui/weekly";
import { subscribeWeekly, weeklyVersion } from "@/ui/celebrate";
import { weeklyRun, WK, syncWeeklyUI } from "@/core/sync";
import { currentExercise } from "@/ui/engine";
import { rebuildKeyboards } from "@/ui/keyboard";
import { showWelcome } from "@/ui/welcome";
import { t, speed, LANG, setLang, type Lang } from "@/i18n";
import { useLang } from "@/i18n/react";
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
  useProgress(); useLang();
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
          <DialogTitle className="font-heading text-[22px] leading-tight font-bold">{t("Settings")}</DialogTitle>
          <DialogClose asChild><Button variant="ghost" size="icon" aria-label={t("Close settings")} className="text-fg-2"><X aria-hidden="true" className="size-5" /></Button></DialogClose>
        </div>
        <DialogDescription id="set-desc" className="sr-only">{t("Typing, goals, keyboard and progress settings.")}</DialogDescription>
        <div className="dlg-body">
          <Group title={t("heading|Language and course")}>
            <Field id="lbl-set-lang" label={t("label|App language")}>
              <Seg label={t("label|App language")} value={LANG} options={[["en", "English"], ["cs", "Čeština"]]} onChange={v => setLang(v as Lang)} />
            </Field>
            <Field id="lbl-set-course" label={t("label|Course")} hint={t("Each course has its own lessons and progress. Your streak, minutes and badges are shared.")}>
              <Seg label={t("label|Course")} value={COURSE} options={[["en", t("opt|English (U.S. keyboard)")], ["cs", t("opt|Czech (Czech keyboard)")]]} onChange={v => switchCourse(v as "en" | "cs")} />
            </Field>
            {COURSE === "cs" ? (
              <Field id="lbl-set-cslayout" label={t("label|Czech keyboard")} hint={t("Pick the one your computer uses. On QWERTZ the Z key sits where QWERTY has Y.")}>
                <Seg label={t("label|Czech keyboard")} value={SC.csLayout === "qwerty" ? "qwerty" : "qwertz"} options={[["qwertz", "QWERTZ"], ["qwerty", "QWERTY"]]} onChange={v => setCsLayout(v as "qwertz" | "qwerty")} />
              </Field>
            ) : null}
          </Group>
          <Separator />
          <Group title={t("heading|Appearance")}>
            <Field id="lbl-set-theme" label={t("label|Theme")} hint={t("System follows your Mac, or claude.ai's own setting. Saved in this browser.")}>
              <Seg label={t("label|Theme")} value={theme} options={[["system", t("opt|System")], ["light", t("opt|Light")], ["dark", t("opt|Dark")]]} onChange={v => setThemePref(v as ThemePref)} />
            </Field>
          </Group>
          <Separator />
          <Group title={t("heading|Typing")}>
            <Field id="lbl-set-hints" label={t("label|Keyboard hints")}>
              <Seg label={t("label|Keyboard hints")} value={st.hints} options={[["always", t("opt|Always")], ["hesitate", t("opt|When I hesitate")], ["hidden", t("opt|Hidden")]]} onChange={v => set("hints", v)} />
            </Field>
            <Row id="set-stop" label={t("Stop on mistakes")} hint={t("The cursor waits until you press the right key.")} checked={!!st.stop} onChange={v => set("stop", v)} />
            <Field id="lbl-set-soundpack" label={t("label|Key sound")} hint={t("Made in your browser. No audio files.")}>
              <Seg label={t("label|Key sound")} value={st.soundPack} options={[["off", t("opt|Off")], ["soft", t("Soft")], ["cream", t("Creamy")], ["click", t("Clicky")], ["type", t("Typewriter")]]}
                onChange={v => { S.settings.soundPack = v; S.settings.sound = v !== "off"; settingChanged(); soundPreview(v); }} onReclick={() => soundPreview(st.soundPack)} />
            </Field>
          </Group>
          <Separator />
          <Group title={t("heading|Goals")}>
            <Field id="lbl-set-goal" label={t("label|Daily goal")}>
              <Seg label={t("label|Daily goal")} value={String(st.goal)} options={[["10", t("{n} min", { n: 10 })], ["15", t("{n} min", { n: 15 })], ["20", t("{n} min", { n: 20 })], ["30", t("{n} min", { n: 30 })]]} onChange={v => set("goal", +v)} />
            </Field>
            <Field id="lbl-set-target" label={t("label|Target speed")} hint={t("Words per minute. Used for key strength and Practice.")}>
              <Seg label={t("label|Target speed")} value={String(st.target)} options={[20, 25, 30, 35, 40].map(n => [String(n), String(speed(n))] as [string, string])} onChange={v => set("target", +v)} />
            </Field>
            <Field id="lbl-set-pace" label={t("label|Pace caret")} hint={t("A faint second cursor moves at a steady pace in Practice and Test. Try to keep up with it.")}>
              <Seg label={t("label|Pace caret")} value={st.pace} options={[["off", t("opt|Off")], ["target", t("opt|Target")], ["best", t("opt|Best")]]} onChange={v => set("pace", v)} />
            </Field>
          </Group>
          <Separator />
          <Group title={t("heading|Keyboard")}>
            <Field id="lbl-set-layout" label={t("label|Keyboard shape")}>
              <Seg label={t("label|Keyboard shape")} value={st.layout} options={[["iso", "ISO"], ["ansi", "ANSI"]]} onChange={v => { set("layout", v); rebuildKeyboards(); }} />
            </Field>
          </Group>
          <Separator />
          <Group title={t("heading|Lessons")}>
            <Row id="set-unlock" label={t("Unlock all lessons")} checked={!!st.unlockAll} onChange={v => set("unlockAll", v)} />
          </Group>
          <Separator />
          <Group title={t("heading|Progress")}>
            <p className="small muted save-line" id="save-status" aria-live="polite">{save}</p>
            {confirm ? (
              <div className="confirm" id="reset-confirm">
                <p>{COURSE === "cs" ? t("This erases the Czech course's lessons, key stats and tests, here and in your account. Your streak, minutes and badges stay.") : t("This erases all lessons, key stats and history, here and in your account.")}</p>
                <div className="actions">
                  <Button variant="destructive" size="sm" id="set-reset-yes" onClick={() => { if (COURSE === "cs") resetCourse(); else resetAll(); setConfirm(false); onOpenChange(false); currentExercise()?.refreshHints?.(); reroute(); }}>{t("button|Yes, erase everything")}</Button>
                  <Button variant="ghost" size="sm" id="set-reset-no" onClick={() => setConfirm(false)}>{t("button|Keep my progress")}</Button>
                </div>
              </div>
            ) : <div id="reset-zone"><Button variant="outline" size="sm" id="set-reset" onClick={() => setConfirm(true)}>{t("button|Reset progress")}</Button></div>}
          </Group>
          <Separator />
          <Group title={t("heading|Coach")}>
            {wk.available ? (
              <div id="set-coach-on">
                <Row id="set-weekly" label={t("Weekly coach")} hint={t("The first time you open Home Row each week, Claude reviews your last week and writes one fresh lesson. Uses your Claude usage.")}
                  checked={!!st.weekly} onChange={v => { set("weekly", v); if (v) weeklyRun({ force: true }); else { WK.msg = ""; syncWeeklyUI(); } }} />
                <p className="small muted" id="set-weekly-msg" role="status" aria-live="polite">{wk.msg}</p>
              </div>
            ) : <p className="small muted" id="set-coach-off">{wk.off}</p>}
          </Group>
          <Separator />
          <Group title={t("heading|About")}>
            <div><Button variant="outline" size="sm" id="set-welcome" onClick={() => { onOpenChange(false); showWelcome(1); }}>{t("button|Show the welcome again")}</Button></div>
          </Group>
        </div>
      </DialogContent>
    </Dialog>
  );
}
