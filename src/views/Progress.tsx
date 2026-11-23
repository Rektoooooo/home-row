/* PROGRESS: level hero, weekly recap, tiles, practice calendar, speed trend, achievements, key heatmap, lessons, recent tests, saving.
   Ported from legacy/src/app5b.js (renderProgress) and app10.js (levelHeroHTML, recapHTML, achHTML). */
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
import { S } from "@/core/state";
import { FING, LESSONS, charInfo } from "@/core/data";
import { dLabel, heatMap, keyAcc, keyWpm, lessonDone, minutesToday, streak, strengthOf, unlocked, usefulPair, addDays } from "@/core/stats";
import { slowPairs, POOL_NAME } from "@/core/generate";
import { fmtMin, levelInfo, mondayOf, weekStats, weekTitle } from "@/core/rewards";
import { resetAll } from "@/core/store";
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
    <div className={"lvl" + (big ? " big" : "")}><span className="lvl-n">Level {L.level}</span><Progress className="bar bg-sunken" value={v} aria-hidden="true" /><span className="lvl-t">{left} {left === 1 ? "word" : "words"} to level {L.level + 1}</span></div>
  );
}

function Delta({ d, txt }: { d: number; txt: string }) {
  if (d === 0) return <span className="delta same">No change</span>;
  const I = d > 0 ? ArrowUp : ArrowDown;
  return <span className={"delta " + (d > 0 ? "up" : "down")}><I size={12} strokeWidth={2} aria-hidden="true" />{d > 0 ? "+" : MINUS}{txt}</span>;
}

function Recap() {
  const mon = mondayOf(new Date()), c = weekStats(mon), p = weekStats(addDays(mon, -7));
  if (!c.has) return <section className="wrecap"><SPanel tag="h2" eyebrow="This week" title={weekTitle(mon)} msg="No practice yet this week. Even 10 minutes counts." /></section>;
  const dm = p.ms > 0 ? Math.round(c.min) - Math.round(p.min) : null;
  const dw = c.wpm == null || p.wpm == null ? null : Math.round(c.wpm) - Math.round(p.wpm);
  const da = c.acc == null || p.acc == null ? null : Math.round(c.acc * 100) - Math.round(p.acc * 100);
  return (
    <section className="wrecap">
      <SPanel tag="h2" eyebrow="This week" title={weekTitle(mon)} statsCls="c4e"
        stats={<>
          <Pstat num={fmtMin(c.min)} label="Time" sub={dm == null ? undefined : <Delta d={dm} txt={fmtMin(Math.abs(dm))} /> as any} />
          <Pstat num={c.wpm == null ? "–" : Math.round(c.wpm)} label="Avg WPM" sub={dw == null ? undefined : <Delta d={dw} txt={Math.abs(dw) + " WPM"} /> as any} />
          <Pstat num={c.acc == null ? "–" : Math.round(c.acc * 100) + "%"} label="Accuracy" sub={da == null ? undefined : <Delta d={da} txt={Math.abs(da) + "%"} /> as any} />
          <Pstat num={c.tests} label="Tests" sub={c.best ? "best " + Math.round(c.best) + " WPM" : undefined} />
        </>}
        foot={<Btn variant="outline" onClick={() => openShare(weekCard())}>Share week</Btn>} />
    </section>
  );
}

function Tiles() {
  const m = minutesToday(), g = S.settings.goal, sk = streak(), passed = LESSONS.filter(l => lessonDone(l.n)).length;
  let bt: any = null; S.tests.forEach((t: any) => { if (!bt || t.wpm > bt.wpm) bt = t; });
  const bar = useGrown(Math.min(100, m / g * 100));
  return (
    <div className="tiles">
      <Card className="tile"><span className="s">Today</span><span className="v num">{Math.floor(m)} of {g} min</span><Progress className="bar bg-sunken h-1.5" value={bar} aria-hidden="true" /></Card>
      <Card className="tile"><span className="s">Streak</span><span className="v num">{sk} day{sk === 1 ? "" : "s"}</span></Card>
      <Card className="tile"><span className="s">Best test</span><span className="v num">{bt ? Math.round(bt.wpm) + " WPM" : "None yet"}</span>{bt ? <span className="s">{bt.dur} s test</span> : null}</Card>
      <Card className="tile"><span className="s">Lessons</span><span className="v num">{passed} of {LESSONS.length} passed</span></Card>
    </div>
  );
}

function Heat() {
  const [heat, setHeat] = useState<"speed" | "acc">("speed"), ver = useProgress();
  const map = useMemo(() => heatMap(heat), [heat, ver]); // eslint-disable-line react-hooks/exhaustive-deps
  const learned = Object.keys(S.keys).filter(k => k !== "shift" && S.keys[k].n >= 8).map(k => ({ k, s: strengthOf(S.keys[k]), st: S.keys[k] })).filter(x => x.s != null).sort((a, b) => a.s - b.s);
  const sp8 = slowPairs(8);
  const prows = Object.keys(S.pairs).filter(usefulPair).sort((x, y) => S.pairs[y].n - S.pairs[x].n).slice(0, 60);
  const rows = Object.keys(S.keys).filter(k => k !== "shift").sort();
  return (
    <section className="sect-gap"><h2>Key heatmap</h2>
      <div className="optrow" style={{ marginBottom: 12 }}>
        <div className="seg" role="group" aria-label="Heat">
          {([["speed", "Speed"], ["acc", "Accuracy"]] as const).map(([v, t]) => <button key={v} type="button" data-seg="Heat" data-v={v} aria-pressed={heat === v} onClick={() => setHeat(v)}>{t}</button>)}
        </div>
      </div>
      <Keyboard mode="heat" id="heat-kb" label={"Keyboard coloured by key " + (heat === "speed" ? "speed" : "accuracy")} heat={map} />
      <div className="ramp"><span id="ramp-l">{heat === "speed" ? "Slower" : "85%"}</span><i /><span id="ramp-r">{heat === "speed" ? "At target" : "100%"}</span></div>
      <h3 style={{ marginTop: 24 }}>Slowest keys</h3>
      {learned.length ? <div className="slow">{learned.slice(0, 5).map(x => (
        <span className="pk" key={x.k}><Cap k={x.k} size="sm">{x.k.toUpperCase()}</Cap>{keyWpm(x.st) || 0} WPM · {keyAcc(x.st)}%</span>))}</div>
        : <div className="empty" style={{ marginTop: 10 }}>Type at least 8 presses of a key to see it here.</div>}
      {rows.length ? <details><summary>Show all keys as a table</summary><div className="tblwrap"><table className="tbl"><thead><tr><th>Key</th><th>Finger</th><th>Presses</th><th>WPM</th><th>Accuracy</th><th>Strength</th></tr></thead><tbody>
        {rows.map(k => { const s = S.keys[k], i = charInfo(k), sv = strengthOf(s); return <tr key={k}><td>{k.toUpperCase()}</td><td>{i ? FING[i.key.f].n : ""}</td><td>{s.n}</td><td>{keyWpm(s) || "–"}</td><td>{keyAcc(s)}%</td><td>{sv == null ? "new" : sv.toFixed(2)}</td></tr>; })}
      </tbody></table></div></details> : null}
      <h3 style={{ marginTop: 24 }}>Slowest letter pairs</h3>
      {sp8.length ? <div className="chips">{sp8.map((x: any) => <span className="pchip" key={x.p}><b>{x.p}</b>{keyWpm(x.st)} WPM · {keyAcc(x.st)}%</span>)}</div>
        : <div className="empty" style={{ marginTop: 10 }}>Practise a little more to see your slowest letter pairs.</div>}
      {prows.length ? <details><summary>Show all letter pairs as a table</summary><div className="tblwrap"><table className="tbl"><thead><tr><th>Pair</th><th>Presses</th><th>WPM</th><th>Accuracy</th><th>Strength</th></tr></thead><tbody>
        {prows.map(p => { const s = S.pairs[p], sv = strengthOf(s, 6); return <tr key={p}><td>{p}</td><td>{s.n}</td><td>{keyWpm(s) || "–"}</td><td>{keyAcc(s)}%</td><td>{sv == null ? "new" : sv.toFixed(2)}</td></tr>; })}
      </tbody></table></div></details> : null}
    </section>
  );
}

function LessonsList() {
  return (
    <section className="sect-gap"><h2>Lessons</h2>
      {LESSONS.map(l => {
        const r = S.lessons[l.n], lock = !unlocked(l.n);
        return (
          <button key={l.n} type="button" className="crow" aria-disabled={lock || undefined} data-n={l.n} onClick={lock ? undefined : () => goLesson(l.n)}>
            <span className="lnum">{l.n}</span><span className="t">{l.title}</span>
            <span className="m">{lock ? "Locked" : <><Stars n={r ? r.stars : 0} size={14} />{r && r.attempts ? <><span>{Math.round(r.wpm)} WPM</span><span>{Math.round(r.acc * 100)}%</span></> : <span>Not started</span>}</>}</span>
          </button>
        );
      })}
    </section>
  );
}

const OPT: Record<string, string> = { c: "capitals", p: "punctuation", n: "numbers" };
function RecentTests() {
  const tests = S.tests.slice(-10).reverse();
  return (
    <section className="sect-gap"><h2>Recent tests</h2>
      {tests.length ? <div className="tblwrap"><table className="tbl tt"><thead><tr><th>Date</th><th>Length</th><th>Words</th><th>WPM</th><th>Accuracy</th></tr></thead><tbody>
        {tests.map((t: any, i: number) => <tr key={i}><td>{dLabel(new Date(t.ts))}</td><td>{t.dur} s</td><td>{(POOL_NAME[t.pool] || t.pool) + (t.opts ? " · " + [...t.opts].map((c: any) => OPT[c]).filter(Boolean).join(", ") : "")}</td><td>{Math.round(t.wpm)}</td><td>{Math.round(t.acc * 100)}%</td></tr>)}
      </tbody></table></div>
        : <SPanel eyebrow="Recent tests" msg="No tests yet. Try a 30 second test to set your first score." foot={<Button variant="outline" type="button" onClick={() => navigate("test")}>Go to Test</Button>} />}
    </section>
  );
}

function Saving() {
  const status = useSaveStatus(), [ask, setAsk] = useState(false);
  return (
    <section className="sect-gap"><h2>Saving</h2>
      <SPanel eyebrow="Save status">
        <p className="save-line" aria-live="polite">{status}</p>
        <div id="pr-reset-zone">
          {ask ? <div className="confirm"><p>This erases all lessons, key stats and history, here and in your account.</p>
            <div className="actions"><Button variant="destructive" size="sm" type="button" onClick={() => { resetAll(); setAsk(false); }}>Yes, erase all progress</Button><Button variant="ghost" size="sm" type="button" onClick={() => setAsk(false)}>Cancel</Button></div></div>
            : <Button variant="outline" size="sm" type="button" onClick={() => setAsk(true)}>Reset progress</Button>}
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
      <div className="view-head"><h1>Progress</h1></div>
      <Card className="lvl-card"><LevelRow big /></Card>
      <Recap />
      <Tiles />
      <div className="pg-duo">
        <section className="sect-gap"><h2>Practice calendar</h2><p className="small muted" style={{ marginBottom: 12 }}>Last 12 weeks. The darkest squares mean you reached your daily goal.</p><Calendar /></section>
        <section className="sect-gap"><h2>Speed trend</h2><p className="small muted">Last 30 days, in words per minute.</p><TrendChart /></section>
      </div>
      <Achievements />
      <Heat />
      <LessonsList />
      <RecentTests />
      <Saving />
    </div>
  );
}
