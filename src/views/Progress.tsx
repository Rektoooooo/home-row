/* PROGRESS: level hero, weekly recap, tiles, practice calendar, speed trend, achievements, key heatmap, lessons, recent tests, saving.
   Ported from legacy/src/app5b.js (renderProgress) and app10.js (levelHeroHTML, recapHTML, achHTML). */
import { lessonTitle } from "@/core/data";
import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { Screen } from "@/lib/screen";
import { Btn, Cap, Pstat, Stars } from "@/components/parts";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { SPanel } from "@/components/SPanel";
import { Calendar } from "@/components/Calendar";
import { TrendChart } from "@/components/TrendChart";
import { Achievements } from "@/components/Achievements";
import { Keyboard } from "@/components/Keyboard";
import { S, C, COURSE } from "@/core/state";
import { FING, LESSONS, charInfo } from "@/core/data";
import { dLabel, heatMap, keyAcc, keyWpm, lessonDone, minutesToday, streak, strengthOf, unlocked, usefulPair, addDays } from "@/core/stats";
import { slowPairs, poolName } from "@/core/generate";
import { t, tn, dec, pct, finger, speed, speedUnit, speedTxt } from "@/i18n";
import { fmtMin, levelInfo, mondayOf, weekStats, weekTitle } from "@/core/rewards";
import { resetAll, resetCourse } from "@/core/store";
import { weekCard } from "@/core/shareCard";
import { openShare } from "@/ui/share";
import { useProgress, useSaveStatus } from "@/lib/progress";
import { goLesson, navigate } from "@/lib/route";
import { useGrown } from "@/ui/grown";
import "@/styles/panels.css";

const MINUS = "−";

function LevelRow({ big }: { big?: boolean }) {
  const L = levelInfo(), left = L.need - L.into, v = useGrown(L.pct);
  return (
    <div className={"lvl" + (big ? " big" : "")}><span className="lvl-n">{t("Level {n}", { n: L.level })}</span><Progress className="bar bg-sunken" value={v} aria-hidden="true" /><span className="lvl-t">{tn(left, "{n} word to level {next}", "{n} words to level {next}", { next: L.level + 1 })}</span></div>
  );
}

function Delta({ d, txt }: { d: number; txt: string }) {
  if (d === 0) return <span className="delta same">{t("No change")}</span>;
  const I = d > 0 ? ArrowUp : ArrowDown;
  return <span className={"delta " + (d > 0 ? "up" : "down")}><I size={12} strokeWidth={2} aria-hidden="true" />{d > 0 ? "+" : MINUS}{txt}</span>;
}

function Recap() {
  const mon = mondayOf(new Date()), c = weekStats(mon), p = weekStats(addDays(mon, -7));
  if (!c.has) return <section className="wrecap"><SPanel tag="h2" eyebrow={t("heading|This week")} title={weekTitle(mon)} msg={t("No practice yet this week. Even 10 minutes counts.")} /></section>;
  const dm = p.ms > 0 ? Math.round(c.min) - Math.round(p.min) : null;
  const dw = c.wpm == null || p.wpm == null ? null : speed(c.wpm) - speed(p.wpm);
  const da = c.acc == null || p.acc == null ? null : Math.round(c.acc * 100) - Math.round(p.acc * 100);
  return (
    <section className="wrecap">
      <SPanel tag="h2" eyebrow={t("heading|This week")} title={weekTitle(mon)} statsCls="c4e"
        stats={<>
          <Pstat num={fmtMin(c.min)} label={t("Time")} sub={dm == null ? undefined : <Delta d={dm} txt={fmtMin(Math.abs(dm))} /> as any} />
          <Pstat num={c.wpm == null ? "–" : speed(c.wpm)} label={t("Avg {unit}", { unit: speedUnit() })} sub={dw == null ? undefined : <Delta d={dw} txt={Math.abs(dw) + " " + speedUnit()} /> as any} />
          <Pstat num={c.acc == null ? "–" : pct(Math.round(c.acc * 100) + "%")} label={t("Accuracy")} sub={da == null ? undefined : <Delta d={da} txt={pct(Math.abs(da) + "%")} /> as any} />
          <Pstat num={c.tests} label={t("Tests")} sub={c.best ? t("best {s}", { s: speedTxt(c.best) }) : undefined} />
        </>}
        foot={<Btn variant="outline" onClick={() => openShare(weekCard())}>{t("button|Share week")}</Btn>} />
    </section>
  );
}

function Tiles() {
  const m = minutesToday(), g = S.settings.goal, sk = streak(), passed = LESSONS.filter(l => lessonDone(l.n)).length;
  let bt: any = null; C().tests.forEach((x: any) => { if (!bt || x.wpm > bt.wpm) bt = x; });
  const bar = useGrown(Math.min(100, m / g * 100));
  return (
    <div className="tiles">
      <Card className="tile"><span className="s">{t("heading|Today")}</span><span className="v num">{t("{m} of {g} min", { m: Math.floor(m), g })}</span><Progress className="bar bg-sunken h-1.5" value={bar} aria-hidden="true" /></Card>
      <Card className="tile"><span className="s">{t("label|Streak")}</span><span className="v num">{tn(sk, "{n} day", "{n} days")}</span></Card>
      <Card className="tile"><span className="s">{t("label|Best test")}</span><span className="v num">{bt ? speedTxt(bt.wpm) : t("None yet")}</span>{bt ? <span className="s">{t("{d} s test", { d: bt.dur })}</span> : null}</Card>
      <Card className="tile"><span className="s">{t("heading|Lessons")}</span><span className="v num">{t("{n} of {total} passed", { n: passed, total: LESSONS.length })}</span></Card>
    </div>
  );
}

function Heat() {
  const [heat, setHeat] = useState<"speed" | "acc">("speed"), ver = useProgress();
  const map = useMemo(() => heatMap(heat), [heat, ver]); // eslint-disable-line react-hooks/exhaustive-deps
  const learned = Object.keys(C().keys).filter(k => k !== "shift" && C().keys[k].n >= 8).map(k => ({ k, s: strengthOf(C().keys[k]), st: C().keys[k] })).filter(x => x.s != null).sort((a, b) => a.s - b.s);
  const sp8 = slowPairs(8);
  const prows = Object.keys(C().pairs).filter(usefulPair).sort((x, y) => C().pairs[y].n - C().pairs[x].n).slice(0, 60);
  const rows = Object.keys(C().keys).filter(k => k !== "shift").sort();
  return (
    <section className="sect-gap"><h2>{t("heading|Key heatmap")}</h2>
      <div className="optrow" style={{ marginBottom: 12 }}>
        <div className="seg" role="group" aria-label={t("label|Heat")}>
          {([["speed", t("opt|Speed")], ["acc", t("opt|Accuracy")]] as const).map(([v, l]) => <button key={v} type="button" data-seg="Heat" data-v={v} aria-pressed={heat === v} onClick={() => setHeat(v)}>{l}</button>)}
        </div>
      </div>
      <Keyboard mode="heat" id="heat-kb" label={heat === "speed" ? t("Keyboard coloured by key speed") : t("Keyboard coloured by key accuracy")} heat={map} />
      <div className="ramp"><span id="ramp-l">{heat === "speed" ? t("Slower") : pct("85%")}</span><i /><span id="ramp-r">{heat === "speed" ? t("At target") : pct("100%")}</span></div>
      <h3 style={{ marginTop: 24 }}>{t("heading|Slowest keys")}</h3>
      {learned.length ? <div className="slow">{learned.slice(0, 5).map(x => (
        <span className="pk" key={x.k}><Cap k={x.k} size="sm">{x.k.toUpperCase()}</Cap>{t("{s} {unit} · {acc}", { s: speed(keyWpm(x.st) || 0), unit: speedUnit(), acc: pct(keyAcc(x.st) + "%") })}</span>))}</div>
        : <div className="empty" style={{ marginTop: 10 }}>{t("Type at least 8 presses of a key to see it here.")}</div>}
      {rows.length ? <details><summary>{t("Show all keys as a table")}</summary><div className="tblwrap"><table className="tbl"><thead><tr><th>{t("col|Key")}</th><th>{t("col|Finger")}</th><th>{t("col|Presses")}</th><th>{speedUnit()}</th><th>{t("col|Accuracy")}</th><th>{t("col|Strength")}</th></tr></thead><tbody>
        {rows.map(k => { const s = C().keys[k], i = charInfo(k), sv = strengthOf(s); return <tr key={k}><td>{k.toUpperCase()}</td><td>{i ? finger(i.key.f) : ""}</td><td>{s.n}</td><td>{keyWpm(s) ? speed(keyWpm(s)!) : "–"}</td><td>{pct(keyAcc(s) + "%")}</td><td>{sv == null ? t("new") : dec(sv.toFixed(2))}</td></tr>; })}
      </tbody></table></div></details> : null}
      <h3 style={{ marginTop: 24 }}>{t("heading|Slowest letter pairs")}</h3>
      {sp8.length ? <div className="chips">{sp8.map((x: any) => <span className="pchip" key={x.p}><b>{x.p}</b>{t("{s} {unit} · {acc}", { s: speed(keyWpm(x.st) || 0), unit: speedUnit(), acc: pct(keyAcc(x.st) + "%") })}</span>)}</div>
        : <div className="empty" style={{ marginTop: 10 }}>{t("Practise a little more to see your slowest letter pairs.")}</div>}
      {prows.length ? <details><summary>{t("Show all letter pairs as a table")}</summary><div className="tblwrap"><table className="tbl"><thead><tr><th>{t("col|Pair")}</th><th>{t("col|Presses")}</th><th>{speedUnit()}</th><th>{t("col|Accuracy")}</th><th>{t("col|Strength")}</th></tr></thead><tbody>
        {prows.map(p => { const s = C().pairs[p], sv = strengthOf(s, 6); return <tr key={p}><td>{p}</td><td>{s.n}</td><td>{keyWpm(s) ? speed(keyWpm(s)!) : "–"}</td><td>{pct(keyAcc(s) + "%")}</td><td>{sv == null ? t("new") : dec(sv.toFixed(2))}</td></tr>; })}
      </tbody></table></div></details> : null}
    </section>
  );
}

function LessonsList() {
  return (
    <section className="sect-gap"><h2>{t("heading|Lessons")}</h2>
      {LESSONS.map(l => {
        const r = C().lessons[l.n], lock = !unlocked(l.n);
        return (
          <button key={l.n} type="button" className="crow" aria-disabled={lock || undefined} data-n={l.n} onClick={lock ? undefined : () => goLesson(l.n)}>
            <span className="lnum">{l.n}</span><span className="t">{lessonTitle(l)}</span>
            <span className="m">{lock ? t("Locked") : <><Stars n={r ? r.stars : 0} size={14} />{r && r.attempts ? <><span>{speedTxt(r.wpm)}</span><span>{pct(Math.round(r.acc * 100) + "%")}</span></> : <span>{t("Not started")}</span>}</>}</span>
          </button>
        );
      })}
    </section>
  );
}

const OPT: Record<string, () => string> = { c: () => t("opt|capitals"), p: () => t("opt|punctuation"), n: () => t("opt|numbers") };
function RecentTests() {
  const tests = C().tests.slice(-10).reverse();
  return (
    <section className="sect-gap"><h2>{t("heading|Recent tests")}</h2>
      {tests.length ? <div className="tblwrap"><table className="tbl tt"><thead><tr><th>{t("col|Date")}</th><th>{t("col|Length")}</th><th>{t("col|Words")}</th><th>{speedUnit()}</th><th>{t("col|Accuracy")}</th></tr></thead><tbody>
        {tests.map((r: any, i: number) => <tr key={i}><td>{dLabel(new Date(r.ts))}</td><td>{t("{d} s", { d: r.dur })}</td><td>{r.opts && [...r.opts].some((c: any) => OPT[c]) ? t("{pool} · {opts}", { pool: poolName(r.pool), opts: [...r.opts].map((c: any) => OPT[c]?.()).filter(Boolean).join(", ") }) : poolName(r.pool)}</td><td>{speed(r.wpm)}</td><td>{pct(Math.round(r.acc * 100) + "%")}</td></tr>)}
      </tbody></table></div>
        : <SPanel eyebrow={t("heading|Recent tests")} msg={t("No tests yet. Try a 30 second test to set your first score.")} foot={<Button variant="outline" type="button" onClick={() => navigate("test")}>{t("button|Go to Test")}</Button>} />}
    </section>
  );
}

function Saving() {
  const status = useSaveStatus(), [ask, setAsk] = useState(false);
  return (
    <section className="sect-gap"><h2>{t("heading|Saving")}</h2>
      <SPanel eyebrow={t("heading|Save status")}>
        <p className="save-line" aria-live="polite">{status}</p>
        <div id="pr-reset-zone">
          {ask ? <div className="confirm"><p>{COURSE === "cs" ? t("This erases the Czech course's lessons, key stats and tests, here and in your account. Your streak, minutes and badges stay.") : t("This erases all lessons, key stats and history, here and in your account.")}</p>
            <div className="actions"><Button variant="destructive" size="sm" type="button" onClick={() => { if (COURSE === "cs") resetCourse(); else resetAll(); setAsk(false); }}>{t("button|Yes, erase all progress")}</Button><Button variant="ghost" size="sm" type="button" onClick={() => setAsk(false)}>{t("button|Cancel")}</Button></div></div>
            : <Button variant="outline" size="sm" type="button" onClick={() => setAsk(true)}>{t("button|Reset progress")}</Button>}
        </div>
      </SPanel>
    </section>
  );
}

export function ProgressView() {
  useProgress();
  return (
    <div>
      <Screen kind="progress" />
      <div className="view-head"><h1>{t("tab|Progress")}</h1></div>
      <Card className="lvl-card"><LevelRow big /></Card>
      <Recap />
      <Tiles />
      <div className="pg-duo">
        <section className="sect-gap"><h2>{t("heading|Practice calendar")}</h2><p className="small muted" style={{ marginBottom: 12 }}>{t("Last 12 weeks. The darkest squares mean you reached your daily goal.")}</p><Calendar /></section>
        <section className="sect-gap"><h2>{t("heading|Speed trend")}</h2><p className="small muted">{t("Last 30 days, in words per minute.")}</p><TrendChart /></section>
      </div>
      <Achievements />
      <Heat />
      <LessonsList />
      <RecentTests />
      <Saving />
    </div>
  );
}
