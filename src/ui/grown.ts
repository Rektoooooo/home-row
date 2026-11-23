/* bars grow from 0 on a fresh screen (not under reduced motion); same behaviour as Learn's level and goal bars */
import { useEffect, useState } from "react";
import { reduceMotion } from "./engine";

export function useGrown(v: number) {
  const [x, setX] = useState(reduceMotion() ? v : 0);
  useEffect(() => { const id = requestAnimationFrame(() => requestAnimationFrame(() => setX(v))); return () => cancelAnimationFrame(id); }, [v]);
  return x;
}
