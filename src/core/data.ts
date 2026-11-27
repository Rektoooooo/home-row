/* DATA: lessons, layouts, finger map, charInfo, reach, small helpers.  Ported from legacy/src/app1.js (+ idsFor from app2.js). */
import { WORDS_CORE, WORDS_MORE } from "./words";
import { S, SC, COURSE } from "./state";
import { t } from "@/i18n";

/* Course data is held in live bindings (export let): the English values below are the defaults, and setCourseData()
   (called by course.ts) swaps them for the Czech course. Importers read them at call time, so they follow the switch. */
export const EN_WL=[...new Set([...WORDS_CORE,...WORDS_MORE].filter(w=>/^[a-z]+$/.test(w)))];
export let WL:string[]=EN_WL;
/* U.S. International dead keys (English course only; the Czech course types its accents on purpose) */
export const EN_DEAD="'\"`~^";
export let DEAD=EN_DEAD;
export const EN_BADDEAD=/[`'"~^][aeiouycnAEIOUYCN`'"~^]/;
export let BADDEAD:RegExp=EN_BADDEAD;
export const EN_isLetter=(c?:any)=>/^[a-z]$/.test(c);
export let isLetter:(c?:any)=>boolean=EN_isLetter;
export const rnd=(n?:any)=>Math.floor(Math.random()*n);
export const pick=(a?:any)=>a[rnd(a.length)];
export const pickF=(a?:any)=>a[Math.floor(a.length*Math.pow(Math.random(),1.5))];
export const cap=(w?:any)=>w[0].toUpperCase()+w.slice(1);
export const esc=(s?:any)=>String(s).replace(/[&<>"]/g,(c:string)=>(({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"} as any)[c]));
export function wpick(items?:any,wf?:any){let t=0;const w=items.map((x?:any)=>{const v=Math.max(0,wf(x));t+=v;return v});if(t<=0)return pick(items);let r=Math.random()*t;for(let i=0;i<items.length;i++){r-=w[i];if(r<=0)return items[i]}return items[items.length-1]}

export const FING:any={LP:{n:"left pinky",g:"pinky"},LR:{n:"left ring finger",g:"ring"},LM:{n:"left middle finger",g:"middle"},LI:{n:"left index finger",g:"index"},
  RI:{n:"right index finger",g:"index"},RM:{n:"right middle finger",g:"middle"},RR:{n:"right ring finger",g:"ring"},RP:{n:"right pinky",g:"pinky"},TH:{n:"thumb",g:"thumb"}};
export const GCOL:any={pinky:"--f-pinky",ring:"--f-ring",middle:"--f-middle",index:"--f-index",thumb:"--f-thumb"};
export const fcol=(f?:any)=>FING[f]?"var("+GCOL[FING[f].g]+")":"var(--f-thumb)";
export const HOMEID:any={LP:"KeyA",LR:"KeyS",LM:"KeyD",LI:"KeyF",RI:"KeyJ",RM:"KeyK",RR:"KeyL",RP:"Semicolon"};
/* finger per letter key code (the same for every layout: Y and Z only swap their letters on Czech QWERTZ) */
export const CODE_F:any={KeyQ:"LP",KeyW:"LR",KeyE:"LM",KeyR:"LI",KeyT:"LI",KeyY:"RI",KeyU:"RI",KeyI:"RM",KeyO:"RR",KeyP:"RP",KeyA:"LP",KeyS:"LR",KeyD:"LM",KeyF:"LI",KeyG:"LI",KeyH:"RI",KeyJ:"RI",KeyK:"RM",KeyL:"RR",KeyZ:"LP",KeyX:"LR",KeyC:"LM",KeyV:"LI",KeyB:"LI",KeyN:"RI",KeyM:"RI"};
export const LF:any={q:"LP",w:"LR",e:"LM",r:"LI",t:"LI",y:"RI",u:"RI",i:"RM",o:"RR",p:"RP",a:"LP",s:"LR",d:"LM",f:"LI",g:"LI",h:"RI",j:"RI",k:"RM",l:"RR",z:"LP",x:"LR",c:"LM",v:"LI",b:"LI",n:"RI",m:"RI"};
export const DIG=[["1","!","LP"],["2","@","LR"],["3","#","LM"],["4","$","LI"],["5","%","LI"],["6","^","LI"],["7","&","RI"],["8","*","RM"],["9","(","RR"],["0",")","RP"]];

/* keyboard layouts
   variant "us": U.S. (the English course). "cs-qwertz" / "cs-qwerty": Apple's and Windows' Czech layouts, read from the
   system layout data (macOS UCKeyTranslate) and kbdlayout.info (KBDCZ, KBDCZ1). The two platforms agree on every key the
   Czech course uses; they differ only on the key left of 1 (Mac: < > on ISO, \\ | on ANSI; Windows: ; and dead °) and on
   Shift + the dead ¨ key (Mac `, Windows '). `mac` picks those legends. Dead keys: ´ (Equal) and ˇ (Shift + Equal). */
export function buildLayout(shape?:any,variant:string="us",mac:boolean=true){
  const iso=shape==="iso",cz=variant!=="us",qz=variant==="cs-qwertz";
  const K:any=(id?:any,base?:any,sh?:any,f?:any,w?:any)=>({id,base,sh,f,w:w||1});
  const M:any=(id?:any,mod?:any,f?:any,w?:any,a?:any)=>({id,mod,f,w,a:a||"s"});
  const Ls=(s?:any)=>[...s].map(c=>K("Key"+c.toUpperCase(),c,c.toUpperCase(),LF[c]));
  /* Czech letter keys by code; on QWERTZ the KeyY key types z and the KeyZ key types y */
  const Lc=(s?:any)=>[...s].map(c=>{const id="Key"+c.toUpperCase(),ch=qz&&c==="y"?"z":qz&&c==="z"?"y":c;return K(id,ch,ch.toUpperCase(),CODE_F[id])});
  const dead=(k:any,b:boolean,s:boolean)=>Object.assign(k,b?{deadB:1}:{},s?{deadS:1}:{});
  const r0:any[]=[];
  if(!cz){r0.push(iso?Object.assign(K("Backquote","§","±","LP"),{nochar:1}):K("Backquote","`","~","LP"));DIG.forEach((d,i)=>r0.push(K("Digit"+d[0],d[0],d[1],d[2])));
    r0.push(K("Minus","-","_","RP"),K("Equal","=","+","RP"),M("Backspace","delete","RP",2,"e"))}
  else{r0.push(mac?(iso?K("Backquote","<",">","LP"):K("Backquote","\\","|","LP")):dead(K("Backquote",";","°","LP"),false,true));
    "+ěščřžýáíé".split("").forEach((c,i)=>r0.push(K("Digit"+DIG[i][0],c,DIG[i][0],DIG[i][2])));
    r0.push(K("Minus","=","%","RP"),dead(K("Equal","´","ˇ","RP"),true,true),M("Backspace","delete","RP",2,"e"))}
  const bsl=cz?dead(K("Backslash","¨",mac?"`":"'","RP",iso?1:1.5),true,false):K("Backslash","\\","|","RP",iso?1:1.5);
  const r1:any[]=[M("Tab","tab","LP",1.5),...(cz?Lc("qwertyuiop"):Ls("qwertyuiop")),cz?K("BracketLeft","ú","/","RP"):K("BracketLeft","[","{","RP"),cz?K("BracketRight",")","(","RP"):K("BracketRight","]","}","RP")];
  r1.push(iso?{id:"Enter",mod:"return",f:"RP",w:1.5,a:"e",L:1}:bsl);
  const r2:any[]=[M("CapsLock","caps","LP",1.75),...(cz?Lc("asdfghjkl"):Ls("asdfghjkl")),cz?K("Semicolon","ů",'"',"RP"):K("Semicolon",";",":","RP"),cz?K("Quote","§","!","RP"):K("Quote","'",'"',"RP")];
  r2.push(iso?bsl:M("Enter","return","RP",2.25,"e"));
  const r3:any[]=[Object.assign(M("ShiftLeft","shift","LP",iso?1.25:2.25),{sh:1})];
  if(iso)r3.push(cz?K("IntlBackslash","\\","|","LP"):K("IntlBackslash","`","~","LP"));
  if(!cz)r3.push(...Ls("zxcvbnm"),K("Comma",",","<","RM"),K("Period",".",">","RR"),K("Slash","/","?","RP"));
  else r3.push(...Lc("zxcvbnm"),K("Comma",",","?","RM"),K("Period",".",":","RR"),K("Slash","-","_","RP"));
  r3.push(Object.assign(M("ShiftRight","shift","RP",iso?2.75:2.75,"e"),{sh:1}));
  const r4:any[]=[M("Fn","fn","-",1),M("ControlLeft","control","-",1),M("AltLeft","option","-",1.25),M("MetaLeft","command","-",1.5,"s"),
    {id:"Space",base:" ",f:"TH",w:5.5,space:1},M("MetaRight","command","-",1.5,"s"),M("AltRight","option","-",1.25,"e"),{id:"Arrows",mod:"← ↑ ↓ →",f:"-",w:2,a:"c",arrows:1}];
  const keys:any[]=[],byId:any={};
  [r0,r1,r2,r3,r4].forEach((r,ri)=>{let x=0;r.forEach(k=>{k.x=x;k.row=ri;x+=k.w;keys.push(k);byId[k.id]=k})});
  const chars:any={};
  keys.forEach(k=>{if(k.nochar)return;if(k.space){chars[" "]={id:k.id,shift:false};return}
    if(k.base){if(!k.deadB)chars[k.base]={id:k.id,shift:false};if(k.sh&&typeof k.sh==="string"&&!k.deadS)chars[k.sh]={id:k.id,shift:true}}});
  if(cz){
    /* letters with no key of their own: the accent key first, then the letter (Shift for a capital).
       ´ (Equal): á é í ó ú ý; ˇ (Shift + Equal): č ď ě ň ř š ť ž. Letters that have a key keep it (á is Digit8). */
    const add=(ch:string,deadShift:boolean)=>{const b=chars[ch.normalize("NFD")[0]];if(!b)return;
      if(!chars[ch])chars[ch]={id:b.id,shift:false,dead:{id:"Equal",shift:deadShift}};
      const U=ch.toUpperCase();if(!chars[U])chars[U]={id:b.id,shift:true,dead:{id:"Equal",shift:deadShift}}};
    [..."áéíóúý"].forEach(c=>add(c,false));[..."čďěňřšťž"].forEach(c=>add(c,true));
    /* Ů: Mac ˇ + Shift+U; Windows ° (Shift + the key left of 1) + Shift+U */
    chars["Ů"]={id:"KeyU",shift:true,dead:mac?{id:"Equal",shift:true}:{id:"Backquote",shift:true}};
  }
  return {keys,byId,chars};
}
export const LAYOUTS:any={iso:buildLayout("iso"),ansi:buildLayout("ansi")};
export const IS_MAC=typeof navigator!=="undefined"&&/Mac|iPhone|iPad|iPod/.test((navigator as any).platform||navigator.userAgent||"");
const CSL:any={};
export const csLayout=(shape:string,variant:string)=>{const k=shape+"-"+variant;return CSL[k]||(CSL[k]=buildLayout(shape,"cs-"+variant,IS_MAC))};
/* can ch be typed in a course (coach lessons are checked against their own course, whichever is active) */
export const typableIn=(course:string,ch:string)=>{const shape=S&&S.settings.layout==="ansi"?"ansi":"iso";
  return !!(course==="cs"?csLayout(shape,SC&&SC.csLayout==="qwerty"?"qwerty":"qwertz"):LAYOUTS[shape]).chars[ch]};
export const LAY=()=>{const shape=S&&S.settings.layout==="ansi"?"ansi":"iso";return COURSE==="cs"?csLayout(shape,SC&&SC.csLayout==="qwerty"?"qwerty":"qwertz"):LAYOUTS[shape]};
export const CM=()=>LAY().chars;
export const kcx=(k?:any)=>(k.x+k.w/2);
export const STAG:any={0:-.75,1:-.25,2:0,3:.5};
export function reach(id?:any):any{
  const lay=LAY(),k=lay.byId[id];
  if(!k||!k.f||k.f==="TH")return {thumb:true,phrase:"thumb"};
  const h=lay.byId[HOMEID[k.f]];
  if(k.id===h.id)return {home:true,phrase:"home key"};
  const dr=k.row-2,dx=kcx(k)-(kcx(h)+STAG[k.row]);
  const left=k.f[0]==="L",inn=left?dx>=.74:dx<=-.74,out=left?dx<=-.74:dx>=.74;
  const rt=dr===-1?"up":dr===-2?"up two rows":dr===1?"down":"";
  const ct=inn?"in":out?"out":"";
  const phrase=rt&&ct?rt+" and "+ct:rt||ct||"in place";
  return {phrase,from:(h.base||"").toUpperCase(),home:false};
}
export const shiftIdFor=(f?:any)=>f&&f[0]==="L"?"ShiftRight":"ShiftLeft";
/* key, Shift and fingers for one character. A letter typed through an accent key also gets `pre`: the same fields for
   the accent key, which is pressed first (key/ids/fingers stay the letter key's) */
export function charInfo(ch?:any):any{
  const m=CM()[ch];if(!m)return null;
  const step=(id:string,shift:boolean)=>{const k=LAY().byId[id];const sid=shift?shiftIdFor(k.f):null;
    return {key:k,shift,shiftId:sid,ids:sid?[k.id,sid]:[k.id],fingers:sid?[k.f,LAY().byId[sid].f]:[k.f]}};
  const r:any=step(m.id,m.shift);
  if(m.dead)r.pre=step(m.dead.id,m.dead.shift);
  return r;
}
export const homeCh=(k?:any)=>{const m=CM()[k];if(!m)return k;const f=LAY().byId[m.id].f;if(!f||f==="TH")return k;return LAY().byId[HOMEID[f]].base};
export const EN_NB:any={d:"f",k:"j",s:"d",l:"k",a:"s",";":"l",f:"j",j:"f"};
export let NB:any=EN_NB;

/* lessons */
export const EN_LESSONS:any[]=[];
export let LESSONS:any[]=EN_LESSONS;
(function(){
  const add=(stage?:any,title?:any,keys?:any,wpm?:any,x?:any)=>EN_LESSONS.push(Object.assign({n:EN_LESSONS.length+1,stage,title,keys,wpm},x||{}));
  add("Home row","F and J",["f","j"],12);add("Home row","D and K",["d","k"],12);add("Home row","S and L",["s","l"],12);
  add("Home row","A and ;",["a",";"],12);add("Home row","G and H",["g","h"],12);add("Home row","Home row review",[],14,{review:1});
  add("Top row","E and I",["e","i"],15);add("Top row","R and U",["r","u"],15);add("Top row","T and Y",["t","y"],15);
  add("Top row","W and O",["w","o"],15);add("Top row","Q and P",["q","p"],15);add("Top row","Top row review",[],17,{review:1});
  add("Bottom row","V and M",["v","m"],18);add("Bottom row","B and N",["b","n"],18);add("Bottom row","C and comma",["c",","],18);
  add("Bottom row","X and period",["x","."],18);add("Bottom row","Z and slash",["z","/"],18);
  add("All letters","All letters review",[],20,{review:1});
  add("Capitals","Shift and capitals",[],18,{shift:1});
  add("Punctuation","Punctuation",["'",'"',"?","!","-",":"],15,{punct:1});
  add("Numbers","Numbers 1 to 5",["1","2","3","4","5"],15,{digits:1});
  add("Numbers","Numbers 6 to 0",["6","7","8","9","0"],15,{digits:1});
})();
export const STEP_NAMES=["Find the keys","Combine","Words"];
/* translated display names (the English data stays the id) */
export const stepName=(n:string)=>n==="Find the keys"?t("step|Find the keys"):n==="Combine"?t("step|Combine"):n==="Words"?t("step|Words"):n==="Rhythm"?t("step|Rhythm"):n;
export const lessonTitle=(L:any)=>t("lesson|"+L.title);
export const stageName=(s:string)=>t("stage|"+s);

/* letter bigram counts of a word list ("^" word start, "$" word end), for pseudo-words */
export function bigrams(words:string[]){const BG:any={};const add=(a?:any,b?:any)=>{const r=BG[a]||(BG[a]={});r[b]=(r[b]||0)+1};
  words.forEach(w=>{let p="^";for(const c of w){add(p,c);p=c}add(p,"$")});return BG}
export const EN_BG:any=bigrams(EN_WL);
export let BG:any=EN_BG;
export const EN_BLOCK=/^(ass|sex|cum|tit|tits|fag|gay|anal|anus|dick|cock|shit|fuck|piss|slut|porn|cunt|rape|nazi|damn|hell|butt|kkk)$/;
export let BLOCK:RegExp=EN_BLOCK;
export function idsFor(chars?:any){
  const ids=new Set();
  chars.forEach((ch?:any)=>{if(ch==="shift"){ids.add("ShiftLeft");ids.add("ShiftRight");return}const i=charInfo(ch);if(i){i.ids.forEach((x:any)=>ids.add(x));if(i.pre)i.pre.ids.forEach((x:any)=>ids.add(x))}});
  return [...ids];
}

/* course facts derived from the lesson list (English: capitals 19, punctuation 20, numbers 21 and 22, all-letters review 18,
   long words from 13). marks: punctuation that word steps may add; joiner: the mark that joins two words ("/" or "-") */
export function courseMeta(id:string,L:any[],x:any){
  const nOf=(f:(l:any)=>any)=>(L.find(f)||{n:0}).n;
  return Object.assign({id,capsN:nOf(l=>l.shift),punctN:nOf(l=>l.punct),numN:L.filter(l=>l.digits).map(l=>l.n),
    allN:nOf(l=>l.title==="All letters review"),longN:nOf(l=>l.stage==="Bottom row")},x);
}
export const EN_CO:any=courseMeta("en",EN_LESSONS,{letters:"abcdefghijklmnopqrstuvwxyz",home:"asdfjkl;",marks:",.;/",joiner:"/",rare:"",
  letterRe:/[a-z]/,wordRe:/^[a-z]+$/,pairRe:/^[a-z]{2}$/,core:WORDS_CORE,code:true});
export let CO:any=EN_CO;
/* swap every course binding at once (course.ts) */
export function setCourseData(d:any){WL=d.WL;LESSONS=d.LESSONS;BG=d.BG;BLOCK=d.BLOCK;NB=d.NB;DEAD=d.DEAD;BADDEAD=d.BADDEAD;isLetter=d.isLetter;CO=d.CO}
