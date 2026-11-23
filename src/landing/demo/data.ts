/* Hero typing demo: static data shared by the markup (prerendered) and the engine. Ported from legacy/site/index.html. */
export const SENT = ["Eyes on the screen, not on your hands.", "Slow is smooth, and smooth becomes fast.", "Learn one key at a time, then the next.", "Your fingers already know the way home."];
export const KF: Record<string, string> = {};
[["p", "`1qaz0p;/-=[]\\'"], ["r", "2wsx9ol."], ["m", "3edc8ik,"], ["i", "45rtfgvb67yuhjnm"]].forEach(([f, s]) => [...s].forEach((c) => (KF[c] = f)));
export const LEFT = new Set([..."`12345qwertasdfgzxcvb"]);
export const SHIFTED: Record<string, string> = { "1": "!", "2": "@", "3": "#", "4": "$", "5": "%", "6": "^", "7": "&", "8": "*", "9": "(", "0": ")", "-": "_", "=": "+", "[": "{", "]": "}", "\\": "|", ";": ":", "'": "\"", ",": "<", ".": ">", "/": "?" };
export const FNAME: Record<string, string> = { p: "pinky", r: "ring", m: "middle", i: "index", t: "thumb" };
export const NEAR: Record<string, string> = { a: "s", b: "v", c: "x", d: "s", e: "r", f: "g", g: "f", h: "j", i: "o", j: "h", k: "l", l: "k", m: "n", n: "m", o: "i", p: "o", q: "w", r: "e", s: "a", t: "r", u: "y", v: "c", w: "e", x: "c", y: "u", z: "x" };

export type KeyDef = string | [string, number, string, string, string];
export const DROWS: KeyDef[][] = [
  [["esc", 4, "mod acc", "esc", "p"], ..."1234567890-=", ["delete", 8, "mod", "bk", "p"]],
  [["tab", 6, "mod", "tab", "p"], ..."qwertyuiop[]", ["\\", 6, "dual", "\\", "p"]],
  [["caps", 7, "mod", "caps", "p"], ..."asdfghjkl;'", ["return", 9, "mod", "ret", "p"]],
  [["shift", 9, "mod", "shl", "p"], ..."zxcvbnm,./", ["shift", 11, "mod", "shr", "p"]],
  [["⌃", 5, "mod sym", "c1", "t"], ["⌥", 5, "mod sym", "o1", "t"], ["⌘", 6, "mod sym", "m1", "t"], ["", 28, "space", "space", "t"], ["⌘", 6, "mod sym", "m2", "t"], ["⌥", 5, "mod sym", "o2", "t"], ["⌃", 5, "mod sym", "c2", "t"]],
];
export function keyParts(x: KeyDef) {
  let l: string, w = 4, c = "", id: string, f: string;
  if (typeof x === "string") { id = x; f = KF[x] || "p"; c = /[a-z]/.test(x) ? "" : "dual"; l = x; } else [l, w, c, id, f] = x;
  return { l, w, c, id, f, hm: "fj".includes(id) && id.length === 1 };
}
