import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { golden, useState, J, clone, fixClock, unfixClock, installLocalStorage, NOW } from "./testutil";
import { allowedChars, buildSummary, buildPrompt, validateReply, sanitizeCoach, findLessonJSON, braceEnd, hash36, importLessons, cleanLesson, coachAsk } from "./coach";
import { S } from "./state";

beforeEach(() => { fixClock(); installLocalStorage(); });
afterEach(() => { unfixClock(); });

describe("COACH golden", () => {
  const g = golden("coach");
  for (const sn of Object.keys(g.out)) {
    it("state " + sn, () => {
      useState(sn);
      const o = g.out[sn];
      expect([...allowedChars()].join("")).toBe(o.allowed);
      expect(J(buildSummary())).toEqual(o.summary);
      expect(buildPrompt(buildSummary(), allowedChars())).toBe(o.prompt);
      expect(buildPrompt(buildSummary(), allowedChars(), "extra rule here")).toBe(o.promptExtra);
      expect(coachAsk()).toBe(o.ask);
      expect(g.replies.map((j: string) => J(validateReply(JSON.parse(j), allowedChars())))).toEqual(o.validate);
      expect(g.rawCoach.map((j: string) => J(sanitizeCoach(JSON.parse(j))))).toEqual(o.validCoach);
      expect(g.paste.map((t: string) => J(findLessonJSON(t)))).toEqual(o.find);
      expect(g.braceCases.map(([t, s]: any) => braceEnd(t, s))).toEqual(o.brace);
      expect(o.hash.map(([s]: any) => [s, hash36(s)])).toEqual(o.hash);
      expect(g.paste.map((t: string) => J(importLessons(t)))).toEqual(o.imp);
      expect(g.cleanCases.map((c: any) => g.sampleAllowed.map((al: any) => J(cleanLesson(clone(c), al === null ? undefined : new Set(al)))))).toEqual(o.clean);
    });
  }
});

describe("COACH hand-written: paste-in import", () => {
  const steps = (a: string) => [{ name: "One", text: a }, { name: "Two", text: "just fish flight jump shift flaw jelly fluff jog fix just fish flight" }, { name: "Three", text: "just fix my flight jump and fish for jelly just fix my flight jump" }];
  const lesson = (title: string, a = "jf jf fj jf fjf jfj fjf jfj fjf") => ({ title, why: "Because.", steps: steps(a) });
  beforeEach(() => useState("mid"));

  it("a reply with prose and a ```json block imports the lessons and the note", () => {
    const reply = "Sure, here is your plan!\n\n```json\n" + JSON.stringify({ homerow: 1, note: "  Slow down on J.  ", lessons: [lesson("First"), lesson("Second", "jj ff jf fj jjj fff jfj fjf jff")] }) + "\n```\n\nGood luck.";
    const r = importLessons(reply)!;
    expect(r.added.map((l: any) => l.title)).toEqual(["First", "Second"]);
    expect(r.bad).toBe(0); expect(r.note).toEqual({ text: "Slow down on J.", at: NOW });
    expect(r.added[0]).toMatchObject({ by: "chat", created: NOW, why: "Because." });
    expect(r.added[1].created).toBe(NOW - 1);
    expect(r.added[0].id).toMatch(/^chat-[0-9a-z]+$/);
  });
  it("the same lesson pasted twice keeps one copy and the id is stable", () => {
    const l = lesson("Dup"), text = JSON.stringify({ homerow: 1, lessons: [l, l] });
    const a = importLessons(text)!; expect(a.added).toHaveLength(1);
    expect(importLessons(text)!.added[0].id).toBe(a.added[0].id);
    expect(a.added[0].id).toBe("chat-" + hash36(JSON.stringify([l.title, l.steps.map(s => s.text)])));
  });
  it("lessons with characters the keyboard can't type are counted as bad, the rest survive", () => {
    const r = importLessons(JSON.stringify({ homerow: 1, lessons: [lesson("Accent", "café jf jf fj jf fjf jfj"), lesson("Fine"), 7, { title: "x" }] }))!;
    expect(r.added.map((l: any) => l.title)).toEqual(["Fine"]); expect(r.bad).toBe(3);
    expect(importLessons(JSON.stringify({ homerow: 1, lessons: [lesson("Accent", "café jf jf fj jf fjf jfj")] }))).toMatchObject({ added: [], bad: 1 });
  });
  it("dead-key pairs in a step reject the lesson", () => {
    expect(importLessons(JSON.stringify({ homerow: 1, lessons: [lesson("Dead", "it's an apple jf jf fj jf'a fjf")] }))!.bad).toBe(1);
  });
  it("no JSON block at all returns null; an empty lessons array returns no lessons", () => {
    expect(importLessons("Just some advice, no block.")).toBeNull();
    expect(importLessons("")).toBeNull();
    expect(importLessons(undefined as any)).toBeNull();
    expect(importLessons('{"homerow":1,"lessons":[]}')).toEqual({ added: [], bad: 0, note: null });
  });
  it("a note containing braces and quotes does not break object detection; only the first 6 lessons are read", () => {
    const text = "intro {not json} then " + JSON.stringify({ homerow: 1, note: 'has } and "quote"', lessons: Array.from({ length: 9 }, (_, i) => lesson("L" + i, "jf ".repeat(5 + i))) });
    const r = importLessons(text)!;
    expect(r.added).toHaveLength(6); expect(r.note!.text).toBe('has } and "quote"');
  });
  it("a long note is cut to 600 characters; a note without text is ignored", () => {
    expect(importLessons(JSON.stringify({ homerow: 1, note: "n".repeat(700), lessons: [lesson("A")] }))!.note!.text).toHaveLength(600);
    expect(importLessons(JSON.stringify({ homerow: 1, note: "  ", lessons: [lesson("A")] }))!.note).toBeNull();
  });
  it("findLessonJSON also accepts an object that only has a lessons array, and skips objects without one", () => {
    expect(findLessonJSON('x {"a":1} {"lessons":[1]} y')).toEqual({ lessons: [1] });
    expect(findLessonJSON('{"homerow":1,"lessons":5}')).toBeNull();
    expect(findLessonJSON("{\"homerow\":1,\"lessons\":[")).toBeNull();
  });
  it("braceEnd skips braces inside strings and escaped quotes", () => {
    expect(braceEnd('{"a":"}"}', 0)).toBe(8); expect(braceEnd('{"a":"\\"}"}', 0)).toBe(10); expect(braceEnd('{"a":1', 0)).toBe(-1);
  });
  it("replies from the sampler are held to the characters the learner has", () => {
    const good = { note: "ok", lesson: lesson("Fine") };
    const letters = new Set([...good.lesson.steps.map(s => s.text).join("")].filter(c => c !== " "));
    expect(validateReply(good, letters)).not.toBeNull(); /* spaces are always allowed */
    letters.delete("j"); expect(validateReply(good, letters)).toBeNull();
    expect(validateReply({ ...good, lesson: { ...lesson("T".repeat(41)) } }, new Set("jfdkslyuitwoeg h"))).toBeNull();
    expect(validateReply({ ...good, note: "  " }, undefined)).toBeNull();
    expect(validateReply({ ...good, lesson: { ...good.lesson, steps: good.lesson.steps.slice(0, 2) } }, undefined)).toBeNull();
  });
  it("sanitizeCoach caps at 20 lessons, drops duplicates and counts them", () => {
    const ls = [lesson("A"), lesson("B")].map((l, i) => ({ id: "x" + i, ...l }));
    const r = sanitizeCoach({ lessons: [...ls, { ...ls[0] }, { ...ls[0], id: "bad id" }] });
    expect(r.lessons).toHaveLength(2); expect(r.dropped).toBe(2);
    expect(sanitizeCoach({ lessons: Array.from({ length: 50 }, (_, i) => ({ id: "l" + i, ...lesson("T" + i) })) })).toMatchObject({ dropped: 20 });
    expect(sanitizeCoach(null)).toEqual({ note: null, lessons: [], dropped: 0 });
  });
  it("coachAsk (website): asks for one JSON block with the learner's characters and falls back to lesson 1's keys", () => {
    const t = coachAsk(); expect(t).toContain('{"homerow":1,"note":"..."'); expect(t).toContain("Use only these characters: ");
    useState("empty"); expect(coachAsk()).toContain("Use only these characters: fj and the space bar.");
    expect(S.lessons).toEqual({});
  });
});
