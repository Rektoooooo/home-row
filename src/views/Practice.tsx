/* PRACTICE: the adaptive "Next round" hero, round run, round result strip, Your keys / Slowest pairs, and the modes Real text / Code / Your text.
   Ported from legacy/src/app5.js (renderPractice, startRound) and app11.js (practice modes). Flow glue lives in core/flows.ts. */
import { stageName } from "@/core/data";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, Check, ChevronRight, Lock, RotateCcw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Btn, Cap, ENTER, Panel, Pstat, StatusChip } from "@/components/parts";
import { TypingStage } from "@/components/TypingStage";
import { S, C } from "@/core/state";
import { settingChanged } from "@/core/store";
import { FING, LESSONS, CO, charInfo, fcol, pick } from "@/core/data";
import { TEXTS, SNIPPETS } from "@/core/texts";
import { keyWpm, keyAcc, lessonDone, nextLessonN, poolLetters, strengthOf } from "@/core/stats";
import * as G from "@/core/generate";
import { prepRound, finishRound } from "@/core/flows";
import { liveCheck } from "@/core/rewards";
import { reduceMotion } from "@/ui/engine";
import { t, tn, tx, pct, finger, speed, speedUnit, speedTxt } from "@/i18n";
import { useProgress } from "@/lib/progress";
import { goLesson } from "@/lib/route";
import { Screen, toTop } from "@/lib/screen";
import { cn } from "@/lib/utils";
import "@/styles/drills.css";

/* ---------- shared building blocks (also used by Test and Session) ---------- */

/* shadcn Card panel with an h2 title (legacy panel({tag:"h2"})); Panel in parts.tsx always uses an h1 */
export function HPanel({ eyebrow, title, msg, children, foot, className }: { eyebrow: ReactNode; title?: ReactNode; msg?: ReactNode; children?: ReactNode; foot?: ReactNode; className?: string }) {
  return (
    <Card className={cn("panel flat", className)}>
      <div className="panel-body">
        <div className="panel-head"><div><span className="label">{eyebrow}</span>{title ? <h2 className="pt">{title}</h2> : null}</div></div>
        {msg ? <p className="msg">{msg}</p> : null}
        {children}
      </div>
      {foot ? <div className="panel-foot">{foot}</div> : null}
    </Card>
  );
}

/* legacy re-rendered the screen after every click, so Enter afterwards ran the primary action. React keeps focus on the clicked
   control, where Enter would press it again: drop focus after a mouse click (keyboard clicks have detail 0 and keep it). */
export const mouseBlur = (e: React.MouseEvent<HTMLElement>) => { if (e.detail > 0) e.currentTarget.blur(); };

/* segmented choice: shadcn ToggleGroup in the legacy .seg look. Radix single groups emit "" when the selected item is clicked again: that keeps the value, and only a control that passes onReclick reacts */
export function Seg({ label, value, options, onChange, onReclick, className, children }: { label: string; value: string; options: [string, ReactNode][]; onChange: (v: string) => void; onReclick?: () => void; className?: string; children?: (v: string) => ReactNode }) {
  return (
    <ToggleGroup type="single" aria-label={label} className={cn("seg h-auto rounded-[10px]", className)} value={value} onValueChange={v => { if (v) onChange(v); else onReclick?.(); }}>
      {options.map(([v, l]) => <ToggleGroupItem key={v} value={v} onClick={mouseBlur} className="h-auto min-w-0 hover:bg-transparent">{children ? children(v) : l}</ToggleGroupItem>)}
    </ToggleGroup>
  );
}

/* Include toggles (Capitals / Punctuation / Numbers): shadcn Toggle buttons inside a .seg */
export function IncludeRow({ items }: { items: [string, string, boolean][] }) {
  if (!items.length) return null;
  return (
    <div className="optrow"><span className="label">{t("label|Include")}</span>
      <div className="seg">{items.map(([k, l, on]) => (
        <Toggle key={k} onClick={mouseBlur} className="tbtn h-auto min-w-0 hover:bg-transparent" pressed={on} onPressedChange={() => { S.settings[k] = !S.settings[k]; settingChanged(); }}>{l}</Toggle>
      ))}</div>
    </div>
  );
}

export const paceLine = () => {
  const pc = G.paceFor("practice");
  return pc ? <p className="small muted">{S.settings.pace === "best" && C().bests.practice > 0 ? t("Pace caret: your best, {s} {unit}", { s: speed(pc), unit: speedUnit() }) : t("Pace caret: {s} {unit}", { s: speed(pc), unit: speedUnit() })}</p> : null;
};

/* bars grow from 0 on a fresh screen */
function useGrow(v: number) {
  const [x, setX] = useState(() => (reduceMotion() ? v : 0));
  useEffect(() => { const id = requestAnimationFrame(() => requestAnimationFrame(() => setX(v))); return () => cancelAnimationFrame(id); }, [v]);
  return x;
}

/* one row of the Your keys / Slowest pairs lists; id is a key or a letter pair */
function KRow({ id, st, sv, onPick }: { id: string; st: any; sv: number | null; onPick: (id: string) => void }) {
  const pair = id.length === 2, w = keyWpm(st), a = keyAcc(st), isNew = sv == null, done = !isNew && sv! >= 1;
  const key = id.toUpperCase();
  const lab = isNew ? t("Practise {key}: still new", { key }) : w ? t("Practise {key}: {s} {unit}, {acc} accuracy", { key, s: speed(w), unit: speedUnit(), acc: pct(a + "%") }) : t("Practise {key}: {acc} accuracy", { key, acc: pct(a + "%") });
  const grow = useGrow(isNew ? 0 : Math.round(Math.min(sv!, 1) * 100));
  return (
    <button type="button" className={cn("krow", isNew && "new")} aria-label={lab} onClick={() => onPick(id)}>
      <span className={cn("kc", pair && "pair")} style={{ "--fc": fcol(charInfo(id[0]).key.f) } as any}>{id.toUpperCase()}</span>
      <Progress className="kbar h-1.5 bg-sunken [&>div]:rounded-[3px] [&>div]:bg-fg-2 data-[ok=true]:[&>div]:bg-ok" data-ok={done} value={grow} aria-hidden="true" />
      <span className="knum">{isNew ? t("Still new") : <>{w ? t("{s} {unit} · ", { s: speed(w), unit: speedUnit() }) : ""}{pct(a + "%")}{done ? <span className="ok"><Check size={14} aria-hidden="true" /></span> : null}</>}</span>
      <span className="go"><ChevronRight size={16} aria-hidden="true" /></span>
    </button>
  );
}

/* the "Round done" strip. extra: change chip or the Your-text buttons */
export function RoundStrip({ info, extra, className, status }: { info: any; extra?: ReactNode; className?: string; status?: ReactNode }) {
  if (!info || info.wpm == null) return null;
  return (
    <Card className={cn("panel flat rstrip flex-row", className)} role="region" aria-label={t("Round result")}>
      <span className="label">{t("Round done")}</span>{status}
      <span className="rs"><span className="num">{speed(info.wpm)}</span><span className="label">{speedUnit()}</span></span>
      <span className="rs"><span className="num">{pct(Math.round(info.acc * 100) + "%")}</span><span className="label">{t("Accuracy")}</span></span>
      {extra}
    </Card>
  );
}

/* a round of adaptive practice (legacy startRound). o: {focus, text, avoid, crumb, back}; onDone(res, info) */
export function AdaptiveRound({ o, onDone, onBack }: { o: any; onDone: (res: any, info: any) => void; onBack: () => void }) {
  const [prep] = useState(() => prepRound(o));
  if (!prep) return null;
  const st = S.settings;
  return <TypingStage opts={{
    crumb: prep.focus.length === 2 ? t("{crumb} · Focus pair {focus}", { crumb: o.crumb || t("tab|Practice"), focus: prep.focus.toUpperCase() }) : t("{crumb} · Focus key {focus}", { crumb: o.crumb || t("tab|Practice"), focus: prep.focus.toUpperCase() }), text: prep.text, mode: st.stop ? "stop" : "free",
    pace: G.paceFor("practice") || undefined, onBack: o.back || onBack,
    onFinish: res => onDone(res, finishRound(res, prep.focus, prep.before)),
  }} />;
}

/* a round in a practice mode (legacy pmRound) */
function ModeRound({ o, onBack }: { o: { text: string; code?: boolean; crumb: string; done: (res: any) => void }; onBack: () => void }) {
  return <TypingStage opts={{
    text: o.text, code: !!o.code, mode: S.settings.stop ? "stop" : "free", crumb: o.crumb, pace: G.paceFor("practice") || undefined, onBack,
    onFinish: res => { C().modes.at = Date.now(); o.done(res); liveCheck(false); },
  }} />;
}

/* ---------- the view ---------- */
type Scr = { k: "idle" } | { k: "adaptive"; id: number; o: any } | { k: "mode"; id: number; o: any };
let MT_DRAFT = "";
let ids = 0;

export function PracticeView() {
  useProgress();
  const [scr, setScr] = useState<Scr>({ k: "idle" });
  const [info, setInfo] = useState<any>(null);
  const [, bump] = useState(0);
  const refresh = () => bump(n => n + 1);
  const toIdle = (i?: any) => { setInfo(i || null); setScr({ k: "idle" }); };
  const mode = G.pmode();
  const setMode = (m: string) => { G.pmSet(G.PM_KEY, m); setInfo(null); refresh(); };

  if (scr.k === "adaptive") return <AdaptiveRound key={scr.id} o={scr.o} onBack={() => toIdle()} onDone={(_res, i) => toIdle(i)} />;
  if (scr.k === "mode") return <ModeRound key={scr.id} o={scr.o} onBack={() => toIdle()} />;
  const startAdaptive = (o: any) => setScr({ k: "adaptive", id: ++ids, o });
  const startMode = (o: any) => setScr({ k: "mode", id: ++ids, o });
  const head = (sub: string) => (<>
    <div className="view-head"><h1>{t("tab|Practice")}</h1>{sub ? <p>{sub}</p> : null}</div>
    <div className="pmodes">
      <ToggleGroup type="single" aria-label={t("Practice mode")} className="seg h-auto rounded-[10px]" value={mode} onValueChange={v => { if (v) setMode(v); }}>
        {G.PMODES.filter(m => m[0] !== "code" || CO.code).map(m => (
          <ToggleGroupItem key={m[0]} value={m[0]} onClick={mouseBlur} className="h-auto min-w-0 hover:bg-transparent">{G.pmodeName(m[0])}{G.pmLocked(m[0]) ? <span className="lk"><Lock size={13} aria-hidden="true" /><span className="vh"> {t("(locked)")}</span></span> : null}</ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  </>);

  let page: ReactNode;
  if (mode === "adaptive") page = <AdaptivePage info={info} head={head} refresh={refresh} start={startAdaptive} />;
  else if (mode === "mine") page = <MinePage info={info} head={head} startMode={startMode} done={toIdle} />;
  else if (G.pmLocked(mode)) page = <LockedPage m={mode} info={info} head={head} start={startMode} done={toIdle} refresh={refresh} />;
  else if (mode === "text") page = <TextPage info={info} head={head} refresh={refresh} startMode={startMode} done={toIdle} />;
  else page = <CodePage info={info} head={head} refresh={refresh} startMode={startMode} done={toIdle} />;
  return <div><Screen kind="idle" k={mode + "|" + G.pmLang() + "|" + (info ? 1 : 0)} />{page}</div>;
}

/* ---------- adaptive ---------- */
/* "Show all keys" lives outside the page like legacy's module-level SHOWALL: it survives rounds and tab switches */
let SHOWALL = false;
function AdaptivePage({ info, head, refresh, start }: { info: any; head: (s: string) => ReactNode; refresh: () => void; start: (o: any) => void }) {
  const [showAll, setShowAllState] = useState(SHOWALL);
  const toggleAll = () => { SHOWALL = !SHOWALL; setShowAllState(SHOWALL); };
  const pool = poolLetters(), st = S.settings;
  if (!pool.length) return (
    <>
      {head("")}
      <div className="pw560"><Panel flat eyebrow={t("tab|Practice")} title={t("Nothing to practise yet")} msg={t("Pass lesson 1 to start practising. Practice builds rounds from the keys you have learned.")}
        foot={<Btn primary hint={ENTER} onClick={() => goLesson(1)}>{t("button|Go to lesson 1")}</Btn>} /></div>
    </>
  );
  const nr = G.nextRound(pool), focus: string = nr.focus, isPair = focus.length === 2, ci = charInfo(isPair ? focus[0] : focus), f = ci.key.f;
  const sp = G.slowPairs(6, pool);
  const strong = pool.filter(k => { const sv = strengthOf(C().keys[k]); return sv != null && sv >= 1; }).length;
  const all = strong === pool.length, nx = nextLessonN();
  const keys = pool.map(k => ({ k, st: C().keys[k], sv: strengthOf(C().keys[k]) as number | null })).sort((a, b) => ((a.sv == null) as any) - ((b.sv == null) as any) || (a.sv as number) - (b.sv as number));
  const shown = showAll ? keys : keys.slice(0, 8);
  const toggles: [string, string, boolean][] = [];
  if (st.unlockAll || lessonDone(CO.capsN)) toggles.push(["pCaps", t("chip|Capitals"), st.pCaps]);
  if (st.unlockAll || lessonDone(CO.punctN)) toggles.push(["pPunct", t("chip|Punctuation"), st.pPunct]);
  if (st.unlockAll || CO.numN.some(lessonDone)) toggles.push(["pNums", t("chip|Numbers"), st.pNums]);
  const has = info && info.before != null && info.after != null, up = has && info.after >= info.before;
  const chg = has ? <span className={cn("chg", up ? "up" : "down")}>{up ? <ArrowUp aria-hidden="true" /> : <ArrowDown aria-hidden="true" />}{t("{key}: {before} → {after} {unit}", { key: info.focus.toUpperCase(), before: speed(info.before), after: speed(info.after), unit: speedUnit() })}</span> : null;
  const fs = G.focusStat(focus), fw = keyWpm(fs), fa = keyAcc(fs);
  const reason = all ? t("Picked to keep every key fresh.") : isPair ? t("Your weakest letter pair right now.") : t("Your weakest key right now.");
  const pick = (id: string) => start({ focus: id });
  return (
    <>
      {head(t("Short rounds built around your weakest key or letter pair."))}
      {info ? <RoundStrip info={info} extra={chg} /> : null}
      <HPanel eyebrow={t("heading|Next round")} title={t("Focus on {key}", { key: focus.toUpperCase() })}
        foot={<>
          <Btn variant="ghost" onClick={e => { mouseBlur(e); G.setNEXT(null); G.nextRound(pool); refresh(); }}><RotateCcw aria-hidden="true" />{t("button|New words")}</Btn>
          <Btn primary hint={ENTER} onClick={() => { const n = G.NEXT; G.setNEXT(null); start(n ? { focus: n.focus, text: n.text } : {}); }}>{info ? t("button|Next round") : t("button|Start round")}</Btn>
        </>}>
        <div className="nr-grid">
          <div className="nr-l">
            <div className="focus">
              {isPair
                ? <><span className="pairfocus">{[...focus].map((c, i) => <Cap key={i} k={c} />)}</span><p><strong>{focus.toUpperCase()}</strong><br /><span className="muted">{G.capFirst(G.pairFingers(focus))}</span></p></>
                : <><Cap k={focus} /><p><strong>{focus.toUpperCase()}</strong><br /><span className="muted">{G.capFirst(finger(f))}</span></p></>}
            </div>
            <p className="muted">{reason}</p>
            {fs && fs.n > 0 ? <div className="pstats"><Pstat num={fw ? speed(fw) : "–"} label={speedUnit()} /><Pstat num={pct(fa + "%")} label={t("Accuracy")} /><Pstat num={fs.n} label={t("Presses")} /></div> : <p className="muted">{t("New key: no data yet.")}</p>}
            {all ? <div className="upnext"><p>{t("All your keys are strong at {target}. Continue with the next lesson, or raise the target speed in Settings.", { target: speedTxt(st.target) })}</p>{nx ? <Btn variant="ghost" size="sm" onClick={() => goLesson(nx)}>{t("Go to lesson {n}", { n: nx })}</Btn> : null}</div> : null}
          </div>
          <div className="nr-r">
            <span className="label">{t("label|Preview")}</span>
            <div className="preview" role="group" aria-label={t("Preview of the round")}><span>{nr.text.slice(0, 90)}</span></div>
            <IncludeRow items={toggles} />
            {paceLine()}
          </div>
        </div>
      </HPanel>
      <div className="pgrid2">
        <HPanel eyebrow={t("heading|Your keys")} msg={t("Weakest first. Tap a key to practise it.")}>
          <div className="klist">{shown.map(x => <KRow key={x.k} id={x.k} st={x.st} sv={x.sv} onPick={pick} />)}</div>
          {keys.length > 8 ? <Btn variant="ghost" size="sm" className="showall" onClick={e => { mouseBlur(e); toggleAll(); }}>{showAll ? t("button|Show fewer") : t("Show all {n} keys", { n: keys.length })}</Btn> : null}
          <p className="small muted">{t("Strong: {n} of {total} at {target} and 95% accuracy.", { n: strong, total: pool.length, target: speedTxt(st.target) })}</p>
        </HPanel>
        <HPanel eyebrow={t("heading|Slowest letter pairs")} msg={t("Tap a pair to practise it.")}>
          {sp.length ? <div className="klist">{sp.map((x: any) => <KRow key={x.p} id={x.p} st={x.st} sv={x.sv} onPick={pick} />)}</div> : <div className="empty">{t("Pairs show up here after a few rounds.")}</div>}
        </HPanel>
      </div>
    </>
  );
}

/* ---------- real text / code ---------- */
type ModeProps = { info: any; head: (s: string) => ReactNode; refresh: () => void; startMode: (o: any) => void; done: (i?: any) => void };
const pmInfo = (res: any) => ({ wpm: res.wpm, acc: res.acc });

function startText(tx0: any, p: Pick<ModeProps, "startMode" | "done">, crumb?: string) {
  p.startMode({ text: tx0.x, crumb: crumb || t("Practice · Real text"), done: (res: any) => { C().modes.text++; G.pmMarkDone(tx0.t); G.setRT(null); p.done(pmInfo(res)); } });
}
function startCode(s: any, p: Pick<ModeProps, "startMode" | "done">) {
  p.startMode({ text: s.x, code: true, crumb: t("Practice · Code"), done: (res: any) => { C().modes.code++; G.setCS(null); p.done(pmInfo(res)); } });
}

function TextPage(p: ModeProps) {
  if (!G.RT) G.pmPickText();
  const tt = G.RT, done = new Set(G.pmDone());
  return (
    <>
      {p.head(t("Type real passages with capitals, punctuation and numbers."))}
      <RoundStrip info={p.info} />
      <HPanel eyebrow={t("heading|Real text")} title={t("text|" + tt.t)}
        foot={<><Btn variant="ghost" onClick={e => { mouseBlur(e); G.pmPickText(); p.refresh(); }}><RotateCcw aria-hidden="true" />{t("button|New text")}</Btn><Btn primary hint={ENTER} onClick={() => startText(tt, p)}>{t("button|Start")}</Btn></>}>
        <div className="nr-grid">
          <div className="nr-l"><p className="muted">{t("{chars} · {minutes} at your speed", { chars: G.pmChars(tt.x.length), minutes: G.pmMinutes(tt.x.length) })}</p><p className="muted">{t("Capitals, punctuation and numbers are part of the text.")}</p>{paceLine()}</div>
          <div className="nr-r"><span className="label">{t("label|Preview")}</span><div className="preview l4" role="group" aria-label={t("Preview of the text")}><span>{tt.x}</span></div></div>
        </div>
      </HPanel>
      <div className="pmlib">
        <HPanel eyebrow={t("heading|All texts")} msg={t("Tap a text to start it. Texts you finished are checked.")}>
          <div className="tlist">{TEXTS.map((x: any, i: number) => { const d = done.has(x.t); return (
            <button key={i} type="button" className={cn("trow", d && "done")} onClick={() => startText(TEXTS[i], p)}>
              <span className="tt">{t("text|" + x.t)}</span>{d ? <span className="ok" role="img" aria-label={t("Done")}><Check size={14} aria-hidden="true" /></span> : null}<span className="go"><ChevronRight size={16} aria-hidden="true" /></span>
            </button>); })}</div>
        </HPanel>
      </div>
    </>
  );
}

function CodePage(p: ModeProps) {
  const lang = G.pmLang();
  if (!G.CS || (lang !== "All" && G.CS.lang !== lang)) G.pmPickSnip();
  const s = G.CS, lines = s.x.split("\n").length, list = G.pmSnips();
  return (
    <>
      {p.head(t("Type short code snippets with real indentation and symbols."))}
      <div className="pmodes">
        <ToggleGroup type="single" aria-label={t("Language")} className="seg h-auto rounded-[10px]" value={lang} onValueChange={v => { if (v) { G.pmSet(G.PM_LANG, v); G.setCS(null); p.refresh(); } }}>
          {G.PMLANGS.map((l: string) => <ToggleGroupItem key={l} value={l} onClick={mouseBlur} className="h-auto min-w-0 hover:bg-transparent">{l === "All" ? t("opt|All") : l}</ToggleGroupItem>)}
        </ToggleGroup>
      </div>
      <RoundStrip info={p.info} />
      <HPanel eyebrow={t("Code · {lang}", { lang: s.lang })} title={s.t}
        foot={<><Btn variant="ghost" onClick={e => { mouseBlur(e); G.pmPickSnip(); p.refresh(); }}><RotateCcw aria-hidden="true" />{t("button|New snippet")}</Btn><Btn primary hint={ENTER} onClick={() => startCode(s, p)}>{t("button|Start")}</Btn></>}>
        <div className="nr-grid">
          <div className="nr-l"><p className="muted">{t("Press Enter for a new line. Indentation is typed for you.")}</p><p className="small muted">{t("{lines} · {chars}", { lines: tn(lines, "{n} line", "{n} lines"), chars: G.pmChars(s.x.length) })}</p>{paceLine()}</div>
          <div className="nr-r"><span className="label">{t("label|Preview")}</span><div className="preview code" role="group" aria-label={t("Preview of the snippet")} tabIndex={0}>{s.x}</div></div>
        </div>
      </HPanel>
      <div className="pmlib">
        <HPanel eyebrow={t("heading|Snippets")} msg={lang === "All" ? t("All {n} snippets. Tap one to start it.", { n: list.length }) : t("{n} {lang} snippets. Tap one to start it.", { n: list.length, lang })}>
          <div className="tlist">{list.map((x: any) => (
            <button key={SNIPPETS.indexOf(x)} type="button" className="trow" onClick={() => startCode(x, p)}><span className="ltag">{x.lang}</span><span className="tt">{x.t}</span><span className="go"><ChevronRight size={16} aria-hidden="true" /></span></button>
          ))}</div>
        </HPanel>
      </div>
    </>
  );
}

function LockedPage({ m, info, head, start, done, refresh }: { m: string; info: any; head: (s: string) => ReactNode; start: (o: any) => void; done: (i?: any) => void; refresh: () => void }) {
  void refresh;
  const n = G.pmLockN(m), label = m === "text" ? t("mode|Real text") : t("mode|Code"), stage = LESSONS[n - 1].stage, nx = nextLessonN();
  let sample: ReactNode;
  if (m === "text") { if (!G.RT) G.pmPickText(); sample = <><span className="label">{t("A sample")}</span><div className="preview l4" role="group" aria-label={t("Sample text")}><span>{G.RT.x}</span></div></>; }
  else { if (!G.CS || G.pmLang() !== "All") G.setCS(pick(SNIPPETS)); sample = <><span className="label">{t("A sample")}</span><div className="preview code" role="group" aria-label={t("Sample snippet")} tabIndex={0}>{G.CS.x}</div></>; }
  const what = m === "text" ? t("{n} short passages, from a few lines to a paragraph. Real sentences with capitals, punctuation and numbers.", { n: TEXTS.length }) : t("{n} short snippets in JavaScript, Python, Swift, CSS, SQL and Shell. Enter starts a new line, and indentation is typed for you.", { n: SNIPPETS.length });
  const sp = { startMode: start, done };
  return (
    <>
      {head(m === "text" ? t("Type real passages with capitals, punctuation and numbers.") : t("Type short code snippets with real indentation and symbols."))}
      <RoundStrip info={info} />
      <HPanel eyebrow={<><Lock size={14} aria-hidden="true" style={{ display: "inline", verticalAlign: "-2px" }} /> {label}</>} title={t("{label} unlocks after lesson {n} ({stage}).", { label, n, stage: stageName(stage) })}
        foot={<><Btn variant="ghost" onClick={() => { if (m === "text") { if (!G.RT) G.pmPickText(); startText(G.RT, sp); } else { if (!G.CS) G.setCS(pick(SNIPPETS)); startCode(G.CS, sp); } }}>{t("button|Try one anyway")}</Btn>{nx ? <Btn primary hint={ENTER} onClick={() => goLesson(nx)}>{t("Go to lesson {n}", { n: nx })}</Btn> : null}</>}>
        <div className="nr-grid"><div className="nr-l"><p className="muted">{what}</p></div><div className="nr-r">{sample}</div></div>
      </HPanel>
    </>
  );
}

/* ---------- your text ---------- */
function MinePage({ info, head, startMode, done }: { info: any; head: (s: string) => ReactNode; startMode: (o: any) => void; done: (i?: any) => void }) {
  const [draft, setDraft] = useState(MT_DRAFT);
  const [err, setErr] = useState("");
  const ta = useRef<HTMLTextAreaElement>(null);
  const [, bump] = useState(0);
  const list = G.mtList(), res = info && info.mt ? info.mt : null;
  const setD = (v: string) => { MT_DRAFT = v; setDraft(v); setErr(""); };
  const fb = draft.trim() ? G.mtFeedback(draft, false) : null;
  const start = (mt: any, idx: number) => {
    const total = mt.parts.length;
    startMode({ text: mt.parts[idx], crumb: t("Practice · Your text · Part {i} of {n}", { i: idx + 1, n: total }), done: (r: any) => {
      C().modes.mine++;
      const a = G.mtList(), e = a.find((x: any) => x.id === mt.id); if (e) { e.next = Math.max(e.next >= total ? 0 : e.next, idx + 1); e.at = Date.now(); G.mtSave(a); }
      done({ ...pmInfo(r), mt: { id: mt.id, idx, total } });
    } });
  };
  const go = () => {
    const f = G.mtFeedback(draft, true);
    if (f.err) { setErr(f.html); ta.current?.focus(); return; }
    const parts = f.sp!.parts, title = f.c!.text.slice(0, 40).trim();
    const a = G.mtList().filter((x: any) => !(x.parts[0] === parts[0] && x.parts.length === parts.length));
    const nt = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), title, parts, next: 0, at: Date.now() };
    a.unshift(nt); G.mtSave(a); MT_DRAFT = ""; setDraft("");
    start(nt, 0);
  };
  const cont = (id: string) => { const mt = G.mtList().find((x: any) => x.id === id); if (mt) start(mt, mt.next >= mt.parts.length ? 0 : mt.next); };
  const stripPrimary = !!res, first = list.length > 0 && !res;
  const goPrimary = !stripPrimary && (!first || draft.trim().length > 0), firstPrimary = !stripPrimary && first && draft.trim().length === 0;
  let strip: ReactNode = null;
  if (res && info.wpm != null) {
    const last = res.idx + 1 >= res.total;
    strip = <RoundStrip info={info} className="mt-strip"
      status={last ? <StatusChip ok label={t("All parts done")} /> : null}
      extra={<span className="rbtns">{last ? <Btn primary onClick={() => done()}>{t("button|Done")}</Btn> : <><Btn primary hint={ENTER} onClick={() => cont(res.id)}>{t("button|Next part")}</Btn><Btn variant="ghost" onClick={() => done()}>{t("button|Back to your texts")}</Btn></>}</span>} />;
  }
  return (
    <>
      {head(t("Practise with your own writing, in parts of about 300 characters."))}
      {strip}
      <div className={cn("mtgrid", list.length > 0 && "two")}>
        <HPanel eyebrow={t("heading|Your text")} title={t("Type your own writing")} foot={<Btn primary={goPrimary} onClick={go}>{t("button|Clean up and start")}</Btn>}>
          <label className="vh" htmlFor="mt-in">{t("heading|Your text")}</label>
          <Textarea ref={ta} id="mt-in" className="mtarea field-sizing-fixed" rows={6} maxLength={6000} placeholder={t("Paste an email, notes or any text you write often.")} spellCheck={false} autoComplete="off" value={draft} onChange={e => setD(e.target.value)} />
          <p className={cn("small mtmsg", err ? "err" : "muted")} id="mt-msg" role="status" aria-live="polite">{err || (fb ? fb.html : "")}</p>
          <p className="small muted">{t("Saved in this browser only. Your text never leaves this device.")}</p>
        </HPanel>
        {list.length ? (
          <HPanel eyebrow={t("heading|Recent texts")} msg={t("Pick up where you left off. The last 5 are kept.")}>
            <ul className="mlist">{list.map((m: any, i: number) => {
              const dn = m.next >= m.parts.length, lab = dn ? t("Done") : t("Part {i} of {n}", { i: m.next + 1, n: m.parts.length }), isFirst = i === 0 && !res;
              return (
                <li className="mrow" key={m.id}>
                  <div className="mt"><strong>{m.title}</strong><span className="small muted">{lab}</span></div>
                  <div className="ma">
                    <Btn size="sm" primary={isFirst && firstPrimary} hint={isFirst ? ENTER : undefined} onClick={() => cont(m.id)}>{dn ? t("button|Start again") : t("button|Continue")}</Btn>
                    <Btn variant="ghost" size="sm" aria-label={t("Remove {title}", { title: m.title })} onClick={() => { G.mtSave(G.mtList().filter((x: any) => x.id !== m.id)); bump(n => n + 1); toTop(); }}>{t("button|Remove")}</Btn>
                  </div>
                </li>
              );
            })}</ul>
          </HPanel>
        ) : null}
      </div>
    </>
  );
}
