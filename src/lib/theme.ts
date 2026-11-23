/* Dark mode for shadcn's `.dark` class. claude.ai sets data-theme="dark" | "light" on <html> when the viewer picks
   a theme and nothing for "system"; the website has no attribute, so the system setting decides. */
export function watchTheme(): () => void {
  const root = document.documentElement;
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  const apply = () => {
    const t = root.getAttribute("data-theme");
    const dark = t === "dark" || (t !== "light" && mq.matches);
    root.classList.toggle("dark", dark);
    root.style.colorScheme = dark ? "dark" : "light";
  };
  apply();
  mq.addEventListener("change", apply);
  const mo = new MutationObserver(apply);
  mo.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
  return () => {
    mq.removeEventListener("change", apply);
    mo.disconnect();
  };
}
