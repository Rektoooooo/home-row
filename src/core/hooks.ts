/* Side effects the legacy code did straight on the DOM. The core calls these; the UI layer replaces them.
   Defaults are no-ops so the core runs headless (tests, SSR). */
export const hooks: Record<string, any> = {
  toast: (_o: any) => {},          // toast({icon,title,sub})
  onRemoteApplied: () => {},        // account data merged into S: re-render the current screen
  rerenderCoach: () => {},          // coach doc or ask state changed
  syncWeeklyUI: () => {},           // weekly coach switch / message changed
  renderRing: () => {},             // today ring / streak flame
  achBooted: () => {},              // badges were granted silently at load: refresh Progress
  courseChanged: () => {},          // the active course or the Czech layout changed (account load): rebuild keyboards
};
export function setHooks(h: Record<string, any>) { Object.assign(hooks, h); }
