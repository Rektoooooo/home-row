/* GENERATE: lesson text, review, capitals/punctuation/numbers, practice rounds, test text, real text / code / your-text helpers.
   Ported line for line from legacy/src/app1.js, app5.js, app11.js so the order of Math.random calls is identical. */
import { TEXTS, SNIPPETS } from "./texts";
import { CS_TEXTS } from "./cs/texts";
import { CS_SENT, CS_UNITS } from "./cs/extra";
import { WL, EN_WL, BADDEAD, BLOCK, BG, LESSONS, STEP_NAMES, isLetter, rnd, pick, pickF, cap, wpick, FING, charInfo, homeCh, NB, CO } from "./data";
import { S, C } from "./state";
import { own } from "./store";
import { strengthOf, weakW, lessonDone, poolLetters, usefulPair, keyWpm } from "./stats";
import { t, tn, finger, speed, speedUnit } from "@/i18n";

export function pseudoOnce(al?:any,min?:any,max?:any){
  let s="",p="^";
  for(;;){
    if(s.length>=max)break;
    const row=BG[p]||{};let tot=0;const opts=[];
    for(const c of al){if(s.length>=2&&s[s.length-1]===c&&s[s.length-2]===c)continue;const w=(row[c]||0)+.5;opts.push([c,w]);tot+=w}
    if(s.length>=min){const w=.5+.3*Math.sqrt(row.$||0);opts.push(["$",w]);tot+=w}
    let r=Math.random()*tot,ch=opts[opts.length-1][0];
    for(const [c,w] of opts){r-=w;if(r<=0){ch=c;break}}
    if(ch==="$")break;s+=ch;p=ch;
  }
  return s;
}
export function pseudoWord(allowed?:any,o?:any){
  o=o||{};const min=o.min||2,max=o.max||6,must=o.must,al=[...allowed];
  if(al.length<3){
    let s="";const len=2+rnd(3);for(let i=0;i<len;i++)s+=pick(al);
    if(must&&!s.includes(must)){const p=rnd(s.length);s=s.slice(0,p)+must+s.slice(p+1)}
    return s;
  }
  for(let t=0;t<(must?40:1);t++){const s=pseudoOnce(al,min,max);if(!must||s.includes(must))return s}
  let s=pseudoOnce(al,min,max);const p=rnd(s.length+1);return s.slice(0,p)+must+s.slice(p);
}
export function pw(al?:any,o?:any){for(let i=0;i<8;i++){const w=pseudoWord(al,o);if(!BLOCK.test(w))return w}return pseudoWord(al,o)}
export const poolCache:any={};
export function realPool(set?:any,min?:any,max?:any){const key=[...set].sort().join("")+min+"_"+max;
  return poolCache[key]||(poolCache[key]=WL.filter(w=>w.length>=min&&w.length<=max&&[...w].every(c=>set.has(c))))}
export function fill(next?:any,target?:any,maxTok?:any){
  const t:any[]=[];let len=0,g=0;
  while(len<target&&t.length<maxTok&&g++<400){const w=next(t);if(w==null||w===""||(t.length&&t[t.length-1]===w))continue;if(BADDEAD.test(w))continue;t.push(w);len+=w.length+1}
  return t;
}
export function ctx(n?:any){
  const L=LESSONS[n-1],known=new Set();
  for(let i=0;i<n-1;i++)LESSONS[i].keys.forEach((k?:any)=>known.add(k));
  const all=new Set([...known,...L.keys]);
  const letters=n>=CO.capsN?[...CO.letters]:[...all].filter(isLetter);
  return {L,n,known,newK:L.keys,all,letters,newLetters:L.keys.filter(isLetter)};
}
export function decorate(t?:any,c?:any,minNew?:any){
  const P=CO.marks,J=CO.joiner,has=(s?:any)=>[...P].some(m=>s.includes(m));
  const newP=c.newK.filter((k?:any)=>P.includes(k)),knownP=[...c.known].filter(k=>P.includes(k)&&!c.newK.includes(k));
  const marks:any[]=[];
  newP.forEach((k?:any)=>{for(let i=0;i<minNew;i++)marks.push(k)});
  knownP.forEach(k=>{if(Math.random()<.7)marks.push(k)});
  marks.filter(m=>m!==J).forEach(m=>{const idx:any[]=[];t.forEach((w?:any,i?:any)=>{if(!has(w))idx.push(i)});if(idx.length)t[pick(idx)]+=m});
  marks.filter(m=>m===J).forEach(()=>{const idx=[];for(let i=0;i<t.length-1;i++)if(!has(t[i])&&!has(t[i+1]))idx.push(i);if(idx.length){const i=pick(idx);t[i]=t[i]+J+t[i+1];t.splice(i+1,1)}});
  return t;
}
export function drill(c?:any,len?:any){
  len=len||45;const ks=c.newK,pats=["hkh","khk","hhk","kkh","hkk","kkk","hko","kh","hk"];
  const t:any[]=[];let l=0,g=0;
  while(l<len&&g++<400){
    const k=ks[t.length%ks.length],k2=ks[(t.length+1)%ks.length];
    const hh=(x?:any)=>{const h=homeCh(x);return h===x?(NB[x]||x):h};
    const pat=pick(ks.length>1?pats:pats.filter(p=>p!=="hko"));
    const tok=[...pat].map(p=>p==="h"?hh(k):p==="k"?k:hh(k2)).join("");
    if(BADDEAD.test(tok)||tok===t[t.length-1])continue;
    t.push(tok);l+=tok.length+1;
  }
  return t.join(" ");
}
export function combine(c?:any){
  const nl=c.newLetters;
  const t=fill(()=>pw(c.letters,{min:3,max:5,must:nl.length?pick(nl):null}),60,12);
  decorate(t,c,2);return t.join(" ");
}
export function wordText(c?:any,len?:any,review?:any){
  const nl=c.newLetters,set=new Set(c.letters);
  let cand=realPool(set,2,c.n>=CO.longN?9:8).slice();
  if(cand.length<15){const have=new Set(cand);let g=0;
    while(cand.length<15&&g++<120){const w=pw(c.letters,{min:3,max:5,must:nl.length?pick(nl):null});if(!have.has(w)){have.add(w);cand.push(w)}}}
  const withNew=nl.length?cand.filter((w?:any)=>nl.some((k?:any)=>w.includes(k))):[];
  const ws=new Set(withNew),others=cand.filter((w?:any)=>!ws.has(w));
  const wf=(w?:any)=>1+[...w].reduce((s,ch)=>s+weakW(ch),0)/w.length*3;
  const next=()=>{
    if(review)return wpick(cand,wf);
    if(withNew.length&&(Math.random()<.68||!others.length))return pickF(withNew);
    return pickF(others.length?others:cand);
  };
  const t=fill(next,len,40);
  /* every key of the lesson shows up at least once: a few keys (J above all) have almost no words */
  /* rare letters (Czech q, w, x: a handful of loanwords) are only forced into their own lesson */
  c.letters.filter((k?:any)=>!t.some(w=>w.includes(k))&&(!CO.rare.includes(k)||nl.includes(k))).forEach((k?:any)=>{
    const pool=cand.filter((w?:any)=>w.includes(k)),w=pool.length?pick(pool):pw(c.letters,{min:3,max:5,must:k});
    t.splice(1+rnd(t.length),0,w);
  });
  decorate(t,c,len>=100?3:2);return t.join(" ");
}
export function genReview(c?:any,s?:any){
  if(s===1){const t=fill(()=>pw(c.letters,{min:3,max:5,must:wpick(c.letters,weakW)}),45,14);return t.join(" ")}
  return wordText(c,s===2?60:120,true);
}
/* lesson 19: capitals */
export function gen19(s?:any){
  const LH=["a","s","d","f","g"],RH=["h","j","k","l"];
  if(s===1){
    const t:any[]=[];while(t.length<14){const left=Math.random()<.5,A=left?LH:RH,B=left?RH:LH;
      const tok=cap(pick(A))+pick(B)+(Math.random()<.4?pick(B):"");if(tok!==t[t.length-1])t.push(tok)}
    return t.join(" ");
  }
  const short=WL.filter(w=>w.length>=2&&w.length<=6);
  if(s===2&&CO.id==="cs"){/* Czech: about a third of the capitals start with an accented letter (ˇ or ´, then Shift + the letter) */
    const acc=short.filter(w=>/^[čďěňřšťžúýáíéó]/.test(w));
    return fill(()=>Math.random()<.35?cap(pickF(acc)):(()=>{const w=pickF(short);return Math.random()<.5?cap(w):w})(),60,12).join(" ")}
  if(s===2)return fill(()=>{const w=pickF(short);return Math.random()<.5?cap(w):w},60,12).join(" ");
  let out="";
  while(out.length<90){
    const n=4+rnd(3),ws=[];for(let i=0;i<n;i++){const w=pickF(WL.filter(x=>x.length>=2&&x.length<=7).slice(0,500));ws.push(i===0||Math.random()<.3?cap(w):w)}
    out+=(out?" ":"")+ws.join(" ")+".";
  }
  return out;
}
/* lesson 20: templates + short building blocks */
export const CONTR=["don't","it's","I'm","we'll","you're","I'd","I've","can't","won't","isn't","that's","let's","they're","we've","he's","she's"];
export const VERBS=["see","find","type","read","make","take","keep","try","hold","check"];
export const ADJ=["slow","steady","calm","clear","quick","light"];
export const HYPH=["well-known","long-term","short-term","quick-start","real-life","ten-minute","step-by-step","easy-going"];
export const QWORDS=EN_WL.filter(w=>w.length>=3&&w.length<=6&&!/^[aeiouycn]/.test(w)).slice(0,300);
export const W20=EN_WL.filter(w=>w.length>=3&&w.length<=6).slice(0,300);
export function sent20(kind?:any){
  const w=()=>pickF(W20),q=()=>pickF(QWORDS);
  switch(kind){
    case "contr":{const c=pick(CONTR);const first=c[0].toUpperCase()+c.slice(1);return pick([first+" "+pick(VERBS)+" "+w()+".",first+" "+w()+" "+w()+"."])}
    case "quote":return pick(['Say "'+q()+'" twice.','Type "'+q()+'" and "'+q()+'".','The word is "'+q()+'".'])
    case "ques":return pick(["Can you "+pick(VERBS)+" "+w()+"?","Did you "+pick(VERBS)+" it?","What is "+w()+"?"]);
    case "excl":return pick([cap(pick(VERBS))+" it!","Nice and "+pick(ADJ)+"!","Keep going!"]);
    case "hyph":return "A "+pick(HYPH)+" "+w()+".";
    default:return pick(["Remember: "+w()+", "+w()+", "+w()+".","Tip: "+pick(VERBS)+" "+w()+" and "+w()+".","Goal: "+pick(ADJ)+" and "+pick(ADJ)+"."]);
  }
}
/* the Czech course: whole sentences (Czech grammar does not take slot-filled templates) */
export function gen20cs(s?:any){
  const kinds=s===2?["ques","excl","colon"]:["quote","paren","ques","excl"];
  return kinds.map(k=>pick((CS_SENT as any)[k])).join(" ");
}
export function gen20(s?:any,c?:any){
  if(s===1)return drill(c,45);
  if(CO.id==="cs")return gen20cs(s);
  const kinds=s===2?["ques","excl","contr"]:["hyph","quote","colon","contr"];
  return kinds.map(sent20).join(" ");
}
/* lessons 21, 22: numbers */
export const NOUNS=["days","cars","books","trees","hours","miles","dogs","cats","cups","keys","pens","boxes","coins","apples","birds","chairs","doors","lamps"];
export function genNum(n?:any,s?:any,c?:any){
  if(s===1)return drill(c,45);
  const ds=s===2?c.newK:[...new Set([...c.known,...c.newK].filter(k=>/\d/.test(k)))];
  const tok=()=>{const len=1+rnd(4);let x="";for(let i=0;i<len;i++){let d=pick(ds);if(i===0&&len>1&&d==="0")d=pick(ds.filter((z?:any)=>z!=="0")||ds);x+=d}
    return Math.random()<.85?x+" "+pick(CO.id==="cs"?CS_UNITS:NOUNS):x};
  return fill(tok,s===2?60:90,12).join(" ");
}
export function genStep(n?:any,s?:any){
  const c=ctx(n),L=c.L;
  if(L.shift)return gen19(s);
  if(L.punct)return gen20(s,c);
  if(L.digits)return genNum(n,s,c);
  if(L.review)return genReview(c,s);
  if(s===1)return drill(c,45);
  if(s===2)return combine(c);
  return wordText(c,90,false);
}
export function genLesson(n?:any){
  let r;
  for(let a=0;a<12;a++){r=[1,2,3].map(s=>genStep(n,s).trim());if(r.every(t=>t&&!BADDEAD.test(t)&&!/ {2}/.test(t)))return r}
  return r;
}
/* ---- shared by Practice and Test ---- */
export const shuffle=(a?:any)=>{for(let i=a.length-1;i>0;i--){const j=rnd(i+1);[a[i],a[j]]=[a[j],a[i]]}return a};
export const niceStep=(m?:any,maxTicks?:any)=>{for(const s of [10,20,25,50,100,200])if(Math.ceil(m/s)<=maxTicks)return s;return 200};
export function extras(toks?:any,o?:any){
  const out=toks.slice(),digs=o.digits||"0123456789";
  if(o.nums)for(let i=0;i<out.length;i++)if(Math.random()<.1){const len=1+rnd(4);let x="";for(let j=0;j<len;j++)x+=pick(digs.split(""));out[i]=x}
  if(o.punct)for(let i=0;i<out.length;i++){
    const w=out[i];let r=Math.random();
    if(r<.03&&o.contr&&CO.id==="en")out[i]=pick(CONTR);
    else if(r<.06&&CO.wordRe.test(w)&&(CO.id!=="en"||!/^[aeiouycn]/.test(w)))out[i]='"'+w+'"';
    r=Math.random();if(r<.2)out[i]+=r<.02?"?":r<.04?"!":r<.12?",":".";
  }
  if(o.caps)for(let i=0;i<out.length;i++){
    const prev=i>0?out[i-1]:(o.prev||"");
    if(Math.random()<.25||/[.?!]"?$/.test(prev))out[i]=out[i].replace(CO.letterRe,(c?:any)=>c.toUpperCase());
  }
  return out.map((t?:any)=>BADDEAD.test(t)?t.replace(/[`'"~^]/g,""):t);
}
/* ---- Practice ---- */
export function focusKey(pool?:any,avoid?:any){
  if(avoid&&avoid.length){const rest=pool.filter((k?:any)=>!avoid.includes(k));if(rest.length)pool=rest}
  let best=null,bv=9;
  pool.forEach((k?:any)=>{const sv=strengthOf(C().keys[k]);if(sv!=null&&sv<bv){bv=sv;best=k}});
  if(best)return best;
  return pool.slice().sort((a?:any,b?:any)=>((C().keys[a]||{n:0}).n)-((C().keys[b]||{n:0}).n))[0];
}
export function slowPairs(max?:any,pool?:any,avoid?:any){
  const set=pool?new Set(pool):null;
  return Object.keys(C().pairs).filter(p=>!(avoid&&avoid.includes(p))&&usefulPair(p)&&(!set||(set.has(p[0])&&set.has(p[1])))).map(p=>({p,st:C().pairs[p],sv:strengthOf(C().pairs[p],6)})).filter(x=>x.sv!=null).sort((a,b)=>a.sv-b.sv).slice(0,max);
}
/* focus is a single key ("h") or a letter pair ("th") */
export function chooseFocus(pool?:any,avoid?:any){
  const key=focusKey(pool,avoid),ksv=strengthOf(C().keys[key]),wp=slowPairs(1,pool,avoid)[0];
  if(wp&&ksv!=null&&wp.sv<=ksv-.05)return wp.p;
  return key;
}
export const focusStat=(f?:any)=>f.length===2?C().pairs[f]:C().keys[f];
export const pairFingers=(p?:any)=>t("{a} then {b}",{a:finger(charInfo(p[0]).key.f),b:finger(charInfo(p[1]).key.f)});
export function genPairRound(pool?:any,pair?:any,o?:any){
  const set=new Set(pool),real=realPool(set,2,9);
  const wf=real.filter((w?:any)=>w.includes(pair)),wo=real.filter((w?:any)=>!w.includes(pair));
  const n=12+rnd(3),k=Math.ceil(n*.7),slots=[];
  for(let i=0;i<n;i++)slots.push(i<k);shuffle(slots);
  const pseudoPair=()=>{for(let g=0;g<30;g++){const b=pw(pool,{min:2,max:4}),p=rnd(b.length+1),w=b.slice(0,p)+pair+b.slice(p);if(!/(.)\1\1/.test(w)&&!BLOCK.test(w))return w}return pair+pair[0]};
  const toks:any[]=[];let last="";
  slots.forEach(has=>{
    let w,g=0;
    do{
      if(has)w=(wf.length>=4&&Math.random()<.7)?pickF(wf):pseudoPair();
      else w=(wo.length>=6&&Math.random()<.7)?pickF(wo):pw(pool,{min:3,max:5});
    }while((w===last||BLOCK.test(w))&&g++<12);
    toks.push(w);last=w;
  });
  const dg=o.nums?practiceDigits():"";
  return extras(toks,{caps:o.caps,punct:o.punct,nums:o.nums&&dg,digits:dg||undefined}).join(" ");
}
export function practiceDigits(){const s=new Set();LESSONS.forEach(L=>{if(L.digits&&(S.settings.unlockAll||lessonDone(L.n)))L.keys.forEach((k?:any)=>s.add(k))});return [...s].join("")}
export function genPractice(pool?:any,focus?:any,o?:any){
  o=o||{};if(focus.length===2)return genPairRound(pool,focus,o);
  const set=new Set(pool),real=realPool(set,2,9);
  const wf=real.filter((w?:any)=>w.includes(focus)),wo=real.filter((w?:any)=>!w.includes(focus));
  const n=12+rnd(3),k=Math.ceil(n*.62),slots=[];
  for(let i=0;i<n;i++)slots.push(i<k);shuffle(slots);
  const toks:any[]=[];let last="";
  slots.forEach(has=>{
    let w,g=0;
    do{
      if(has)w=(wf.length>=6&&Math.random()<.7)?pickF(wf):pw(pool,{min:3,max:6,must:focus});
      else w=(wo.length>=6&&Math.random()<.7)?pickF(wo):pw(pool,{min:3,max:5});
    }while((w===last||BLOCK.test(w))&&g++<12);
    toks.push(w);last=w;
  });
  const dg=o.nums?practiceDigits():"";
  return extras(toks,{caps:o.caps,punct:o.punct,nums:o.nums&&dg,digits:dg||undefined}).join(" ");
}
export let PRI:any=null,NEXT:any=null,SHOWALL:any=false,PINFO:any=null;
export const capFirst=(t?:any)=>t.charAt(0).toUpperCase()+t.slice(1);
export const pOpts=()=>{const st=S.settings;return {caps:st.pCaps&&(st.unlockAll||lessonDone(CO.capsN)),punct:st.pPunct&&(st.unlockAll||lessonDone(CO.punctN)),nums:st.pNums&&(st.unlockAll||CO.numN.some(lessonDone))}};
export const pSig=(pool?:any)=>[S.settings.pCaps,S.settings.pPunct,S.settings.pNums].map(Number).join("")+"|"+pool.length;
export function nextRound(pool?:any,fresh?:any){
  const focus=chooseFocus(pool),sig=pSig(pool);
  if(fresh||!NEXT||NEXT.sig!==sig||NEXT.focus!==focus)NEXT={focus,text:genPractice(pool,focus,pOpts()),sig};
  return NEXT;
}
export function paceFor(kind?:any,dur?:any){
  const p=S.settings.pace;if(p==="off")return 0;
  if(p==="best"){const b=kind==="test"?C().bests["test"+dur]:C().bests.practice;if(b>0)return b}
  return S.settings.target;
}
/* ---- Test text ---- */
export const POOLS:any={c200:()=>[...new Set(CO.core as string[])].filter(w=>w.length>=2),e950:()=>WL.filter(w=>w.length>=2)};
export const POOL_NAME:any={c200:"Common 200",e950:"Everyday 950"};
export function testChunk(n?:any,o?:any,prev?:any){
  const pool=POOLS[o.pool](),t=[];let last="";
  while(t.length<n){const w=pick(pool);if(w!==last){t.push(w);last=w}}
  const out=extras(t,{caps:o.caps,punct:o.punct,nums:o.nums,contr:true,prev});
  return {text:out.join(" ")+" ",last:out[out.length-1]};
}
/* ---- Practice modes: Real text, Code, Your text ---- */
export const PM_KEY="homerow.pmode",PM_LANG="homerow.clang",PM_DONE="homerow.textsDone",PM_MINE="homerow.mytexts";
export const pmGet=(k?:any,d?:any)=>{try{const v=localStorage.getItem(k);return v==null?d:v}catch(e){return d}};
export const pmSet=(k?:any,v?:any)=>{try{localStorage.setItem(k,v)}catch(e){}};
export const pmJSON=(k?:any,d?:any)=>{try{const v=JSON.parse(localStorage.getItem(k) as any);return v==null?d:v}catch(e){return d}};
export const PMODES=[["adaptive","Adaptive"],["text","Real text"],["code","Code"],["mine","Your text"]];
/* translated names for the UI (the English names stay the ids) */
/* the Czech course's everyday pool has about 1,000 words */
export const poolName=(id?:any)=>id==="e950"&&CO.id==="cs"?t("pool|Everyday 1000"):POOL_NAME[id]?t("pool|"+POOL_NAME[id]):String(id);
export const pmodeName=(id?:any)=>{const m=PMODES.find(x=>x[0]===id);return m?t("mode|"+m[1]):String(id)};
export const PMLANGS=["All","JavaScript","Python","Swift","CSS","SQL","Shell"];
/* Real text opens with the punctuation lesson, Code with the last numbers lesson (English course only) */
export const pmLockN=(m?:any)=>m==="text"?CO.punctN:m==="code"?CO.numN[CO.numN.length-1]:0;
export const pmLocked=(m?:any)=>{const n=pmLockN(m);return !!n&&!(lessonDone(n)||S.settings.unlockAll)};
export function pmode(){const m=pmGet(PM_KEY,"adaptive");return PMODES.some(x=>x[0]===m)&&(m!=="code"||CO.code)?m:"adaptive"}
export const courseTexts=()=>CO.id==="cs"?CS_TEXTS:TEXTS;
export const pmChars=(n?:any)=>tn(n,"{n} character","{n} characters");
export let RT:any=null;
export const pmDone=()=>{const a=pmJSON(PM_DONE,[]);return Array.isArray(a)?a.filter(x=>typeof x==="string"):[]};
export function pmMarkDone(id?:any){pmSet(PM_DONE,JSON.stringify(pmDone().filter(x=>x!==id).concat(id).slice(-20)))}
export function pmPickText(){
  const T=courseTexts(),done=new Set(pmDone()),fresh=T.filter(t=>!done.has(t.t)&&t!==RT);
  RT=pick(fresh.length?fresh:T.filter(t=>t!==RT));
}
export function pmMinutes(n?:any){const w=C().bests.practice||S.settings.target||20,m=Math.max(1,Math.round(n/5/w));return tn(m,"about {n} minute","about {n} minutes")}
export function pmPaceLine(){const pc=paceFor("practice");return pc?'<p class="small muted">'+(S.settings.pace==="best"&&C().bests.practice>0?t("Pace caret: your best, {speed} {unit}",{speed:speed(pc),unit:speedUnit()}):t("Pace caret: {speed} {unit}",{speed:speed(pc),unit:speedUnit()}))+'</p>':""}
export let CS:any=null;
export const pmLang=()=>{const l=pmGet(PM_LANG,"All");return PMLANGS.includes(l)?l:"All"};
export const pmSnips=()=>{const l=pmLang();return l==="All"?SNIPPETS:SNIPPETS.filter(s=>s.lang===l)};
export function pmPickSnip(){const l=pmSnips().filter(s=>s!==CS);CS=pick(l.length?l:SNIPPETS)}
export const MT_MAX=20;
export function cleanText(s?:any){
  let n=0;
  s=String(s).replace(/[\s  -   　]+/g," ");/* line breaks, tabs, no-break and thin spaces */
  const MAP:any={"‘":"'","’":"'","‚":"'","‛":"'","“":'"',"”":'"',"„":'"',"‟":'"',"–":"-","—":"-","−":"-","…":"...","•":"-","×":"x"};
  let o="";for(const ch of s){if(own(MAP,ch)){o+=MAP[ch];n++}else o+=ch}
  let r="";
  if(CO.id==="cs"){/* keep every letter the Czech keyboard can type; otherwise drop the accent, then the character */
    for(const ch of o.normalize("NFC")){if(ch===" "||charInfo(ch)){r+=ch;continue}
      const b=ch.normalize("NFD").replace(/[̀-ͯ]/g,"");n++;if(b&&b!==ch&&[...b].every(x=>charInfo(x)))r+=b}
  }else{
  let d="";for(const ch of o.normalize("NFD")){if(/[̀-ͯ]/.test(ch))n++;else d+=ch}
  for(const ch of d){if(ch===" "||charInfo(ch))r+=ch;else n++}
  }
  return {text:r.replace(/ {2,}/g," ").trim(),changed:n};
}
/* parts of about 300 characters (220 to 360), split at sentence ends when possible, otherwise at a space */
export function splitParts(text?:any,max?:any){
  const parts=[];let r=text.trim();
  while(r.length){
    if(r.length<=360){
      if(parts.length&&r.length<120&&parts[parts.length-1].length+1+r.length<=360)parts[parts.length-1]+=" "+r;else parts.push(r);
      break;
    }
    let cut=-1,best=1e9;
    for(let i=220;i<=360;i++)if(r[i]===" "&&/[.?!]["')]?$/.test(r.slice(i-2,i))&&Math.abs(i-300)<best){best=Math.abs(i-300);cut=i}
    if(cut<0)for(let i=220;i<=360;i++)if(r[i]===" "&&Math.abs(i-300)<best){best=Math.abs(i-300);cut=i}
    if(cut<0){cut=r.indexOf(" ",360);if(cut<0){parts.push(r);break}}
    parts.push(r.slice(0,cut).trim());r=r.slice(cut).trim();
  }
  const cap=max||MT_MAX;
  return {parts:parts.slice(0,cap),cut:parts.length>cap};
}
/* "Your text" is kept per course (a Czech text keeps č and ř, which the English course can't type) */
const mtKey=()=>PM_MINE+(CO.id==="cs"?".cs":"");
export const mtList=()=>{const a=pmJSON(mtKey(),[]);return Array.isArray(a)?a.filter(x=>x&&typeof x.id==="string"&&Array.isArray(x.parts)&&x.parts.length):[]};
export const mtSave=(a?:any)=>pmSet(mtKey(),JSON.stringify(a.slice(0,5)));
export function mtFeedback(raw?:any,submit?:any){
  const c=cleanText(raw),sp=splitParts(c.text);let h="";
  if(submit&&c.text.length<20)return {err:true,html:t("Add at least 20 characters that can be typed.")};
  if(c.changed>0)h+=tn(c.changed,"Changed {n} character so everything can be typed.","Changed {n} characters so everything can be typed.")+" ";
  if(sp.cut)h+=t("Only the first {n} parts are kept.",{n:MT_MAX});
  return {err:false,html:h.trim(),c,sp};
}

/* a course switch: word pools, the queued practice round and the picked passages belong to the old course */
export function resetCourseCaches() { for (const k of Object.keys(poolCache)) delete poolCache[k]; NEXT = null; RT = null; CS = null; }

/* mutable module state needs setters, because an imported live binding cannot be assigned from outside */
export function setPRI(v: any) { PRI = v; }
export function setNEXT(v: any) { NEXT = v; }
export function setSHOWALL(v: any) { SHOWALL = v; }
export function setPINFO(v: any) { PINFO = v; }
export function setRT(v: any) { RT = v; }
export function setCS(v: any) { CS = v; }
