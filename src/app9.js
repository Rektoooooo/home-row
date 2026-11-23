/* ============================ LOGO, FAVICON, WELCOME (phase A) ============================ */
/* the brand mark: two square F and J keycaps with their home bumps, overlapping on a dark app-icon tile (64 unit grid).
   Letters are strokes, not text, so they stay crisp at 16 px and need no font. Key paths are centred on (0,0). */
const LOGO_F="M-4-8V4M-4-8h8M-4-2.5h6.5",LOGO_J="M3.5-8v8a3.75 3.75 0 0 1-7.5 0";
const LOGO_KEYS=[[21,25,-8,LOGO_F],[43,36,6,LOGO_J]]; /* [centre x, centre y, tilt in degrees, letter] */
const LOGO_INK="#161A26",LOGO_EDGE="#9C9486",LOGO_BUMP="#F5A524",LOGO_GAP="#1B1F2E";
let logoN=0;
function logoBody(g){
  const key=(k,i)=>'<g transform="translate('+k[0]+' '+k[1]+') rotate('+k[2]+')">'+(i?'<rect x="-15.75" y="-15.75" width="31.5" height="35.5" rx="8.75" fill="'+LOGO_GAP+'"/>':'')+
    '<rect x="-14" y="-10" width="28" height="28" rx="7" fill="'+LOGO_EDGE+'"/><rect x="-14" y="-14" width="28" height="28" rx="7" fill="url(#'+g+'c)"/>'+
    '<path d="'+k[3]+'" fill="none" stroke="'+LOGO_INK+'" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/><rect x="-4" y="6.6" width="8" height="2.4" rx="1.2" fill="'+LOGO_BUMP+'"/></g>';
  return '<defs><linearGradient id="'+g+'t" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2B3147"/><stop offset="1" stop-color="#0C0F18"/></linearGradient>'+
    '<linearGradient id="'+g+'c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#E3DED3"/></linearGradient></defs>'+
    '<rect width="64" height="64" rx="15" fill="url(#'+g+'t)"/><rect x=".75" y=".75" width="62.5" height="62.5" rx="14.25" fill="none" stroke="#fff" stroke-opacity=".12" stroke-width="1.5"/>'+LOGO_KEYS.map(key).join("");
}
function logoSVG(size){return '<svg class="logo" width="'+size+'" height="'+size+'" viewBox="0 0 64 64" aria-hidden="true" focusable="false">'+logoBody("lg"+(++logoN))+'</svg>'}
function addFavicon(){
  if(document.head.querySelector('link[rel~="icon"]'))return;
  const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">'+logoBody("f")+'</svg>';
  const l=document.createElement("link");l.rel="icon";l.type="image/svg+xml";l.href="data:image/svg+xml,"+encodeURIComponent(svg);document.head.appendChild(l);
}

/* ---- welcome flow ---- */
Object.assign(IC,{clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5"/><path d="M12 12h.01"/>',chat:'<path d="M5 5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-7l-5 4v-4H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"/>'});
const WEL_GOALS=[[10,"Casual"],[15,"Regular"],[20,"Serious"],[30,"Intense"]];
const WEL_STAGES=[["Home row","lessons 1–6",.2,"--f-index"],["All letters","lessons 7–17",.5,"--f-middle"],["Capitals, punctuation and numbers","lessons 18–22",.3,"--f-pinky"]];
const WEL_H=12;
const WEL_SOUNDS=[["soft","Soft","Quiet and gentle"],["cream","Creamy","Deep, smooth thock"],["click","Clicky","Crisp and snappy"],["type","Typewriter","Old-school clack"]];
const WL_SPK='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/></svg>';
const wlSound0=()=>S.settings.soundPack&&S.settings.soundPack!=="off"?S.settings.soundPack:"cream";
const wlDur=n=>n>=14?"about "+Math.round(n/7)+(Math.round(n/7)===1?" week":" weeks"):"about "+n+(n===1?" day":" days");
const wlDays=(share,goal)=>Math.max(1,Math.round(WEL_H*share*60/goal));
/* mini keyboard drawings: the highlighted keys are the ones that tell ISO and ANSI apart */
function wlKb(iso){
  const u=18,g=1,rows=[[],[],[]],R=(x,w,r,hl)=>'<rect class="mk'+(hl?" hl":"")+'" x="'+(x*u+g)+'" y="'+(r*20+g)+'" width="'+(w*u-2*g)+'" height="'+(18-2*g)+'" rx="3"/>';
  let h="",x;
  /* row 0: Tab + 12 keys, then the Enter top (ISO) or backslash (ANSI) */
  h+=R(0,1.5,0);for(x=1.5;x<13.5;x++)h+=R(x,1,0);
  if(iso){const a=13.5*u+g,b=15*u-g,c=13.75*u+g,t=g,m=38-g;h+='<path class="mk hl" d="M'+a+' '+t+'H'+b+'V'+m+'H'+c+'V'+(18-g)+'H'+a+'Z"/>'}else h+=R(13.5,1.5,0);
  /* row 1: Caps + keys, then the Enter */
  h+=R(0,1.75,1);for(x=1.75;x<(iso?13.75:12.75);x++)h+=R(x,1,1);
  if(!iso)h+=R(12.75,2.25,1,true);
  /* row 2: left Shift (short + one extra key on ISO), keys, right Shift */
  if(iso){h+=R(0,1.25,2,true)+R(1.25,1,2,true);for(x=2.25;x<12.25;x++)h+=R(x,1,2)}else{h+=R(0,2.25,2,true);for(x=2.25;x<12.25;x++)h+=R(x,1,2)}
  h+=R(12.25,2.75,2);
  return '<svg class="wl-kb" viewBox="0 0 '+(15*u)+' 58" aria-hidden="true" focusable="false">'+h+'</svg>';
}
let WEL=null; /* {step,layout,goal,sound,sound0,soundSeen,res,checking,el} */
const wlHasProgress=()=>Object.values(S.lessons).some(l=>l.attempts>0)||Object.keys(S.days).length>0||S.tests.length>0||!!S.baseline;
function wlEl(){
  if(WEL&&WEL.el)return WEL.el;
  const el=document.createElement("div");el.className="welcome";el.hidden=true;el.setAttribute("role","dialog");el.setAttribute("aria-modal","true");el.setAttribute("aria-labelledby","wl-title");
  el.innerHTML='<div class="wl-top"><span class="brand-mark">'+logoSVG(30)+'</span><div class="wl-dots" id="wl-dots" role="img"></div><button class="btn quiet sm" type="button" data-wl="skip">Skip</button></div><div class="wl-main"><div class="wl-col" id="wl-col"></div></div>';
  el.addEventListener("click",wlClick);
  $("app").appendChild(el);return el;
}
const wlInert=on=>{[document.querySelector("header.top"),document.querySelector(".col")].forEach(n=>{if(n){if(on)n.setAttribute("inert","");else n.removeAttribute("inert")}})};
function showWelcome(step){
  if(!WEL)WEL={layout:S.settings.layout,goal:S.settings.goal,sound:wlSound0(),sound0:S.settings.soundPack,soundSeen:false,res:null,step:1,checking:false,el:null};
  if(step===1){WEL.layout=S.settings.layout;WEL.goal=S.settings.goal;WEL.sound=wlSound0();WEL.sound0=S.settings.soundPack;WEL.soundSeen=false;WEL.res=null}
  WEL.el=wlEl();WEL.checking=false;stopExercise();
  WEL.el.hidden=false;wlInert(true);document.documentElement.style.overflow="hidden";wlRender(step);
}
function wlHide(){if(WEL&&WEL.el)WEL.el.hidden=true;wlInert(false);document.documentElement.style.overflow=""}
const wlOpen=()=>!!(WEL&&WEL.el&&!WEL.el.hidden);
function wlRender(step){
  WEL.step=step;const col=$("wl-col");
  $("wl-dots").innerHTML=[1,2,3,4,5,6].map(i=>'<i class="'+(i<step?"done":i===step?"cur":"")+'"></i>').join("");
  $("wl-dots").setAttribute("aria-label","Step "+step+" of 6");
  const foot=(primary,extra)=>'<div class="wl-foot"><button class="btn quiet back" type="button" data-wl="back"'+(step===1?" hidden":"")+'>'+ico("back")+'Back</button>'+(extra||"")+btn(primary,{act:"wl-next",primary:1,hint:ENTER})+'</div>';
  const card=(grp,v,on,inner)=>'<button class="wl-card" type="button" role="radio" aria-checked="'+on+'" tabindex="'+(on?0:-1)+'" data-wl="pick" data-g="'+grp+'" data-v="'+v+'">'+inner+'</button>';
  let h="";
  if(step===1){
    h='<div class="wl-logo">'+logoSVG(72)+'</div><h1 id="wl-title" tabindex="-1">Learn to type with all ten fingers</h1>'+
      '<p class="wl-lead">Short daily lessons that adapt to you. No looking at the keyboard.</p>'+
      '<ul class="wl-rows">'+[["clock","About 15 minutes a day"],["target","Practice built around your weakest keys"],["chat","Claude can coach you and write lessons for you"]].map(r=>'<li><span class="wl-ic">'+ico(r[0],20)+'</span>'+esc(r[1])+'</li>').join("")+'</ul>'+foot("Get started");
  }else if(step===2){
    h='<h1 id="wl-title" tabindex="-1">Which keyboard do you have?</h1><p class="wl-lead">Look at the Enter key. It sets the shape of the keyboard on screen.</p>'+
      '<div class="wl-cards kbc" role="radiogroup" aria-labelledby="wl-title">'+
      card("layout","iso",WEL.layout==="iso",wlKb(true)+'<span class="big">ISO</span><span class="cap">Tall Enter key, common in Europe</span>')+
      card("layout","ansi",WEL.layout==="ansi",wlKb(false)+'<span class="big">ANSI</span><span class="cap">Wide Enter key, common in the US</span>')+'</div>'+foot("Continue");
  }else if(step===3){
    h='<h1 id="wl-title" tabindex="-1">How much time each day?</h1><p class="wl-lead">You can change this later in Settings.</p>'+
      '<div class="wl-cards wl-goals" role="radiogroup" aria-labelledby="wl-title">'+WEL_GOALS.map(g=>card("goal",g[0],WEL.goal===g[0],'<span class="big">'+g[0]+'<small>min</small></span><span class="nm">'+g[1]+'</span>'+(g[0]===15?'<span class="wl-tag">Recommended</span>':""))).join("")+'</div>'+foot("Continue");
  }else if(step===4){
    WEL.soundSeen=true;
    h='<h1 id="wl-title" tabindex="-1">Pick your key sound</h1><p class="wl-lead">Every key makes a quiet sound as you type. Tap one to hear it. You can change it later in Settings.</p>'+
      '<div role="radiogroup" aria-labelledby="wl-title"><div class="wl-cards wl-goals wl-sounds">'+WEL_SOUNDS.map(s=>card("sound",s[0],WEL.sound===s[0],'<span class="wl-spk">'+WL_SPK+'</span><span class="big sm">'+s[1]+'</span><span class="nm">'+s[2]+'</span>'+(s[0]==="cream"?'<span class="wl-tag">Recommended</span>':""))).join("")+'</div>'+
      '<button class="wl-off" type="button" role="radio" aria-checked="'+(WEL.sound==="off")+'" tabindex="'+(WEL.sound==="off"?0:-1)+'" data-wl="pick" data-g="sound" data-v="off">No sound</button></div>'+foot("Continue");
  }else if(step===5){
    h='<h1 id="wl-title" tabindex="-1">A quick typing check</h1><p class="wl-lead">Type for one minute the way you type today. It gives us your starting speed and doesn\'t count towards your stats.</p>'+
      '<div class="wl-note"><span class="wl-ic">'+ico("clock",20)+'</span><div><b>60 seconds</b><span>Common words, no capitals or punctuation</span></div></div>'+
      foot("Start the check",'<button class="btn quiet" type="button" data-wl="skipcheck">Skip this step</button>');
  }else{
    const g=WEL.goal,N=Math.max(1,Math.round(WEL_H*60/g/7)),r=WEL.res;
    h='<h1 id="wl-title" tabindex="-1">Your plan</h1>'+
      (r?'<div class="pstats c2">'+pstat(Math.round(r.wpm),"WPM","Your starting speed")+pstat(Math.round(r.acc*100)+"%","Accuracy")+'</div>':"")+
      '<p class="wl-head2">Touch typing at 30 WPM in about '+N+(N===1?" week":" weeks")+'</p>'+
      '<ol class="wl-road">'+WEL_STAGES.map(s=>'<li style="--fc:var('+s[3]+')"><span class="dt"></span><span class="st">'+esc(s[0])+' <span>· '+s[1]+'</span></span><span class="du">'+wlDur(wlDays(s[2],g))+'</span></li>').join("")+'</ol>'+
      '<p class="wl-small">A rough estimate based on about '+WEL_H+' hours of practice at '+g+' minutes a day. Everyone learns at their own pace.</p>'+
      '<div class="wl-foot"><button class="btn quiet back" type="button" data-wl="back">'+ico("back")+'Back</button><button class="btn quiet" type="button" data-wl="done-learn">Go to Learn</button>'+btn("Start lesson 1",{act:"wl-lesson",primary:1,hint:ENTER})+'</div>';
  }
  col.innerHTML='<div class="wl-step">'+h+'</div>';
  const t=$("wl-title");if(t)t.focus({preventScroll:true});
  WEL.el.scrollTop=0;
}
function wlFinish(dest){
  const st=S.settings;let ch=false;
  if(st.layout!==WEL.layout){st.layout=WEL.layout;ch=true}
  if(st.goal!==WEL.goal){st.goal=WEL.goal;ch=true}
  if(WEL.soundSeen&&(st.soundPack!==WEL.sound||WEL.sound!==WEL.sound0)){st.soundPack=WEL.sound;st.sound=WEL.sound!=="off";ch=true}
  if(ch)S.settingsAt=Date.now();
  S.seenTips.welcome=true;save();
  wlHide();if(ch){rebuildKeyboards();renderRing();syncSettingsUI()}
  if(dest==="lesson")PENDING=1;
  if(location.hash!=="#learn")location.hash="learn";else route();
}
function wlCheck(){
  WEL.checking=true;wlHide();
  if(WEL.soundSeen){S.settings.soundPack=WEL.sound;S.settings.sound=WEL.sound!=="off"}
  startTest({dur:60,o:{pool:"c200",caps:false,punct:false,nums:false},baseline:true,crumb:"Welcome · Typing check",
    back:()=>{route();showWelcome(5)},
    onDone:res=>{
      WEL.res={wpm:res.wpm,acc:res.acc};
      if(!S.baseline&&res.wpm>0)S.baseline={wpm:Math.round(res.wpm*10)/10,acc:res.acc,ts:Date.now()};
      route();showWelcome(6);
    }});
}
function wlNext(){
  const s=WEL.step;
  if(s<5)wlRender(s+1);
  else if(s===5)wlCheck();
  else wlFinish("lesson");
}
function wlClick(e){
  const b=e.target.closest("[data-wl],[data-act]");if(!b)return;
  const w=b.dataset.wl,a=b.dataset.act;
  if(a==="wl-next")wlNext();
  else if(a==="wl-lesson")wlFinish("lesson");
  else if(w==="skip"||w==="done-learn")wlFinish("learn");
  else if(w==="skipcheck")wlRender(6);
  else if(w==="back")wlRender(WEL.step-1);
  else if(w==="pick"){
    const g=b.dataset.g;
    if(g==="layout")WEL.layout=b.dataset.v;else if(g==="sound"){WEL.sound=b.dataset.v;if(WEL.sound!=="off"){soundPreview(WEL.sound);if(!reduceMotion()){b.classList.remove("playing");void b.offsetWidth;b.classList.add("playing")}}}else WEL.goal=+b.dataset.v;
    wlRadios().forEach(r=>{const on=r===b;r.setAttribute("aria-checked",String(on));r.tabIndex=on?0:-1});
  }
}
const wlRadios=()=>[...WEL.el.querySelectorAll('[role="radio"]')];
document.addEventListener("keydown",e=>{
  if(!wlOpen())return;
  e.stopPropagation();
  const t=e.target,radio=t.closest&&t.closest('[role="radio"]');
  if(e.key==="Enter"){
    if(t.closest&&t.closest("button")&&!radio)return;
    e.preventDefault();const p=WEL.el.querySelector("[data-primary]");if(p)p.click();
  }else if(/^Arrow(Left|Right|Up|Down)$/.test(e.key)){
    const rs=wlRadios();if(!rs.length)return;e.preventDefault();
    const cur=Math.max(0,rs.findIndex(r=>r.getAttribute("aria-checked")==="true")),d=/Right|Down/.test(e.key)?1:-1;
    const n=rs[(cur+d+rs.length)%rs.length];n.click();n.focus();
  }
},true);
/* the welcome opens by itself once the account has settled, and only for someone with no progress */
let wlChecked=false;
statusHooks.push(s=>{
  if(wlChecked||s==="connecting")return;wlChecked=true;
  if(S.seenTips.welcome)return;
  if(wlHasProgress()){S.seenTips.welcome=true;writeLocal();return}
  showWelcome(1);
});
