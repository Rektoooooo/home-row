/* React wrappers around the imperative SVG keyboard and hands (ui/keyboard.ts). The SVG is built once into the ref and updated
   through set/press/err/setHeat, never re-rendered. */
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { makeKeyboard, makeHands, type Keyboard as KB, type KbMode } from "@/ui/keyboard";
import { S } from "@/core/state";
import { t } from "@/i18n";
import { useProgress } from "@/lib/progress";

export interface KeyboardHandle { set: KB["set"]; setHeat: KB["setHeat"]; press: KB["press"]; err: KB["err"]; }
interface Props {
  mode: KbMode; id?: string; label?: string; className?: string;
  next?: string[]; learned?: string[]; upnext?: string[];
  heat?: any;
}

export const Keyboard = forwardRef<KeyboardHandle, Props>(function Keyboard({ mode, id, label, className = "", next, learned, upnext, heat }, ref) {
  const svg = useRef<SVGSVGElement>(null), kb = useRef<KB | null>(null);
  useProgress();
  const layout = S.settings.layout; /* switching ISO/ANSI rebuilds every live keyboard (KB-11) */
  const key = [next, learned, upnext].map(a => (a || []).join(",")).join("|");
  useEffect(() => {
    kb.current = makeKeyboard(svg.current!, mode);
    return () => { kb.current?.destroy(); kb.current = null; };
  }, [mode, layout]);
  useEffect(() => {
    kb.current?.set({ next: next || [], learned: learned || [], upnext: upnext || [] });
    if (heat) kb.current?.setHeat(heat);
  }, [key, layout, heat, mode]); // eslint-disable-line react-hooks/exhaustive-deps
  useImperativeHandle(ref, () => ({
    set: o => kb.current?.set(o), setHeat: m => kb.current?.setHeat(m), press: i => kb.current?.press(i), err: i => kb.current?.err(i),
  }), []);
  return <svg ref={svg} id={id} className={"kb " + className} role="img" aria-label={label ?? t("Keyboard")} />;
});

export function Hands({ fingers, id }: { fingers: string[]; id?: string }) {
  const svg = useRef<SVGSVGElement>(null), h = useRef<ReturnType<typeof makeHands> | null>(null);
  useEffect(() => { h.current = makeHands(svg.current!); h.current.set(fingers); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const key = fingers.join(",");
  useEffect(() => { h.current?.set(fingers); }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  return <svg ref={svg} id={id} className="hands" role="img" aria-label={t("Hands")} />;
}
