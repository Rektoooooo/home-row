import { useEffect, useRef } from "react";

const DATA = { kind: "test", big: "43", unit: "WPM", tag: "Typing test", items: [["Accuracy", "92%"], ["Test", "30 s test"], ["Example", "Sample result"]] };

/* The same renderer the trainer uses for its share image (src/core/shareCard.ts), loaded after hydration and
   painted onto the visible canvas. */
export function ShareCard() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let dead = false;
    (async () => {
      const { drawShareCard } = await import("@/core/shareCard");
      const blob = (await drawShareCard(DATA)) as Blob;
      const img = await createImageBitmap(blob);
      const cv = ref.current;
      if (dead || !cv) return;
      cv.getContext("2d")!.drawImage(img, 0, 0);
      (window as unknown as { __cardDrawn?: boolean }).__cardDrawn = true;
    })().catch(() => {});
    return () => { dead = true; };
  }, []);
  return <canvas ref={ref} id="shareCard" width={1200} height={630} role="img" aria-label="Example share card: 43 WPM at 92 percent accuracy in a 30 second test, with the Home Row logo and a glowing F and J key"></canvas>;
}
