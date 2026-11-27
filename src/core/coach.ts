/* COACH: prompt building, reply validation, paste-in JSON finding and import.  Ported from legacy/src/app8.js and app8b.js.
   All coach text is untrusted data: it only ever reaches the page through esc() or textContent. */
import { EN_BADDEAD, LESSONS, isLetter, CO, typableIn } from "./data";
import { LANG } from "@/i18n";
import { isObj, fin, C } from "./store";
import { S } from "./state";
import { strengthOf, keyWpm, keyAcc, lessonDone, nextLessonN, learnedChars, addDays, dateKey } from "./stats";
import { slowPairs } from "./generate";
import { t } from "@/i18n";

export const COACH_LS="homerow.coach",COACH_PATH=(id?:any)=>"data/users/"+id+"/coach";
export const ARTIFACT_URL="https://claude.ai/artifact/PXFc3xE9zfiTUu6bmdxXgM";
export const SHARE_PROMPT="Check my Home Row typing progress and make me 2 custom lessons: "+ARTIFACT_URL;
/* the Czech course: its progress is the progress-cs doc, and its lessons are Czech and tagged "course":"cs" */
export const SHARE_PROMPT_CS="Check my Home Row typing progress in the Czech course (the progress-cs doc, Czech keyboard) and make me 2 custom lessons with common Czech words, each with \"course\":\"cs\": "+ARTIFACT_URL;
export const sharePrompt=()=>CO.id==="cs"?SHARE_PROMPT_CS:SHARE_PROMPT;
export const ID_RE=/^[A-Za-z0-9_-]{1,40}$/;
export const clone=(o?:any)=>JSON.parse(JSON.stringify(o));
/* l.course: "cs" for a Czech-course lesson (checked on the Czech keyboard); anything else is an English-course lesson */
export function cleanLesson(l?:any,allowed?:any){
  if(!isObj(l)||typeof l.id!=="string"||!ID_RE.test(l.id))return null;
  /* untagged lessons with Czech letters (written by Claude in a chat) belong to the Czech course */
  const course=l.course==="cs"||(l.course!=="en"&&Array.isArray(l.steps)&&l.steps.some((s:any)=>isObj(s)&&typeof s.text==="string"&&/[ěščřžůďťňĚŠČŘŽŮĎŤŇ]/.test(s.text)))?"cs":"en";
  const title=typeof l.title==="string"?l.title.trim():"";
  if(title.length<1||title.length>60)return null;
  const why=l.why==null?"":l.why;if(typeof why!=="string"||why.length>200)return null;
  if(!Array.isArray(l.steps)||l.steps.length<1||l.steps.length>4)return null;
  const steps=[];
  for(let i=0;i<l.steps.length;i++){
    const s=l.steps[i];if(!isObj(s)||typeof s.text!=="string")return null;
    let name=typeof s.name==="string"?s.name.trim():"";if(name.length>30)return null;if(!name)name="Step "+(i+1);
    const text=s.text.replace(/\s+/g," ").trim();
    if(text.length<10||text.length>400||(course==="en"&&EN_BADDEAD.test(text)))return null;
    for(const ch of text){if(!typableIn(course,ch)||(allowed&&ch!==" "&&!allowed.has(ch)))return null}
    steps.push({name,text});
  }
  return Object.assign({id:l.id,title,why,by:l.by==="app"?"app":"chat",created:fin(l.created)?l.created:0,steps},course==="cs"?{course:"cs"}:{});
}
/* the coach lessons of the active course (untagged ones belong to the English course) */
export const courseOf=(l?:any)=>l&&l.course==="cs"?"cs":"en";
export const courseTag=()=>CO.id==="cs"?{course:"cs"}:{};
export function sanitizeCoach(o?:any){
  const out:any={note:null,lessons:[],dropped:0};
  if(!isObj(o))return out;
  if(isObj(o.note)&&typeof o.note.text==="string"&&o.note.text.trim())out.note={text:o.note.text.trim().slice(0,600),at:fin(o.note.at)?o.note.at:0};
  const seen=new Set();
  (Array.isArray(o.lessons)?o.lessons:[]).slice(0,40).forEach((l?:any)=>{
    const c=cleanLesson(l);
    if(!c||seen.has(c.id)){out.dropped++;return}
    if(out.lessons.length>=20){out.dropped++;return}
    seen.add(c.id);out.lessons.push(c);
  });
  return out;
}
export function allowedChars(){
  const set:Set<any>=new Set();
  LESSONS.forEach(L=>{if(lessonDone(L.n))L.keys.forEach((k?:any)=>set.add(k))});
  if(lessonDone(CO.capsN))[...set].filter(isLetter).forEach(c=>set.add(c.toUpperCase()));
  return set;
}
export function buildSummary():any{
  const keys=Object.keys(C().keys).filter(k=>k!=="shift"&&C().keys[k].n>=8&&strengthOf(C().keys[k])!=null)
    .sort((a,b)=>strengthOf(C().keys[a])-strengthOf(C().keys[b])).slice(0,6)
    .map(k=>({key:k,wpm:keyWpm(C().keys[k])||0,accuracy:keyAcc(C().keys[k]),presses:C().keys[k].n}));
  const days=[];for(let i=6;i>=0;i--){const d=addDays(new Date(),-i),r=S.days[dateKey(d)];days.push({date:dateKey(d),minutes:r?Math.round(r.ms/6000)/10:0,wpm:r&&r.ms>=60000?Math.round(r.chars/5/(r.ms/60000)):0})}
  return {targetWpm:S.settings.target,lessonsPassed:LESSONS.filter(l=>lessonDone(l.n)).length,nextLesson:nextLessonN(),
    learnedKeys:[...learnedChars()].join(""),weakestKeys:keys,
    slowestPairs:slowPairs(6).map(x=>({pair:x.p,wpm:keyWpm(x.st)||0,accuracy:keyAcc(x.st)})),last7Days:days,
    recentTests:C().tests.slice(-3).reverse().map((t?:any)=>({seconds:t.dur,wpm:Math.round(t.wpm),accuracy:Math.round(t.acc*100)})),
    capitals:lessonDone(CO.capsN),punctuation:lessonDone(CO.punctN),numbers:CO.numN.some(lessonDone)};
}
/* course and language lines of the prompts (the English course in English reads exactly as before) */
const csKb=()=>"Czech "+(CO.layout||"QWERTZ");
const wordsKind=()=>CO.id==="cs"?"Czech words (with correct diacritics)":"English words";
const deadRule=()=>CO.id==="en"?" Never put ' \" ` ~ or ^ directly before a vowel, c, n or y.":"";
const langLines=()=>(CO.id==="cs"?"- The learner takes the Czech course on a "+csKb()+" keyboard.\n":"")+(LANG==="cs"?"- Write the title, why, step names and note in Czech.\n":"");
export function buildPrompt(sum?:any,allowed?:any,extra?:any){
  return "You are a touch-typing coach inside a typing trainer. Write ONE custom practice lesson for this learner and a short tip.\n\nLearner data (JSON):\n"+JSON.stringify(sum)+"\n\nRules:\n"+
  "- Use ONLY these characters: "+[...allowed].join("")+" plus the space bar.\n"+
  "- 3 steps. Step 1, 40-80 characters: a drill that isolates the weakest keys and letter pairs.\n  Steps 2 and 3, 80-200 characters each: real, common "+wordsKind()+" and short phrases dense in those keys and pairs.\n  No names, no profanity.\n"+
  (CO.id==="en"?"- Never put ' \" ` ~ or ^ directly before a vowel, c, n or y. Single spaces only. No line breaks.\n":"- Single spaces only. No line breaks.\n")+langLines()+
  "- title: at most 40 characters. why: one sentence to the learner (\"you\"), at most 140 characters.\n"+
  "- note: 1-2 sentences of specific advice from the data, at most 300 characters.\n"+(extra?"- "+extra+"\n":"")+"\n"+
  "Reply with only JSON in exactly this shape:\n"+
  '{"note":"...","lesson":{"title":"...","why":"...","steps":[{"name":"...","text":"..."},{"name":"...","text":"..."},{"name":"...","text":"..."}]}}';
}
/* returns {note,title,why,steps} or null */
export function validateReply(d?:any,allowed?:any){
  if(!isObj(d)||!isObj(d.lesson)||typeof d.note!=="string"||!d.note.trim())return null;
  const l=d.lesson;if(!Array.isArray(l.steps)||l.steps.length!==3)return null;
  const c=cleanLesson(Object.assign({id:"x",title:l.title,why:l.why,steps:l.steps},courseTag()),allowed);
  if(!c||c.title.length>40||c.why.length>140)return null;
  return {note:d.note.trim().slice(0,300),title:c.title,why:c.why,steps:c.steps};
}
export const ASK_COPY:any={rate_limited:"Claude is busy or you've reached a usage limit. Try again later.",invalid_json:"Claude's answer couldn't be used. Try again."};
/* the message for an error code, translated (ASK_COPY keeps the English text) */
export const askErr=(code?:any)=>code==="rate_limited"?t("Claude is busy or you've reached a usage limit. Try again later."):code==="invalid_json"?t("Claude's answer couldn't be used. Try again."):t("Something went wrong. Try again.");
export const HIDE_CODES=["not_granted","sampling_disabled","not_declared","capability_disabled","capability_removed"];
/* the end of the JSON object that starts at st, or -1 (skips braces inside strings) */
export function braceEnd(t?:any,st?:any){
  let d=0,inS=false,bs=false;
  for(let k=st;k<t.length;k++){
    const c=t[k];
    if(inS){if(bs)bs=false;else if(c==="\\")bs=true;else if(c==='"')inS=false;continue}
    if(c==='"')inS=true;else if(c==="{")d++;else if(c==="}"&&--d===0)return k;
  }
  return -1;
}
/* finds {"homerow":1,...} (or any object with "lessons") in a pasted chat reply */
export function findLessonJSON(t?:any){
  for(const mark of ['"homerow"','"lessons"']){
    for(let i=t.indexOf(mark);i>=0;i=t.indexOf(mark,i+1)){
      const st=t.lastIndexOf("{",i);if(st<0)continue;
      const end=braceEnd(t,st);if(end<0)continue;
      try{const o=JSON.parse(t.slice(st,end+1));if(isObj(o)&&Array.isArray(o.lessons))return o}catch(e){}
    }
  }
  return null;
}
export function hash36(s?:any){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0).toString(36)}
/* checks every lesson like a chat-made one; the same lesson pasted twice keeps one copy */
export function importLessons(text?:any){
  const o=findLessonJSON(String(text||""));
  if(!o)return null;
  const now=Date.now(),added:any[]=[];let bad=0;
  o.lessons.slice(0,6).forEach((l?:any,i?:any)=>{
    if(!isObj(l)){bad++;return}
    const steps=Array.isArray(l.steps)?l.steps:[];
    const c=cleanLesson(Object.assign({id:"chat-"+hash36(JSON.stringify([l.title,steps.map((s?:any)=>isObj(s)?s.text:"")])),title:l.title,why:l.why,by:"chat",created:now-i,steps},courseTag()));
    if(c&&!added.some(a=>a.id===c.id))added.push(c);else if(!c)bad++;
  });
  const note=typeof o.note==="string"&&o.note.trim()?{text:o.note.trim().slice(0,600),at:now}:null;
  return {added,bad,note};
}
/* website: Claude can't reach the app, so the copied text asks for the lessons as one JSON block the learner pastes back */
export function coachAsk(){
  let allowed=[...allowedChars()];if(!allowed.length)allowed=[...LESSONS[0].keys];
  return "I'm learning to touch type with Home Row. Here is my progress. Tell me in 2 or 3 sentences what to work on, then write me 2 short practice lessons for my weakest keys and letter pairs.\n\n"+
  "My progress (JSON):\n"+JSON.stringify(buildSummary())+"\n\nRules for the lessons:\n"+
  "- Use only these characters: "+allowed.join("")+" and the space bar.\n"+
  "- 3 steps per lesson. Step 1, 40-80 characters: a drill on my weakest keys and pairs. Steps 2 and 3, 80-200 characters each: real, common "+wordsKind()+" and short phrases full of those keys. No names.\n"+
  "- Single spaces, no line breaks."+deadRule()+"\n"+(CO.id==="cs"?"- I'm taking the Czech course on a "+csKb()+" keyboard.\n":"")+(LANG==="cs"?"- Answer in Czech, and write the title, why, step names and note in Czech.\n":"")+
  "- title: up to 40 characters. why: one sentence to me, up to 140 characters. note: your advice, up to 300 characters.\n\n"+
  "End your reply with one code block that holds only this JSON, so I can paste it into the app:\n"+
  '{"homerow":1,"note":"...","lessons":[{"title":"...","why":"...","steps":[{"name":"...","text":"..."},{"name":"...","text":"..."},{"name":"...","text":"..."}]}]}';
}
