/* A translated plural with the number in bold: bold(tn(n, "{n} day streak", "{n} days streak", { n: NB }), n).
   The sentinel keeps the word order and the plural forms of the translation. */
import { Fragment, type ReactNode } from "react";
import { num } from "@/i18n";

export const NB = "\u0000";
export function bold(s: string, n: number): ReactNode {
  const [a, ...rest] = s.split(NB), b = rest.join(NB);
  return <Fragment>{a}<b>{num(n)}</b>{b}</Fragment>;
}

