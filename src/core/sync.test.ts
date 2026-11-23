import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { golden, useState, clone, J, installLocalStorage, NOW } from "./testutil";
import { S, setS } from "./state";
import { emptyState, save, sanitize, merge, LSK, setSaveHook } from "./store";
import * as sync from "./sync";
import { setClaude, connectAccount, setSaveStatus, statusHooks, coachMutate, coachAdd, coachRemove, COACH_RAW, COACH, SAMPLE, weeklyRun, weeklyAuto, WK, resetSyncForTests, installCoreHooks, STATUS_TXT, applyCoachRaw, askClaude, ASK, shareLocal, progressExport } from "./sync";
import { COACH_LS, ARTIFACT_URL } from "./coach";
import { hooks, setHooks } from "./hooks";
import { resetRewardsForTests, checkAchievements } from "./rewards";
import { dateKey, addDays } from "./stats";

let ls: any;
beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(NOW); ls = installLocalStorage(); resetSyncForTests(); resetRewardsForTests(); setHooks({ toast: () => {}, onRemoteApplied: () => {}, rerenderCoach: () => {}, syncWeeklyUI: () => {}, renderRing: () => {}, achBooted: () => {} }); });
afterEach(() => { vi.useRealTimers(); });

/* a fake claude.ai host: in-memory docs, the db / user / sample capabilities */
function fakeClaude(o: any = {}) {
  const docs = new Map<string, any>(Object.entries(o.docs || {}).map(([k, v]) => [k, clone(v)]));
  const calls: any[] = [], snaps = new Map<string, Function[]>();
  const db = {
    doc(path: string) {
      return {
        path,
        async get() { calls.push(["get", path]); if (o.getFails) throw new Error("boom"); return { exists: docs.has(path), data: () => clone(docs.get(path)) }; },
        async set(v: any) { calls.push(["set", path, clone(v)]); if (o.setError) { const e = typeof o.setError === "function" ? o.setError(calls.filter(c => c[0] === "set" && c[1] === path).length) : o.setError; if (e) throw e; } docs.set(path, clone(v)); },
        onSnapshot(cb: Function, _err: Function) { snaps.set(path, [...(snaps.get(path) || []), cb]); calls.push(["onSnapshot", path]); },
      };
    },
  };
  const sample = o.sample === undefined ? { json: vi.fn(async () => { throw { code: "rate_limited" }; }) } : o.sample;
  const claude = { use: vi.fn(async (name: string) => (name === "db" ? db : name === "user" ? (o.noUser ? null : { id: async () => "u1" }) : name === "sample" ? sample : null)) };
  return { claude, docs, calls, snaps, sample, sets: (path = "data/users/u1/progress") => calls.filter(c => c[0] === "set" && c[1] === path) };
}
const flushAll = async () => { for (let i = 0; i < 20; i++) await Promise.resolve(); await vi.advanceTimersByTimeAsync(0); };

describe("SYNC-01..04: connectAccount", () => {
  it("SYNC-01 status texts and hooks run in order on every change", () => {
    expect(STATUS_TXT).toEqual({ connecting: "Connecting…", local: "Saved in this browser only", offline: "Saved in this browser only (offline)", account: "Saved to your claude.ai account", failed: "Saved in this browser only (account unavailable)" });
    const seen: string[] = []; statusHooks.push((s: string) => seen.push("a" + s)); statusHooks.push(() => { throw new Error("x"); }); statusHooks.push((s: string) => seen.push("b" + s));
    setSaveStatus("local"); setSaveStatus("offline");
    expect(seen).toEqual(["alocal", "blocal", "aoffline", "boffline"]); expect(sync.saveStatus).toBe("offline");
  });
  it("SYNC-02 without claude, or without claude.use, the status is local", async () => {
    setClaude(undefined); await connectAccount(); expect(sync.saveStatus).toBe("local");
    setClaude({}); await connectAccount(); expect(sync.saveStatus).toBe("local");
    const f = fakeClaude({ noUser: true }); setClaude(f.claude); await connectAccount(); expect(sync.saveStatus).toBe("local");
  });
  it("SYNC-04 no account write on load without local progress", async () => {
    useState("empty"); expect(S.updatedAt).toBe(0);
    const f = fakeClaude(); setClaude(f.claude);
    await connectAccount();
    expect(sync.saveStatus).toBe("account"); expect(f.sets()).toHaveLength(0);
    expect(f.calls.some(c => c[0] === "get" && c[1] === "data/users/u1/progress")).toBe(true);
    expect(f.calls.some(c => c[0] === "onSnapshot" && c[1] === "data/users/u1/coach")).toBe(true); /* coachConnect runs right after db + user */
  });
  it("with local progress and no remote doc, the progress is written once to data/users/<id>/progress", async () => {
    useState("mid");
    const f = fakeClaude(); setClaude(f.claude);
    await connectAccount(); await flushAll();
    /* the silent badge grant at load saves once more (as in the legacy code), so one or two writes, the last one is the full state */
    expect(f.sets().length).toBeGreaterThanOrEqual(1); expect(f.sets().length).toBeLessThanOrEqual(2);
    expect(f.sets()[f.sets().length - 1][2]).toEqual(clone(S)); expect(sync.saveStatus).toBe("account");
    expect(JSON.parse(ls.getItem(LSK)).lessons[1].done).toBe(true);
  });
  it("a remote doc identical to the local state is not written back; a different one is merged, saved locally and written", async () => {
    useState("mid"); checkAchievements({ silent: true }); const same = clone(S);
    let f = fakeClaude({ docs: { "data/users/u1/progress": same } }); setClaude(f.claude);
    await connectAccount(); await flushAll(); expect(f.sets()).toHaveLength(0);
    /* remote has lessons the local state lacks */
    resetSyncForTests(); useState("empty"); S.updatedAt = NOW; S.lessons[1] = { done: true, stars: 1, wpm: 10, acc: 0.96, attempts: 1, last: NOW };
    const remote = clone(golden("states").mid);
    f = fakeClaude({ docs: { "data/users/u1/progress": remote } }); setClaude(f.claude);
    const applied = vi.fn(); setHooks({ onRemoteApplied: applied });
    await connectAccount(); await flushAll();
    expect(Object.keys(S.lessons)).toHaveLength(8); expect(applied).toHaveBeenCalledTimes(1);
    expect(f.sets().length).toBeGreaterThanOrEqual(1); expect(f.sets()[f.sets().length - 1][2].lessons[1].stars).toBe(2);
  });
  it("SYNC-03 a failing or timing-out get() leaves the status offline and the account unattached", async () => {
    useState("mid"); let f = fakeClaude({ getFails: true }); setClaude(f.claude);
    await connectAccount(); expect(sync.saveStatus).toBe("offline");
    save(); await flushAll(); expect(f.sets()).toHaveLength(0);
    resetSyncForTests();
    /* timeout: get never resolves */
    const hang = fakeClaude(); const orig = hang.claude.use; hang.claude.use = vi.fn(async (n: string) => { const v: any = await orig(n); return n === "db" ? { doc: (p: string) => ({ ...v.doc(p), get: () => new Promise(() => {}) }) } : v; });
    setClaude(hang.claude); const p = connectAccount(); await vi.advanceTimersByTimeAsync(10001); await p;
    expect(sync.saveStatus).toBe("offline");
  });
  it("SYNC-06/09 save() queues writes: one in flight, a follow-up flush for what changed meanwhile", async () => {
    useState("mid"); const f = fakeClaude(); setClaude(f.claude); await connectAccount(); await flushAll();
    const before = f.sets().length;
    S.lessons[9] = { done: true, stars: 1, wpm: 10, acc: 0.96, attempts: 1, last: NOW }; save();
    S.lessons[10] = { done: true, stars: 1, wpm: 10, acc: 0.96, attempts: 1, last: NOW }; save(); save();
    await flushAll();
    const sets = f.sets(); expect(sets.length).toBeGreaterThan(before); expect(sets.length - before).toBeLessThanOrEqual(2);
    expect(sets[sets.length - 1][2].lessons[10].done).toBe(true);
    expect(sets[sets.length - 1][2]).toEqual(clone(S)); /* a deep copy of S */
  });
  it("SYNC-07 'unavailable' retries once after 1-3 s; a second failure leaves status offline but stays attached", async () => {
    useState("mid"); checkAchievements({ silent: true });
    let n = 0; const f = fakeClaude({ setError: () => (++n <= 2 ? { code: "unavailable", message: "x" } : null) }); setClaude(f.claude);
    await connectAccount(); await flushAll();
    expect(f.sets().length).toBe(1); expect(sync.saveStatus).toBe("account"); /* first failure: retry pending, status unchanged */
    await vi.advanceTimersByTimeAsync(999); await flushAll(); expect(f.sets().length).toBe(1);
    await vi.advanceTimersByTimeAsync(2100); await flushAll();
    expect(f.sets().length).toBe(2); expect(sync.saveStatus).toBe("offline"); /* the retry failed too */
    save(); await flushAll(); expect(f.sets().length).toBe(3); /* still attached: the next save writes again and succeeds */
    expect(f.docs.get("data/users/u1/progress")).toEqual(clone(S));
  });
  it("SYNC-07 invalid_argument / revoked / not_granted: status failed and no more writes", async () => {
    useState("mid"); checkAchievements({ silent: true }); const f = fakeClaude({ setError: () => ({ code: "invalid_argument", message: "bad" }) }); setClaude(f.claude);
    await connectAccount(); await flushAll(); expect(sync.saveStatus).toBe("failed");
    save(); await flushAll(); expect(f.sets().length).toBe(1);
  });
});

describe("SYNC-11..14: the coach doc", () => {
  it("coachMutate reads a fresh copy before writing, so a lesson made in chat is never overwritten", async () => {
    useState("mid"); const chat = { id: "chat-1", title: "From chat", steps: [], by: "chat", created: 1 };
    const f = fakeClaude({ docs: { "data/users/u1/coach": { lessons: [chat], note: { text: "old", at: 1 } } } }); setClaude(f.claude);
    await connectAccount(); await flushAll();
    /* this tab only ever saw an empty doc */
    applyCoachRaw({}, true); expect(COACH_RAW).toEqual({});
    const lesson = { id: "app-1", title: "Mine", why: "w", by: "app", created: 2, steps: [{ name: "a", text: "jf jf fj jf fjf jfj" }] };
    await coachAdd(lesson, { text: "new note", at: 5 });
    const coachCalls = f.calls.filter(c => c[1] === "data/users/u1/coach" && c[0] !== "onSnapshot");
    expect(coachCalls.map(c => c[0])).toEqual(["get", "set"]); /* get happens first, then the write */
    const written = coachCalls[1][2];
    expect(written.lessons.map((l: any) => l.id)).toEqual(["app-1", "chat-1"]); expect(written.note).toEqual({ text: "new note", at: 5 });
    expect(COACH_RAW).toEqual(written); expect(JSON.parse(ls.getItem(COACH_LS))).toEqual(written);
    await coachRemove("chat-1"); expect(f.docs.get("data/users/u1/coach").lessons.map((l: any) => l.id)).toEqual(["app-1"]);
  });
  it("writes are serialised in order and keep only 20 lessons; a same-id lesson is replaced", async () => {
    useState("mid"); const f = fakeClaude(); setClaude(f.claude); await connectAccount(); await flushAll();
    const mk = (i: number) => ({ id: "l" + i, title: "t" + i, steps: [], by: "app", created: i });
    await Promise.all(Array.from({ length: 22 }, (_, i) => coachAdd(mk(i))));
    const doc = f.docs.get("data/users/u1/coach");
    expect(doc.lessons).toHaveLength(20); expect(doc.lessons[0].id).toBe("l21");
    await coachAdd({ ...mk(21), title: "again" }); expect(f.docs.get("data/users/u1/coach").lessons.filter((l: any) => l.id === "l21")).toHaveLength(1);
  });
  it("without an account (or if the account fails) the change is applied to the local copy only", async () => {
    await coachAdd({ id: "x1", title: "T", why: "", by: "app", created: 1, steps: [{ name: "a", text: "jf jf fj jf fjf jfj" }] });
    expect(COACH_RAW.lessons).toHaveLength(1); expect(JSON.parse(ls.getItem(COACH_LS)).lessons[0].id).toBe("x1"); expect(COACH.lessons[0].id).toBe("x1");
    useState("mid"); const f = fakeClaude({ getFails: true }); setClaude(f.claude); await connectAccount(); await flushAll();
    await coachAdd({ id: "x2", title: "T", why: "", by: "app", created: 2, steps: [{ name: "a", text: "jf jf fj jf fjf jfj" }] });
    expect(COACH_RAW.lessons.map((l: any) => l.id)).toEqual(["x2", "x1"]);
  });
  it("SYNC-12 the coach snapshot updates the local copy and the sampler handle is taken", async () => {
    useState("mid"); const f = fakeClaude({ sample: { json: vi.fn() } }); setClaude(f.claude);
    const rer = vi.fn(); setHooks({ rerenderCoach: rer });
    await connectAccount(); await flushAll();
    expect(sync.SAMPLE).toBe(f.sample);
    const cb = f.snaps.get("data/users/u1/coach")![0];
    cb({ exists: true, data: () => ({ lessons: [{ id: "s1", title: "T", steps: [{ name: "a", text: "jf jf fj jf fjf jfj" }] }] }) });
    expect(COACH.lessons.map((l: any) => l.id)).toEqual(["s1"]); expect(sync.COACH_SNAP).toBe(true); expect(rer).toHaveBeenCalled();
    cb({ exists: false }); expect(COACH.lessons).toEqual([]);
  });
});

describe("weekly coach and ask Claude", () => {
  const letters = "fjdksla;ghei ru";
  const reply = () => ({ note: "Last week: 90 minutes. Work on E.", lesson: { title: "Week focus", why: "Your E is slow.", steps: [{ name: "Drill", text: "fj dk sl a; gh ei ru fj dk sl a; gh ei ru" }, { name: "Words", text: "he said she had red sad ask he led is rue fed hid die lie sue" }, { name: "Phrases", text: "he ruled her side as she led us he said she fired his sled idea" }] } });
  async function setup(sampleJson: any, practiceMin = 10) {
    useState("mid"); S.settings.weekly = true;
    for (let i = 0; i < 7; i++) S.days[dateKey(addDays(new Date(), -i))] = { ms: practiceMin * 60000 / 7 + 1, chars: 100, presses: 100, correct: 100, ex: 1, t: NOW };
    const f = fakeClaude({ sample: { json: sampleJson } }); setClaude(f.claude);
    installCoreHooks();
    await connectAccount(); await flushAll();
    return f;
  }
  it("runs once per ISO week: a second run finds the weekly lesson and does nothing", async () => {
    const json = vi.fn(async () => reply());
    const f = await setup(json);
    /* the automatic run happens by itself once account, sampler and first coach snapshot are all in */
    f.snaps.get("data/users/u1/coach")![0]({ exists: false }); await flushAll();
    expect(json).toHaveBeenCalledTimes(1);
    const prompt = (json.mock.calls[0] as any)[0] as string;
    expect(prompt).toContain("The note starts with a one-sentence recap of last week"); expect(prompt).toContain("lastWeek"); expect(prompt).toContain("thisWeekSoFar");
    const doc = f.docs.get("data/users/u1/coach");
    expect(doc.lessons[0].id).toBe("weekly-2026-w25"); expect(doc.lessons[0].by).toBe("app"); expect(doc.note.text).toContain("Last week");
    expect(ls.getItem("homerow.weeklyTry")).toBe("2026-06-17");
    expect(WK.msg).toBe("Done. Find it in the Coach tab.");
    await weeklyRun({ force: true }); expect(json).toHaveBeenCalledTimes(1); /* even forced: the week's lesson exists */
    ls.removeItem("homerow.weeklyTry"); await weeklyRun({}); expect(json).toHaveBeenCalledTimes(1);
  });
  it("is silent when switched off, when the week has under 5 minutes of practice, or when it already tried today", async () => {
    let json: any = vi.fn(async () => reply());
    let f = await setup(json, 3); f.snaps.get("data/users/u1/coach")![0]({ exists: false }); await flushAll();
    expect(json).not.toHaveBeenCalled(); expect(ls.getItem("homerow.weeklyTry")).toBe("2026-06-17");
    /* force overrides the minutes and the daily guard */
    await weeklyRun({ force: true }); expect(json).toHaveBeenCalledTimes(1);
    resetSyncForTests(); ls.clear(); json = vi.fn(async () => reply()); f = await setup(json); S.settings.weekly = false;
    f.snaps.get("data/users/u1/coach")![0]({ exists: false }); await flushAll(); expect(json).not.toHaveBeenCalled();
    resetSyncForTests(); ls.clear(); json = vi.fn(async () => reply()); f = await setup(json); ls.setItem("homerow.weeklyTry", "2026-06-17");
    f.snaps.get("data/users/u1/coach")![0]({ exists: false }); await flushAll(); expect(json).not.toHaveBeenCalled();
  });
  it("the automatic run waits for the account status, the sampler and the first coach snapshot", async () => {
    const json = vi.fn(async () => reply()); useState("mid"); S.settings.weekly = true;
    const f = fakeClaude({ sample: { json } }); setClaude(f.claude); installCoreHooks();
    weeklyAuto(); expect(WK.fired).toBe(false);
    await connectAccount(); await flushAll(); expect(WK.fired).toBe(false); /* no coach snapshot yet */
    f.snaps.get("data/users/u1/coach")![0]({ exists: false }); await flushAll(); expect(WK.fired).toBe(true);
  });
  it("capability errors switch the coach off and the weekly setting with it", async () => {
    const json = vi.fn(async () => { throw { code: "sampling_disabled" }; });
    const f = await setup(json); await weeklyRun({ force: true });
    expect(sync.coachOff).toBe(true); expect(S.settings.weekly).toBe(false); expect(WK.msg).toBe("Claude isn't available for this page.");
    await weeklyRun({ force: true }); expect(json).toHaveBeenCalledTimes(1);
    expect(f).toBeTruthy();
  });
  it("askClaude: a valid reply is added to the doc; an invalid one gives the copy text", async () => {
    let json: any = vi.fn(async () => reply()); let f = await setup(json);
    await askClaude(); expect(ASK_ok()).toBe(true);
    expect(f.docs.get("data/users/u1/coach").lessons[0].by).toBe("app");
    resetSyncForTests(); json = vi.fn(async () => ({ note: "x" })); f = await setup(json);
    await askClaude(); expect(sync.ASK).toMatchObject({ ok: false, err: "Claude's answer couldn't be used. Try again." });
    resetSyncForTests(); json = vi.fn(async () => { throw { code: "rate_limited" }; }); f = await setup(json);
    await askClaude(); expect(sync.ASK.err).toBe("Claude is busy or you've reached a usage limit. Try again later.");
    resetSyncForTests(); json = vi.fn(async () => { throw { code: "cancelled" }; }); f = await setup(json);
    await askClaude(); expect(sync.ASK.err).toBe("");
    expect(letters.length).toBeGreaterThan(0); expect(f).toBeTruthy();
  });
  const ASK_ok = () => sync.ASK.ok;
  it("share card: local progress is copied as text, claude.ai gets the prompt", async () => {
    expect(shareLocal()).toBe(true);
    useState("mid"); const f = fakeClaude(); setClaude(f.claude); setSaveStatus("local"); expect(shareLocal()).toBe(true);
    expect(progressExport()).toContain(ARTIFACT_URL); expect(progressExport()).toContain(JSON.stringify(S));
    setSaveStatus("account"); expect(shareLocal()).toBe(false);
  });
});
