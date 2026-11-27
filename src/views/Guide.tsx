/* GUIDE: the article, carried over verbatim from legacy/src/app4.js renderGuide. */
import { Keyboard } from "@/components/Keyboard";
import { Screen } from "@/lib/screen";
import { GCOL, CO } from "@/core/data";
import { t, speedTxt } from "@/i18n";
import "@/styles/panels.css";

const legend = () => [["pinky", t("Pinky")], ["ring", t("Ring finger")], ["middle", t("Middle finger")], ["index", t("Index finger")], ["thumb", t("Thumb (space)")]];
const sources = () => [
  [t("Touch typing (Wikipedia)"), "https://en.wikipedia.org/wiki/Touch_typing"],
  [t("Words per minute (Wikipedia)"), "https://en.wikipedia.org/wiki/Words_per_minute"],
  [t("Dhakal, Feit, Kristensson, Oulasvirta: Observations on Typing from 136 Million Keystrokes, CHI 2018"), "https://userinterfaces.aalto.fi/136Mkeystrokes/"],
  [t("Feit, Weir, Oulasvirta: How We Type, CHI 2016"), "https://userinterfaces.aalto.fi/how-we-type/"],
  [t("Keybr help: how adaptive lessons work"), "https://www.keybr.com/help"],
  [t("Monkeytype: how WPM, raw and accuracy are measured"), "https://monkeytype.com/about"],
  [t("OSHA computer workstations: keyboards"), "https://www.osha.gov/etools/computer-workstations/components/keyboards"],
];

const List = ({ items }: { items: string[] }) => <ul>{items.map((x, i) => <li key={i}>{x}</li>)}</ul>;

export function GuideView() {
  const hk = [...(CO.home as string)].map(c => c.toUpperCase());
  return (
    <div>
      <Screen kind="guide" />
      <article className="guide"><h1>{t("tab|Guide")}</h1><p className="muted">{t("Everything you need to know before and while you learn.")}</p>
        <h2>{t("1. Sit and place your hands")}</h2>
        <List items={[t("Sit back with your feet flat and your shoulders relaxed. Keep your elbows close to your body."), t("Keep your wrists straight, in line with your forearms. Let your hands hover over the keys instead of resting on the edge of the laptop while you type."), t("Put the top of the screen at or just below eye level, about an arm's length away."), t("Take short breaks often.")]} />
        <h2>{t("2. Find the home row")}</h2>
        <List items={[t("Your fingers rest on the middle row: left hand on {left}, right hand on {right}. Your thumbs rest on the space bar.", { left: hk.slice(0, 4).join(" "), right: hk.slice(4).join(" ") }), t("Feel for the small bumps on F and J. They let you find home without looking."), t("After every reach, the finger goes back to its home key.")]} />
        <h2>{t("3. One finger for each key")}</h2>
        <div className="guide-kb"><Keyboard mode="fingers" id="g-kb" label={t("Keyboard coloured by finger")} />
          <div className="legend">{legend().map(g => <span key={g[0]}><span className="dot" style={{ "--fc": "var(" + GCOL[g[0]] + ")" } as React.CSSProperties} />{g[1]}</span>)}</div></div>
        <div style={{ height: 22 }} />
        <List items={[t("Each key belongs to one finger. Use the same finger every time, even when another one feels quicker. A fixed finger for each key and a fixed hand position are what make typing automatic. Studies of everyday typists found these matter more than how many fingers you use."), t("Shift: hold it with the little finger of the other hand. For a capital F (left hand), hold the right Shift."), t("Space: press it with either thumb. Many typists use the thumb of the hand that did not type the last letter."), t("The 6 key: most charts give it to the left index finger, and this course does too. Some people use the right index finger. Pick one and keep it.")]} />
        <h2>{t("4. How to practise")}</h2>
        <List items={[t("Accuracy first. Aim for 95% or better before you try to go faster. Speed comes from repeating the right movement."), t("Keep your eyes on the screen. The keyboard below the text shows the next key and finger. When the keys feel familiar, switch hints to \"Only when I hesitate or miss\", and later hide them."), t("Keep an even rhythm. Steady and a bit slow beats fast bursts with pauses."), t("Practise a little every day. 15 to 20 minutes a day is the usual advice. It hasn't been tested for typing in particular, but short regular practice is how most motor skills stick."), t("Once you know all the letters, type your real messages with the new technique too.")]} />
        <h2>{t("5. What to expect")}</h2>
        <List items={[t("If you used to type with a few fingers, you will be slower at first. That is normal. Most people get back to their old speed and then pass it, usually within weeks to a few months. Nobody can promise an exact timeline."), t("For reference: a 1999 study found computer users averaged about 33 words per minute when copying text. Professional typists usually type 43 to 80. A 2018 study of 168,000 people typing online found an average of about 52."), t("Words per minute counts every 5 characters, spaces included, as one word. Accuracy is the share of your key presses that were right.")]} />
        <h2>{t("6. When you get stuck")}</h2>
        <List items={[t("Your speed is limited by your slowest keys and letter pairs. Practice finds the weakest one and builds each round around it."), t("If your accuracy drops below 95%, slow down on purpose for a few rounds."), t("Plateaus are normal. When most of your keys are strong, raise the target speed by {n} in Settings.", { n: speedTxt(5) })]} />
        <h2>{t("7. Notes for your keyboard")}</h2>
        <List items={[t("Your Mac uses the U.S. International layout. On it, ' \" ` ~ and ^ are accent keys: they wait for the next key, so ' then e gives é. To type the mark on its own, press Space after it; this app accepts that. If it feels clumsy, switch to the ABC or U.S. layout in the input menu while you practise."), t("If a number key gives ě, š or č, your Czech keyboard is active. Switch the input source back to U.S."), t("Some labels on your Czech keyboard may not match what the U.S. layout types (for example Y and Z, or the number row). Follow the keyboard on the screen. Not looking at the keys is the point anyway.")]} />
        <h2>{t("Sources")}</h2>
        <ul className="src">{sources().map(s => <li key={s[1]}><a href={s[1]} target="_blank" rel="noopener">{s[0]}</a></li>)}</ul>
      </article>
    </div>
  );
}
