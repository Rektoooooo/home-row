/* STORE: sanitize, merge, stable, localStorage, save().  Ported from legacy/src/app2.js. */
import { EN_LESSONS } from "./data";
import { S, setS, emptyState, notify, SC, setSC, emptyCourse, COURSE } from "./state";
import { csLessons, CS_LETTERS } from "./cs/course";
import { hooks } from "./hooks";
export { S, setS, emptyState, DEF, BEST0, subscribe, notify, getVersion, C, SC, setSC, COURSE, emptyCourse } from "./state";

export const fin=(x?:any)=>typeof x==="number"&&isFinite(x);
export const isObj=(x?:any)=>x&&typeof x==="object"&&!Array.isArray(x);
export const num=(x?:any,d?:any,lo?:any,hi?:any)=>fin(x)?Math.min(hi,Math.max(lo,x)):d;
export const own=(o?:any,k?:any)=>Object.prototype.hasOwnProperty.call(o,k),PACKS=["off","soft","cream","click","type"];
const CS_N=csLessons("qwertz").length,CS_PAIR=new RegExp("^["+CS_LETTERS+"]{2}$");
/* cs: the Czech course store (same shape; its lesson count, Czech letter pairs, plus on and csLayout) */
export function sanitize(o?:any,cs?:boolean):any{
  if(!isObj(o))return null;
  const s=cs?emptyCourse():emptyState(),nL=cs?CS_N:EN_LESSONS.length,pairRe=cs?CS_PAIR:/^[a-z]{2}$/;
  if(cs){s.on=o.on===true;s.csLayout=o.csLayout==="qwerty"?"qwerty":"qwertz"}
  s.updatedAt=num(o.updatedAt,0,0,1e15);s.resetAt=num(o.resetAt,0,0,1e15);s.settingsAt=num(o.settingsAt,0,0,1e15);s.keysAt=num(o.keysAt,0,0,1e15);s.pairsAt=num(o.pairsAt,0,0,1e15);
  if(isObj(o.settings)){const t=o.settings,d=s.settings;
    if(["always","hesitate","hidden"].includes(t.hints))d.hints=t.hints;
    if(typeof t.stop==="boolean")d.stop=t.stop;if(typeof t.sound==="boolean")d.sound=t.sound;
    d.soundPack=PACKS.includes(t.soundPack)?t.soundPack:(d.sound?"cream":"off");
    /* an older tab only writes the boolean: when it disagrees with the pack, the boolean wins */
    if(PACKS.includes(t.soundPack)&&typeof t.sound==="boolean"&&t.sound!==(t.soundPack!=="off"))d.soundPack=t.sound?"cream":"off";
    d.sound=d.soundPack!=="off";if(typeof t.weekly==="boolean")d.weekly=t.weekly;
    if([10,15,20,30].includes(t.goal))d.goal=t.goal;if([20,25,30,35,40].includes(t.target))d.target=t.target;
    if(t.layout==="iso"||t.layout==="ansi")d.layout=t.layout;if(typeof t.unlockAll==="boolean")d.unlockAll=t.unlockAll;
    ["pCaps","pPunct","pNums","tCaps","tPunct","tNums"].forEach(k=>{if(typeof t[k]==="boolean")d[k]=t[k]});
    if([15,30,60,120].includes(t.tDur))d.tDur=t.tDur;if(t.tPool==="c200"||t.tPool==="e950")d.tPool=t.tPool;
    if(["off","target","best"].includes(t.pace))d.pace=t.pace}
  if(isObj(o.lessons))for(const id of Object.keys(o.lessons)){const n=+id,r=o.lessons[id];
    if(!(n>=1&&n<=nL)||!isObj(r))continue;
    s.lessons[n]={done:!!r.done,stars:num(r.stars,0,0,3)|0,wpm:num(r.wpm,0,0,500),acc:num(r.acc,0,0,1),attempts:num(r.attempts,0,0,1e6)|0,last:num(r.last,0,0,1e15)}}
  if(isObj(o.custom)){let c=0;for(const id of Object.keys(o.custom)){if(c++>=100)break;const r=o.custom[id];
    if(!/^[A-Za-z0-9_-]{1,40}$/.test(id)||!isObj(r))continue;
    s.custom[id]={wpm:num(r.wpm,0,0,500),acc:num(r.acc,0,0,1),stars:num(r.stars,0,0,3)|0,attempts:num(r.attempts,0,0,1e6)|0,last:num(r.last,0,0,1e15)}}}
  if(isObj(o.keys)){let c=0;for(const k of Object.keys(o.keys)){if(c++>200)break;const r=o.keys[k];
    if(k.length>8||!isObj(r)||!fin(r.n))continue;
    s.keys[k]={n:num(r.n,0,0,1e7)|0,errEma:num(r.errEma,.05,0,1)};if(fin(r.timeEma)&&r.timeEma>0)s.keys[k].timeEma=Math.min(1e5,r.timeEma)}}
  if(isObj(o.pairs)){let c=0;for(const k of Object.keys(o.pairs)){if(c++>=300)break;const r=o.pairs[k];
    if(!pairRe.test(k)||!isObj(r)||!fin(r.n))continue;
    s.pairs[k]={n:num(r.n,0,0,1e7)|0,errEma:num(r.errEma,.05,0,1)};if(fin(r.timeEma)&&r.timeEma>0)s.pairs[k].timeEma=Math.min(1e5,r.timeEma)}}
  if(isObj(o.days)){const ks=Object.keys(o.days).filter(k=>/^\d{4}-\d{2}-\d{2}$/.test(k)).sort().slice(-400);
    ks.forEach(k=>{const r=o.days[k];if(!isObj(r))return;
      s.days[k]={ms:num(r.ms,0,0,1e10),chars:num(r.chars,0,0,1e8),presses:num(r.presses,0,0,1e8),correct:num(r.correct,0,0,1e8),ex:num(r.ex,0,0,1e6)|0,t:num(r.t,0,0,1e15)}})}
  if(Array.isArray(o.tests))s.tests=o.tests.filter((t?:any)=>isObj(t)&&fin(t.ts)&&fin(t.wpm)&&fin(t.acc)).slice(-100).map((t?:any)=>({ts:t.ts,dur:num(t.dur,0,0,1e4),pool:String(t.pool||"").slice(0,20),opts:String(t.opts||"").slice(0,10),wpm:t.wpm,raw:num(t.raw,0,0,1e4),acc:t.acc}));
  if(isObj(o.bests))for(const k of Object.keys(s.bests))s.bests[k]=num(o.bests[k],0,0,1e4);
  if(isObj(o.seenTips)){s.seenTips.deadKey=!!o.seenTips.deadKey;s.seenTips.welcome=!!o.seenTips.welcome}
  if(isObj(o.ach)){let c=0;for(const id of Object.keys(o.ach)){if(c>=64)break;const t=o.ach[id];if(!/^[a-z0-9-]{1,32}$/.test(id)||!fin(t)||t<0)continue;s.ach[id]=Math.min(1e15,t);c++}}
  if(isObj(o.baseline)&&fin(o.baseline.ts)&&fin(o.baseline.wpm))s.baseline={wpm:num(o.baseline.wpm,0,0,500),acc:num(o.baseline.acc,0,0,1),ts:num(o.baseline.ts,0,0,1e15)};
  if(isObj(o.modes)){["text","code","mine"].forEach(k=>{s.modes[k]=num(o.modes[k],0,0,1e9)|0});s.modes.at=num(o.modes.at,0,0,1e15)}
  return s;
}
export function mx(a?:any,b?:any){return Math.max(a||0,b||0)}
export function merge(a?:any,b?:any){
  if(!b)return a;
  const cs=a.course==="cs",r=mx(a.resetAt,b.resetAt),o=cs?emptyCourse():emptyState();o.resetAt=r;
  [a,b].forEach(s=>{
    for(const id of Object.keys(s.lessons)){const x=s.lessons[id];if(x.last<r)continue;const y=o.lessons[id];
      o.lessons[id]=y?{done:y.done||x.done,stars:mx(y.stars,x.stars),wpm:mx(y.wpm,x.wpm),acc:mx(y.acc,x.acc),attempts:mx(y.attempts,x.attempts),last:mx(y.last,x.last)}:Object.assign({},x)}
    for(const id of Object.keys(s.custom||{})){const x=s.custom[id];if(x.last<r)continue;const y=o.custom[id];
      o.custom[id]=y?{wpm:mx(y.wpm,x.wpm),acc:mx(y.acc,x.acc),stars:mx(y.stars,x.stars),attempts:mx(y.attempts,x.attempts),last:mx(y.last,x.last)}:Object.assign({},x)}
    for(const d of Object.keys(s.days)){const x=s.days[d];if(x.t<r)continue;const y=o.days[d];
      o.days[d]=y?{ms:mx(y.ms,x.ms),chars:mx(y.chars,x.chars),presses:mx(y.presses,x.presses),correct:mx(y.correct,x.correct),ex:mx(y.ex,x.ex),t:mx(y.t,x.t)}:Object.assign({},x)}
    if(s.updatedAt>=r)for(const k of Object.keys(o.bests))o.bests[k]=mx(o.bests[k],s.bests[k]);
    s.tests.forEach((t?:any)=>{if(t.ts>=r&&!o.tests.some((u:any)=>u.ts===t.ts))o.tests.push(t)});
    o.seenTips.deadKey=o.seenTips.deadKey||s.seenTips.deadKey;o.seenTips.welcome=o.seenTips.welcome||s.seenTips.welcome;
    for(const id of Object.keys(s.ach)){const t=s.ach[id];if(t<r)continue;o.ach[id]=own(o.ach,id)?Math.min(o.ach[id],t):t}
    if(s.baseline&&s.baseline.ts>=r&&(!o.baseline||s.baseline.ts<o.baseline.ts))o.baseline=Object.assign({},s.baseline);
    if(s.modes.at>=r){["text","code","mine"].forEach(k=>{o.modes[k]=mx(o.modes[k],s.modes[k])});o.modes.at=mx(o.modes.at,s.modes.at)}
  });
  o.tests.sort((x?:any,y?:any)=>x.ts-y.ts);o.tests=o.tests.slice(-100);
  {const ak=Object.keys(o.ach);if(ak.length>64){const keep=ak.sort((x,y)=>o.ach[x]-o.ach[y]).slice(0,64),na:any={};keep.forEach(k=>{na[k]=o.ach[k]});o.ach=na}}
  const dk=Object.keys(o.days).sort();dk.slice(0,Math.max(0,dk.length-400)).forEach(k=>delete o.days[k]);
  const ss=b.settingsAt>a.settingsAt?b:a;o.settings=Object.assign({},ss.settings);o.settingsAt=mx(a.settingsAt,b.settingsAt);
  if(cs){o.on=ss.on===true;o.csLayout=ss.csLayout==="qwerty"?"qwerty":"qwertz"}
  const ka=a.keysAt>=r?a:null,kb=b.keysAt>=r?b:null;const kw=ka&&kb?(kb.keysAt>ka.keysAt?kb:ka):(ka||kb);
  if(kw){o.keys=JSON.parse(JSON.stringify(kw.keys));o.keysAt=kw.keysAt}
  const pa=a.pairsAt>=r?a:null,pb=b.pairsAt>=r?b:null;const pw2=pa&&pb?(pb.pairsAt>pa.pairsAt?pb:pa):(pa||pb);
  if(pw2){o.pairs=JSON.parse(JSON.stringify(pw2.pairs));o.pairsAt=pw2.pairsAt}
  o.updatedAt=mx(a.updatedAt,b.updatedAt);
  return o;
}
export function stable(x?:any):any{if(Array.isArray(x))return "["+x.map(stable).join(",")+"]";if(isObj(x))return "{"+Object.keys(x).sort().map(k=>JSON.stringify(k)+":"+stable(x[k])).join(",")+"}";return JSON.stringify(x)}
export const LSK="homerow.v1";
export function loadLocal(){try{const raw=localStorage.getItem(LSK);if(raw){const s=sanitize(JSON.parse(raw));if(s)return s}}catch(e){}return emptyState()}
export function writeLocal(){try{localStorage.setItem(LSK,JSON.stringify(S))}catch(e){}}
/* the Czech course has its own key, so a tab still running the English-only app (which rewrites homerow.v1 wholesale)
   can never drop it */
export const LSK_CS="homerow.cs.v1";
export function loadLocalCs(){try{const raw=localStorage.getItem(LSK_CS);if(raw){const s=sanitize(JSON.parse(raw),true);if(s)return s}}catch(e){}return emptyCourse()}
export function writeLocalCs(){try{localStorage.setItem(LSK_CS,JSON.stringify(SC))}catch(e){}}

/* the account side (sync.ts) registers here so save() can queue a flush without a cycle */
let saveHook: (() => void) | null = null;
export function setSaveHook(f: (() => void) | null) { saveHook = f; }
/* call after a finished exercise, a settings change or a reset */
/* the Czech store is written while the Czech course is active, and by course switches (course.ts) */
/* csPending: the Czech store changed and the account copy (progress-cs) needs a write; sync.ts takes it */
let csPending = false;
export function touchCs() { csPending = true; }
export function takeCsPending() { const p = csPending; csPending = false; return p; }
export function save() { S.updatedAt = Date.now(); writeLocal(); if (COURSE === "cs") { SC.updatedAt = Date.now(); writeLocalCs(); csPending = true; } if (saveHook) saveHook(); notify(); }
/* the Czech course: only its own progress goes; days, badges and settings stay */
export function resetCourse() {
  const now = Date.now(), st = emptyCourse();
  st.on = SC.on; st.csLayout = SC.csLayout; st.settingsAt = SC.settingsAt; st.modes.at = now; st.resetAt = now; st.updatedAt = now; st.keysAt = now; st.pairsAt = now;
  setSC(st); save();
}
export function resetAll() {
  const now = Date.now(), st = emptyState();
  st.settings = S.settings; st.settingsAt = S.settingsAt; st.seenTips = S.seenTips; st.modes.at = now; st.resetAt = now; st.updatedAt = now; st.keysAt = now; st.pairsAt = now;
  setS(st); save();
}
/* a settings change: stamp, save, refresh the ring (legacy settingChanged) */
export function settingChanged() { S.settingsAt = Date.now(); save(); hooks.renderRing && hooks.renderRing(); }
