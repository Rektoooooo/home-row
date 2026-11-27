import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { installLocalStorage, NOW, clone } from "./testutil";
import { S, SC, setS, setSC, setCOURSE, emptyState, emptyCourse } from "./state";
import { save, LSK } from "./store";
import * as sync from "./sync";
import { connectAccount, disconnectAccount, resetSyncForTests, applyCoachRaw, COACH_RAW, OWNER_LS, ASIDE_LS, STATUS_TXT, statusText } from "./sync";
import { applyCourse } from "./course";
import { setHooks } from "./hooks";
import { resetRewardsForTests } from "./rewards";
import { supaHost, isAuthReturn } from "./supa";

/* a fake supabase-js client over public.users (one row per person; progress, progress_cs, coach columns); rows of
   other users are invisible (RLS). Seed rows are given doc-style ({ user_id, name, data }) for readability.
   fail: an HTTP status for every call, or "network" (supabase-js reports status 0 and "Failed to fetch") */
const COLS: Record<string, string> = { progress: "progress", "progress-cs": "progress_cs", coach: "coach" };
function fakeSupa(o: { rows?: any[]; fail?: number | "network"; noRow?: boolean } = {}) {
  const users = new Map<string, any>(), calls: any[] = [];
  for (const r of o.rows || []) { const u = users.get(r.user_id) || { id: r.user_id, email: "x@example.invalid" }; u[COLS[r.name]] = clone(r.data); users.set(r.user_id, u); }
  let fail: number | "network" | 0 = o.fail || 0;
  const res = (r: any) => (fail === "network" ? { data: null, error: { message: "TypeError: Failed to fetch" }, status: 0 } : fail ? { data: null, error: { message: "boom" }, status: fail } : r);
  const c = {
    from(t: string) {
      expect(t).toBe("users");
      let cols = "", patch: any = null; const f: any = {};
      const q: any = {
        select(c2: string) { cols = c2; return q; },
        eq(k: string, v: any) { f[k] = v; return q; },
        async maybeSingle() { calls.push(["get", f.id, cols]); const u = users.get(f.id); return res({ data: u ? { [cols]: u[cols] ?? null } : null, error: null, status: 200 }); },
        update(row: any) { patch = row; return q; },
        async insert(row: any) { calls.push(["insert", row.id, Object.keys(row).join()]); const out = res({ error: null, status: 201 }); if (out.error) return out; users.set(row.id, { ...(users.get(row.id) || {}), ...clone(row) }); return out; },
        then(ok: any, bad: any) { /* awaiting update(...).eq(...).select("id") */
          calls.push(["set", f.id, Object.keys(patch || {}).join()]);
          const out = res(null); if (out) return Promise.resolve(out).then(ok, bad);
          const u = users.get(f.id); if (u) Object.assign(u, clone(patch));
          return Promise.resolve({ data: u ? [{ id: f.id }] : [], error: null, status: 200 }).then(ok, bad);
        },
      };
      return q;
    },
    setFail(s: number | "network") { fail = s; },
  };
  if (o.noRow) users.clear();
  return { c, users, calls, row: (uid: string, name: string) => { const u = users.get(uid); const v = u ? u[COLS[name]] : undefined; return v == null ? undefined : { data: v }; } };
}
const flushAll = async () => { for (let i = 0; i < 20; i++) await Promise.resolve(); await vi.advanceTimersByTimeAsync(0); };
const lesson = (n: number) => ({ [n]: { done: true, stars: 1, wpm: 15, acc: 1, attempts: 1, last: NOW } });

let ls: any;
beforeEach(() => {
  vi.useFakeTimers(); vi.setSystemTime(NOW); ls = installLocalStorage(); resetSyncForTests(); resetRewardsForTests();
  setHooks({ toast: () => {}, onRemoteApplied: () => {}, rerenderCoach: () => {}, syncWeeklyUI: () => {}, renderRing: () => {}, achBooted: () => {}, courseChanged: () => {} });
  setS(emptyState()); setSC(emptyCourse()); setCOURSE("en"); applyCourse(); applyCoachRaw({}, true);
});
afterEach(() => { vi.useRealTimers(); });

describe("Supabase host: the claude.ai doc shape on the docs table", () => {
  it("doc paths map to (user, name) rows; get/set round trip; unknown paths are refused", async () => {
    const f = fakeSupa({ rows: [{ user_id: "u1", name: "coach", data: {} }] }), h = supaHost(f.c, "u1"), db: any = await h.use("db");
    expect(await h.use("sample")).toBeNull();
    expect(await (await h.use("user") as any).id()).toBe("u1");
    expect((await db.doc("data/users/u1/progress").get()).exists).toBe(false);
    await db.doc("data/users/u1/progress-cs").set({ a: 1 });
    expect(f.row("u1", "progress-cs")!.data).toEqual({ a: 1 });
    const s = await db.doc("data/users/u1/progress-cs").get();
    expect(s.exists).toBe(true); expect(s.data()).toEqual({ a: 1 });
    expect(() => db.doc("data/users/u1/secrets")).toThrow();
    /* no row yet (before the sign-in trigger ran): set adds it */
    const g = fakeSupa(), db2: any = await supaHost(g.c, "u9").use("db");
    await db2.doc("data/users/u9/progress").set({ b: 2 });
    expect(g.users.get("u9").progress).toEqual({ b: 2 }); expect(g.calls.map(x => x[0])).toEqual(["set", "insert"]);
    let snap: any = null; db.doc("data/users/u1/progress-cs").onSnapshot((x: any) => { snap = x; }); await flushAll();
    expect(snap.data()).toEqual({ a: 1 });
  });
  it("errors carry the codes flush() understands", async () => {
    for (const [st, code] of [["network", "unavailable"], [503, "unavailable"], [401, "not_granted"], [403, "not_granted"], [400, "invalid_argument"]] as const) {
      const f = fakeSupa({ fail: st }), db: any = await supaHost(f.c, "u1").use("db");
      const e = await db.doc("data/users/u1/progress").set({}).catch((x: any) => x);
      expect(e.code, String(st)).toBe(code);
      const g = await db.doc("data/users/u1/progress").get().catch((x: any) => x);
      expect(g.code, String(st)).toBe(code);
    }
  });
  it("the Google return is a query (?code=, ?error=), never the #hash", () => {
    expect(isAuthReturn("?code=abc")).toBe(true);
    expect(isAuthReturn("?error=access_denied&error_description=x")).toBe(true);
    expect(isAuthReturn("")).toBe(false);
  });
});

describe("connectAccount with the Supabase host", () => {
  it("first sign-in uploads local progress (English, Czech, coach) and shows 'Saved to your account'", async () => {
    S.lessons = lesson(1); S.updatedAt = NOW; SC.lessons = lesson(2); SC.updatedAt = NOW;
    applyCoachRaw({ lessons: [{ id: "chat-1", title: "Mine", why: "", by: "chat", created: 1, steps: [{ name: "a", text: "jf jf fj fj jjf ffj" }] }] }, true);
    const f = fakeSupa();
    await connectAccount(supaHost(f.c, "u1")); await flushAll();
    expect(sync.saveStatus).toBe("cloud"); expect(statusText("cloud")).toBe("Saved to your account");
    expect(f.row("u1", "progress")!.data.lessons[1].done).toBe(true);
    expect(f.row("u1", "progress-cs")!.data.lessons[2].done).toBe(true);
    expect(f.row("u1", "coach")!.data.lessons.map((l: any) => l.id)).toEqual(["chat-1"]);
    expect(ls.getItem(OWNER_LS)).toBe("u1");
    expect(sync.SAMPLE).toBeNull();
  });
  it("the account's progress merges into this browser; pasted coach lessons join the account's", async () => {
    const remote = emptyState(); remote.lessons = lesson(5); remote.updatedAt = NOW - 5;
    const f = fakeSupa({ rows: [{ user_id: "u1", name: "progress", data: remote }, { user_id: "u1", name: "coach", data: { lessons: [{ id: "chat-r", title: "Theirs", why: "", by: "chat", created: 1, steps: [{ name: "a", text: "fj fj jf jf ffj jjf" }] }] } }] });
    S.lessons = lesson(1); S.updatedAt = NOW;
    applyCoachRaw({ lessons: [{ id: "chat-l", title: "Mine", why: "", by: "chat", created: 2, steps: [{ name: "a", text: "jf jf fj fj jjf ffj" }] }] }, true);
    await connectAccount(supaHost(f.c, "u1")); await flushAll();
    expect(Object.keys(S.lessons).sort()).toEqual(["1", "5"]);
    expect(Object.keys(f.row("u1", "progress")!.data.lessons).sort()).toEqual(["1", "5"]);
    expect(f.row("u1", "coach")!.data.lessons.map((l: any) => l.id)).toEqual(["chat-r", "chat-l"]);
    expect(COACH_RAW.lessons.length).toBe(2);
  });
  it("another account's progress in this browser is set aside, never uploaded", async () => {
    ls.setItem(OWNER_LS, "someone-else");
    S.lessons = lesson(3); S.updatedAt = NOW; S.settings.layout = "ansi";
    applyCoachRaw({ lessons: [{ id: "chat-x", title: "Theirs", why: "", by: "chat", created: 1, steps: [{ name: "a", text: "jf jf fj fj jjf ffj" }] }] }, true);
    const remote = emptyState(); remote.lessons = lesson(7); remote.updatedAt = NOW - 5;
    const f = fakeSupa({ rows: [{ user_id: "u2", name: "progress", data: remote }] });
    await connectAccount(supaHost(f.c, "u2")); await flushAll();
    expect(Object.keys(S.lessons)).toEqual(["7"]);
    expect(f.row("u2", "progress")?.data.lessons[3]).toBeUndefined();
    expect(f.row("u2", "coach")).toBeUndefined();
    const aside = JSON.parse(ls.getItem(ASIDE_LS));
    expect(aside.owner).toBe("someone-else"); expect(aside.progress.lessons[3].done).toBe(true); expect(aside.coach.lessons[0].id).toBe("chat-x");
    expect(S.settings.layout).toBe("ansi");
    expect(ls.getItem(OWNER_LS)).toBe("u2");
  });
  it("sign-out stops syncing; later saves stay in this browser", async () => {
    const f = fakeSupa();
    await connectAccount(supaHost(f.c, "u1")); await flushAll();
    S.lessons = lesson(1); save(); await flushAll();
    const n = f.calls.filter(c => c[0] === "set").length;
    await disconnectAccount();
    expect(sync.saveStatus).toBe("local");
    S.lessons = lesson(2); save(); await flushAll();
    expect(f.calls.filter(c => c[0] === "set").length).toBe(n);
    expect(JSON.parse(ls.getItem(LSK)).lessons[2].done).toBe(true);
  });
  it("a paused or offline project leaves everything in this browser (status offline)", async () => {
    const f = fakeSupa({ fail: 503 });
    S.lessons = lesson(1); S.updatedAt = NOW;
    await connectAccount(supaHost(f.c, "u1")); await flushAll();
    expect(sync.saveStatus).toBe("offline");
    expect(S.lessons[1].done).toBe(true);
    expect(sync.ACCT).toBeTruthy(); /* connected far enough to retry on the next save */
  });
  it("the claude.ai status texts are unchanged", () => {
    expect(STATUS_TXT).toEqual({ connecting: "Connecting…", local: "Saved in this browser only", offline: "Saved in this browser only (offline)", account: "Saved to your claude.ai account", failed: "Saved in this browser only (account unavailable)" });
  });
});
