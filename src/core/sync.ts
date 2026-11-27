/* SYNC: save status, claude.ai account (progress doc), coach doc + sampler, weekly coach.
   Ported from legacy/src/app2.js (connectAccount, flush, status), app8.js (coach doc, askClaude) and app8b.js (weekly coach).
   Written against an injected `claude`-like object (setClaude) so it can be tested; without one it falls back to window.claude.
   DOM work of the legacy code goes through `hooks` (hooks.ts). */
import { S, setS, SC, setSC, COURSE } from "./state";
import { sanitize, merge, stable, writeLocal, writeLocalCs, setSaveHook, takeCsPending, isObj, settingChanged } from "./store";
import { courseFromStore } from "./course";
import { rnd } from "./data";
import { dateKey, addDays } from "./stats";
import { hooks } from "./hooks";
import { afterRemote, achBootHook, mondayOf, weekStats, aico } from "./rewards";
import { COACH_LS, COACH_PATH, ARTIFACT_URL, clone, sanitizeCoach, allowedChars, buildSummary, buildPrompt, validateReply, ASK_COPY, HIDE_CODES, coachAsk } from "./coach";

/* ---- the claude.ai host object (legacy: window.claude) ---- */
let injected: any = undefined, hasInjected = false;
export function setClaude(c: any) { injected = c; hasInjected = true; }
export function getClaude(): any { return hasInjected ? injected : (typeof window !== "undefined" ? (window as any).claude : undefined); }

/* ---- save status and account sync ---- */
/* acct: the progress doc (English course, shared days and badges); acctCs: progress-cs (the Czech course) */
export let saveStatus:any="connecting",acct:any=null,acctCs:any=null,writing=false,dirty=false,dirtyCs=false,retried=false,statusHooks:any[]=[];
export const STATUS_TXT={connecting:"Connecting…",local:"Saved in this browser only",offline:"Saved in this browser only (offline)",account:"Saved to your claude.ai account",failed:"Saved in this browser only (account unavailable)"};
export function setSaveStatus(s?:any){saveStatus=s;statusHooks.forEach(f=>{try{f(s)}catch(e){}})}
/* store.save() calls this: queue an account write when an account is attached */
setSaveHook(()=>{if(acct){dirty=true;if(takeCsPending()&&acctCs)dirtyCs=true;flush()}});
export async function flush(){
  if(writing||!acct||(!dirty&&!dirtyCs))return;
  const doS=dirty,doC=dirtyCs&&!!acctCs;
  writing=true;dirty=false;dirtyCs=false;
  try{if(doS)await acct.set(JSON.parse(JSON.stringify(S)));if(doC)await acctCs.set(JSON.parse(JSON.stringify(SC)));retried=false}
  catch(e:any){
    const code=String((e&&(e.code||e.name))||"")+" "+String((e&&e.message)||"");
    if(/unavailable/i.test(code)&&!retried){retried=true;dirty=dirty||doS;dirtyCs=dirtyCs||doC;writing=false;setTimeout(flush,1000+rnd(2000));return}
    if(/invalid_argument|revoked|not_granted/i.test(code)){acct=null;setSaveStatus("failed")}
    else if(/unavailable/i.test(code)){setSaveStatus("offline")}
  }
  writing=false;
  if(dirty)flush();
}
export async function connectAccount(){
  try{
    const claude=getClaude();
    if(!claude||typeof claude.use!=="function")return setSaveStatus("local");
    const timeout=(ms?:any)=>new Promise((_,rej)=>setTimeout(()=>rej(new Error("timeout")),ms));
    const [db,user]:any=await Promise.race([Promise.all([claude.use("db"),claude.use("user")]),timeout(10000)]);
    const id=user?await user.id():null;
    if(!db||!id)return setSaveStatus("local");
    ACCT={db,id};coachConnect();
    const ref=db.doc("data/users/"+id+"/progress");
    let snap;try{snap=await Promise.race([ref.get(),timeout(10000)])}catch(e){return setSaveStatus("offline")}
    const remote=snap&&snap.exists?sanitize(snap.data()):null;
    const merged=merge(S,remote);
    setS(merged);writeLocal();acct=ref;
    /* the Czech course doc: merged the same way; it also says which course is active */
    const refCs=db.doc("data/users/"+id+"/progress-cs");
    let snapCs:any=undefined;try{snapCs=await Promise.race([refCs.get(),timeout(10000)])}catch(e){}
    if(snapCs!==undefined){
      const rc=snapCs&&snapCs.exists?sanitize(snapCs.data(),true):null,mc=merge(SC,rc);
      setSC(mc);writeLocalCs();acctCs=refCs;
      if((SC.updatedAt>0||SC.settingsAt>0)&&(!rc||stable(mc)!==stable(rc)))dirtyCs=true;
      if((COURSE==="cs")!==!!SC.on){courseFromStore();hooks.courseChanged&&hooks.courseChanged()}
    }
    onRemoteApplied();
    if(S.updatedAt>0&&(!remote||stable(merged)!==stable(remote))){dirty=true;flush()}
    if(dirtyCs)flush();
    setSaveStatus("account");
  }catch(e){setSaveStatus(getClaude()?"offline":"local")}
}
/* ---- coach doc ---- */
export let ACCT:any=null,SAMPLE:any=null,COACH_RAW:any={},COACH:any={note:null,lessons:[],dropped:0},coachQ:Promise<any>=Promise.resolve(),coachOff=false,RM_ID="",COACH_SNAP=false;
export let ASK:any={running:false,ctl:null,err:"",ok:false};
export function loadCoach(){try{const raw=localStorage.getItem(COACH_LS);if(raw){COACH_RAW=JSON.parse(raw)||{};COACH=sanitizeCoach(COACH_RAW)}}catch(e){}}
export function rerenderCoach(){hooks.rerenderCoach()}
/* legacy onRemoteApplied: rewards bookkeeping, then the UI re-renders */
export function onRemoteApplied(){afterRemote();hooks.onRemoteApplied()}
export function applyCoachRaw(raw?:any,quiet?:any){
  COACH_RAW=isObj(raw)?raw:{};COACH=sanitizeCoach(COACH_RAW);
  try{localStorage.setItem(COACH_LS,JSON.stringify(COACH_RAW))}catch(e){}
  if(!quiet)rerenderCoach();
}
export async function coachConnect(){
  const db=ACCT&&ACCT.db;if(!db)return;
  try{
    db.doc(COACH_PATH(ACCT.id)).onSnapshot((snap?:any)=>{
      try{applyCoachRaw(snap&&snap.exists?snap.data():{})}catch(e){}
      COACH_SNAP=true;weeklyAuto();
    },()=>{});
  }catch(e){}
  try{SAMPLE=await Promise.race([getClaude().use("sample"),new Promise(r=>setTimeout(()=>r(null),10000))])||null}catch(e){SAMPLE=null}
  rerenderCoach();weeklyAuto();syncWeeklyUI();
}
/* one write at a time; always get() a fresh copy and change it by id so chat-made lessons are never overwritten */
export function coachMutate(fn?:any){
  coachQ=coachQ.then(async()=>{
    if(ACCT){
      try{
        const ref=ACCT.db.doc(COACH_PATH(ACCT.id)),snap=await ref.get();
        const raw=fn(snap&&snap.exists&&isObj(snap.data())?clone(snap.data()):{});
        await ref.set(raw);applyCoachRaw(raw);return;
      }catch(e){}
    }
    applyCoachRaw(fn(clone(COACH_RAW)));
  }).catch(()=>{});
  return coachQ;
}
export const coachAdd=(lesson?:any,note?:any)=>coachMutate((raw?:any)=>{
  const ls=(Array.isArray(raw.lessons)?raw.lessons:[]).filter((l?:any)=>!(isObj(l)&&l.id===lesson.id));
  ls.unshift(lesson);raw.lessons=ls.slice(0,20);if(note)raw.note=note;return raw;
});
export const coachRemove=(id?:any)=>coachMutate((raw?:any)=>{raw.lessons=(Array.isArray(raw.lessons)?raw.lessons:[]).filter((l?:any)=>!(isObj(l)&&l.id===id));return raw});

/* ---- the sampler: ask Claude ---- */
export async function askClaude(){
  if(ASK.running||!SAMPLE||coachOff)return;
  const ctl=new AbortController();ASK={running:true,ctl,err:"",ok:false};rerenderCoach();
  try{
    const allowed=allowedChars(),data=await SAMPLE.json(buildPrompt(buildSummary(),allowed),{signal:ctl.signal,modelTier:"default",cache:false});
    const v=validateReply(data,allowed);if(!v)throw {code:"invalid_json"};
    const now=Date.now(),lesson={id:"app-"+now.toString(36),title:v.title,why:v.why,by:"app",created:now,steps:v.steps};
    await coachAdd(lesson,{text:v.note,at:now});
    ASK={running:false,ctl:null,err:"",ok:true};
  }catch(e:any){
    const code=e&&e.code;
    if(HIDE_CODES.includes(code))coachOff=true;
    ASK={running:false,ctl:null,ok:false,err:code==="cancelled"?"":(ASK_COPY[code]||"Something went wrong. Try again.")};
  }
  rerenderCoach();
}
export const customById=(id?:any)=>COACH.lessons.find((l:any)=>l.id===id);
/* without an account Claude can't read the progress, so the card copies the whole progress instead of a prompt */
export const shareLocal=()=>!getClaude()||saveStatus==="local"||saveStatus==="offline"||saveStatus==="failed";
/* inside claude.ai the copy can be moved into the owner's account; on the website it only asks for advice and lessons */
export const progressExport=()=>getClaude()?"Here is my Home Row typing progress. It is saved in this browser only. Check it, move it to my account and make me custom lessons: "+ARTIFACT_URL+"\n\n"+JSON.stringify(S):coachAsk();
/* ---- weekly coach ---- */
export const WK={running:false,fired:false,msg:""},WK_TRY="homerow.weeklyTry";
export const WK_GONE="Claude isn't available for this page.";
/* ISO week: weeks start on Monday, week 1 holds the first Thursday */
export function isoWeek(d?:any){
  const t=new Date(d.getFullYear(),d.getMonth(),d.getDate());
  t.setDate(t.getDate()+3-((t.getDay()+6)%7));
  const y=t.getFullYear(),w1=new Date(y,0,4);
  return {y,w:1+Math.round((((t as any)-(w1 as any))/864e5-3+((w1.getDay()+6)%7))/7)};
}
export const weekId=(d?:any)=>{const x=isoWeek(d||new Date());return "weekly-"+x.y+"-w"+String(x.w).padStart(2,"0")};
export function weekBrief(mon?:any){
  const s=weekStats(mon);let n=0;
  for(let i=0;i<7;i++){const d=S.days[dateKey(addDays(mon,i))];if(d&&d.ms>0)n++}
  return {minutes:Math.round(s.min),daysPracticed:n,avgWpm:s.wpm==null?null:Math.round(s.wpm),accuracyPercent:s.acc==null?null:Math.round(s.acc*100),tests:s.tests,bestTestWpm:s.best?Math.round(s.best):null};
}
export function practiceMs7(){let ms=0;for(let i=0;i<7;i++){const r=S.days[dateKey(addDays(new Date(),-i))];if(r)ms+=r.ms}return ms}
/* the weekly switch / message UI lives in the view layer: it reads WK, coachOff, SAMPLE from this module */
export function syncWeeklyUI(){hooks.syncWeeklyUI()}
export async function weeklyRun(o?:any){
  const force=!!(o&&o.force);
  if(!SAMPLE||coachOff||WK.running||(!force&&!S.settings.weekly))return;
  const id=weekId();
  if((Array.isArray(COACH_RAW.lessons)?COACH_RAW.lessons:[]).some((l?:any)=>isObj(l)&&l.id===id)){
    if(force){WK.msg="Done. Find it in the Coach tab.";syncWeeklyUI()}
    return;
  }
  const today=dateKey();let tried="";
  try{tried=localStorage.getItem(WK_TRY)||""}catch(e){}
  if(!force&&tried===today)return;
  try{localStorage.setItem(WK_TRY,today)}catch(e){}
  if(!force&&practiceMs7()<300000)return;
  WK.running=true;WK.msg="Writing this week's lesson…";syncWeeklyUI();
  try{
    const allowed=allowedChars(),mon=mondayOf(new Date()),sum=buildSummary();
    sum.lastWeek=weekBrief(addDays(mon,-7));sum.thisWeekSoFar=weekBrief(mon);
    const prompt=buildPrompt(sum,allowed,"The note starts with a one-sentence recap of last week (time, speed, accuracy), then one piece of advice.");
    const data=await SAMPLE.json(prompt,{modelTier:"default",cache:false});
    const v=validateReply(data,allowed);if(!v)throw {code:"invalid_json"};
    const now=Date.now(),lesson={id,title:v.title,why:v.why,by:"app",created:now,steps:v.steps};
    await coachMutate((raw?:any)=>{
      const ls=(Array.isArray(raw.lessons)?raw.lessons:[]).filter((l?:any)=>!(isObj(l)&&typeof l.id==="string"&&l.id.indexOf("weekly-")===0));
      ls.unshift(lesson);raw.lessons=ls.slice(0,20);raw.note={text:v.note,at:now};return raw;
    });
    WK.msg="Done. Find it in the Coach tab.";
    hooks.toast({icon:'<span class="medal" style="--ac:var(--fg);width:36px;height:36px">'+aico("bolt",20)+'</span>',title:"This week's lesson is ready",sub:v.title});
  }catch(e:any){
    const code=e&&e.code;
    if(HIDE_CODES.includes(code)){coachOff=true;S.settings.weekly=false;settingChanged();WK.msg=WK_GONE}
    else WK.msg=force?(ASK_COPY[code]||"Something went wrong. Try again."):"";
  }
  WK.running=false;syncWeeklyUI();
}
/* automatic run: once per page load, after the account status, the sampler and the first coach snapshot are all in */
export function weeklyAuto(){
  if(WK.fired||!SAMPLE||!COACH_SNAP||saveStatus==="connecting")return;
  WK.fired=true;weeklyRun({});
}

/* ---- wiring and test helpers ---- */
export function setCoachOff(v: any) { coachOff = v; syncWeeklyUI(); }
/* register the core status hooks once at app start (legacy registered them at load): weekly coach auto run, silent achievement grant at load */
export function installCoreHooks() {
  statusHooks.push(() => weeklyAuto());
  statusHooks.push((s: any) => { if (achBootHook(s)) hooks.achBooted && hooks.achBooted(); });
}
/* back to a pristine module state (tests) */
export function resetSyncForTests() {
  saveStatus = "connecting"; acct = null; acctCs = null; writing = false; dirty = false; dirtyCs = false; retried = false; statusHooks.length = 0;
  ACCT = null; SAMPLE = null; COACH_RAW = {}; COACH = { note: null, lessons: [], dropped: 0 }; coachQ = Promise.resolve(); coachOff = false; COACH_SNAP = false;
  ASK = { running: false, ctl: null, err: "", ok: false }; WK.running = false; WK.fired = false; WK.msg = "";
  hasInjected = false; injected = undefined;
}
