/* The brand mark: two square F and J keycaps with their home bumps on a dark app-icon tile (legacy app9.js logoBody). */
import { useId } from "react";

const LOGO_F = "M-4-8V4M-4-8h8M-4-2.5h6.5", LOGO_J = "M3.5-8v8a3.75 3.75 0 0 1-7.5 0";
const LOGO_KEYS: [number, number, number, string][] = [[21, 25, -8, LOGO_F], [43, 36, 6, LOGO_J]]; /* [centre x, centre y, tilt, letter] */
const LOGO_INK = "#161A26", LOGO_EDGE = "#9C9486", LOGO_BUMP = "#F5A524", LOGO_GAP = "#1B1F2E";

export function logoBody(g: string) {
  const key = (k: [number, number, number, string], i: number) => '<g transform="translate(' + k[0] + ' ' + k[1] + ') rotate(' + k[2] + ')">' + (i ? '<rect x="-15.75" y="-15.75" width="31.5" height="35.5" rx="8.75" fill="' + LOGO_GAP + '"/>' : '') +
    '<rect x="-14" y="-10" width="28" height="28" rx="7" fill="' + LOGO_EDGE + '"/><rect x="-14" y="-14" width="28" height="28" rx="7" fill="url(#' + g + 'c)"/>' +
    '<path d="' + k[3] + '" fill="none" stroke="' + LOGO_INK + '" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/><rect x="-4" y="6.6" width="8" height="2.4" rx="1.2" fill="' + LOGO_BUMP + '"/></g>';
  return '<defs><linearGradient id="' + g + 't" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2B3147"/><stop offset="1" stop-color="#0C0F18"/></linearGradient>' +
    '<linearGradient id="' + g + 'c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#E3DED3"/></linearGradient></defs>' +
    '<rect width="64" height="64" rx="15" fill="url(#' + g + 't)"/><rect x=".75" y=".75" width="62.5" height="62.5" rx="14.25" fill="none" stroke="#fff" stroke-opacity=".12" stroke-width="1.5"/>' + LOGO_KEYS.map(key).join("");
}

export function Logo({ size = 30 }: { size?: number }) {
  const id = "lg" + useId().replace(/[^a-zA-Z0-9]/g, "");
  return <svg className="logo" width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" focusable="false" dangerouslySetInnerHTML={{ __html: logoBody(id) }} />;
}
