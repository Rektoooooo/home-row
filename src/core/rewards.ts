/* REWARDS: level / XP, achievements, weekly stats.  Ported from legacy/src/app10.js. Toasts go through hooks.toast. */
import { LESSONS } from "./data";
import { S } from "./state";
import { own, save } from "./store";
import { hooks } from "./hooks";
import { lessonDone, strengthOf, dateKey, addDays, streak, minutesToday, MON, DOW } from "./stats";
import { POOL_NAME } from "./generate";

export const xpWords=()=>{let c=0;for(const k in S.days)c+=S.days[k].correct||0;return Math.floor(c/5)};
/* level n needs 300+150*(n-1) more words to reach n+1: totals 300, 750, 1350, 2100 … */
export function levelInfo(w?:any){
  if(w==null)w=xpWords();
  let level=1,base=0,need=300;
  while(w>=base+need){base+=need;level++;need=300+150*(level-1)}
  return {level,into:w-base,need,pct:Math.round((w-base)/need*100)};
}
export const FLAME_D="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z";
export const FLAME='<path d="'+FLAME_D+'"/>';
/* the header flame: filled warm gradient with an inner glow when today counts, a quiet outline when it does not yet */
export const flameSVG=(lit?:any)=>'<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">'+(lit?'<defs><linearGradient id="flg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFD66B"/><stop offset=".55" stop-color="#FF8A3D"/><stop offset="1" stop-color="#EE4B2B"/></linearGradient></defs>'+
  '<path d="'+FLAME_D+'" fill="url(#flg)"/><path d="M12 21.2a3.4 3.4 0 0 1-3.4-3.4c0-1.5 1-2.5 1.9-3.4.3 1.2 1 1.9 1.9 2.1.2-1.3 0-2.6-.5-3.6 2 1 3.4 2.9 3.4 4.9a3.4 3.4 0 0 1-3.3 3.4z" fill="#FFE7A1"/>'
  :'<path d="'+FLAME_D+'" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>')+'</svg>';
export const AIC:any={
  key:'<rect x="4.5" y="4" width="15" height="13.5" rx="4"/><path d="M8 20.5h8M9.5 10.8h5"/>',
  keys:'<rect x="2.5" y="8" width="5" height="8" rx="1.6"/><rect x="9.5" y="8" width="5" height="8" rx="1.6"/><rect x="16.5" y="8" width="5" height="8" rx="1.6"/>',
  flag:'<path d="M5 21V4M5 4h12l-2.5 4 2.5 4H5"/>',
  trophy:'<path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H4.5v1A3.5 3.5 0 0 0 8 10.5M16 6h3.5v1A3.5 3.5 0 0 1 16 10.5M12 13v4M8.5 20h7M10 17h4"/>',
  star:'<path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7z"/>',
  stars:'<path d="M10 6l2 4.2 4.5.5-3.4 3.1.9 4.5L10 16l-4 2.3.9-4.5L3.5 10.7 8 10.2z"/><path d="M19 3v4M17 5h4"/>',
  flame:FLAME,
  bolt:'<path d="M13 3L5.5 13.5h5.8L10.5 21 18.5 10h-5.8z"/>',
  target:'<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4"/><path d="M12 12h.01"/>',
  shield:'<path d="M12 3l7 3v5.5c0 4.2-2.8 7.6-7 9.5-4.2-1.9-7-5.3-7-9.5V6z"/><path d="M9 12l2.2 2.2L15.2 10"/>',
  rocket:'<path d="M12 3c3 2 5 5 5 9l-2 3H9l-2-3c0-4 2-7 5-9z"/><circle cx="12" cy="10" r="1.5"/><path d="M9 15l-2 4 3-1M15 15l2 4-3-1"/>',
  calendar:'<rect x="4" y="5" width="16" height="15" rx="3"/><path d="M4 10h16M9 3v4M15 3v4"/>',
  chevron:'<path d="M6 13l6-6 6 6M6 19l6-6 6 6"/>',
  page:'<path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4M10 12h5M10 16h5"/>',
  brackets:'<path d="M9 5H6v14h3M15 5h3v14h-3"/>'
};
export const aico=(k?:any,sz?:any)=>'<svg width="'+sz+'" height="'+sz+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+AIC[k]+'</svg>';
export const ACOL:any={lesson:"--f-index",streak:"--f-pinky",speed:"--f-ring",accuracy:"--f-middle",special:"--fg"};
export function longestRun(){
  const ks=Object.keys(S.days).filter(k=>S.days[k].ms>=60000).sort();let best=0,run=0,prev:any=null;
  ks.forEach(k=>{const d=new Date(k+"T00:00:00");run=prev&&Math.round(((d as any)-prev)/864e5)===1?run+1:1;prev=d;if(run>best)best=run});
  return best;
}
export const passedAll=(a?:any,b?:any)=>{for(let n=a;n<=b;n++)if(!lessonDone(n))return false;return true};
export const starsOn=(n?:any)=>(Object.values(S.lessons) as any[]).filter(l=>l.stars>=3).length>=n;
export const testOk=(w?:any)=>S.tests.some((t?:any)=>t.wpm>=w&&t.acc>=.9);
export const ACH=[
  {id:"first-lesson",title:"First lesson",desc:"Pass lesson 1",cat:"lesson",icon:"key",test:()=>lessonDone(1)},
  {id:"home-row",title:"Home row",desc:"Pass lessons 1 to 6",cat:"lesson",icon:"keys",test:()=>passedAll(1,6)},
  {id:"all-letters",title:"All letters",desc:"Pass lessons 1 to 17",cat:"lesson",icon:"flag",test:()=>passedAll(1,17)},
  {id:"course",title:"Course complete",desc:"Pass all "+LESSONS.length+" lessons",cat:"lesson",icon:"trophy",test:()=>passedAll(1,LESSONS.length)},
  {id:"three-stars",title:"Three stars",desc:"Get 3 stars on a lesson",cat:"lesson",icon:"star",test:()=>starsOn(1)},
  {id:"star-collector",title:"Star collector",desc:"Get 3 stars on 10 lessons",cat:"lesson",icon:"stars",test:()=>starsOn(10)},
  {id:"streak-3",title:"3-day streak",desc:"Practise 3 days in a row",cat:"streak",icon:"flame",test:()=>longestRun()>=3},
  {id:"streak-7",title:"7-day streak",desc:"Practise 7 days in a row",cat:"streak",icon:"flame",test:()=>longestRun()>=7},
  {id:"streak-30",title:"30-day streak",desc:"Practise 30 days in a row",cat:"streak",icon:"calendar",test:()=>longestRun()>=30},
  {id:"wpm-20",title:"20 WPM",desc:"A test at 20 WPM or more, with 90% accuracy or better",cat:"speed",icon:"bolt",test:()=>testOk(20)},
  {id:"wpm-30",title:"30 WPM",desc:"A test at 30 WPM or more, with 90% accuracy or better",cat:"speed",icon:"bolt",test:()=>testOk(30)},
  {id:"wpm-40",title:"40 WPM",desc:"A test at 40 WPM or more, with 90% accuracy or better",cat:"speed",icon:"rocket",test:()=>testOk(40)},
  {id:"wpm-60",title:"60 WPM",desc:"A test at 60 WPM or more, with 90% accuracy or better",cat:"speed",icon:"rocket",test:()=>testOk(60)},
  {id:"sharp",title:"Sharpshooter",desc:"A test of 30 s or longer with 98% accuracy or better",cat:"accuracy",icon:"target",test:()=>S.tests.some((t?:any)=>t.dur>=30&&t.acc>=.98)},
  {id:"home-strong",title:"Home row mastered",desc:"Make every home row key strong",cat:"accuracy",icon:"shield",test:()=>[..."asdfjkl;"].every(k=>{const v=strengthOf(S.keys[k]);return v!=null&&v>=1})},
  {id:"faster",title:"Faster than before",desc:"Beat your starting speed in a test, with 95% accuracy or better",cat:"speed",icon:"chevron",test:()=>!!S.baseline&&S.tests.some((t?:any)=>t.wpm>S.baseline.wpm&&t.acc>=.95)},
  {id:"goal-5",title:"Five good days",desc:"Reach your daily goal on 5 days",cat:"streak",icon:"calendar",test:()=>(Object.values(S.days) as any[]).filter(d=>d.ms>=S.settings.goal*60000).length>=5},
  {id:"level-5",title:"Level 5",desc:"Reach level 5",cat:"special",icon:"chevron",test:()=>levelInfo().level>=5},
  {id:"level-10",title:"Level 10",desc:"Reach level 10",cat:"special",icon:"chevron",test:()=>levelInfo().level>=10},
  {id:"first-text",title:"First real text",desc:"Finish a text in Practice",cat:"special",icon:"page",test:()=>S.modes.text>=1},
  {id:"first-code",title:"First code",desc:"Finish a code snippet in Practice",cat:"special",icon:"brackets",test:()=>S.modes.code>=1}
];
export const achBy=(id?:any):any=>ACH.find(a=>a.id===id);
export const medal=(a?:any,sz?:any,ic?:any)=>'<span class="medal" style="--ac:var('+ACOL[a.cat]+');width:'+sz+'px;height:'+sz+'px">'+aico(a.icon,ic)+'</span>';
export let LASTLV: any = null;
export function setLASTLV(v: any) { LASTLV = v; }
/* grants every newly met achievement; silent skips the celebration. Returns the new ids */
export function checkAchievements(o?: any) {
  const silent = !!(o && o.silent), now = Date.now(), got: any[] = [];
  ACH.forEach(a => {
    if (own(S.ach, a.id)) return;
    let ok = false; try { ok = !!a.test(); } catch (e) {}
    if (ok) { S.ach[a.id] = now; got.push(a.id); }
  });
  if (got.length) { save(); if (!silent) got.forEach(id => { const a = achBy(id); hooks.toast({ icon: medal(a, 36, 20), title: "Achievement unlocked", sub: a.title }); }); }
  return got;
}
/* set when a celebration (confetti) is due; viewHook in the UI reads it once after the next view is set (legacy: CEL) */
let CEL = 0;
export const markCelebrate = () => { CEL = Date.now(); };
export function takeCelebrate() { const fresh = CEL ? Date.now() - CEL < 4000 : false; CEL = 0; return fresh; }
/* one call after every finished exercise: celebrations for a level up and new badges, then confetti when asked */
export function liveCheck(conf?: any) {
  if (conf) markCelebrate();
  const lv = levelInfo().level, up = LASTLV != null && lv > LASTLV; LASTLV = lv;
  if (up) { const L = levelInfo(), left = L.need - L.into; hooks.toast({ icon: '<span class="medal" style="--ac:var(--fg);width:36px;height:36px">' + aico("chevron", 20) + '</span>', title: "Level " + lv, sub: "Keep going. Level " + (lv + 1) + " is " + left + " words away." }); }
  checkAchievements({ silent: false });
}
export function afterRemote() { LASTLV = levelInfo().level; checkAchievements({ silent: true }); }
/* status hook: the first time the save status leaves "connecting" every earned badge is granted silently (no toasts).
   Returns true when something was granted so the caller can re-render the Progress tab. */
let achBooted = false;
export function achBootHook(s: string) {
  if (s === "connecting" || achBooted) return false; achBooted = true;
  LASTLV = levelInfo().level;
  return checkAchievements({ silent: true }).length > 0;
}
export function resetRewardsForTests() { achBooted = false; LASTLV = null; CEL = 0; SHT = null; }
/* hooks from the lesson, custom lesson and test flows */
export function rewardsLesson(conf: any) { liveCheck(conf); }
export let SHT: any = null;
export function rewardsTest(res: any, dur: number, o: any, isBest: boolean) {
  SHT = { wpm: res.wpm, acc: res.acc, dur, pool: o.pool, ts: Date.now() };
  if (isBest) { markCelebrate(); hooks.toast({ icon: '<span class="medal" style="--ac:var(--f-ring);width:36px;height:36px">' + aico("bolt", 20) + '</span>', title: "New best · " + Math.round(res.wpm) + " WPM at " + dur + " s" }); }
  liveCheck(false);
}

/* ---- weekly recap ---- */
export const mondayOf=(d?:any)=>addDays(d,-((d.getDay()+6)%7));
export function weekStats(mon?:any){
  let ms=0,chars=0,pr=0,co=0;
  for(let i=0;i<7;i++){const d=S.days[dateKey(addDays(mon,i))];if(d){ms+=d.ms;chars+=d.chars;pr+=d.presses;co+=d.correct}}
  const t0=mon.getTime(),t1=addDays(mon,7).getTime(),ts=S.tests.filter((t?:any)=>t.ts>=t0&&t.ts<t1);
  return {ms,min:ms/60000,wpm:ms>0&&chars>0?chars/5/(ms/60000):null,acc:pr>0?co/pr:null,tests:ts.length,best:ts.reduce((m?:any,t?:any)=>Math.max(m,t.wpm),0),has:ms>0||ts.length>0};
}
export function fmtMin(m?:any){
  const r=Math.round(m);if(m>0&&r<1)return "<1 min";
  return r>=60?Math.floor(r/60)+" h"+(r%60?" "+r%60+" min":""):r+" min";
}
export function weekTitle(mon?:any){
  const sun=addDays(mon,6),a=DOW[mon.getDay()]+" "+mon.getDate(),b=DOW[sun.getDay()]+" "+sun.getDate()+" "+MON[sun.getMonth()];
  return mon.getMonth()===sun.getMonth()?a+" – "+b:a+" "+MON[mon.getMonth()]+" – "+b;
}
