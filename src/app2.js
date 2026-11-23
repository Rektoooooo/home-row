
/* ============================ STORAGE ============================ */
const DEF={hints:"always",stop:true,sound:false,soundPack:"off",weekly:false,goal:15,target:25,layout:"iso",unlockAll:false,pace:"target",pCaps:false,pPunct:false,pNums:false,tDur:30,tPool:"c200",tCaps:false,tPunct:false,tNums:false};
const BEST0=()=>({practice:0,lessonWpm:0,test15:0,test30:0,test60:0,test120:0});
function emptyState(){return {v:1,updatedAt:0,resetAt:0,settings:Object.assign({},DEF),settingsAt:0,lessons:{},custom:{},keys:{},keysAt:0,pairs:{},pairsAt:0,days:{},tests:[],bests:BEST0(),seenTips:{deadKey:false,welcome:false},ach:{},baseline:null,modes:{text:0,code:0,mine:0,at:0}}}
const fin=x=>typeof x==="number"&&isFinite(x);
const isObj=x=>x&&typeof x==="object"&&!Array.isArray(x);
const num=(x,d,lo,hi)=>fin(x)?Math.min(hi,Math.max(lo,x)):d;
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k),PACKS=["off","soft","cream","click","type"];
function sanitize(o){
  if(!isObj(o))return null;
  const s=emptyState();
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
    if(!(n>=1&&n<=LESSONS.length)||!isObj(r))continue;
    s.lessons[n]={done:!!r.done,stars:num(r.stars,0,0,3)|0,wpm:num(r.wpm,0,0,500),acc:num(r.acc,0,0,1),attempts:num(r.attempts,0,0,1e6)|0,last:num(r.last,0,0,1e15)}}
  if(isObj(o.custom)){let c=0;for(const id of Object.keys(o.custom)){if(c++>=100)break;const r=o.custom[id];
    if(!/^[A-Za-z0-9_-]{1,40}$/.test(id)||!isObj(r))continue;
    s.custom[id]={wpm:num(r.wpm,0,0,500),acc:num(r.acc,0,0,1),stars:num(r.stars,0,0,3)|0,attempts:num(r.attempts,0,0,1e6)|0,last:num(r.last,0,0,1e15)}}}
  if(isObj(o.keys)){let c=0;for(const k of Object.keys(o.keys)){if(c++>200)break;const r=o.keys[k];
    if(k.length>8||!isObj(r)||!fin(r.n))continue;
    s.keys[k]={n:num(r.n,0,0,1e7)|0,errEma:num(r.errEma,.05,0,1)};if(fin(r.timeEma)&&r.timeEma>0)s.keys[k].timeEma=Math.min(1e5,r.timeEma)}}
  if(isObj(o.pairs)){let c=0;for(const k of Object.keys(o.pairs)){if(c++>=300)break;const r=o.pairs[k];
    if(!/^[a-z]{2}$/.test(k)||!isObj(r)||!fin(r.n))continue;
    s.pairs[k]={n:num(r.n,0,0,1e7)|0,errEma:num(r.errEma,.05,0,1)};if(fin(r.timeEma)&&r.timeEma>0)s.pairs[k].timeEma=Math.min(1e5,r.timeEma)}}
  if(isObj(o.days)){const ks=Object.keys(o.days).filter(k=>/^\d{4}-\d{2}-\d{2}$/.test(k)).sort().slice(-400);
    ks.forEach(k=>{const r=o.days[k];if(!isObj(r))return;
      s.days[k]={ms:num(r.ms,0,0,1e10),chars:num(r.chars,0,0,1e8),presses:num(r.presses,0,0,1e8),correct:num(r.correct,0,0,1e8),ex:num(r.ex,0,0,1e6)|0,t:num(r.t,0,0,1e15)}})}
  if(Array.isArray(o.tests))s.tests=o.tests.filter(t=>isObj(t)&&fin(t.ts)&&fin(t.wpm)&&fin(t.acc)).slice(-100).map(t=>({ts:t.ts,dur:num(t.dur,0,0,1e4),pool:String(t.pool||"").slice(0,20),opts:String(t.opts||"").slice(0,10),wpm:t.wpm,raw:num(t.raw,0,0,1e4),acc:t.acc}));
  if(isObj(o.bests))for(const k of Object.keys(s.bests))s.bests[k]=num(o.bests[k],0,0,1e4);
  if(isObj(o.seenTips)){s.seenTips.deadKey=!!o.seenTips.deadKey;s.seenTips.welcome=!!o.seenTips.welcome}
  if(isObj(o.ach)){let c=0;for(const id of Object.keys(o.ach)){if(c>=64)break;const t=o.ach[id];if(!/^[a-z0-9-]{1,32}$/.test(id)||!fin(t)||t<0)continue;s.ach[id]=Math.min(1e15,t);c++}}
  if(isObj(o.baseline)&&fin(o.baseline.ts)&&fin(o.baseline.wpm))s.baseline={wpm:num(o.baseline.wpm,0,0,500),acc:num(o.baseline.acc,0,0,1),ts:num(o.baseline.ts,0,0,1e15)};
  if(isObj(o.modes)){["text","code","mine"].forEach(k=>{s.modes[k]=num(o.modes[k],0,0,1e9)|0});s.modes.at=num(o.modes.at,0,0,1e15)}
  return s;
}
function mx(a,b){return Math.max(a||0,b||0)}
function merge(a,b){
  if(!b)return a;
  const r=mx(a.resetAt,b.resetAt),o=emptyState();o.resetAt=r;
  [a,b].forEach(s=>{
    for(const id of Object.keys(s.lessons)){const x=s.lessons[id];if(x.last<r)continue;const y=o.lessons[id];
      o.lessons[id]=y?{done:y.done||x.done,stars:mx(y.stars,x.stars),wpm:mx(y.wpm,x.wpm),acc:mx(y.acc,x.acc),attempts:mx(y.attempts,x.attempts),last:mx(y.last,x.last)}:Object.assign({},x)}
    for(const id of Object.keys(s.custom||{})){const x=s.custom[id];if(x.last<r)continue;const y=o.custom[id];
      o.custom[id]=y?{wpm:mx(y.wpm,x.wpm),acc:mx(y.acc,x.acc),stars:mx(y.stars,x.stars),attempts:mx(y.attempts,x.attempts),last:mx(y.last,x.last)}:Object.assign({},x)}
    for(const d of Object.keys(s.days)){const x=s.days[d];if(x.t<r)continue;const y=o.days[d];
      o.days[d]=y?{ms:mx(y.ms,x.ms),chars:mx(y.chars,x.chars),presses:mx(y.presses,x.presses),correct:mx(y.correct,x.correct),ex:mx(y.ex,x.ex),t:mx(y.t,x.t)}:Object.assign({},x)}
    if(s.updatedAt>=r)for(const k of Object.keys(o.bests))o.bests[k]=mx(o.bests[k],s.bests[k]);
    s.tests.forEach(t=>{if(t.ts>=r&&!o.tests.some(u=>u.ts===t.ts))o.tests.push(t)});
    o.seenTips.deadKey=o.seenTips.deadKey||s.seenTips.deadKey;o.seenTips.welcome=o.seenTips.welcome||s.seenTips.welcome;
    for(const id of Object.keys(s.ach)){const t=s.ach[id];if(t<r)continue;o.ach[id]=own(o.ach,id)?Math.min(o.ach[id],t):t}
    if(s.baseline&&s.baseline.ts>=r&&(!o.baseline||s.baseline.ts<o.baseline.ts))o.baseline=Object.assign({},s.baseline);
    if(s.modes.at>=r){["text","code","mine"].forEach(k=>{o.modes[k]=mx(o.modes[k],s.modes[k])});o.modes.at=mx(o.modes.at,s.modes.at)}
  });
  o.tests.sort((x,y)=>x.ts-y.ts);o.tests=o.tests.slice(-100);
  {const ak=Object.keys(o.ach);if(ak.length>64){const keep=ak.sort((x,y)=>o.ach[x]-o.ach[y]).slice(0,64),na={};keep.forEach(k=>{na[k]=o.ach[k]});o.ach=na}}
  const dk=Object.keys(o.days).sort();dk.slice(0,Math.max(0,dk.length-400)).forEach(k=>delete o.days[k]);
  const ss=b.settingsAt>a.settingsAt?b:a;o.settings=Object.assign({},ss.settings);o.settingsAt=mx(a.settingsAt,b.settingsAt);
  const ka=a.keysAt>=r?a:null,kb=b.keysAt>=r?b:null;const kw=ka&&kb?(kb.keysAt>ka.keysAt?kb:ka):(ka||kb);
  if(kw){o.keys=JSON.parse(JSON.stringify(kw.keys));o.keysAt=kw.keysAt}
  const pa=a.pairsAt>=r?a:null,pb=b.pairsAt>=r?b:null;const pw2=pa&&pb?(pb.pairsAt>pa.pairsAt?pb:pa):(pa||pb);
  if(pw2){o.pairs=JSON.parse(JSON.stringify(pw2.pairs));o.pairsAt=pw2.pairsAt}
  o.updatedAt=mx(a.updatedAt,b.updatedAt);
  return o;
}
function stable(x){if(Array.isArray(x))return "["+x.map(stable).join(",")+"]";if(isObj(x))return "{"+Object.keys(x).sort().map(k=>JSON.stringify(k)+":"+stable(x[k])).join(",")+"}";return JSON.stringify(x)}
const LSK="homerow.v1";
function loadLocal(){try{const raw=localStorage.getItem(LSK);if(raw){const s=sanitize(JSON.parse(raw));if(s)return s}}catch(e){}return emptyState()}
function writeLocal(){try{localStorage.setItem(LSK,JSON.stringify(S))}catch(e){}}

let saveStatus="connecting",acct=null,writing=false,dirty=false,retried=false,statusHooks=[];
const STATUS_TXT={connecting:"Connecting…",local:"Saved in this browser only",offline:"Saved in this browser only (offline)",account:"Saved to your claude.ai account",failed:"Saved in this browser only (account unavailable)"};
function setSaveStatus(s){saveStatus=s;const el=document.getElementById("save-status");if(el)el.textContent=STATUS_TXT[s];statusHooks.forEach(f=>{try{f(s)}catch(e){}})}
/* call after a finished exercise, a settings change or a reset */
function save(){S.updatedAt=Date.now();writeLocal();if(acct){dirty=true;flush()}}
async function flush(){
  if(writing||!acct||!dirty)return;
  writing=true;dirty=false;
  try{await acct.set(JSON.parse(JSON.stringify(S)));retried=false}
  catch(e){
    const code=String((e&&(e.code||e.name))||"")+" "+String((e&&e.message)||"");
    if(/unavailable/i.test(code)&&!retried){retried=true;dirty=true;writing=false;setTimeout(flush,1000+rnd(2000));return}
    if(/invalid_argument|revoked|not_granted/i.test(code)){acct=null;setSaveStatus("failed")}
    else if(/unavailable/i.test(code)){setSaveStatus("offline")}
  }
  writing=false;
  if(dirty)flush();
}
async function connectAccount(){
  try{
    if(!window.claude||typeof window.claude.use!=="function")return setSaveStatus("local");
    const timeout=ms=>new Promise((_,rej)=>setTimeout(()=>rej(new Error("timeout")),ms));
    const [db,user]=await Promise.race([Promise.all([window.claude.use("db"),window.claude.use("user")]),timeout(10000)]);
    const id=user?await user.id():null;
    if(!db||!id)return setSaveStatus("local");
    ACCT={db,id};coachConnect();
    const ref=db.doc("data/users/"+id+"/progress");
    let snap;try{snap=await Promise.race([ref.get(),timeout(10000)])}catch(e){return setSaveStatus("offline")}
    const remote=snap&&snap.exists?sanitize(snap.data()):null;
    const merged=merge(S,remote);
    S=merged;writeLocal();acct=ref;
    onRemoteApplied();
    if(S.updatedAt>0&&(!remote||stable(merged)!==stable(remote))){dirty=true;flush()}
    setSaveStatus("account");
  }catch(e){setSaveStatus(window.claude?"offline":"local")}
}
function resetAll(){
  const now=Date.now(),st=emptyState();
  st.settings=S.settings;st.settingsAt=S.settingsAt;st.seenTips=S.seenTips;st.modes.at=now;st.resetAt=now;st.updatedAt=now;st.keysAt=now;st.pairsAt=now;
  S=st;save();
}

/* stats helpers */
const dateKey=(d)=>{d=d||new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")};
function addDay(ms,chars,presses,correct){
  const k=dateKey(),d=S.days[k]||(S.days[k]={ms:0,chars:0,presses:0,correct:0,ex:0,t:0});
  d.ms+=ms;d.chars+=chars;d.presses+=presses;d.correct+=correct;d.ex+=1;d.t=Date.now();
  const ks=Object.keys(S.days).sort();ks.slice(0,Math.max(0,ks.length-400)).forEach(x=>delete S.days[x]);
}
function applyKeyEvents(evs){
  evs.forEach(e=>{
    if(e.c==="\n")return;/* code rounds: Enter is timed for flow only, never a stat key */
    const keys=[e.c.toLowerCase()];if(e.c!==e.c.toLowerCase())keys.push("shift");
    keys.forEach(k=>{const st=S.keys[k]||(S.keys[k]={n:0,errEma:.05});
      st.n+=1;st.errEma=st.errEma*.95+(e.miss?1:0)*.05;
      if(e.dt!=null&&!e.miss)st.timeEma=st.timeEma?st.timeEma*.9+e.dt*.1:e.dt});
  });
  S.keysAt=Date.now();
  evs.forEach(e=>{
    if(!e.pc)return;const a=e.pc.toLowerCase(),b=e.c.toLowerCase();
    if(!/^[a-z]$/.test(a)||!/^[a-z]$/.test(b))return;
    const k=a+b,st=S.pairs[k]||(S.pairs[k]={n:0,errEma:.05}),miss=e.miss||e.pmiss;
    st.n+=1;st.errEma=st.errEma*.95+(miss?1:0)*.05;
    if(!miss&&e.dt!=null)st.timeEma=st.timeEma?st.timeEma*.9+e.dt*.1:e.dt;
  });
  const pk=Object.keys(S.pairs);
  if(pk.length>300){pk.sort((x,y)=>S.pairs[x].n-S.pairs[y].n).slice(0,pk.length-300).forEach(k=>delete S.pairs[k])}
  S.pairsAt=Date.now();
}
const minutesToday=()=>{const d=S.days[dateKey()];return d?d.ms/60000:0};
function streak(){
  let n=0;const d=new Date();
  if(!(S.days[dateKey(d)]&&S.days[dateKey(d)].ms>=60000))d.setDate(d.getDate()-1);
  while(S.days[dateKey(d)]&&S.days[dateKey(d)].ms>=60000){n++;d.setDate(d.getDate()-1)}
  return n;
}
const lessonDone=n=>!!(S.lessons[n]&&S.lessons[n].done);
const unlocked=n=>n===1||S.settings.unlockAll||lessonDone(n-1);
function nextLessonN(){for(let n=1;n<=LESSONS.length;n++)if(!lessonDone(n)&&unlocked(n))return n;return 0}
function learnedChars(){const set=new Set();LESSONS.forEach(L=>{if(lessonDone(L.n))L.keys.forEach(k=>set.add(k))});return set}
function weakestKey(){
  const learned=learnedChars();let best=null,bv=9;
  learned.forEach(k=>{const sv=strengthOf(S.keys[k.toLowerCase()]);if(sv!=null&&sv<bv){bv=sv;best=k}});
  return best;
}

/* ============================ KEYBOARD + HANDS SVG ============================ */
const U=60,G=3;
let KSID="ks0",KSN=0;  /* the sheen gradient id of the keyboard being built */
function keySVG(k){
  const x=k.x*U,y=k.row*U,w=k.w*U,h=U-2*G;
  const cls=["key"];if(k.mod&&!k.sh)cls.push("mod");
  const style=k.f&&k.f!=="-"?'style="--fc:'+fcol(k.f)+'"':"";
  let shape,edge,txt="";
  if(k.L){
    const x0=x+G,x1=x+w-G,xm=x+G+.25*U,yt=y+G,yn=y+U-G,yb=y+2*U-G,r=8;
    const d="M"+(x0+r)+","+yt+" H"+(x1-r)+" Q"+x1+","+yt+" "+x1+","+(yt+r)+" V"+(yb-r)+" Q"+x1+","+yb+" "+(x1-r)+","+yb+" H"+(xm+r)+" Q"+xm+","+yb+" "+xm+","+(yb-r)+" V"+(yn+r)+" Q"+xm+","+yn+" "+(xm-r)+","+yn+" H"+(x0+r)+" Q"+x0+","+yn+" "+x0+","+(yn-r)+" V"+(yt+r)+" Q"+x0+","+yt+" "+(x0+r)+","+yt+" Z";
    shape='<path class="cap" d="'+d+'"/><path class="shine" d="'+d+'" fill="url(#'+KSID+')"/>';edge='<path class="edge" d="'+d+'" transform="translate(0,4)"/>';
    txt='<text class="ml" x="'+(x+w-G-9)+'" y="'+(y+2*U-G-9)+'" text-anchor="end">return</text>';
  }else{
    shape='<rect class="cap" x="'+(x+G)+'" y="'+(y+G)+'" width="'+(w-2*G)+'" height="'+h+'" rx="9"/><rect class="shine" x="'+(x+G)+'" y="'+(y+G)+'" width="'+(w-2*G)+'" height="'+h+'" rx="9" fill="url(#'+KSID+')"/>';
    edge='<rect class="edge" x="'+(x+G)+'" y="'+(y+G+4)+'" width="'+(w-2*G)+'" height="'+h+'" rx="9"/>';
    if(k.mod){const a=k.a==="e"?"end":k.a==="c"?"middle":"start",tx=k.a==="e"?x+w-G-9:k.a==="c"?x+w/2:x+G+9;
      txt='<text class="ml" x="'+tx+'" y="'+(y+G+h-8)+'" text-anchor="'+a+'">'+esc(k.mod)+'</text>'}
    else if(k.sh&&typeof k.sh==="string"&&!/^[A-Z]$/.test(k.sh)){
      txt='<text class="sl" x="'+(x+G+10)+'" y="'+(y+G+20)+'">'+esc(k.sh)+'</text><text class="bl" x="'+(x+G+10)+'" y="'+(y+G+43)+'">'+esc(k.base)+'</text>'}
    else if(k.base&&!k.space){txt='<text class="lg" x="'+(x+w/2)+'" y="'+(y+G+h/2+9)+'" text-anchor="middle">'+esc(k.base.toUpperCase())+'</text>'}
  }
  txt=txt.replace(/<text /g,'<text aria-hidden="true" ');
  if(k.base&&!k.space&&!k.L)txt+='<text class="hv" aria-hidden="true" x="'+(x+w/2)+'" y="'+(y+G+h-7)+'" text-anchor="middle"></text>';
  const bump=(k.id==="KeyF"||k.id==="KeyJ")?'<rect class="bump" x="'+(x+w/2-9)+'" y="'+(y+G+h-10)+'" width="18" height="3" rx="1.5"/>':"";
  const ring=k.L?"":'<rect class="ring" x="'+(x+G)+'" y="'+(y+G)+'" width="'+(w-2*G)+'" height="'+h+'" rx="8"/>';
  return '<g class="'+cls.join(" ")+'" data-id="'+k.id+'" '+style+'>'+edge+'<g class="top">'+shape+txt+bump+ring+'</g></g>';
}
function makeKeyboard(svg,mode){
  const c={svg,els:{},st:{next:[],learned:[],upnext:[]},timers:{}};
  c.build=()=>{
    const lay=LAY();svg.setAttribute("viewBox","0 0 900 304");svg.setAttribute("data-mode",mode);
    KSID="ks"+(++KSN);
    svg.innerHTML='<defs><linearGradient id="'+KSID+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".75"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>'+lay.keys.map(keySVG).join("");c.els={};
    svg.querySelectorAll(".key").forEach(g=>{c.els[g.getAttribute("data-id")]=g});c.apply();
  };
  c.apply=()=>{
    const t=(list,cls)=>{const s=new Set(list);for(const id in c.els)c.els[id].classList.toggle(cls,s.has(id))};
    t(c.st.next,"next");t(c.st.learned,"learned");t(c.st.upnext,"upnext");
  };
  c.set=o=>{Object.assign(c.st,o);c.apply()};
  c.setHeat=m=>{for(const id in c.els){const g=c.els[id],d=m&&m[id];g.classList.toggle("has",!!d);g.classList.toggle("hot",!!(d&&d.hot));if(d)g.style.setProperty("--hp",d.pct.toFixed(0)+"%");else g.style.removeProperty("--hp");const t=g.querySelector(".hv");if(t)t.textContent=d?d.label:""}};
  const flash=(id,cls,ms)=>{const g=c.els[id];if(!g)return;g.classList.add(cls);clearTimeout(c.timers[id+cls]);c.timers[id+cls]=setTimeout(()=>g.classList.remove(cls),ms)};
  c.press=id=>flash(id,"down",90);c.err=id=>flash(id,"err",180);
  c.build();KBS.push(c);return c;
}
let KBS=[];
function rebuildKeyboards(){KBS.forEach(k=>k.build())}
function idsFor(chars){
  const ids=new Set();
  chars.forEach(ch=>{if(ch==="shift"){ids.add("ShiftLeft");ids.add("ShiftRight");return}const i=charInfo(ch);if(i)i.ids.forEach(x=>ids.add(x))});
  return [...ids];
}
function makeHands(svg){
  const cx={LP:135,LR:195,LM:255,LI:315,RI:495,RM:555,RR:615,RP:675},len={P:48,R:64,M:72,I:64};
  const L={LP:len.P,LR:len.R,LM:len.M,LI:len.I,RI:len.I,RM:len.M,RR:len.R,RP:len.P};
  let h='<rect class="palm" x="105" y="62" width="250" height="50" rx="25"/><rect class="palm" x="465" y="62" width="250" height="50" rx="25"/>';
  for(const f in cx)h+='<rect class="hf" data-f="'+f+'" style="--fc:'+fcol(f)+'" x="'+(cx[f]-22)+'" y="'+(80-L[f])+'" width="44" height="'+(L[f]+22)+'" rx="22"/>';
  h+='<rect class="hf" data-f="TH" style="--fc:var(--f-thumb)" x="-22" y="-60" width="44" height="76" rx="22" transform="translate(352,106) rotate(38)"/>';
  h+='<rect class="hf" data-f="TH" style="--fc:var(--f-thumb)" x="-22" y="-60" width="44" height="76" rx="22" transform="translate(448,106) rotate(-38)"/>';
  svg.setAttribute("viewBox","0 0 900 126");svg.innerHTML=h;
  const c={svg,set:list=>{const s=new Set(list);svg.querySelectorAll(".hf").forEach(e=>e.classList.toggle("on",s.has(e.getAttribute("data-f"))))}};
  return c;
}
