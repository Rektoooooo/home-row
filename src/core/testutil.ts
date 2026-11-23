/* Test helpers shared by the core tests: seeded Math.random, fixed clock + UTC, in-memory localStorage, golden loader. */
process.env.TZ = "UTC";
import fs from "node:fs";
import path from "node:path";
import { vi } from "vitest";
import { setS } from "./state";

/* same instant the recorder fixed in the legacy page: Wed 17 Jun 2026 12:00 UTC */
export const NOW = Date.UTC(2026, 5, 17, 12, 0, 0);

export function mulberry32(a: number) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const realRandom = Math.random;
export function seed(s: number) { Math.random = mulberry32(s); }
export function unseed() { Math.random = realRandom; }

export function fixClock(now = NOW) { vi.useFakeTimers({ toFake: ["Date"] }); vi.setSystemTime(now); }
export function unfixClock() { vi.useRealTimers(); }

/* Map-backed localStorage (the tests run in node) */
export function installLocalStorage() {
  const m = new Map<string, string>();
  const ls = {
    getItem: (k: string) => (m.has(k) ? m.get(k)! : null),
    setItem: (k: string, v: string) => { m.set(k, String(v)); },
    removeItem: (k: string) => { m.delete(k); },
    clear: () => { m.clear(); },
    key: (i: number) => [...m.keys()][i] ?? null,
    get length() { return m.size; },
  };
  (globalThis as any).localStorage = ls;
  return ls;
}

const dir = path.join(__dirname, "__golden__");
const cache: Record<string, any> = {};
export function golden(name: string): any {
  return (cache[name] ||= JSON.parse(fs.readFileSync(path.join(dir, name + ".json"), "utf8")));
}
export const clone = <T>(o: T): T => JSON.parse(JSON.stringify(o));
/* what the recorder stored: JSON round trip (drops undefined, -0, NaN) */
export const J = (o: any) => (o === undefined ? null : JSON.parse(JSON.stringify(o)));
/* install one of the synthetic legacy states as the live state */
export function useState(name: string) { setS(clone(golden("states")[name])); }
