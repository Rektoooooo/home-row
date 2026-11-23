/* DATA: lessons, layouts, finger map, charInfo, reach, small helpers.  Ported from legacy/src/app1.js (+ idsFor from app2.js). */
import { WORDS_CORE, WORDS_MORE } from "./words";
import { S } from "./state";

export const WL=[...new Set([...WORDS_CORE,...WORDS_MORE].filter(w=>/^[a-z]+$/.test(w)))];
export const DEAD="'\"`~^";
export const BADDEAD=/[`'"~^][aeiouycnAEIOUYCN`'"~^]/;
export const isLetter=(c?:any)=>/^[a-z]$/.test(c);
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
export const LF:any={q:"LP",w:"LR",e:"LM",r:"LI",t:"LI",y:"RI",u:"RI",i:"RM",o:"RR",p:"RP",a:"LP",s:"LR",d:"LM",f:"LI",g:"LI",h:"RI",j:"RI",k:"RM",l:"RR",z:"LP",x:"LR",c:"LM",v:"LI",b:"LI",n:"RI",m:"RI"};
export const DIG=[["1","!","LP"],["2","@","LR"],["3","#","LM"],["4","$","LI"],["5","%","LI"],["6","^","LI"],["7","&","RI"],["8","*","RM"],["9","(","RR"],["0",")","RP"]];

/* keyboard layouts */
export function buildLayout(shape?:any){
  const iso=shape==="iso";
  const K:any=(id?:any,base?:any,sh?:any,f?:any,w?:any)=>({id,base,sh,f,w:w||1});
  const M:any=(id?:any,mod?:any,f?:any,w?:any,a?:any)=>({id,mod,f,w,a:a||"s"});
  const Ls=(s?:any)=>[...s].map(c=>K("Key"+c.toUpperCase(),c,c.toUpperCase(),LF[c]));
  const r0:any[]=[iso?Object.assign(K("Backquote","§","±","LP"),{nochar:1}):K("Backquote","`","~","LP")];
  DIG.forEach((d,i)=>r0.push(K("Digit"+d[0],d[0],d[1],d[2])));
  r0.push(K("Minus","-","_","RP"),K("Equal","=","+","RP"),M("Backspace","delete","RP",2,"e"));
  const r1:any[]=[M("Tab","tab","LP",1.5),...Ls("qwertyuiop"),K("BracketLeft","[","{","RP"),K("BracketRight","]","}","RP")];
  r1.push(iso?{id:"Enter",mod:"return",f:"RP",w:1.5,a:"e",L:1}:K("Backslash","\\","|","RP",1.5));
  const r2:any[]=[M("CapsLock","caps","LP",1.75),...Ls("asdfghjkl"),K("Semicolon",";",":","RP"),K("Quote","'",'"',"RP")];
  r2.push(iso?K("Backslash","\\","|","RP"):M("Enter","return","RP",2.25,"e"));
  const r3:any[]=[Object.assign(M("ShiftLeft","shift","LP",iso?1.25:2.25),{sh:1})];
  if(iso)r3.push(K("IntlBackslash","`","~","LP"));
  r3.push(...Ls("zxcvbnm"),K("Comma",",","<","RM"),K("Period",".",">","RR"),K("Slash","/","?","RP"),Object.assign(M("ShiftRight","shift","RP",iso?2.75:2.75,"e"),{sh:1}));
  const r4:any[]=[M("Fn","fn","-",1),M("ControlLeft","control","-",1),M("AltLeft","option","-",1.25),M("MetaLeft","command","-",1.5,"s"),
    {id:"Space",base:" ",f:"TH",w:5.5,space:1},M("MetaRight","command","-",1.5,"s"),M("AltRight","option","-",1.25,"e"),{id:"Arrows",mod:"← ↑ ↓ →",f:"-",w:2,a:"c",arrows:1}];
  const keys:any[]=[],byId:any={};
  [r0,r1,r2,r3,r4].forEach((r,ri)=>{let x=0;r.forEach(k=>{k.x=x;k.row=ri;x+=k.w;keys.push(k);byId[k.id]=k})});
  const chars:any={};
  keys.forEach(k=>{if(k.nochar)return;if(k.space){chars[" "]={id:k.id,shift:false};return}
    if(k.base){chars[k.base]={id:k.id,shift:false};if(k.sh&&typeof k.sh==="string")chars[k.sh]={id:k.id,shift:true}}});
  return {keys,byId,chars};
}
export const LAYOUTS:any={iso:buildLayout("iso"),ansi:buildLayout("ansi")};
export const LAY=()=>LAYOUTS[S&&S.settings.layout==="ansi"?"ansi":"iso"];
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
export function charInfo(ch?:any):any{
  const m=CM()[ch];if(!m)return null;
  const k=LAY().byId[m.id];const sid=m.shift?shiftIdFor(k.f):null;
  return {key:k,shift:m.shift,shiftId:sid,ids:sid?[k.id,sid]:[k.id],fingers:sid?[k.f,LAY().byId[sid].f]:[k.f]};
}
export const homeCh=(k?:any)=>{const m=CM()[k];if(!m)return k;const f=LAY().byId[m.id].f;if(!f||f==="TH")return k;return LAY().byId[HOMEID[f]].base};
export const NB:any={d:"f",k:"j",s:"d",l:"k",a:"s",";":"l",f:"j",j:"f"};

/* lessons */
export const LESSONS:any[]=[];
(function(){
  const add=(stage?:any,title?:any,keys?:any,wpm?:any,x?:any)=>LESSONS.push(Object.assign({n:LESSONS.length+1,stage,title,keys,wpm},x||{}));
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

export const BG:any={};
(function(){const add=(a?:any,b?:any)=>{const r=BG[a]||(BG[a]={});r[b]=(r[b]||0)+1};
  WL.forEach(w=>{let p="^";for(const c of w){add(p,c);p=c}add(p,"$")})})();
export const BLOCK=/^(ass|sex|cum|tit|tits|fag|gay|anal|anus|dick|cock|shit|fuck|piss|slut|porn|cunt|rape|nazi|damn|hell|butt|kkk)$/;
export function idsFor(chars?:any){
  const ids=new Set();
  chars.forEach((ch?:any)=>{if(ch==="shift"){ids.add("ShiftLeft");ids.add("ShiftRight");return}const i=charInfo(ch);if(i)i.ids.forEach((x:any)=>ids.add(x))});
  return [...ids];
}
