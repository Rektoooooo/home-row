import type { CSSProperties } from "react";

/* the legacy markup sets CSS custom properties in inline style="--x:4%;--y:150px"; this keeps that text as written */
export function v(text: string): CSSProperties {
  const out: Record<string, string> = {};
  for (const part of text.split(";")) {
    const i = part.indexOf(":");
    if (i <= 0) continue;
    const k = part.slice(0, i).trim();
    out[k.startsWith("--") ? k : k.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())] = part.slice(i + 1).trim();
  }
  return out as CSSProperties;
}
