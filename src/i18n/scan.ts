/* Finds every translation key used in the trainer's source: t("…"), tn(n, "…", "…"), tx("…") with literal strings.
   Node only (tests and scripts/i18n-keys.mjs). Dynamic keys (lesson titles, stages, badges …) are listed by the test. */
import fs from "node:fs";
import path from "node:path";

const ROOTS = ["src/app", "src/views", "src/components", "src/core", "src/ui", "src/lib"];
const STR = String.raw`"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)'|\x60((?:[^\x60\\$]|\\.)*)\x60`;
const unq = (m: RegExpExecArray, i: number) => {
  const raw = m[i] ?? (m[i + 1] ?? m[i + 2] ?? "").replace(/\\'/g, "'").replace(/"/g, '\\"').replace(/\n/g, "\\n");
  try { return JSON.parse('"' + raw + '"') as string; } catch (e) { return raw; }
};

export interface Found { key: string; plural?: string; file: string; line: number; }
export function scanKeys(root: string): Found[] {
  const out: Found[] = [];
  const files: string[] = [];
  const walk = (d: string) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (/\.(ts|tsx)$/.test(e.name) && !/\.test\.ts$/.test(e.name)) files.push(p); } };
  ROOTS.forEach(r => { const d = path.join(root, r); if (fs.existsSync(d)) walk(d); });
  const reT = new RegExp(String.raw`\b(t|tx|tr)\(\s*(?:${STR})`, "g");
  const reN = new RegExp(String.raw`\btn\([^,]+,\s*(?:${STR})\s*,\s*(?:${STR})`, "g");
  for (const f of files) {
    const src = fs.readFileSync(f, "utf8"), rel = path.relative(root, f);
    const lineOf = (i: number) => src.slice(0, i).split("\n").length;
    let m: RegExpExecArray | null;
    while ((m = reT.exec(src))) out.push({ key: unq(m, 2), file: rel, line: lineOf(m.index) });
    while ((m = reN.exec(src))) out.push({ key: unq(m, 1), plural: unq(m, 4), file: rel, line: lineOf(m.index) });
  }
  return out;
}
