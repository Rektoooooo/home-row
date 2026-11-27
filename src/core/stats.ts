/* STATS: scoring and derived numbers.  Ported from legacy/src/app1.js, app2.js, app5.js, app5b.js, app7.js. */
import { LESSONS, BG, charInfo, LAY, isLetter, CO } from "./data";
import { S, SC, C } from "./state";
import { t, pct as pctI, dayLabel, speed, meetsSpeed } from "@/i18n";

export const pctTxt=(a?:any)=>{const v=Math.floor(a*1000+1e-6)/10;return pctI((Number.isInteger(v)?v:v.toFixed(1))+"%")};
export function wpmCalc(chars?:any,ms?:any){return ms>0?(chars/5)/(ms/60000):0}
export function strengthOf(st?:any,minN?:any):any{
  if(!st||st.n<(minN||8))return null;
  const tms=60000/(S.settings.target*5);
  const speed=st.timeEma?tms/st.timeEma:.3,acc=(1-st.errEma)/.95;
  return Math.min(1.5,speed,acc);
}
export const usefulPair=(p?:any)=>CO.pairRe.test(p)&&((BG[p[0]]||{})[p[1]]||0)>=3;
export const weakW=(ch?:any)=>{const sv=strengthOf(C().keys[ch]);return sv==null?.8:Math.max(.1,1.6-sv)};
export const dateKey=(d?:any)=>{d=d||new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")};
export function addDay(ms?:any,chars?:any,presses?:any,correct?:any){
  const k=dateKey(),d=S.days[k]||(S.days[k]={ms:0,chars:0,presses:0,correct:0,ex:0,t:0});
  d.ms+=ms;d.chars+=chars;d.presses+=presses;d.correct+=correct;d.ex+=1;d.t=Date.now();
  const ks=Object.keys(S.days).sort();ks.slice(0,Math.max(0,ks.length-400)).forEach(x=>delete S.days[x]);
}
export function applyKeyEvents(evs?:any){
  evs.forEach((e?:any)=>{
    if(e.c==="\n")return;/* code rounds: Enter is timed for flow only, never a stat key */
    const keys=[e.c.toLowerCase()];if(e.c!==e.c.toLowerCase())keys.push("shift");
    keys.forEach(k=>{const st=C().keys[k]||(C().keys[k]={n:0,errEma:.05});
      st.n+=1;st.errEma=st.errEma*.95+(e.miss?1:0)*.05;
      if(e.dt!=null&&!e.miss)st.timeEma=st.timeEma?st.timeEma*.9+e.dt*.1:e.dt});
  });
  C().keysAt=Date.now();
  evs.forEach((e?:any)=>{
    if(!e.pc)return;const a=e.pc.toLowerCase(),b=e.c.toLowerCase();
    if(!isLetter(a)||!isLetter(b))return;
    const k=a+b,st=C().pairs[k]||(C().pairs[k]={n:0,errEma:.05}),miss=e.miss||e.pmiss;
    st.n+=1;st.errEma=st.errEma*.95+(miss?1:0)*.05;
    if(!miss&&e.dt!=null)st.timeEma=st.timeEma?st.timeEma*.9+e.dt*.1:e.dt;
  });
  const pk=Object.keys(C().pairs);
  if(pk.length>300){pk.sort((x,y)=>C().pairs[x].n-C().pairs[y].n).slice(0,pk.length-300).forEach(k=>delete C().pairs[k])}
  C().pairsAt=Date.now();
}
export const minutesToday=()=>{const d=S.days[dateKey()];return d?d.ms/60000:0};
export function streak(){
  let n=0;const d=new Date();
  if(!(S.days[dateKey(d)]&&S.days[dateKey(d)].ms>=60000))d.setDate(d.getDate()-1);
  while(S.days[dateKey(d)]&&S.days[dateKey(d)].ms>=60000){n++;d.setDate(d.getDate()-1)}
  return n;
}
export const lessonDone=(n?:any)=>!!(C().lessons[n]&&C().lessons[n].done);
export const unlocked=(n?:any)=>n===1||S.settings.unlockAll||lessonDone(n-1);
export function nextLessonN(){for(let n=1;n<=LESSONS.length;n++)if(!lessonDone(n)&&unlocked(n))return n;return 0}
export function learnedChars(){const set=new Set<any>();LESSONS.forEach(L=>{if(lessonDone(L.n))L.keys.forEach((k?:any)=>set.add(k))});return set}
export function weakestKey(){
  const learned=learnedChars();let best=null,bv=9;
  learned.forEach(k=>{const sv=strengthOf(C().keys[k.toLowerCase()]);if(sv!=null&&sv<bv){bv=sv;best=k}});
  return best;
}
export const keyWpm=(st?:any)=>st&&st.timeEma?Math.round(12000/st.timeEma):null;
export const keyAcc=(st?:any)=>st&&st.n>0?Math.round((1-st.errEma)*100):null;
export const MON=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],DOW=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
export const dLabel=(d?:any)=>dayLabel(d);
export const dayWpm=(d?:any)=>d&&d.ms>=60000?d.chars/5/(d.ms/60000):null;
export const addDays=(d?:any,n?:any)=>{const x=new Date(d.getFullYear(),d.getMonth(),d.getDate());x.setDate(x.getDate()+n);return x};
export function heatMap(HEAT="speed"){
  const m:any={};
  LAY().keys.forEach((k:any)=>{
    if(!k.base||k.space||k.nochar)return;
    const st=C().keys[k.base];if(!st||st.n<8)return;
    if(HEAT==="speed"){const sv=strengthOf(st);if(sv==null)return;const pct=10+75*Math.min(sv,1);m[k.id]={pct,label:String(speed(keyWpm(st)||0)),hot:pct>=50}}
    else{const a=1-st.errEma,pct=10+75*Math.max(0,Math.min(1,(a-.85)/.15));m[k.id]={pct,label:pctI(Math.round(a*100)+"%"),hot:pct>=50}}
  });
  return m;
}
/* the step label for the UI (buildSteps keeps the English labels for ids and tests) */
export function stepLabel(s:any){
  switch(s.id){case "warm":return t("step|Warm-up");case "lesson":return t("step|Lesson");case "extra":return t("step|Practice round");case "practice":return t("step|Practice");case "test":return t("step|Test");case "review":return t("step|Review")}
  return s.label;
}
export function buildSteps(){
  const nx=nextLessonN(),steps=[];
  if(poolLetters().length)steps.push({id:"warm",label:"Warm-up",rounds:1});
  steps.push(nx?{id:"lesson",label:"Lesson",n:nx}:{id:"extra",label:"Practice round",rounds:1});
  steps.push({id:"practice",label:"Practice",rounds:2});
  steps.push(lessonDone(CO.allN)||S.settings.unlockAll?{id:"test",label:"Test"}:{id:"review",label:"Review",rounds:1});
  return steps;
}
export const sumRes=(a?:any)=>{const t=a.reduce((x?:any,r?:any)=>({ms:x.ms+r.ms,chars:x.chars+r.chars,presses:x.presses+r.presses,correct:x.correct+r.correct}),{ms:0,chars:0,presses:0,correct:0});
  return {wpm:wpmCalc(t.chars,t.ms),acc:t.presses?t.correct/t.presses:1,ms:t.ms,chars:t.chars,presses:t.presses,correct:t.correct}};
export function poolLetters(){
  const out:any[]=[];LESSONS.forEach(L=>{if(S.settings.unlockAll||lessonDone(L.n))L.keys.forEach((k?:any)=>{if(isLetter(k)&&!out.includes(k))out.push(k)})});
  return out;
}

/* ---- result scoring (pure parts of showResults / customResults / testDone) ---- */
/* LEARN-12 / LEARN-13: pass is acc >= .95 exactly; stars 1 (pass), 2 (wpm >= target), 3 (acc >= .98 and wpm >= target + 5). `target` is the lesson's wpm (or the setting for custom lessons). */
export function scoreRun(agg: any, target: number) {
  const wpm = wpmCalc(agg.chars, agg.ms), acc = agg.presses ? agg.correct / agg.presses : 1, passed = acc >= .95;
  let stars = 0; if (passed) { stars = 1; if (meetsSpeed(wpm, target)) stars = 2; if (acc >= .98 && meetsSpeed(wpm, target + 5)) stars = 3; }
  return { wpm, acc, passed, stars };
}
/* records a finished lesson into S (as showResults does). Returns what the result screen and rewardsLesson need. */
export function applyLessonResult(n: number, agg: any) {
  const L = LESSONS[n - 1], sc = scoreRun(agg, L.wpm), { wpm, acc, passed, stars } = sc;
  const r = C().lessons[n] || (C().lessons[n] = { done: false, stars: 0, wpm: 0, acc: 0, attempts: 0, last: 0 });
  const wasDone = r.done, prevStars = r.stars;
  r.attempts++; r.last = Date.now(); if (passed) r.done = true; r.stars = Math.max(r.stars, stars); r.wpm = Math.max(r.wpm, wpm); r.acc = Math.max(r.acc, acc);
  C().bests.lessonWpm = Math.max(C().bests.lessonWpm, wpm);
  return { ...sc, wasDone, prevStars, celebrate: passed && (!wasDone || stars > prevStars) };
}
/* a custom (Claude) lesson: the target is the target-speed setting; keeps at most 100 results */
export function applyCustomResult(id: string, agg: any) {
  const target = S.settings.target, sc = scoreRun(agg, target), { wpm, acc, passed, stars } = sc;
  const r = C().custom[id] || (C().custom[id] = { wpm: 0, acc: 0, stars: 0, attempts: 0, last: 0 });
  const prevStars = r.stars;
  r.attempts++; r.last = Date.now(); r.stars = Math.max(r.stars, stars); r.wpm = Math.max(r.wpm, wpm); r.acc = Math.max(r.acc, acc);
  const ids = Object.keys(C().custom); if (ids.length > 100) ids.sort((x, y) => C().custom[x].last - C().custom[y].last).slice(0, ids.length - 100).forEach(k => delete C().custom[k]);
  return { ...sc, prevStars, celebrate: passed && stars > prevStars };
}
/* a finished timed test: appends to C().tests (last 100) and updates the best. Returns isBest (testDone) */
export function applyTestResult(res: any, dur: number, o: any) {
  const key = "test" + dur, isBest = res.wpm > (C().bests[key] || 0);
  C().tests.push({ ts: Date.now(), dur, pool: o.pool, opts: (o.caps ? "c" : "") + (o.punct ? "p" : "") + (o.nums ? "n" : ""), wpm: Math.round(res.wpm * 10) / 10, raw: Math.round(res.raw * 10) / 10, acc: res.acc });
  C().tests = C().tests.slice(-100); if (isBest) C().bests[key] = res.wpm;
  return isBest;
}

/* welcome: anyone with any progress never gets the first-run flow (legacy wlHasProgress) */
/* progress in either course counts (S holds the English course and the shared days, SC the Czech course) */
const courseProgress = (o: any) => Object.values(o.lessons).some((l: any) => l.attempts > 0) || o.tests.length > 0 || !!o.baseline;
export const hasProgress = () => courseProgress(S) || Object.keys(S.days).length > 0 || courseProgress(SC);
