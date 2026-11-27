/* The website account as UI state (who is signed in, busy, last error). No Supabase code here: the actions load
   src/core/supa.ts on demand, and the claude.ai build has accounts off (it syncs to the Claude account). */
import { useSyncExternalStore } from "react";
import { SUPA_URL, SUPA_KEY } from "@/config";

export const ACCOUNTS = import.meta.env.MODE !== "artifact" && !!SUPA_URL && !!SUPA_KEY;
export interface AccountState { user: { id: string; email: string } | null; busy: boolean; err: string }
let A: AccountState = { user: null, busy: false, err: "" };
const subs = new Set<() => void>();
const set = (p: Partial<AccountState>) => { A = { ...A, ...p }; subs.forEach(f => f()); };
export const setAccountUser = (user: AccountState["user"]) => set({ user });
export const setAccountBusy = (busy: boolean) => set({ busy });
export const setAccountError = (err: string) => set({ err });
export const useAccount = () => useSyncExternalStore(f => { subs.add(f); return () => { subs.delete(f); }; }, () => A);

export async function signInGoogle() { if (ACCOUNTS) (await import("@/core/supa")).signIn(); }
export async function signOutAccount() { if (ACCOUNTS) (await import("@/core/supa")).signOut(); }
export async function startAccounts() { if (ACCOUNTS) (await import("@/core/supa")).startAccounts(); }
