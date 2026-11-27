/* Czech course: the lesson list (Czech QWERTZ order; QWERTY swaps where Y and Z come in), letters, home-row neighbours.
   Lesson objects have the same shape as the English ones in data.ts (stage and title stay English here; the app
   language translates them for display). Flags: review, shift, punct, digits, dead (letters typed with an accent key). */

export const CS_LETTERS = "aábcčdďeéěfghiíjklmnňoópqrřsštťuúůvwxyýzž";
export const CS_LETTER_RE = /^[aábcčdďeéěfghiíjklmnňoópqrřsštťuúůvwxyýzž]$/;
/* home key → its inner neighbour, for the first drills (English: NB in data.ts) */
export const CS_NB: Record<string, string> = { d: "f", k: "j", s: "d", l: "k", a: "s", "ů": "l", f: "j", j: "f" };
/* letters typed with the accent key (´ or ˇ) and then the letter; all other Czech letters have their own key */
export const CS_DEAD_LETTERS = "óďťň";

export function csLessons(variant: "qwertz" | "qwerty"): any[] {
  const qz = variant === "qwertz", L: any[] = [];
  const add = (stage: string, title: string, keys: string[], wpm: number, x?: any) => L.push(Object.assign({ n: L.length + 1, stage, title, keys, wpm }, x || {}));
  add("Home row", "F and J", ["f", "j"], 12); add("Home row", "D and K", ["d", "k"], 12); add("Home row", "S and L", ["s", "l"], 12);
  add("Home row", "A and Ů", ["a", "ů"], 12); add("Home row", "G and H", ["g", "h"], 12); add("Home row", "Home row review", [], 14, { review: 1 });
  add("Top row", "E and I", ["e", "i"], 15); add("Top row", "R and U", ["r", "u"], 15);
  add("Top row", qz ? "T and Z" : "T and Y", ["t", qz ? "z" : "y"], 15);
  add("Top row", "W and O", ["w", "o"], 15); add("Top row", "Q and P", ["q", "p"], 15); add("Top row", "Ú", ["ú"], 15);
  add("Top row", "Top row review", [], 17, { review: 1 });
  add("Bottom row", "V and M", ["v", "m"], 18); add("Bottom row", "B and N", ["b", "n"], 18); add("Bottom row", "C and comma", ["c", ","], 18);
  add("Bottom row", "X and period", ["x", "."], 18); add("Bottom row", qz ? "Y and hyphen" : "Z and hyphen", [qz ? "y" : "z", "-"], 18);
  add("Bottom row", "Bottom row review", [], 19, { review: 1 });
  add("Accents", "Ě and Š", ["ě", "š"], 15); add("Accents", "Č and Ř", ["č", "ř"], 15); add("Accents", "Ž and Ý", ["ž", "ý"], 15);
  add("Accents", "Á, Í and É", ["á", "í", "é"], 15); add("Accents", "Ó, Ď, Ť and Ň", ["ó", "ď", "ť", "ň"], 14, { dead: 1 });
  add("Accents", "All letters review", [], 18, { review: 1 });
  add("Capitals", "Shift and capitals", [], 16, { shift: 1 });
  add("Punctuation", "Punctuation", ["?", "!", ":", '"', "(", ")"], 15, { punct: 1 });
  add("Numbers", "Numbers 1 to 5", ["1", "2", "3", "4", "5"], 15, { digits: 1 });
  add("Numbers", "Numbers 6 to 0", ["6", "7", "8", "9", "0"], 15, { digits: 1 });
  return L;
}
