import { useEffect, useRef, useState } from "react";
import { soundPreview } from "@/core/sound";
import { v } from "./util";

const PACKS = [
  { pack: "soft", name: "Soft", desc: "Quiet and gentle", ac: "pinky", dl: "" },
  { pack: "cream", name: "Creamy", desc: "Deep, smooth thock", ac: "index", dl: ";--dl:.07s" },
  { pack: "click", name: "Clicky", desc: "Crisp and snappy", ac: "ring", dl: ";--dl:.14s" },
  { pack: "type", name: "Typewriter", desc: "Old-school clack", ac: "middle", dl: ";--dl:.21s" },
];
const IDLE = "Click a key, or press Enter when it's focused.";

export function Sounds() {
  const [note, setNote] = useState(IDLE);
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const play = (b: HTMLButtonElement, p: (typeof PACKS)[number]) => {
    soundPreview(p.pack);
    b.classList.add("tap"); timers.current.add(setTimeout(() => b.classList.remove("tap"), 170));
    setNote("Playing " + p.name + ".");
  };
  return (
    <section className="band" aria-labelledby="soundh">
      <div className="rail center">
        <h2 className="h2 rv" id="soundh">Pick your sound.</h2>
        <p className="lead rv" style={v("--dl:.06s;margin-top:18px")}>Four key sounds, made in your browser. Press a key to hear it.</p>
        <div className="keys4">
          {PACKS.map((p) => (
            <button key={p.pack} className="sk rv" type="button" data-pack={p.pack} style={v("--ac:var(--f-" + p.ac + ")" + p.dl)} onClick={(e) => play(e.currentTarget, p)}><span className="cap"><span>{p.name}</span></span><span className="sd">{p.desc}</span></button>
          ))}
        </div>
        <p className="soundnote" role="status" id="soundNote">{note}</p>
      </div>
    </section>
  );
}
