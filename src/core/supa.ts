/* SUPA (website only): Google sign-in through Supabase, and an account host with the same shape as claude.ai's
   (use("db") → doc(path).get/set/onSnapshot, use("user") → id()), so sync.ts connectAccount() runs on it unchanged.
   Table public.users: one row per person, the Google profile (filled by a database trigger on sign-in) and the
   progress columns progress | progress_cs | coach that this host reads and writes; row level security keeps it private.
   This module is imported only on the website, and supabase-js itself only when someone signs in or has a session. */
import { SUPA_URL, SUPA_KEY } from "@/config";
import { connectAccount, disconnectAccount, acctHost } from "./sync";
import { setAccountUser, setAccountBusy, setAccountError } from "@/lib/account";

export const AUTH_LS = "homerow.auth";
let client: any = null;
async function sb() {
  if (client) return client;
  const { createClient } = await import("@supabase/supabase-js");
  client = createClient(SUPA_URL, SUPA_KEY, { auth: { flowType: "pkce", persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: AUTH_LS } });
  return client;
}
export const hasStoredSession = () => { try { return !!localStorage.getItem(AUTH_LS); } catch (e) { return false; } };
/* the Google round trip comes back as ?code=… (PKCE) or ?error=… in the query, never in the #hash the app routes on */
export const isAuthReturn = (search = location.search) => /[?&](code|error)=/.test(search);

/* the account host: errors become the codes flush() knows (unavailable → retry, then offline; not_granted → stop) */
const DOC = /^data\/users\/[^/]+\/(progress|progress-cs|coach)$/;
const COL: Record<string, string> = { progress: "progress", "progress-cs": "progress_cs", coach: "coach" };
export function supaHost(c: any, uid: string) {
  const fail = (r: any) => {
    const st = r.status || 0, msg = (r.error && r.error.message) || "";
    const code = !st || st >= 500 || /fetch|network|timeout/i.test(msg) ? "unavailable" : st === 401 || st === 403 ? "not_granted" : "invalid_argument";
    throw Object.assign(new Error(msg || code), { code });
  };
  const doc = (path: string) => {
    const m = DOC.exec(path); if (!m) throw Object.assign(new Error("unknown doc " + path), { code: "invalid_argument" });
    const col = COL[m[1]];
    const get = async () => {
      const r = await c.from("users").select(col).eq("id", uid).maybeSingle();
      if (r.error) fail(r);
      const v = r.data ? r.data[col] : null;
      return { exists: v != null, data: () => (v != null ? v : undefined) };
    };
    return {
      get,
      /* the row exists from the sign-in trigger; if it doesn't (yet), it is added */
      async set(v: any) {
        const row = { [col]: v, updated_at: new Date().toISOString() };
        const r = await c.from("users").update(row).eq("id", uid).select("id");
        if (r.error) fail(r);
        if (!r.data || !r.data.length) { const i = await c.from("users").insert({ id: uid, ...row }); if (i.error) fail(i); }
      },
      /* nothing else writes these rows on the website, so one read is the whole snapshot */
      onSnapshot(cb: (s: any) => void, onErr?: (e: any) => void) { get().then(cb, e => { if (onErr) onErr(e); }); },
    };
  };
  return { use: async (name: string) => (name === "db" ? { doc } : name === "user" ? { id: async () => uid } : null) };
}

let host: any = null, lastSync = 0;
async function connectWith(c: any) {
  const { data } = await c.auth.getSession();
  const u = data && data.session && data.session.user;
  if (!u) { setAccountUser(null); return; }
  setAccountUser({ id: u.id, email: u.email || "" });
  host = supaHost(c, u.id); lastSync = Date.now();
  await connectAccount(host);
}
/* boot: a stored session or the return from Google → finish signing in and sync; otherwise supabase-js never loads */
export async function startAccounts() {
  if (!SUPA_URL || !SUPA_KEY) return;
  const back = isAuthReturn();
  if (!back && !hasStoredSession()) return;
  try {
    setAccountBusy(true);
    const c = await sb();
    if (back) {
      const err = new URLSearchParams(location.search).get("error_description");
      history.replaceState(null, "", location.pathname + location.hash);
      if (err) setAccountError(err);
    }
    await connectWith(c);
  } catch (e: any) { setAccountError(String((e && e.message) || e)); }
  finally { setAccountBusy(false); }
  /* coming back to the tab: pick up what another device saved (at most every 30 s) */
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && host && acctHost === host && Date.now() - lastSync > 30000) { lastSync = Date.now(); connectAccount(host); }
  });
}
export async function signIn() {
  setAccountBusy(true); setAccountError("");
  try {
    const c = await sb();
    const { error } = await c.auth.signInWithOAuth({ provider: "google", options: { redirectTo: location.origin + location.pathname } });
    if (error) throw error;
  } catch (e: any) { setAccountError(String((e && e.message) || e)); setAccountBusy(false); }
}
export async function signOut() {
  setAccountBusy(true);
  try { await disconnectAccount(); host = null; const c = await sb(); await c.auth.signOut(); } catch (e) {}
  setAccountUser(null); setAccountBusy(false);
}
