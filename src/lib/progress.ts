/* React bindings for the framework-free core: progress state S and the save status. */
import { useSyncExternalStore } from "react";
import { subscribe, getVersion } from "@/core/state";
import { statusHooks, saveStatus, statusText } from "@/core/sync";

/* re-renders whenever S changes (save(), setS(), notify()); read S directly while rendering */
export const useProgress = () => useSyncExternalStore(subscribe, getVersion);

let statusVer = 0;
const statusSubs = new Set<() => void>();
statusHooks.push(() => { statusVer++; statusSubs.forEach(f => f()); });
const subStatus = (f: () => void) => { statusSubs.add(f); return () => { statusSubs.delete(f); }; };
/* the save status text ("Saved in this browser only", …), live */
export function useSaveStatus(): string {
  useSyncExternalStore(subStatus, () => statusVer);
  return statusText(saveStatus);
}
