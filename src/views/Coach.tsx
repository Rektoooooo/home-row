/* COACH: paste-in panel (website), Ask Claude (claude.ai), Claude's note, Your lessons, Share with Claude, and the custom lesson run.
   Ported from legacy/src/app8.js and app8b.js. All coach text is untrusted: it only reaches the page as React text. */
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ChevronLeft } from "lucide-react";
import { Btn, Cap, ENTER, Panel, Pstat, Stars, StatusChip } from "@/components/parts";
import { SPanel } from "@/components/SPanel";
import { TypingStage } from "@/components/TypingStage";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { S } from "@/core/state";
import { LESSONS } from "@/core/data";
import { MON, applyCustomResult, lessonDone, pctTxt } from "@/core/stats";
import { SHARE_PROMPT, importLessons } from "@/core/coach";
import { isObj } from "@/core/store";
import { setHooks } from "@/core/hooks";
import { rewardsLesson } from "@/core/rewards";
import { ACCT, ASK, COACH, SAMPLE, askClaude, coachMutate, coachOff, coachRemove, customById, getClaude, progressExport, shareLocal } from "@/core/sync";
import { useProgress, useSaveStatus } from "@/lib/progress";
import { useEscape } from "@/lib/escape";
import { goLesson, navigate } from "@/lib/route";
import { countUp } from "@/ui/countup";
import { Screen } from "@/lib/screen";
import "@/styles/panels.css";

/* the core calls hooks.rerenderCoach when the coach doc or the ask state changes (account snapshot, ask, mutate) */
let coachVer = 0;
const coachSubs = new Set<() => void>();
setHooks({ rerenderCoach: () => { coachVer++; coachSubs.forEach(f => f()); } });
const useCoachVersion = () => useSyncExternalStore(f => { coachSubs.add(f); return () => { coachSubs.delete(f); }; }, () => coachVer);

const fmtDay = (ts: number) => { const d = new Date(ts); return d.getDate() + " " + MON[d.getMonth()]; };
const copyText = (t: string) => { try { return navigator.clipboard.writeText(t); } catch (e) { return Promise.reject(e); } };

/* ---- claude.ai: ask Claude ---- */
function AskPanel() {
  if (!SAMPLE || !ACCT || coachOff || !LESSONS.some(l => lessonDone(l.n))) return null;
  const body = ASK.ok ? <p className="small muted">New lesson added below.</p> : ASK.err ? <p className="small coach-err" role="alert">{ASK.err}</p> : null;
  const foot = ASK.running
    ? <><span className="grow muted thinking" role="status">Thinking<i>.</i><i>.</i><i>.</i></span><Btn variant="ghost" onClick={() => { if (ASK.ctl) ASK.ctl.abort(); }}>Stop</Btn></>
    : <Btn variant="outline" onClick={() => { askClaude(); }}>Ask Claude for a lesson</Btn>;
  return <section className="section-s"><SPanel tag="h2" eyebrow="Ask Claude" title="A lesson made for you" msg="Claude looks at your weakest keys and letter pairs and writes a short lesson for you. It uses your Claude usage." foot={foot}>{body}</SPanel></section>;
}

/* ---- website: paste Claude's reply to add lessons ---- */
interface Paste { open: boolean; text: string; msg: string; err: boolean }
const PASTE0: Paste = { open: false, text: "", msg: "", err: false };
function PastePanel() {
  const [p, setP] = useState<Paste>(PASTE0), [copied, setCopied] = useState(false), [fallback, setFallback] = useState<string | null>(null);
  const area = useRef<HTMLTextAreaElement>(null), fb = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { if (p.open) area.current?.focus({ preventScroll: true }); }, [p.open]);
  useEffect(() => { if (fallback != null && fb.current) { fb.current.focus(); fb.current.select(); } }, [fallback]);
  const copy = () => {
    const text = progressExport();
    copyText(text).then(
      () => { setCopied(true); setP(q => ({ ...q, msg: "Copied. Paste it into a chat with Claude.", err: false })); setTimeout(() => setCopied(false), 1600); },
      () => { setP({ ...PASTE0, msg: "Your browser blocked copying. Select the text below and copy it." }); setFallback(text); },
    );
  };
  const add = () => {
    const r = importLessons(p.text);
    const fail = (msg: string) => setP(q => ({ ...q, msg, err: true }));
    if (!r) return fail("No lessons found. Paste Claude's whole reply, including the block that starts with {\"homerow\".");
    if (!r.added.length) return fail(r.bad === 1 ? "That lesson can't be used: it has characters this keyboard can't type, or a step is too short or too long. Ask Claude to fix it." : "These lessons can't be used: they have characters this keyboard can't type, or steps that are too short or too long. Ask Claude to fix them.");
    const ids = new Set(r.added.map((l: any) => l.id)), n = r.added.length;
    setP({ open: false, text: "", err: false, msg: "Added " + n + (n === 1 ? " lesson" : " lessons") + " below." + (r.bad ? " " + r.bad + (r.bad === 1 ? " lesson" : " lessons") + " couldn't be used." : "") });
    coachMutate((raw: any) => {
      const ls = (Array.isArray(raw.lessons) ? raw.lessons : []).filter((x: any) => !(isObj(x) && ids.has(x.id)));
      raw.lessons = r.added.concat(ls).slice(0, 20); if (r.note) raw.note = r.note; return raw;
    });
  };
  const msg = <p className={"small " + (p.err ? "coach-err" : "muted")} id="paste-msg" role={p.err ? "alert" : "status"}>{p.msg}</p>;
  const body = p.open
    ? <><label className="vh" htmlFor="paste-in">Claude's reply</label>
        <Textarea id="paste-in" ref={area} className="mtarea field-sizing-fixed" rows={6} maxLength={40000} spellCheck={false} placeholder="Paste Claude's whole reply here" value={p.text} onChange={e => { const v = e.target.value; setP(q => ({ ...q, text: v })); }} />{msg}</>
    : <><ol className="psteps"><li><b>Copy your progress.</b> It tells Claude your weakest keys and how to write the lessons.</li><li><b>Paste it into a chat with Claude</b> on claude.ai or in the Claude app.</li><li><b>Paste Claude's reply here.</b> Its lessons appear below.</li></ol>{msg}
        {fallback != null ? <Textarea id="paste-copy" ref={fb} className="mtarea field-sizing-fixed" rows={5} readOnly aria-label="Your progress, ready to copy" value={fallback} /> : null}</>;
  const foot = p.open
    ? <><Btn variant="ghost" onClick={() => setP(PASTE0)}>Cancel</Btn><Btn onClick={add}>Add lessons</Btn></>
    : <><Btn variant="outline" onClick={copy}>{copied ? "Copied" : "Copy my progress"}</Btn><Btn onClick={() => { setFallback(null); setP({ open: true, text: "", msg: "", err: false }); }}>Paste Claude's reply</Btn></>;
  return <section className="section-s"><SPanel tag="h2" eyebrow="Three steps" title="Get new lessons from Claude" foot={foot}>{body}</SPanel></section>;
}

/* ---- your lessons ---- */
function LessonCard({ l, rm, setRm, onOpen }: { l: any; rm: string; setRm: (id: string) => void; onOpen: (id: string) => void }) {
  const r = S.custom[l.id], date = l.created ? " · " + fmtDay(l.created) : "";
  const meta = r && r.attempts ? <><Stars n={r.stars} size={14} /><span>{Math.round(r.wpm)} WPM · {Math.round(r.acc * 100)}%</span></> : <span className="muted">Not started</span>;
  const foot = rm === l.id
    ? <><span className="grow small">Remove this lesson?</span><Button variant="destructive" size="sm" onClick={() => { setRm(""); coachRemove(l.id); }}>Remove</Button><Button variant="ghost" size="sm" onClick={() => setRm("")}>Keep</Button></>
    : <><Button variant="ghost" size="sm" onClick={() => setRm(l.id)}>Remove</Button><Button size="sm" onClick={() => onOpen(l.id)}>Start</Button></>;
  return (
    <SPanel tag="h3" eyebrow={(l.id.indexOf("weekly-") === 0 ? "This week · made by Claude" : l.by === "app" ? "Made in the app" : "Made in chat") + date} title={l.title}
      msg={l.why ? <span className="clamp2">{l.why}</span> : undefined} foot={foot}><div className="cmeta">{meta}</div></SPanel>
  );
}

function YourLessons({ ready, onOpen }: { ready: boolean; onOpen: (id: string) => void }) {
  const [rm, setRm] = useState(""), n = COACH.lessons.length;
  if (!n && !COACH.note && !COACH.dropped && !ready) return null;
  return (
    <section className="section-s">
      <div className="stage-h"><h2>Your lessons</h2>{n ? <span className="scount">{n}{n === 1 ? " lesson" : " lessons"}</span> : null}</div>
      {COACH.note ? <div className="coach-note"><span className="label">Claude's note{COACH.note.at ? " · " + fmtDay(COACH.note.at) : ""}</span><p>{COACH.note.text}</p></div> : null}
      {n ? <div className="cgrid">{COACH.lessons.map((l: any) => <LessonCard key={l.id} l={l} rm={rm} setRm={setRm} onOpen={onOpen} />)}</div>
        : <div className="empty">No lessons yet. {getClaude() ? "Ask Claude above, or ask in any Claude chat." : "Paste Claude's reply above and they show up here."}</div>}
      {COACH.dropped ? <p className="small muted" style={{ marginTop: 12 }}>{COACH.dropped}{COACH.dropped === 1 ? " lesson from Claude couldn't" : " lessons from Claude couldn't"} be used on this keyboard.</p> : null}
    </section>
  );
}

/* ---- claude.ai: share with Claude ---- */
function ShareCard() {
  useSaveStatus();
  const local = shareLocal(), [label, setLabel] = useState(""), [msg, setMsg] = useState(""), [box, setBox] = useState<string | null>(null);
  const area = useRef<HTMLTextAreaElement>(null), pre = useRef<HTMLPreElement>(null);
  useEffect(() => { if (box != null && area.current) { area.current.focus(); area.current.select(); } }, [box]);
  const copy = () => {
    const text = local ? progressExport() : SHARE_PROMPT;
    copyText(text).then(
      () => { setLabel("Copied"); if (local) setMsg("Copied. Paste it into a chat with Claude."); setTimeout(() => setLabel(""), 1600); },
      () => {
        if (local) setBox(text);
        else if (pre.current) { const r = document.createRange(); r.selectNodeContents(pre.current); const s = getSelection(); s?.removeAllRanges(); s?.addRange(r); }
        setMsg("Press ⌘C to copy");
      },
    );
  };
  if (local) return (
    <section className="sect-gap"><SPanel tag="h2" eyebrow="Share with Claude" title="Send your progress to Claude"
      msg="This copy saves your progress in this browser only, so Claude can’t see it. Copy it and paste it into a Claude chat. Claude can check it, move it to your account and add custom lessons."
      foot={<Btn variant="outline" id="share-copy" onClick={copy}>{label || "Copy my progress"}</Btn>}>
      <Textarea id="share-box" ref={area} className="promptbox exportbox field-sizing-fixed" readOnly rows={4} hidden={box == null} aria-label="Your progress, ready to copy" value={box ?? ""} />
      <p className="small muted" id="share-msg" role="status">{msg}</p></SPanel></section>
  );
  return (
    <section className="sect-gap"><SPanel tag="h2" eyebrow="Share with Claude" title="Let Claude see your progress"
      msg="Your progress is saved privately in your claude.ai account. In any Claude chat, ask Claude to check it. It can read your stats and add custom lessons to the Coach tab."
      foot={<Btn variant="outline" id="share-copy" onClick={copy}>{label || "Copy prompt"}</Btn>}>
      <pre className="promptbox" id="share-box" tabIndex={0} ref={pre}>{SHARE_PROMPT}</pre>
      <p className="small muted" id="share-msg" role="status">{msg}</p></SPanel></section>
  );
}

function CoachList({ onOpen }: { onOpen: (id: string) => void }) {
  const ready = LESSONS.some(l => lessonDone(l.n));
  const claude = !!getClaude();
  return (
    <>
      <div className="view-head"><h1>Coach</h1><p>Claude reads your progress and writes short lessons for the keys you miss most.</p></div>
      {!ready ? <div className="empty"><p>Pass lesson 1 first. Claude needs some of your typing to write lessons for you.</p><Btn variant="outline" onClick={() => goLesson(1)}>Go to lesson 1</Btn></div>
        : claude ? <AskPanel /> : <PastePanel />}
      <YourLessons ready={ready} onOpen={onOpen} />
      {claude ? <ShareCard /> : null}
    </>
  );
}

/* ---- running a custom lesson (the lesson flow with Claude's texts) ---- */
interface Run { id: string; title: string; step: number; texts: string[]; names: string[]; agg: { ms: number; chars: number; presses: number; correct: number; missBy: Record<string, number> } }
type Screen = { k: "list" } | { k: "intro"; id: string } | { k: "stage"; n: number } | { k: "summary"; res: any; s: number } | { k: "results"; r: any };

function Intro({ id, onStart, onBack }: { id: string; onStart: () => void; onBack: () => void }) {
  const l = customById(id);
  useEscape(onBack);
  if (!l) return null;
  return (
    <div className="intro">
      <Panel eyebrow={l.by === "app" ? "From Claude · made in the app" : "From Claude"} title={l.title} msg={l.why || undefined}
        foot={<><Btn variant="ghost" onClick={onBack}><ChevronLeft aria-hidden="true" />Back to Coach</Btn><Btn primary hint={ENTER} onClick={onStart}>Start lesson</Btn></>}>
        <ol className="csteps">{l.steps.map((s: any, i: number) => <li key={i}><span className="cname">{s.name}</span><code>{s.text.length > 48 ? s.text.slice(0, 48) + "…" : s.text}</code></li>)}</ol>
      </Panel>
    </div>
  );
}

function StepDone({ run, res, s, onNext, onEsc }: { run: Run; res: any; s: number; onNext: () => void; onEsc: () => void }) {
  const N = run.texts.length;
  useEscape(onEsc);
  useEffect(() => { countUp(); }, []);
  return (
    <div className="result">
      <Panel eyebrow={<>From Claude · step {s} of {N}</>} title={<>{run.names[s - 1]} done</>}
        stats={<><Pstat num={Math.round(res.wpm)} label="WPM" /><Pstat num={pctTxt(res.acc)} label="Accuracy" /></>} statsCls="c2"
        foot={<><Btn variant="ghost" onClick={() => navigate("coach")}><ChevronLeft aria-hidden="true" />Back to lessons</Btn><Btn primary hint={ENTER} onClick={onNext}>Next step</Btn></>}>
        <div className="upnext"><span className="label">Up next</span><span className="txt2">Step {s + 1} · {run.names[s]}</span></div>
      </Panel>
    </div>
  );
}

function Results({ r, onAgain, onEsc }: { r: any; onAgain: () => void; onEsc: () => void }) {
  const { title, passed, stars, wpm, acc, pk, time, target } = r;
  useEscape(onEsc);
  useEffect(() => { countUp(); }, []);
  return (
    <div className="result">
      <Panel eyebrow="From Claude" title={title} status={<StatusChip ok={passed} />}
        msg={passed ? undefined : "Accuracy " + pctTxt(acc) + ". You need 95% to pass. Slow down a little and keep your eyes on the screen."}
        stats={<><Pstat num={Math.round(wpm)} label="WPM" sub={"target " + target} /><Pstat num={pctTxt(acc)} label="Accuracy" sub="needs 95%" /><Pstat num={time} label="Time" /></>}
        foot={<><Btn variant="outline" onClick={onAgain}>Try again</Btn><Btn primary hint={ENTER} onClick={() => navigate("coach")}>Back to Coach</Btn></>}>
        {passed ? <div className="stars-lg"><Stars n={stars} size={36} pop /></div> : null}
        {pk.length ? <div><span className="label">Keys to watch</span><div className="pkrow" style={{ marginTop: 10 }}>
          {pk.map(([k, c]: [string, number]) => <span className="pk" key={k}><Cap k={k} size="sm">{k === " " ? "space" : k.toUpperCase()}</Cap>{c} {c === 1 ? "miss" : "misses"}</span>)}
        </div></div> : null}
      </Panel>
    </div>
  );
}

export function CoachView() {
  useProgress(); useCoachVersion();
  const [screen, setScreen] = useState<Screen>({ k: "list" }), run = useRef<Run | null>(null), ids = useRef(0);
  const toList = useCallback(() => { setScreen({ k: "list" }); }, []);
  const open = (id: string) => setScreen(customById(id) ? { k: "intro", id } : { k: "list" });
  const runStage = () => setScreen({ k: "stage", n: ++ids.current });
  const start = (id: string) => {
    const l = customById(id); if (!l) return toList();
    run.current = { id, title: l.title, step: 1, texts: l.steps.map((s: any) => s.text), names: l.steps.map((s: any) => s.name), agg: { ms: 0, chars: 0, presses: 0, correct: 0, missBy: {} } };
    runStage();
  };
  const showResults = () => {
    const rn = run.current!, a = rn.agg, out = applyCustomResult(rn.id, a);
    rewardsLesson(out.celebrate);
    const pk = Object.entries(a.missBy).sort((x, y) => y[1] - x[1]).slice(0, 3);
    const sec = Math.round(a.ms / 1000), time = Math.floor(sec / 60) + ":" + String(sec % 60).padStart(2, "0");
    setScreen({ k: "results", r: { id: rn.id, title: rn.title, passed: out.passed, stars: out.stars, wpm: out.wpm, acc: out.acc, pk, time, target: S.settings.target } });
  };
  const stepDone = (res: any) => {
    const rn = run.current!, a = rn.agg;
    a.ms += res.ms; a.chars += res.chars; a.presses += res.presses; a.correct += res.correct;
    for (const k in res.missBy) a.missBy[k] = (a.missBy[k] || 0) + res.missBy[k];
    if (rn.step < rn.texts.length) setScreen({ k: "summary", res, s: rn.step }); else showResults();
  };

  if (screen.k === "stage") {
    const rn = run.current!, N = rn.texts.length;
    return <TypingStage key={screen.n + "-" + rn.step} opts={{
      crumb: "Claude · " + rn.title + " · Step " + rn.step + " of " + N + " · " + rn.names[rn.step - 1], text: rn.texts[rn.step - 1], mode: S.settings.stop ? "stop" : "free",
      focus: null, onFinish: stepDone, onBack: () => navigate("coach"),
    }} />;
  }
  if (screen.k === "intro") return <div key={"intro" + screen.id}><Screen kind="intro" /><Intro id={screen.id} onBack={toList} onStart={() => start(screen.id)} /></div>;
  if (screen.k === "summary") return <div key={"sum" + screen.s}><Screen kind="summary" /><StepDone run={run.current!} res={screen.res} s={screen.s} onNext={() => { run.current!.step++; runStage(); }} onEsc={toList} /></div>;
  if (screen.k === "results") return <div key="results"><Screen kind="results" /><Results r={screen.r} onAgain={() => start(screen.r.id)} onEsc={toList} /></div>;
  return <div key="list"><Screen kind="coach" /><CoachList onOpen={open} /></div>;
}

