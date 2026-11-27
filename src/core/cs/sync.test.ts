import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { installLocalStorage, NOW, clone } from "../testutil";
import { S, SC, COURSE, setS, setSC, setCOURSE, emptyState, emptyCourse } from "../state";
import { save, LSK_CS } from "../store";
import { connectAccount, setClaude, resetSyncForTests, flush } from "../sync";
import { switchCourse, applyCourse } from "../course";
import { applyLessonResult } from "../stats";
import { setHooks } from "../hooks";
import { resetRewardsForTests } from "../rewards";

function fakeClaude(docs0: Record<string, any> = {}) {
  const docs = new Map<string, any>(Object.entries(docs0).map(([k, v]) => [k, clone(v)]));
  const calls: any[] = [];
  const db = { doc(path: string) { return {
    async get() { calls.push(["get", path]); return { exists: docs.has(path), data: () => clone(docs.get(path)) }; },
    async set(v: any) { calls.push(["set", path, clone(v)]); docs.set(path, clone(v)); },
    onSnapshot() {},
  }; } };
  const claude = { use: vi.fn(async (n: string) => (n === "db" ? db : n === "user" ? { id: async () => "u1" } : null)) };
  return { claude, docs, calls, sets: (p: string) => calls.filter(c => c[0] === "set" && c[1] === p) };
}
const P = "data/users/u1/progress", PC = "data/users/u1/progress-cs";
const flushAll = async () => { for (let i = 0; i < 20; i++) await Promise.resolve(); await vi.advanceTimersByTimeAsync(0); };
let courseChanged = 0;

beforeEach(() => {
  vi.useFakeTimers(); vi.setSystemTime(NOW); installLocalStorage(); resetSyncForTests(); resetRewardsForTests(); courseChanged = 0;
  setHooks({ toast: () => {}, onRemoteApplied: () => {}, rerenderCoach: () => {}, syncWeeklyUI: () => {}, renderRing: () => {}, achBooted: () => {}, courseChanged: () => { courseChanged++; } });
  setS(emptyState()); setSC(emptyCourse()); setCOURSE("en"); applyCourse();
});
afterEach(() => { setS(emptyState()); setSC(emptyCourse()); setCOURSE("en"); applyCourse(); vi.useRealTimers(); });

describe("Czech course: account sync (progress-cs)", () => {
  it("an English-only user: progress-cs is read, never written", async () => {
    const f = fakeClaude(); setClaude(f.claude);
    await connectAccount(); await flushAll();
    expect(f.calls.some(c => c[0] === "get" && c[1] === PC)).toBe(true);
    expect(f.sets(PC)).toHaveLength(0);
    S.lessons[1] = { done: true, stars: 1, wpm: 12, acc: 1, attempts: 1, last: NOW }; save(); await flushAll();
    expect(f.sets(P).length).toBeGreaterThan(0); expect(f.sets(PC)).toHaveLength(0);
  });
  it("the account's Czech doc turns the Czech course on and its progress is merged in", async () => {
    const remote = emptyCourse(); remote.on = true; remote.settingsAt = NOW - 1000; remote.updatedAt = NOW - 1000;
    remote.lessons = { 1: { done: true, stars: 2, wpm: 14, acc: 1, attempts: 1, last: NOW - 1000 } };
    const f = fakeClaude({ [PC]: remote }); setClaude(f.claude);
    await connectAccount(); await flushAll();
    expect(COURSE).toBe("cs"); expect(SC.lessons[1].done).toBe(true); expect(courseChanged).toBe(1);
    expect(JSON.parse(localStorage.getItem(LSK_CS)!).lessons[1].done).toBe(true);
    /* the silent badge check at load may save once (as in the English course); it never loses the account's data */
    for (const c of f.sets(PC)) { expect(c[2].on).toBe(true); expect(c[2].lessons[1].done).toBe(true); }
  });
  it("Czech practice writes progress-cs (and progress, for the shared days); English stays out of it", async () => {
    const f = fakeClaude(); setClaude(f.claude);
    await connectAccount(); await flushAll();
    switchCourse("cs"); await flushAll();
    expect(f.sets(PC).at(-1)![2].on).toBe(true);
    applyLessonResult(1, { ms: 60000, chars: 75, presses: 75, correct: 75 }); save(); await flushAll();
    const last = f.sets(PC).at(-1)![2];
    expect(last.lessons[1].done).toBe(true); expect(last.course).toBe("cs");
    expect(f.docs.get(P).lessons).toEqual({});
    switchCourse("en"); await flushAll();
    expect(f.sets(PC).at(-1)![2].on).toBe(false);
  });
  it("a Czech store with progress and no account doc is uploaded on connect", async () => {
    SC.lessons[2] = { done: true, stars: 1, wpm: 12, acc: 1, attempts: 1, last: NOW }; SC.updatedAt = NOW;
    const f = fakeClaude(); setClaude(f.claude);
    await connectAccount(); await flushAll(); await flush();
    expect(f.sets(PC)).toHaveLength(1); expect(f.sets(PC)[0][2].lessons[2].done).toBe(true);
  });
});
