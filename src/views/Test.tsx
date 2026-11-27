/* TEST: options, the timed run, results with the speed chart, bests and recent tests. Ported from legacy/src/app5.js (renderTest, startTest, testDone). */
import { useEffect, useMemo, useState } from "react";
import { ArrowUp, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Btn, ENTER, Panel, Pstat } from "@/components/parts";
import { TypingStage } from "@/components/TypingStage";
import { S, C } from "@/core/state";
import { settingChanged } from "@/core/store";
import { dLabel, pctTxt } from "@/core/stats";
import { POOL_NAME, paceFor, testChunk, recordTest, testChart, testOptsFromSettings, type TestCfg } from "@/core/flows";
import { SHT } from "@/core/rewards";
import { bestCard, testCard } from "@/core/shareCard";
import { openShare } from "@/ui/share";
import { useProgress } from "@/lib/progress";
import { useEscape } from "@/lib/escape";
import { Screen } from "@/lib/screen";
import { countUp } from "@/ui/countup";
import { HPanel, IncludeRow, Seg, mouseBlur } from "@/views/Practice";
import { poolName } from "@/core/generate";
import { t, speed, speedUnit, pct } from "@/i18n";
import "@/styles/drills.css";

/* a timed test. cfg: {dur, o, crumb, back, baseline}; onDone(res, isBest) (baseline: the welcome typing check, which records nothing) */
export function TestRun({ dur, o, crumb, baseline, onBack, onDone }: { dur: number; o: TestCfg; crumb?: string; baseline?: boolean; onBack: () => void; onDone: (res: any, isBest: boolean) => void }) {
  const [init] = useState(() => { const c = testChunk(45, o, ""); return { text: c.text as string, last: { v: c.last as string } }; });
  return <TypingStage opts={{
    crumb: crumb || t("Test · {dur} s · {pool}", { dur, pool: poolName(o.pool) }), text: init.text, mode: "free", timeLimit: dur * 1000, noKb: true, noStats: !!baseline,
    pace: baseline ? undefined : paceFor("test", dur) || undefined, onBack,
    more: () => { const n = testChunk(15, o, init.last.v); init.last.v = n.last; return n.text; },
    onFinish: res => { if (baseline) { onDone(res, false); return; } onDone(res, recordTest(res, dur, o)); },
  }} />;
}

const NewBest = () => <Badge variant="secondary" className="status ok h-auto gap-1.5 px-2.5 py-1 font-heading text-[13px] leading-tight font-semibold text-fg"><Check size={14} strokeWidth={2} className="text-ok" aria-hidden="true" />{t("New best")}</Badge>;

function Chart({ res, dur }: { res: any; dur: number }) {
  const c = useMemo(() => testChart(res, dur), [res, dur]);
  const [hov, setHov] = useState<{ x: number; text: string; px: number; py: number } | null>(null);
  const move = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!c.tpts.length) return;
    const svg = e.currentTarget, r = svg.getBoundingClientRect(), vx = (e.clientX - r.left) / r.width * c.W;
    let best = c.tpts[0]; for (const p of c.tpts) if (Math.abs(p.x - vx) < Math.abs(best.x - vx)) best = p;
    setHov({ x: best.x, text: best.text, px: r.left + best.x / c.W * r.width, py: r.top + best.y / c.H * r.height });
  };
  return (
    <div className="chart-wrap">
      <svg className="chart" id="tchart" viewBox={"0 0 " + c.W + " " + c.H} role="img" aria-label={c.label} onPointerMove={move} onPointerDown={move} onPointerLeave={() => setHov(null)}>
        {c.yTicks.map(k => <g key={"y" + k.v}><line className="grid" x1={c.L} x2={c.W - c.R} y1={k.y} y2={k.y} /><text x={c.L - 8} y={k.y + 4} textAnchor="end">{speed(k.v)}</text></g>)}
        {c.xTicks.map(k => <text key={"x" + k.s} x={k.x} y={c.H - 8} textAnchor="middle">{t("{s} s", { s: k.s })}</text>)}
        <path className="wash" d={c.area} /><path className="ln" d={c.line} />
        {c.marks.map((d, i) => <path key={i} className="xm" d={d} />)}
        <line className="cross" id="tcross" y1={c.T} y2={c.T + c.ph} x1={hov ? hov.x : 0} x2={hov ? hov.x : 0} style={{ display: hov ? "block" : "none" }} />
        <circle className="dot-end" cx={c.lastX} cy={c.lastY} r={4} />
        <text className="lbl" x={c.lastX + 10} y={c.lastY + 4}>{speed(c.last.wpm)}</text>
      </svg>
      {hov ? <div className="pop in-chart" style={{ left: hov.px, top: hov.py }}>{hov.text}</div> : null}
    </div>
  );
}

function TestResults({ res, dur, o, isBest, onSettings, onAgain }: { res: any; dur: number; o: TestCfg; isBest: boolean; onSettings: () => void; onAgain: () => void }) {
  useEscape(onSettings);
  useEffect(() => { countUp(); }, []);
  const opts = [o.caps ? t("opt|capitals") : "", o.punct ? t("opt|punctuation") : "", o.nums ? t("opt|numbers") : ""].filter(Boolean);
  const eyebrow = opts.length ? t("Test · {dur} s · {pool} · {opts}", { dur, pool: poolName(o.pool), opts: opts.join(", ") }) : t("Test · {dur} s · {pool}", { dur, pool: poolName(o.pool) });
  return (
    <div className="result">
      <Screen kind="results" />
      <Panel wide eyebrow={eyebrow} title={t("Test done")} status={isBest ? <NewBest /> : null}
        stats={<><Pstat lead num={speed(res.wpm)} label={speedUnit()} sub={isBest ? t("your best at {dur} s", { dur }) : undefined} /><Pstat num={speed(res.raw)} label={t("Raw {unit}", { unit: speedUnit() })} /><Pstat num={pctTxt(res.acc)} label={t("Accuracy")} /><Pstat num={res.correct + " · " + res.mistakes} label={t("Correct · mistakes")} /></>} statsCls="c4"
        foot={<>
          <Btn variant="outline" onClick={onSettings}>{t("button|Change settings")}</Btn>
          {SHT ? <Btn variant="outline" onClick={() => openShare(testCard(SHT))}>{t("button|Share")}</Btn> : null}
          <Btn primary hint={ENTER} onClick={onAgain}>{t("button|Try again")}</Btn>
        </>}>
        <div>
          <h3>{t("Speed during the test")}</h3>
          <div className="legrow"><span><svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" style={{ display: "inline", verticalAlign: "middle", marginRight: 6 }}><path d="M3 3l8 8m0-8l-8 8" stroke="var(--error)" strokeWidth="2" strokeLinecap="round" /></svg>{t("mistake")}</span></div>
          <Chart res={res} dur={dur} />
        </div>
      </Panel>
    </div>
  );
}

type Scr = { k: "idle" } | { k: "run"; id: number; dur: number; o: TestCfg } | { k: "done"; res: any; dur: number; o: TestCfg; isBest: boolean };
let ids = 0;

export function TestView() {
  useProgress();
  const [scr, setScr] = useState<Scr>({ k: "idle" });
  const st = S.settings, pool = POOL_NAME[st.tPool] ? st.tPool : "c200";
  const sample = useMemo(() => testChunk(12, { pool, caps: st.tCaps, punct: st.tPunct, nums: st.tNums }, "").text.trim(), [pool, st.tCaps, st.tPunct, st.tNums, st.tDur]);
  const toIdle = () => setScr({ k: "idle" });
  const start = () => { const cfg = { dur: st.tDur as number, o: testOptsFromSettings() }; setScr({ k: "run", id: ++ids, ...cfg }); };

  if (scr.k === "run") return <TestRun key={scr.id} dur={scr.dur} o={scr.o} onBack={toIdle} onDone={(res, isBest) => setScr({ k: "done", res, dur: scr.dur, o: scr.o, isBest })} />;
  if (scr.k === "done") return <TestResults key="done" res={scr.res} dur={scr.dur} o={scr.o} isBest={scr.isBest} onSettings={toIdle} onAgain={() => setScr({ k: "run", id: ++ids, dur: scr.dur, o: scr.o })} />;

  const setDur = (d: number) => { S.settings.tDur = d; settingChanged(); };
  const tiles = [15, 30, 60, 120].map(d => {
    const raw = C().bests["test" + d] || 0, b = Math.round(raw), tr = C().tests.filter((x: any) => x.dur === d).sort((x: any, y: any) => y.wpm - x.wpm)[0];
    return (
      <button key={d} type="button" className="best" aria-pressed={st.tDur === d} onClick={e => { mouseBlur(e); setDur(d); }}>
        <span className="label">{t("{d} s", { d })}</span><span className="num">{b ? speed(raw) : "–"}</span><span className="sub">{!b ? t("No test yet") : tr ? t("{acc} accuracy", { acc: pct(Math.round(tr.acc * 100) + "%") }) : ""}</span>
      </button>
    );
  });
  const rows = C().tests.slice(-5).reverse();
  return (
    <div>
      <Screen kind="idle" />
      <div className="view-head"><h1>{t("tab|Test")}</h1><p>{t("Type as much as you can before the timer ends. Mistakes stay in the text. Backspace fixes them.")}</p></div>
      <div className="tgrid opts-panel">
        <HPanel eyebrow={t("heading|Options")} foot={<Btn primary hint={ENTER} onClick={start}>{t("button|Start test")}</Btn>}>
          <div className="opts">
            <div className="optrow"><span className="label">{t("label|Duration")}</span>
              <Seg label={t("label|Duration")} value={String(st.tDur)} options={[15, 30, 60, 120].map(d => [String(d), t("{d} s", { d })] as [string, string])} onChange={v => setDur(+v)} /></div>
            <div className="optrow"><span className="label">{t("label|Words")}</span>
              <Seg label={t("label|Words")} value={st.tPool} options={[["c200", poolName("c200")], ["e950", poolName("e950")]]} onChange={v => { S.settings.tPool = v; settingChanged(); }} /></div>
            <IncludeRow items={[["tCaps", t("chip|Capitals"), st.tCaps], ["tPunct", t("chip|Punctuation"), st.tPunct], ["tNums", t("chip|Numbers"), st.tNums]]} />
          </div>
          <div className="nr-r"><span className="label">{t("label|Sample")}</span><div className="preview" role="group" aria-label={t("Sample words")}><span>{sample}</span></div></div>
        </HPanel>
        <HPanel eyebrow={t("heading|Your results")} foot={rows.length ? <Button variant="ghost" asChild><a href="#progress">{t("button|See your speed trend")}</a></Button> : undefined}>
          <div className="bests">{tiles}</div>
          {(C().bests["test" + st.tDur] || 0) > 0 ? <div><Btn variant="ghost" size="sm" onClick={() => openShare(bestCard())}><ArrowUp size={14} aria-hidden="true" />{t("Share best · {d} s", { d: st.tDur })}</Btn></div> : null}
          <div><span className="label">{t("label|Recent tests")}</span>
            {rows.length ? (
              <div className="tblwrap"><table className="tbl tt rt"><thead><tr><th>{t("col|Date")}</th><th>{t("col|Time")}</th><th>{t("col|Words")}</th><th>{speedUnit()}</th><th>{t("col|Accuracy")}</th></tr></thead><tbody>
                {rows.map((r: any, i: number) => <tr key={i}><td>{dLabel(new Date(r.ts))}</td><td>{t("{d} s", { d: r.dur })}</td><td>{poolName(r.pool)}</td><td className="wv">{speed(r.wpm)}</td><td>{pct(Math.round(r.acc * 100) + "%")}</td></tr>)}
              </tbody></table></div>
            ) : <div className="empty" style={{ marginTop: 10 }}>{t("No tests yet. Your results show up here.")}</div>}
          </div>
        </HPanel>
      </div>
    </div>
  );
}
