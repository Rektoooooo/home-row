(function(){
/* ============================ DATA ============================ */
const WL=[...new Set([...WORDS_CORE,...WORDS_MORE].filter(w=>/^[a-z]+$/.test(w)))];
const DEAD="'\"`~^";
const BADDEAD=/[`'"~^][aeiouycnAEIOUYCN`'"~^]/;
const isLetter=c=>/^[a-z]$/.test(c);
const rnd=n=>Math.floor(Math.random()*n);
const pick=a=>a[rnd(a.length)];
const pickF=a=>a[Math.floor(a.length*Math.pow(Math.random(),1.5))];
const cap=w=>w[0].toUpperCase()+w.slice(1);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
function wpick(items,wf){let t=0;const w=items.map(x=>{const v=Math.max(0,wf(x));t+=v;return v});if(t<=0)return pick(items);let r=Math.random()*t;for(let i=0;i<items.length;i++){r-=w[i];if(r<=0)return items[i]}return items[items.length-1]}

const FING={LP:{n:"left pinky",g:"pinky"},LR:{n:"left ring finger",g:"ring"},LM:{n:"left middle finger",g:"middle"},LI:{n:"left index finger",g:"index"},
  RI:{n:"right index finger",g:"index"},RM:{n:"right middle finger",g:"middle"},RR:{n:"right ring finger",g:"ring"},RP:{n:"right pinky",g:"pinky"},TH:{n:"thumb",g:"thumb"}};
const GCOL={pinky:"--f-pinky",ring:"--f-ring",middle:"--f-middle",index:"--f-index",thumb:"--f-thumb"};
const fcol=f=>FING[f]?"var("+GCOL[FING[f].g]+")":"var(--f-thumb)";
const HOMEID={LP:"KeyA",LR:"KeyS",LM:"KeyD",LI:"KeyF",RI:"KeyJ",RM:"KeyK",RR:"KeyL",RP:"Semicolon"};
const LF={q:"LP",w:"LR",e:"LM",r:"LI",t:"LI",y:"RI",u:"RI",i:"RM",o:"RR",p:"RP",a:"LP",s:"LR",d:"LM",f:"LI",g:"LI",h:"RI",j:"RI",k:"RM",l:"RR",z:"LP",x:"LR",c:"LM",v:"LI",b:"LI",n:"RI",m:"RI"};
const DIG=[["1","!","LP"],["2","@","LR"],["3","#","LM"],["4","$","LI"],["5","%","LI"],["6","^","LI"],["7","&","RI"],["8","*","RM"],["9","(","RR"],["0",")","RP"]];

/* keyboard layouts */
function buildLayout(shape){
  const iso=shape==="iso";
  const K=(id,base,sh,f,w)=>({id,base,sh,f,w:w||1});
  const M=(id,mod,f,w,a)=>({id,mod,f,w,a:a||"s"});
  const Ls=s=>[...s].map(c=>K("Key"+c.toUpperCase(),c,c.toUpperCase(),LF[c]));
  const r0=[iso?Object.assign(K("Backquote","§","±","LP"),{nochar:1}):K("Backquote","`","~","LP")];
  DIG.forEach((d,i)=>r0.push(K("Digit"+d[0],d[0],d[1],d[2])));
  r0.push(K("Minus","-","_","RP"),K("Equal","=","+","RP"),M("Backspace","delete","RP",2,"e"));
  const r1=[M("Tab","tab","LP",1.5),...Ls("qwertyuiop"),K("BracketLeft","[","{","RP"),K("BracketRight","]","}","RP")];
  r1.push(iso?{id:"Enter",mod:"return",f:"RP",w:1.5,a:"e",L:1}:K("Backslash","\\","|","RP",1.5));
  const r2=[M("CapsLock","caps","LP",1.75),...Ls("asdfghjkl"),K("Semicolon",";",":","RP"),K("Quote","'",'"',"RP")];
  r2.push(iso?K("Backslash","\\","|","RP"):M("Enter","return","RP",2.25,"e"));
  const r3=[Object.assign(M("ShiftLeft","shift","LP",iso?1.25:2.25),{sh:1})];
  if(iso)r3.push(K("IntlBackslash","`","~","LP"));
  r3.push(...Ls("zxcvbnm"),K("Comma",",","<","RM"),K("Period",".",">","RR"),K("Slash","/","?","RP"),Object.assign(M("ShiftRight","shift","RP",iso?2.75:2.75,"e"),{sh:1}));
  const r4=[M("Fn","fn","-",1),M("ControlLeft","control","-",1),M("AltLeft","option","-",1.25),M("MetaLeft","command","-",1.5,"s"),
    {id:"Space",base:" ",f:"TH",w:5.5,space:1},M("MetaRight","command","-",1.5,"s"),M("AltRight","option","-",1.25,"e"),{id:"Arrows",mod:"← ↑ ↓ →",f:"-",w:2,a:"c",arrows:1}];
  const keys=[],byId={};
  [r0,r1,r2,r3,r4].forEach((r,ri)=>{let x=0;r.forEach(k=>{k.x=x;k.row=ri;x+=k.w;keys.push(k);byId[k.id]=k})});
  const chars={};
  keys.forEach(k=>{if(k.nochar)return;if(k.space){chars[" "]={id:k.id,shift:false};return}
    if(k.base){chars[k.base]={id:k.id,shift:false};if(k.sh&&typeof k.sh==="string")chars[k.sh]={id:k.id,shift:true}}});
  return {keys,byId,chars};
}
const LAYOUTS={iso:buildLayout("iso"),ansi:buildLayout("ansi")};
let S=null; /* state, set in storage section */
const LAY=()=>LAYOUTS[S&&S.settings.layout==="ansi"?"ansi":"iso"];
const CM=()=>LAY().chars;
const kcx=k=>(k.x+k.w/2);
const STAG={0:-.75,1:-.25,2:0,3:.5};
function reach(id){
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
const shiftIdFor=f=>f&&f[0]==="L"?"ShiftRight":"ShiftLeft";
function charInfo(ch){
  const m=CM()[ch];if(!m)return null;
  const k=LAY().byId[m.id];const sid=m.shift?shiftIdFor(k.f):null;
  return {key:k,shift:m.shift,shiftId:sid,ids:sid?[k.id,sid]:[k.id],fingers:sid?[k.f,LAY().byId[sid].f]:[k.f]};
}
const homeCh=k=>{const m=CM()[k];if(!m)return k;const f=LAY().byId[m.id].f;if(!f||f==="TH")return k;return LAY().byId[HOMEID[f]].base};
const NB={d:"f",k:"j",s:"d",l:"k",a:"s",";":"l",f:"j",j:"f"};

/* lessons */
const LESSONS=[];
(function(){
  const add=(stage,title,keys,wpm,x)=>LESSONS.push(Object.assign({n:LESSONS.length+1,stage,title,keys,wpm},x||{}));
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
const STEP_NAMES=["Find the keys","Combine","Words"];

/* ============================ TEXT GENERATION ============================ */
const BG={};
(function(){const add=(a,b)=>{const r=BG[a]||(BG[a]={});r[b]=(r[b]||0)+1};
  WL.forEach(w=>{let p="^";for(const c of w){add(p,c);p=c}add(p,"$")})})();
const BLOCK=/^(ass|sex|cum|tit|tits|fag|gay|anal|anus|dick|cock|shit|fuck|piss|slut|porn|cunt|rape|nazi|damn|hell|butt|kkk)$/;
function pseudoOnce(al,min,max){
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
function pseudoWord(allowed,o){
  o=o||{};const min=o.min||2,max=o.max||6,must=o.must,al=[...allowed];
  if(al.length<3){
    let s="";const len=2+rnd(3);for(let i=0;i<len;i++)s+=pick(al);
    if(must&&!s.includes(must)){const p=rnd(s.length);s=s.slice(0,p)+must+s.slice(p+1)}
    return s;
  }
  for(let t=0;t<(must?40:1);t++){const s=pseudoOnce(al,min,max);if(!must||s.includes(must))return s}
  let s=pseudoOnce(al,min,max);const p=rnd(s.length+1);return s.slice(0,p)+must+s.slice(p);
}
function pw(al,o){for(let i=0;i<8;i++){const w=pseudoWord(al,o);if(!BLOCK.test(w))return w}return pseudoWord(al,o)}
const poolCache={};
function realPool(set,min,max){const key=[...set].sort().join("")+min+"_"+max;
  return poolCache[key]||(poolCache[key]=WL.filter(w=>w.length>=min&&w.length<=max&&[...w].every(c=>set.has(c))))}
function fill(next,target,maxTok){
  const t=[];let len=0,g=0;
  while(len<target&&t.length<maxTok&&g++<400){const w=next(t);if(w==null||w===""||(t.length&&t[t.length-1]===w))continue;if(BADDEAD.test(w))continue;t.push(w);len+=w.length+1}
  return t;
}
function ctx(n){
  const L=LESSONS[n-1],known=new Set();
  for(let i=0;i<n-1;i++)LESSONS[i].keys.forEach(k=>known.add(k));
  const all=new Set([...known,...L.keys]);
  const letters=n>=19?"abcdefghijklmnopqrstuvwxyz".split(""):[...all].filter(isLetter);
  return {L,n,known,newK:L.keys,all,letters,newLetters:L.keys.filter(isLetter)};
}
function strengthOf(st,minN){
  if(!st||st.n<(minN||8))return null;
  const tms=60000/(S.settings.target*5);
  const speed=st.timeEma?tms/st.timeEma:.3,acc=(1-st.errEma)/.95;
  return Math.min(1.5,speed,acc);
}
const usefulPair=p=>/^[a-z]{2}$/.test(p)&&((BG[p[0]]||{})[p[1]]||0)>=3;
const weakW=ch=>{const sv=strengthOf(S.keys[ch]);return sv==null?.8:Math.max(.1,1.6-sv)};
function decorate(t,c,minNew){
  const P=",.;/",has=s=>/[,.;/]/.test(s);
  const newP=c.newK.filter(k=>P.includes(k)),knownP=[...c.known].filter(k=>P.includes(k)&&!c.newK.includes(k));
  const marks=[];
  newP.forEach(k=>{for(let i=0;i<minNew;i++)marks.push(k)});
  knownP.forEach(k=>{if(Math.random()<.7)marks.push(k)});
  marks.filter(m=>m!=="/").forEach(m=>{const idx=[];t.forEach((w,i)=>{if(!has(w))idx.push(i)});if(idx.length)t[pick(idx)]+=m});
  marks.filter(m=>m==="/").forEach(()=>{const idx=[];for(let i=0;i<t.length-1;i++)if(!has(t[i])&&!has(t[i+1]))idx.push(i);if(idx.length){const i=pick(idx);t[i]=t[i]+"/"+t[i+1];t.splice(i+1,1)}});
  return t;
}
function drill(c,len){
  len=len||45;const ks=c.newK,pats=["hkh","khk","hhk","kkh","hkk","kkk","hko","kh","hk"];
  const t=[];let l=0,g=0;
  while(l<len&&g++<400){
    const k=ks[t.length%ks.length],k2=ks[(t.length+1)%ks.length];
    const hh=x=>{const h=homeCh(x);return h===x?(NB[x]||x):h};
    const pat=pick(ks.length>1?pats:pats.filter(p=>p!=="hko"));
    const tok=[...pat].map(p=>p==="h"?hh(k):p==="k"?k:hh(k2)).join("");
    if(BADDEAD.test(tok)||tok===t[t.length-1])continue;
    t.push(tok);l+=tok.length+1;
  }
  return t.join(" ");
}
function combine(c){
  const nl=c.newLetters;
  const t=fill(()=>pw(c.letters,{min:3,max:5,must:nl.length?pick(nl):null}),60,12);
  decorate(t,c,2);return t.join(" ");
}
function wordText(c,len,review){
  const nl=c.newLetters,set=new Set(c.letters);
  let cand=realPool(set,2,c.n>=13?9:8).slice();
  if(cand.length<15){const have=new Set(cand);let g=0;
    while(cand.length<15&&g++<120){const w=pw(c.letters,{min:3,max:5,must:nl.length?pick(nl):null});if(!have.has(w)){have.add(w);cand.push(w)}}}
  const withNew=nl.length?cand.filter(w=>nl.some(k=>w.includes(k))):[];
  const ws=new Set(withNew),others=cand.filter(w=>!ws.has(w));
  const wf=w=>1+[...w].reduce((s,ch)=>s+weakW(ch),0)/w.length*3;
  const next=()=>{
    if(review)return wpick(cand,wf);
    if(withNew.length&&(Math.random()<.68||!others.length))return pickF(withNew);
    return pickF(others.length?others:cand);
  };
  const t=fill(next,len,40);
  /* every key of the lesson shows up at least once: a few keys (J above all) have almost no words */
  c.letters.filter(k=>!t.some(w=>w.includes(k))).forEach(k=>{
    const pool=cand.filter(w=>w.includes(k)),w=pool.length?pick(pool):pw(c.letters,{min:3,max:5,must:k});
    t.splice(1+rnd(t.length),0,w);
  });
  decorate(t,c,len>=100?3:2);return t.join(" ");
}
function genReview(c,s){
  if(s===1){const t=fill(()=>pw(c.letters,{min:3,max:5,must:wpick(c.letters,weakW)}),45,14);return t.join(" ")}
  return wordText(c,s===2?60:120,true);
}
/* lesson 19: capitals */
function gen19(s){
  const LH=["a","s","d","f","g"],RH=["h","j","k","l"];
  if(s===1){
    const t=[];while(t.length<14){const left=Math.random()<.5,A=left?LH:RH,B=left?RH:LH;
      const tok=cap(pick(A))+pick(B)+(Math.random()<.4?pick(B):"");if(tok!==t[t.length-1])t.push(tok)}
    return t.join(" ");
  }
  const short=WL.filter(w=>w.length>=2&&w.length<=6);
  if(s===2)return fill(()=>{const w=pickF(short);return Math.random()<.5?cap(w):w},60,12).join(" ");
  let out="";
  while(out.length<90){
    const n=4+rnd(3),ws=[];for(let i=0;i<n;i++){const w=pickF(WL.filter(x=>x.length>=2&&x.length<=7).slice(0,500));ws.push(i===0||Math.random()<.3?cap(w):w)}
    out+=(out?" ":"")+ws.join(" ")+".";
  }
  return out;
}
/* lesson 20: templates + short building blocks */
const CONTR=["don't","it's","I'm","we'll","you're","I'd","I've","can't","won't","isn't","that's","let's","they're","we've","he's","she's"];
const VERBS=["see","find","type","read","make","take","keep","try","hold","check"];
const ADJ=["slow","steady","calm","clear","quick","light"];
const HYPH=["well-known","long-term","short-term","quick-start","real-life","ten-minute","step-by-step","easy-going"];
const QWORDS=WL.filter(w=>w.length>=3&&w.length<=6&&!/^[aeiouycn]/.test(w)).slice(0,300);
const W20=WL.filter(w=>w.length>=3&&w.length<=6).slice(0,300);
function sent20(kind){
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
function gen20(s,c){
  if(s===1)return drill(c,45);
  const kinds=s===2?["ques","excl","contr"]:["hyph","quote","colon","contr"];
  return kinds.map(sent20).join(" ");
}
/* lessons 21, 22: numbers */
const NOUNS=["days","cars","books","trees","hours","miles","dogs","cats","cups","keys","pens","boxes","coins","apples","birds","chairs","doors","lamps"];
function genNum(n,s,c){
  if(s===1)return drill(c,45);
  const ds=s===2?c.newK:[...new Set([...c.known,...c.newK].filter(k=>/\d/.test(k)))];
  const tok=()=>{const len=1+rnd(4);let x="";for(let i=0;i<len;i++){let d=pick(ds);if(i===0&&len>1&&d==="0")d=pick(ds.filter(z=>z!=="0")||ds);x+=d}
    return Math.random()<.85?x+" "+pick(NOUNS):x};
  return fill(tok,s===2?60:90,12).join(" ");
}
function genStep(n,s){
  const c=ctx(n),L=c.L;
  if(L.shift)return gen19(s);
  if(L.punct)return gen20(s,c);
  if(L.digits)return genNum(n,s,c);
  if(L.review)return genReview(c,s);
  if(s===1)return drill(c,45);
  if(s===2)return combine(c);
  return wordText(c,90,false);
}
function genLesson(n){
  let r;
  for(let a=0;a<12;a++){r=[1,2,3].map(s=>genStep(n,s).trim());if(r.every(t=>t&&!BADDEAD.test(t)&&!/ {2}/.test(t)))return r}
  return r;
}
function wpmCalc(chars,ms){return ms>0?(chars/5)/(ms/60000):0}
