
/* ============================ COACH + CUSTOM LESSONS (part E) ============================ */
/* All coach text is untrusted data: it only ever reaches the page through esc() or textContent. */
const COACH_LS="homerow.coach",COACH_PATH=id=>"data/users/"+id+"/coach";
const ARTIFACT_URL="https://claude.ai/artifact/PXFc3xE9zfiTUu6bmdxXgM";
const SHARE_PROMPT="Check my Home Row typing progress and make me 2 custom lessons: "+ARTIFACT_URL;
let ACCT=null,SAMPLE=null,COACH_RAW={},COACH={note:null,lessons:[],dropped:0},coachQ=Promise.resolve(),coachOff=false,RM_ID="",COACH_SNAP=false;
let ASK={running:false,ctl:null,err:"",ok:false};
const ID_RE=/^[A-Za-z0-9_-]{1,40}$/;
const clone=o=>JSON.parse(JSON.stringify(o));

/* one lesson: returns a clean lesson or null. allowed (a Set of chars) is only used for replies from the sampler. */
function cleanLesson(l,allowed){
  if(!isObj(l)||typeof l.id!=="string"||!ID_RE.test(l.id))return null;
  const title=typeof l.title==="string"?l.title.trim():"";
  if(title.length<1||title.length>60)return null;
  const why=l.why==null?"":l.why;if(typeof why!=="string"||why.length>200)return null;
  if(!Array.isArray(l.steps)||l.steps.length<1||l.steps.length>4)return null;
  const steps=[];
  for(let i=0;i<l.steps.length;i++){
    const s=l.steps[i];if(!isObj(s)||typeof s.text!=="string")return null;
    let name=typeof s.name==="string"?s.name.trim():"";if(name.length>30)return null;if(!name)name="Step "+(i+1);
    const text=s.text.replace(/\s+/g," ").trim();
    if(text.length<10||text.length>400||BADDEAD.test(text))return null;
    for(const ch of text){if(!charInfo(ch)||(allowed&&ch!==" "&&!allowed.has(ch)))return null}
    steps.push({name,text});
  }
  return {id:l.id,title,why,by:l.by==="app"?"app":"chat",created:fin(l.created)?l.created:0,steps};
}
function sanitizeCoach(o){
  const out={note:null,lessons:[],dropped:0};
  if(!isObj(o))return out;
  if(isObj(o.note)&&typeof o.note.text==="string"&&o.note.text.trim())out.note={text:o.note.text.trim().slice(0,600),at:fin(o.note.at)?o.note.at:0};
  const seen=new Set();
  (Array.isArray(o.lessons)?o.lessons:[]).slice(0,40).forEach(l=>{
    const c=cleanLesson(l);
    if(!c||seen.has(c.id)){out.dropped++;return}
    if(out.lessons.length>=20){out.dropped++;return}
    seen.add(c.id);out.lessons.push(c);
  });
  return out;
}
function loadCoach(){try{const raw=localStorage.getItem(COACH_LS);if(raw){COACH_RAW=JSON.parse(raw)||{};COACH=sanitizeCoach(COACH_RAW)}}catch(e){}}
function rerenderCoach(){if(TAB==="coach"&&UI.kind==="coach"&&!EX){const y=scrollY;renderTab();scrollTo(0,y)}}
function applyCoachRaw(raw,quiet){
  COACH_RAW=isObj(raw)?raw:{};COACH=sanitizeCoach(COACH_RAW);
  try{localStorage.setItem(COACH_LS,JSON.stringify(COACH_RAW))}catch(e){}
  if(!quiet)rerenderCoach();
}
async function coachConnect(){
  const db=ACCT&&ACCT.db;if(!db)return;
  try{
    db.doc(COACH_PATH(ACCT.id)).onSnapshot(snap=>{
      try{applyCoachRaw(snap&&snap.exists?snap.data():{})}catch(e){}
      COACH_SNAP=true;weeklyAuto();
    },()=>{});
  }catch(e){}
  try{SAMPLE=await Promise.race([window.claude.use("sample"),new Promise(r=>setTimeout(()=>r(null),10000))])||null}catch(e){SAMPLE=null}
  rerenderCoach();weeklyAuto();syncWeeklyUI();
}
/* one write at a time; always get() a fresh copy and change it by id so chat-made lessons are never overwritten */
function coachMutate(fn){
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
const coachAdd=(lesson,note)=>coachMutate(raw=>{
  const ls=(Array.isArray(raw.lessons)?raw.lessons:[]).filter(l=>!(isObj(l)&&l.id===lesson.id));
  ls.unshift(lesson);raw.lessons=ls.slice(0,20);if(note)raw.note=note;return raw;
});
const coachRemove=id=>coachMutate(raw=>{raw.lessons=(Array.isArray(raw.lessons)?raw.lessons:[]).filter(l=>!(isObj(l)&&l.id===id));return raw});

/* ---- the sampler ---- */
function allowedChars(){
  const set=new Set();
  LESSONS.forEach(L=>{if(lessonDone(L.n))L.keys.forEach(k=>set.add(k))});
  if(lessonDone(19))[...set].filter(isLetter).forEach(c=>set.add(c.toUpperCase()));
  return set;
}
function buildSummary(){
  const keys=Object.keys(S.keys).filter(k=>k!=="shift"&&S.keys[k].n>=8&&strengthOf(S.keys[k])!=null)
    .sort((a,b)=>strengthOf(S.keys[a])-strengthOf(S.keys[b])).slice(0,6)
    .map(k=>({key:k,wpm:keyWpm(S.keys[k])||0,accuracy:keyAcc(S.keys[k]),presses:S.keys[k].n}));
  const days=[];for(let i=6;i>=0;i--){const d=addDays(new Date(),-i),r=S.days[dateKey(d)];days.push({date:dateKey(d),minutes:r?Math.round(r.ms/6000)/10:0,wpm:r&&r.ms>=60000?Math.round(r.chars/5/(r.ms/60000)):0})}
  return {targetWpm:S.settings.target,lessonsPassed:LESSONS.filter(l=>lessonDone(l.n)).length,nextLesson:nextLessonN(),
    learnedKeys:[...learnedChars()].join(""),weakestKeys:keys,
    slowestPairs:slowPairs(6).map(x=>({pair:x.p,wpm:keyWpm(x.st)||0,accuracy:keyAcc(x.st)})),last7Days:days,
    recentTests:S.tests.slice(-3).reverse().map(t=>({seconds:t.dur,wpm:Math.round(t.wpm),accuracy:Math.round(t.acc*100)})),
    capitals:lessonDone(19),punctuation:lessonDone(20),numbers:lessonDone(21)||lessonDone(22)};
}
function buildPrompt(sum,allowed,extra){
  return "You are a touch-typing coach inside a typing trainer. Write ONE custom practice lesson for this learner and a short tip.\n\nLearner data (JSON):\n"+JSON.stringify(sum)+"\n\nRules:\n"+
  "- Use ONLY these characters: "+[...allowed].join("")+" plus the space bar.\n"+
  "- 3 steps. Step 1, 40-80 characters: a drill that isolates the weakest keys and letter pairs.\n  Steps 2 and 3, 80-200 characters each: real, common English words and short phrases dense in those keys and pairs.\n  No names, no profanity.\n"+
  "- Never put ' \" ` ~ or ^ directly before a vowel, c, n or y. Single spaces only. No line breaks.\n"+
  "- title: at most 40 characters. why: one sentence to the learner (\"you\"), at most 140 characters.\n"+
  "- note: 1-2 sentences of specific advice from the data, at most 300 characters.\n"+(extra?"- "+extra+"\n":"")+"\n"+
  "Reply with only JSON in exactly this shape:\n"+
  '{"note":"...","lesson":{"title":"...","why":"...","steps":[{"name":"...","text":"..."},{"name":"...","text":"..."},{"name":"...","text":"..."}]}}';
}
/* returns {note,title,why,steps} or null */
function validateReply(d,allowed){
  if(!isObj(d)||!isObj(d.lesson)||typeof d.note!=="string"||!d.note.trim())return null;
  const l=d.lesson;if(!Array.isArray(l.steps)||l.steps.length!==3)return null;
  const c=cleanLesson({id:"x",title:l.title,why:l.why,steps:l.steps},allowed);
  if(!c||c.title.length>40||c.why.length>140)return null;
  return {note:d.note.trim().slice(0,300),title:c.title,why:c.why,steps:c.steps};
}
const ASK_COPY={rate_limited:"Claude is busy or you've reached a usage limit. Try again later.",invalid_json:"Claude's answer couldn't be used. Try again."};
const HIDE_CODES=["not_granted","sampling_disabled","not_declared","capability_disabled","capability_removed"];
async function askClaude(){
  if(ASK.running||!SAMPLE||coachOff)return;
  const ctl=new AbortController();ASK={running:true,ctl,err:"",ok:false};rerenderCoach();
  try{
    const allowed=allowedChars(),data=await SAMPLE.json(buildPrompt(buildSummary(),allowed),{signal:ctl.signal,modelTier:"default",cache:false});
    const v=validateReply(data,allowed);if(!v)throw {code:"invalid_json"};
    const now=Date.now(),lesson={id:"app-"+now.toString(36),title:v.title,why:v.why,by:"app",created:now,steps:v.steps};
    await coachAdd(lesson,{text:v.note,at:now});
    ASK={running:false,ctl:null,err:"",ok:true};
  }catch(e){
    const code=e&&e.code;
    if(HIDE_CODES.includes(code))coachOff=true;
    ASK={running:false,ctl:null,ok:false,err:code==="cancelled"?"":(ASK_COPY[code]||"Something went wrong. Try again.")};
  }
  rerenderCoach();
}
