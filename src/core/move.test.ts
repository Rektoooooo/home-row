import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { golden, useState, clone, J, fixClock, unfixClock, installLocalStorage, NOW } from "./testutil";
import { OLD_HOST, NEW_APP, buildMoveFragment, forwardFromOldHost, parseMove, readMove, moveSummary, moveNeeded, finishMove, setMOVE } from "./move";
import { LSK, writeLocal, save } from "./store";
import { COACH_LS } from "./coach";
import { S, setS } from "./state";
import { COACH, COACH_RAW, resetSyncForTests, applyCoachRaw } from "./sync";
import * as moveMod from "./move";

let ls: any;
beforeEach(() => { fixClock(); ls = installLocalStorage(); resetSyncForTests(); setMOVE(null); });
afterEach(() => { unfixClock(); });

const coachLesson = (id: string, title = "T") => ({ id, title, why: "w", by: "chat", created: 1, steps: [{ name: "a", text: "jf jf fj jf fjf jfj fjf" }, { name: "b", text: "jf jf fj jf fjf jfj fjf" }] });

describe("MOVE: payload round trip and the old-address forward", () => {
  it("OLD_HOST and NEW_APP are the real addresses", () => { expect(OLD_HOST).toBe("home-row-lime.vercel.app"); expect(NEW_APP).toBe("https://homerow.sebthe.dev/app/"); });
  it("builds #move=<encoded json> from the raw saved progress and coach doc and parses it back", () => {
    useState("mid"); writeLocal();
    const coach = { note: { text: "hi", at: 5 }, lessons: [coachLesson("c1"), coachLesson("c2")] };
    ls.setItem(COACH_LS, JSON.stringify(coach));
    const frag = buildMoveFragment(ls);
    expect(frag.startsWith("#move=")).toBe(true);
    expect(frag).not.toMatch(/[{}" ]/); /* encodeURIComponent: safe in a URL fragment */
    const o = JSON.parse(decodeURIComponent(frag.slice(6)));
    expect(o.s).toEqual(JSON.parse(ls.getItem(LSK))); expect(o.c).toEqual(coach);
    const m = parseMove(frag)!;
    expect(m.lessons).toBe(8); expect(m.coach).toBe(2);
    expect(m.mins).toBe(Math.round((Object.values(S.days) as any[]).reduce((a, d) => a + d.ms, 0) / 60000));
    expect(m.s.lessons[3].done).toBe(true); expect(m.c).toEqual(coach);
    expect(moveSummary(m)).toBe("8 lessons passed, " + m.mins + " minutes of practice and 2 lessons from Claude");
  });
  it("only progress or only coach lessons also round trip; nothing saved gives an empty fragment", () => {
    expect(buildMoveFragment(ls)).toBe("");
    ls.setItem(COACH_LS, JSON.stringify({ lessons: [coachLesson("only")] }));
    const m = parseMove(buildMoveFragment(ls))!; expect(m).toMatchObject({ s: null, lessons: 0, mins: 0, coach: 1 }); expect(moveSummary(m)).toBe("1 lesson from Claude");
    ls.removeItem(COACH_LS); useState("late"); writeLocal();
    expect(parseMove(buildMoveFragment(ls))).toMatchObject({ c: null, lessons: 22, coach: 0 });
  });
  it("garbage, an empty payload, or a payload with nothing worth moving gives null", () => {
    expect(parseMove("#learn")).toBeNull(); expect(parseMove("#move=%7Bnot")).toBeNull(); expect(parseMove("#move=" + encodeURIComponent("[]"))).toBeNull();
    expect(parseMove("#move=" + encodeURIComponent(JSON.stringify({ s: { updatedAt: 5 }, c: null })))).toBeNull();
    expect(parseMove("#move=" + encodeURIComponent(JSON.stringify({ s: { tests: [{ ts: 1, wpm: 20, acc: 0.9 }] }, c: null })))).toMatchObject({ lessons: 0, mins: 0 });
  });
  it("forwards only from the old host, with the payload in the fragment (never a query)", () => {
    useState("mid"); writeLocal();
    const replace = vi.fn();
    expect(forwardFromOldHost({ hostname: "homerow.sebthe.dev", replace }, ls)).toBe(false); expect(replace).not.toHaveBeenCalled();
    expect(forwardFromOldHost({ hostname: OLD_HOST, replace }, ls)).toBe(true);
    const url = replace.mock.calls[0][0] as string;
    expect(url.startsWith(NEW_APP + "#move=")).toBe(true); expect(url).not.toContain("?");
    const empty = installLocalStorage(); const r2 = vi.fn();
    forwardFromOldHost({ hostname: OLD_HOST, replace: r2 }, empty); expect(r2).toHaveBeenCalledWith(NEW_APP);
  });
  it("readMove sets MOVE once and replaces the address with #learn", () => {
    useState("mid"); writeLocal();
    const frag = buildMoveFragment(ls), hist = { replaceState: vi.fn() };
    readMove({ hash: frag, pathname: "/app/", search: "?x=1" }, hist);
    expect(moveMod.MOVE).toBeTruthy(); expect(hist.replaceState).toHaveBeenCalledWith(null, "", "/app/?x=1#learn");
    setMOVE(null); readMove({ hash: "#learn", pathname: "/app/", search: "" }, hist); expect(moveMod.MOVE).toBeNull(); expect(hist.replaceState).toHaveBeenCalledTimes(1);
  });
  it("the question is skipped when everything is already here; asked when progress or coach lessons are new", () => {
    useState("mid"); writeLocal();
    const frag = buildMoveFragment(ls);
    setMOVE(parseMove(frag)); expect(moveNeeded()).toBe(false); expect(moveMod.MOVE).toBeNull(); /* same data: nothing new */
    /* a fresh browser */
    setS(clone(golden("states").empty));
    setMOVE(parseMove(frag)); expect(moveNeeded()).toBe(true);
  });
  it("'Bring it over' merges (nothing is replaced) and adds the coach lessons that are not here yet; 'Not now' changes nothing", () => {
    useState("mid"); writeLocal(); ls.setItem(COACH_LS, JSON.stringify({ note: { text: "n", at: 1 }, lessons: [coachLesson("a"), coachLesson("b")] }));
    const frag = buildMoveFragment(ls);
    /* new address already has some progress and a coach lesson */
    useState("empty"); S.lessons[20] = { done: true, stars: 1, wpm: 9, acc: 0.96, attempts: 1, last: NOW }; S.lessons[1] = { done: true, stars: 3, wpm: 30, acc: 0.99, attempts: 4, last: NOW };
    applyCoachRaw({ lessons: [coachLesson("b", "Mine"), coachLesson("z")] }, true);
    setMOVE(parseMove(frag)); expect(moveNeeded()).toBe(true);
    const m = finishMove(false); expect(m).toBeTruthy(); expect(Object.keys(S.lessons)).toEqual(["1", "20"]); expect(moveMod.MOVE).toBeNull();
    setMOVE(parseMove(frag));
    finishMove(true);
    expect(Object.keys(S.lessons).map(Number).sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 20]);
    expect(S.lessons[1]).toMatchObject({ stars: 3, wpm: 30, attempts: 4 }); /* the better of both */
    const ids = (COACH_RAW.lessons as any[]).map(l => l.id); expect(ids).toEqual(["b", "z", "a"]); /* existing first, new ones appended */
    expect(COACH_RAW.lessons[0].title).toBe("Mine"); expect(COACH_RAW.note).toEqual({ text: "n", at: 1 });
    expect(JSON.parse(ls.getItem(LSK)).lessons[20].done).toBe(true); expect(COACH.lessons.map((l: any) => l.id)).toEqual(["b", "z", "a"]);
  });
  it("summary texts", () => {
    expect(moveSummary({ lessons: 1, mins: 0, coach: 0 })).toBe("1 lesson passed");
    expect(moveSummary({ lessons: 0, mins: 1, coach: 0 })).toBe("1 minute of practice");
    expect(moveSummary({ lessons: 2, mins: 5, coach: 0 })).toBe("2 lessons passed and 5 minutes of practice");
    expect(moveSummary({ lessons: 0, mins: 0, coach: 0 })).toBe("your progress");
  });
});
