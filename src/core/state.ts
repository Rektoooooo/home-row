/* STATE: the single source of truth `S` (ES live binding) plus a tiny subscribe/notify for React.
   Ported from legacy/src/app2.js (DEF, BEST0, emptyState); `S=null` in legacy is replaced by an empty state. */
export const DEF={hints:"always",stop:true,sound:false,soundPack:"off",weekly:false,goal:15,target:25,layout:"iso",unlockAll:false,pace:"target",pCaps:false,pPunct:false,pNums:false,tDur:30,tPool:"c200",tCaps:false,tPunct:false,tNums:false};
export const BEST0=()=>({practice:0,lessonWpm:0,test15:0,test30:0,test60:0,test120:0});
export function emptyState():any{return {v:1,updatedAt:0,resetAt:0,settings:Object.assign({},DEF),settingsAt:0,lessons:{},custom:{},keys:{},keysAt:0,pairs:{},pairsAt:0,days:{},tests:[],bests:BEST0(),seenTips:{deadKey:false,welcome:false},ach:{},baseline:null,modes:{text:0,code:0,mine:0,at:0}}}
export let S: any = emptyState();
/* replace the whole state object (legacy: `S=...`) */
export function setS(next: any) { S = next; notify(); }

/* COURSE: the English course keeps its progress in S (as before). The Czech course keeps lessons, keys, pairs,
   tests, bests, baseline, modes and custom results in SC, its own store (homerow.cs.v1 / progress-cs), with the same
   shape as S so sanitize and merge work on it. Days, badges, seen tips and settings always stay in S.
   SC.on: the Czech course is the active one; SC.csLayout: "qwertz" | "qwerty". */
export type CourseId = "en" | "cs";
export function emptyCourse(): any { const s = emptyState(); s.course = "cs"; s.on = false; s.csLayout = "qwertz"; return s; }
export let SC: any = emptyCourse();
export function setSC(next: any) { SC = next; notify(); }
export let COURSE: CourseId = "en";
export function setCOURSE(c: CourseId) { COURSE = c; }
/* the active course's progress object: read lessons, keys, pairs, tests, bests, baseline, modes and custom through C() */
export const C = (): any => (COURSE === "cs" ? SC : S);

let version = 0;
const listeners = new Set<() => void>();
/* call after mutating S in place (save() does it); useSyncExternalStore snapshot is getVersion() */
export function notify() { version++; listeners.forEach(f => { try { f(); } catch (e) {} }); }
export function subscribe(fn: () => void) { listeners.add(fn); return () => { listeners.delete(fn); }; }
export const getVersion = () => version;
