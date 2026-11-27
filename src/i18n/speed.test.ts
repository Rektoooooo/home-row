import { afterEach, describe, expect, it } from "vitest";
import { meetsSpeed, setLangForTests, speed } from "./index";

/* the speed star compares the number the learner sees: WPM in English, keystrokes per minute (WPM x 5) in Czech */
describe("meetsSpeed", () => {
  afterEach(() => setLangForTests("en"));
  it("English rounds WPM", () => {
    setLangForTests("en");
    expect(meetsSpeed(13.5, 14)).toBe(true); /* Math.round(13.5) = 14 */
    expect(meetsSpeed(13.4, 14)).toBe(false);
    expect(speed(13.5)).toBe(14);
  });
  it("Czech compares keystrokes per minute", () => {
    setLangForTests("cs");
    expect(speed(13.6)).toBe(68);
    expect(meetsSpeed(13.6, 14)).toBe(false); /* 68 úh./min is below 70 */
    expect(meetsSpeed(13.9, 14)).toBe(true); /* 69.5 rounds to 70 */
  });
});
