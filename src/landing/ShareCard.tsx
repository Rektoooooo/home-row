import { useEffect, useRef } from "react";

const DATA = { kind: "test", big: "43", unit: "WPM", tag: "Typing test", items: [["Accuracy", "92%"], ["Test", "30 s test"], ["Example", "Sample result"]] };

/* The same renderer the trainer uses for its share image (src/core/shareCard.ts), loaded after hydration and
   painted onto the visible canvas. */
export function ShareCard() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let dead = false, chain: Promise<void> = Promise.resolve();
    /* like legacy: draw at once (system fonts), then again once the card's fonts are loaded; paints run in order */
    const paint = (quick: boolean) => {
      chain = chain.then(async () => {
        const { drawShareCard } = await import("@/core/shareCard");
        const img = await createImageBitmap((await drawShareCard(DATA, quick)) as Blob);
        const cv = ref.current;
        if (dead || !cv) return;
        cv.getContext("2d")!.drawImage(img, 0, 0);
        (window as unknown as { __cardDrawn?: boolean }).__cardDrawn = true;
      }).catch(e => console.warn("share card:", e));
    };
    paint(true);
    paint(false);
    return () => { dead = true; };
  }, []);
  return <canvas ref={ref} id="shareCard" width={1200} height={630} role="img" aria-label="Example share card: 43 WPM at 92 percent accuracy in a 30 second test, with the Home Row logo and a glowing F and J key"></canvas>;
}
