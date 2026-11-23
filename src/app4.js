
/* ============================ VIEWS ============================ */
const TABS=["learn","practice","test","progress","coach","guide"];
let TAB="learn",RUN=null;
const STAR='<path d="M12 2.5l3 6.4 7 .8-5.2 4.8 1.5 6.9L12 17.7 5.7 21.4l1.5-6.9L2 9.7l7-.8z" stroke-width="1.6" stroke-linejoin="round"/>';
const starsSVG=(n,sz,pop)=>'<span class="stars'+(pop?" pp":"")+'" role="img" aria-label="'+n+' of 3 stars">'+[1,2,3].map(i=>'<svg width="'+sz+'" height="'+sz+'" viewBox="0 0 24 24" class="'+(i<=n?"star-on":"star-off")+'" style="--i:'+(i-1)+'" aria-hidden="true">'+STAR+'</svg>').join("")+"</span>";
const IC={back:'<path d="M15 18l-6-6 6-6"/>',restart:'<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/>',x:'<path d="M18 6L6 18M6 6l12 12"/>',check:'<path d="M5 12.5l4.5 4.5L19 7.5"/>',lock:'<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',up:'<path d="M12 19V5M5 12l7-7 7 7"/>',down:'<path d="M12 5v14M5 12l7 7 7-7"/>',next:'<path d="M9 6l6 6-6 6"/>'};
const ico=(k,sz)=>'<svg class="ic" width="'+(sz||16)+'" height="'+(sz||16)+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+IC[k]+'</svg>';
/* button: o={act,n,cls,primary,icon,hint,id} */
function btn(label,o){o=o||{};return '<button type="button" class="btn'+(o.cls?" "+o.cls:"")+'" data-act="'+o.act+'"'+(o.n!=null?' data-n="'+o.n+'"':"")+(o.primary?" data-primary":"")+'>'+(o.icon?ico(o.icon):"")+esc(label)+(o.hint?'<span class="kh" aria-hidden="true">'+o.hint+"</span>":"")+"</button>"}
const ENTER="\u21b5";
const pstat=(num,label,sub,cls)=>'<div class="pstat'+(cls?" "+cls:"")+'"><span class="num">'+num+'</span><span class="label">'+label+"</span>"+(sub?'<span class="sub">'+sub+"</span>":"")+"</div>";
/* panel: o={eyebrow,title,status,msg,stats,statsCls,body,foot,wide,flat} */
function panel(o){
  return '<section class="panel'+(o.wide?" wide":"")+(o.flat?" flat":"")+'"><div class="panel-body"><div class="panel-head"><div><span class="label">'+o.eyebrow+'</span>'+(o.title?'<'+(o.tag||"h1")+(o.tag?' class="pt"':"")+'>'+o.title+'</'+(o.tag||"h1")+'>':"")+'</div>'+(o.status||"")+'</div>'+
    (o.msg?'<p class="msg">'+o.msg+'</p>':"")+(o.stats?'<div class="pstats'+(o.statsCls?" "+o.statsCls:"")+'">'+o.stats+'</div>':"")+(o.body||"")+'</div>'+(o.foot?'<div class="panel-foot">'+o.foot+'</div>':"")+'</section>';
}
const statusChip=(ok)=>ok?'<span class="status ok">'+ico("check",14)+'Passed</span>':'<span class="status bad"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7.5v5M12 16.5h.01"/></svg>Not passed yet</span>';
const capsFor=(L)=>L.shift?["shift"]:L.keys;
function newKeyCaps(L){return '<span class="caps">'+(L.shift?'<span class="bigcap xs" style="--fc:'+fcol("LP")+'">shift</span>':L.keys.map(k=>{const i=charInfo(k);return '<span class="bigcap xs" style="--fc:'+fcol(i?i.key.f:"TH")+'">'+esc(k.toUpperCase())+'</span>'}).join(""))+'</span>'}
function renderRing(){
  const m=minutesToday(),g=S.settings.goal,f=Math.min(1,m/g),C=2*Math.PI*11;
  const arc=$("ring-arc");if(arc)arc.setAttribute("stroke-dasharray",(f*C).toFixed(1)+" "+C.toFixed(1));
  const t=$("ring-t");if(t)t.textContent=Math.floor(m)+" / "+g+" min";
  flameUpdate();
}
function setTabs(){document.querySelectorAll(".tab").forEach(b=>{if(b.dataset.tab===TAB)b.setAttribute("aria-current","page");else b.removeAttribute("aria-current")})}
/* a new tab or screen fades in; re-rendering the same one (a toggle, a shuffle) does not */
function setView(html,kind){
  stopExercise();KBS=[];UI={kind};UI.escape=null;
  const k=TAB+"|"+kind,fresh=k!==VK;VK=k;
  view.innerHTML=(SESSION&&kind!=="learn"&&kind!=="guide"?sessionBar(kind==="session"):"")+html;window.scrollTo(0,0);
  if(fresh&&!reduceMotion()){
    view.classList.remove("view-in");void view.offsetWidth;view.classList.add("view-in");
    const bars=[...view.querySelectorAll(".bar>i,.kbar>i,.skbar>i")].filter(i=>i.style.width);
    bars.forEach(i=>{i.dataset.w=i.style.width;i.style.width="0"});
    if(bars.length)requestAnimationFrame(()=>requestAnimationFrame(()=>bars.forEach(i=>{i.style.width=i.dataset.w})));
  }
  viewHook(kind);
}
let PENDING=0;
function renderTab(){({learn:renderLearn,practice:renderPractice,test:renderTest,progress:renderProgress,coach:renderCoach,guide:renderGuide})[TAB]()}
function route(){
  SESSION=null;
  const h=(location.hash||"").replace(/^#/,"");TAB=TABS.includes(h)?h:"learn";
  setTabs();RUN=null;
  if(TAB==="learn"&&PENDING){const n=PENDING;PENDING=0;renderLearn();openIntro(n);return}
  renderTab();
}
function placeholder(t,p){setView('<div class="view-head"><h1>'+t+'</h1><p>'+p+'</p></div><p class="small muted" id="ph-save">'+esc(STATUS_TXT[saveStatus])+'</p>',"tab")}

/* ---- Learn ---- */
function introLine(ch){
  const i=charInfo(ch);if(!i)return "";
  const k=i.key,f=FING[k.f],r=reach(k.id),show=ch.toUpperCase();
  if(i.shift){const sn=i.shiftId==="ShiftLeft"?"left":"right",sf=FING[LAY().byId[i.shiftId].f].n;
    const base=k.base.toUpperCase();
    return "<strong>"+esc(ch)+"</strong> · Shift + "+esc(base)+". Hold "+sn+" Shift with your "+sf+", then press "+esc(base)+" with your "+f.n+"."}
  if(r.home){const bump=(k.id==="KeyF"||k.id==="KeyJ")?" Feel the bump.":"";return "<strong>"+esc(show)+"</strong> · "+f.n+". This is a home key. Rest the finger here."+bump}
  return "<strong>"+esc(show)+"</strong> · "+f.n+". From "+esc(r.from)+", reach "+r.phrase+" and come back.";
}
function openIntro(n){
  const L=LESSONS[n-1];
  let lines="";
  if(L.shift){
    lines=[["ShiftLeft","Left Shift","Hold it with your left pinky for capitals typed with your right hand."],["ShiftRight","Right Shift","Hold it with your right pinky for capitals typed with your left hand."]]
      .map(x=>'<li><span class="bigcap" style="--fc:'+fcol(LAY().byId[x[0]].f)+'">shift</span><p><strong>'+x[1]+'</strong> · '+x[2]+'</p></li>').join("");
  }else{
    lines=L.keys.map(ch=>{const i=charInfo(ch);return '<li><span class="bigcap" style="--fc:'+fcol(i.key.f)+'">'+esc(ch.toUpperCase())+'</span><p>'+introLine(ch)+'</p></li>'}).join("");
  }
  if(L.review)lines='<li><p>No new keys. This lesson mixes everything you know so far, with extra weight on your slower keys.</p></li>';
  const extra=n===1?'Rest your left fingers on A S D F and your right fingers on J K L ;. Feel the bumps on F and J. Thumbs rest on the space bar.':
    L.shift?'Capitals use the Shift key on the opposite hand. Press and hold Shift, tap the letter, then let go of both.':
    L.punct?'The apostrophe and quote keys are accent keys on your U.S. International layout. When one comes before a space, press the mark and then Space. The app accepts that.':"";
  lines=lines.replace(/class="bigcap"/g,'class="bigcap md"');
  setView('<div class="intro">'+panel({eyebrow:esc(L.stage),title:'Lesson '+n+' · '+esc(L.title),msg:extra,body:'<ul class="keylist">'+lines+'</ul>',
      foot:btn("Back to lessons",{act:"to-learn",cls:"quiet",icon:"back"})+btn("Start lesson",{act:"start",n,primary:1,hint:ENTER})})+
    '<div class="kbwrap" style="width:100%"><svg class="kb" id="kb" role="img" aria-label="Keyboard"></svg><svg class="hands" id="hands" role="img" aria-label="Hands"></svg></div></div>',"intro");
  UI.escape=()=>renderLearn();
  const kb=makeKeyboard($("kb"),"stage"),hands=makeHands($("hands"));
  const ids=L.shift?["ShiftLeft","ShiftRight"]:idsFor(L.keys);
  kb.set({next:ids});
  const fs=new Set();(L.shift?["ShiftLeft","ShiftRight"]:ids).forEach(id=>{const k=LAY().byId[id];if(k)fs.add(k.f)});
  hands.set([...fs]);
}
function renderLearn(){
  SESSION=null;
  const nx=nextLessonN(),L=nx?LESSONS[nx-1]:null,m=minutesToday(),g=S.settings.goal,st=streak(),wk=weakestKey();
  let h='<h1 class="vh">Learn</h1><div class="card today"><div><span class="label">Today</span>'+
    (L?'<h1>Lesson '+nx+' · '+esc(L.title)+'</h1>':'<h1>All lessons passed</h1>')+
    '<div class="today-stats"><span><b>'+Math.floor(m)+'</b> of '+g+' min today</span><span><b>'+st+'</b> day'+(st===1?"":"s")+' streak</span>'+(wk?'<span>Weakest key: <a href="#practice" style="color:inherit"><b>'+esc(wk.toUpperCase())+'</b></a></span>':"")+'</div>'+
    '<div class="bar" aria-hidden="true"><i style="width:'+Math.min(100,m/g*100).toFixed(0)+'%"></i></div>'+levelRowHTML()+'</div>'+
    '<div class="today-act"><div class="actions">'+btn("Start today's session",{act:"s-start",primary:1,hint:ENTER})+
    (L?btn("Lesson "+nx+" only",{act:"open",n:nx,cls:"ghost"}):btn("Repeat lesson 1",{act:"open",n:1,cls:"ghost"}))+'</div>'+
    '<p class="small muted" style="margin-top:10px">About 10 minutes: warm-up, lesson, practice, test.</p></div></div>';
  h+='<section class="section"><h2>Course map</h2><div class="card map-card" style="margin-top:12px"><svg class="kb" id="map-kb" role="img" aria-label="Keyboard showing the keys you have learned"></svg><p class="small muted cap">Keys you know light up as you learn them.</p></div></section>';
  h+='<section class="section"><h2>Lessons</h2>';
  let stage="";const cnt={};LESSONS.forEach(l=>{const c=cnt[l.stage]||(cnt[l.stage]={d:0,t:0});c.t++;if(lessonDone(l.n))c.d++});
  LESSONS.forEach(l=>{
    if(l.stage!==stage){stage=l.stage;h+='<div class="stage-h"><h3>'+esc(stage)+'</h3><span class="scount">'+cnt[stage].d+' of '+cnt[stage].t+' passed</span></div>'}
    const r=S.lessons[l.n],lock=!unlocked(l.n),isNext=l.n===nx,done=lessonDone(l.n);
    const keyTxt=l.shift?"Both Shift keys":l.review?"Mixed review":l.keys.map(k=>FING[(charInfo(k)||{key:{f:"TH"}}).key.f].n).filter((v,i,a)=>a.indexOf(v)===i).join(" and ");
    h+='<button class="lrow'+(lock?" locked":"")+(isNext?" next":"")+'" type="button" data-act="'+(lock?"noop":"open")+'" data-n="'+l.n+'"'+(lock?' aria-disabled="true"':"")+'><span class="lnum">'+l.n+(done?'<span class="ckb">'+ico("check",10)+'</span>':"")+'</span><span class="ltitle">'+esc(l.title)+(isNext?'<span class="upchip">Up next</span>':"")+'</span>'+
      '<span class="lsub">'+(lock?"Pass lesson "+(l.n-1)+" to unlock":esc(keyTxt))+'</span><span class="lmeta">'+
      (lock?'<svg class="lock" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-label="Locked" role="img">'+IC.lock+'</svg>':starsSVG(r?r.stars:0,16)+(r&&r.attempts?'<span>'+Math.round(r.wpm)+' WPM</span><span>'+Math.round(r.acc*100)+'%</span>':'<span class="muted">Not started</span>'))+'</span></button>';
  });
  h+='</section>';
  setView(h,"learn");
  const kb=makeKeyboard($("map-kb"),"map");
  const lc=learnedChars(),ids=new Set(idsFor([...lc]));
  if(lessonDone(19)){ids.add("ShiftLeft");ids.add("ShiftRight")}
  const up=L?(L.shift?["ShiftLeft","ShiftRight"]:idsFor(L.keys)):[];
  kb.set({learned:[...ids],upnext:up.filter(x=>!ids.has(x))});
}
const WLSET=new Set(WL);
function stepNames(texts){
  const t=texts[2].split(" "),real=t.filter(w=>WLSET.has(w.replace(/[^A-Za-z]/g,"").toLowerCase())).length;
  return [STEP_NAMES[0],STEP_NAMES[1],real<t.length/2?"Rhythm":"Words"];
}
function startLesson(n){
  const texts=genLesson(n);
  RUN={n,step:1,texts,names:stepNames(texts),agg:{ms:0,chars:0,presses:0,correct:0,missBy:{}}};
  runStep();
}
function runStep(){
  const N=RUN.texts.length;
  mountStage({crumb:RUN.custom?"Claude · "+RUN.title+" · Step "+RUN.step+" of "+N+" · "+RUN.names[RUN.step-1]:"Lesson "+RUN.n+" · Step "+RUN.step+" of "+N+" · "+RUN.names[RUN.step-1],text:RUN.texts[RUN.step-1],mode:S.settings.stop?"stop":"free",
    onFinish:stepDone});
  UI.escape=null;
}
function stepDone(res){
  const a=RUN.agg;a.ms+=res.ms;a.chars+=res.chars;a.presses+=res.presses;a.correct+=res.correct;
  for(const k in res.missBy)a.missBy[k]=(a.missBy[k]||0)+res.missBy[k];
  if(RUN.step<RUN.texts.length){
    const n=RUN.n,s=RUN.step,N=RUN.texts.length;
    setView('<div class="result">'+panel({eyebrow:(RUN.custom?'From Claude':'Lesson '+n)+' · step '+s+' of '+N,title:esc(RUN.names[s-1])+' done',
      stats:pstat(Math.round(res.wpm),"WPM")+pstat(Math.round(res.acc*100)+"%","Accuracy"),statsCls:"c2",
      body:'<div class="upnext"><span class="label">Up next</span><span class="txt2">Step '+(s+1)+' · '+esc(RUN.names[s])+'</span></div>',
      foot:btn("Back to lessons",{act:"to-learn",cls:"quiet",icon:"back"})+btn("Next step",{act:"next-step",primary:1,hint:ENTER})})+'</div>',"summary");
    UI.escape=()=>renderLearn();
    return;
  }
  showResults();
}
function showResults(){
  if(RUN.custom)return customResults();
  const n=RUN.n,L=LESSONS[n-1],a=RUN.agg;
  const wpm=wpmCalc(a.chars,a.ms),acc=a.presses?a.correct/a.presses:1,passed=acc>=.95;
  let stars=0;if(passed){stars=1;if(wpm>=L.wpm)stars=2;if(acc>=.98&&wpm>=L.wpm+5)stars=3}
  const r=S.lessons[n]||(S.lessons[n]={done:false,stars:0,wpm:0,acc:0,attempts:0,last:0});
  const wasDone=r.done,prevStars=r.stars;
  r.attempts++;r.last=Date.now();if(passed)r.done=true;r.stars=Math.max(r.stars,stars);r.wpm=Math.max(r.wpm,wpm);r.acc=Math.max(r.acc,acc);
  S.bests.lessonWpm=Math.max(S.bests.lessonWpm,wpm);rewardsLesson(passed&&(!wasDone||stars>prevStars));
  const pk=Object.entries(a.missBy).sort((x,y)=>y[1]-x[1]).slice(0,3);
  const sec=Math.round(a.ms/1000),time=Math.floor(sec/60)+":"+String(sec%60).padStart(2,"0");
  const last=n===LESSONS.length;
  const msg=passed?(last?"You finished the course.":"Lesson "+(n+1)+" is unlocked."):"Accuracy "+Math.round(acc*100)+"%. You need 95% to pass. Slow down a little and keep your eyes on the screen.";
  const inS=!!(SESSION&&SESSION.steps[SESSION.i]&&SESSION.steps[SESSION.i].id==="lesson");
  if(inS)SESSION.rs=[{ms:a.ms,chars:a.chars,presses:a.presses,correct:a.correct}];
  const again=btn("Try again",{act:"start",n,cls:"ghost"});
  const foot=inS?again+btn("Continue session",{act:"s-lesson-done",primary:1,hint:ENTER}):
    passed?(last?again+btn("Back to lessons",{act:"to-learn",primary:1,hint:ENTER}):again+btn("Next lesson",{act:"open",n:n+1,primary:1,hint:ENTER})):
    btn("Back to lessons",{act:"to-learn",cls:"ghost"})+btn("Try again",{act:"start",n,primary:1,hint:ENTER});
  const keys=pk.length?'<div><span class="label">Keys to watch</span><div class="pkrow" style="margin-top:10px">'+pk.map(([k,c])=>{const i=charInfo(k)||charInfo(k.toUpperCase());return '<span class="pk"><span class="bigcap sm" style="--fc:'+fcol(i?i.key.f:"TH")+'">'+(k===" "?"space":esc(k.toUpperCase()))+'</span>'+c+(c===1?" miss":" misses")+'</span>'}).join("")+'</div></div>':"";
  setView('<div class="result">'+panel({eyebrow:'Lesson '+n+' · '+esc(L.stage),title:esc(L.title),status:statusChip(passed),
    msg:esc(msg),stats:pstat(Math.round(wpm),"WPM","target "+L.wpm)+pstat(Math.round(acc*100)+"%","Accuracy","needs 95%")+pstat(time,"Time"),
    body:(passed?'<div class="stars-lg">'+starsSVG(stars,36,true)+'</div>':"")+keys,foot})+'</div>',"results");
  UI.escape=()=>renderLearn();
}
view.addEventListener("click",e=>{
  const b=e.target.closest("[data-act]");if(!b)return;
  const n=+b.dataset.n,act=b.dataset.act;
  if(act==="open")openIntro(n);
  else if(act==="start")startLesson(n);
  else if(act==="next-step"){RUN.step++;runStep()}
  else if(act==="stage-back"&&UI.opts&&UI.opts.back){UI.opts.back()}
  else if(act==="to-learn"||act==="stage-back"||act==="to-coach"){const t=act==="to-coach"||RUN&&RUN.custom?"coach":"learn";if(location.hash!=="#"+t)location.hash=t;else route()}
  else if(act==="go-lesson"){PENDING=n;if(location.hash!=="#learn")location.hash="learn";else route()}
  else if(act==="stage-restart"){if(EX)EX.restart()}
  else if(act==="tip-x"){const t=$("tip");if(t)t.hidden=true;if(EX)sink.focus({preventScroll:true})}
});

/* ---- Guide ---- */
function renderGuide(){
  const H=(t)=>"<h2>"+t+"</h2>";
  const ul=a=>"<ul>"+a.map(x=>"<li>"+x+"</li>").join("")+"</ul>";
  const legend=[["pinky","Pinky"],["ring","Ring finger"],["middle","Middle finger"],["index","Index finger"],["thumb","Thumb (space)"]].map(g=>'<span><span class="dot" style="--fc:var('+GCOL[g[0]]+')"></span>'+g[1]+'</span>').join("");
  const src=[["Touch typing (Wikipedia)","https://en.wikipedia.org/wiki/Touch_typing"],["Words per minute (Wikipedia)","https://en.wikipedia.org/wiki/Words_per_minute"],
    ["Dhakal, Feit, Kristensson, Oulasvirta: Observations on Typing from 136 Million Keystrokes, CHI 2018","https://userinterfaces.aalto.fi/136Mkeystrokes/"],
    ["Feit, Weir, Oulasvirta: How We Type, CHI 2016","https://userinterfaces.aalto.fi/how-we-type/"],["Keybr help: how adaptive lessons work","https://www.keybr.com/help"],
    ["Monkeytype: how WPM, raw and accuracy are measured","https://monkeytype.com/about"],["OSHA computer workstations: keyboards","https://www.osha.gov/etools/computer-workstations/components/keyboards"]]
    .map(s=>'<li><a href="'+s[1]+'" target="_blank" rel="noopener">'+esc(s[0])+"</a></li>").join("");
  setView('<article class="guide"><h1>Guide</h1><p class="muted">Everything you need to know before and while you learn.</p>'+
   H("1. Sit and place your hands")+ul(["Sit back with your feet flat and your shoulders relaxed. Keep your elbows close to your body.","Keep your wrists straight, in line with your forearms. Let your hands hover over the keys instead of resting on the edge of the laptop while you type.","Put the top of the screen at or just below eye level, about an arm's length away.","Take short breaks often."])+
   H("2. Find the home row")+ul(["Your fingers rest on the middle row: left hand on A S D F, right hand on J K L ;. Your thumbs rest on the space bar.","Feel for the small bumps on F and J. They let you find home without looking.","After every reach, the finger goes back to its home key."])+
   H("3. One finger for each key")+'<div class="guide-kb"><svg class="kb" id="g-kb" role="img" aria-label="Keyboard coloured by finger"></svg><div class="legend">'+legend+'</div></div><div style="height:22px"></div>'+
   ul(["Each key belongs to one finger. Use the same finger every time, even when another one feels quicker. A fixed finger for each key and a fixed hand position are what make typing automatic. Studies of everyday typists found these matter more than how many fingers you use.","Shift: hold it with the little finger of the other hand. For a capital F (left hand), hold the right Shift.","Space: press it with either thumb. Many typists use the thumb of the hand that did not type the last letter.","The 6 key: most charts give it to the left index finger, and this course does too. Some people use the right index finger. Pick one and keep it."])+
   H("4. How to practise")+ul(["Accuracy first. Aim for 95% or better before you try to go faster. Speed comes from repeating the right movement.","Keep your eyes on the screen. The keyboard below the text shows the next key and finger. When the keys feel familiar, switch hints to \"Only when I hesitate or miss\", and later hide them.","Keep an even rhythm. Steady and a bit slow beats fast bursts with pauses.","Practise a little every day. 15 to 20 minutes a day is the usual advice. It hasn't been tested for typing in particular, but short regular practice is how most motor skills stick.","Once you know all the letters, type your real messages with the new technique too."])+
   H("5. What to expect")+ul(["If you used to type with a few fingers, you will be slower at first. That is normal. Most people get back to their old speed and then pass it, usually within weeks to a few months. Nobody can promise an exact timeline.","For reference: a 1999 study found computer users averaged about 33 words per minute when copying text. Professional typists usually type 43 to 80. A 2018 study of 168,000 people typing online found an average of about 52.","Words per minute counts every 5 characters, spaces included, as one word. Accuracy is the share of your key presses that were right."])+
   H("6. When you get stuck")+ul(["Your speed is limited by your slowest keys and letter pairs. Practice finds the weakest one and builds each round around it.","If your accuracy drops below 95%, slow down on purpose for a few rounds.","Plateaus are normal. When most of your keys are strong, raise the target speed by 5 WPM in Settings."])+
   H("7. Notes for your keyboard")+ul(["Your Mac uses the U.S. International layout. On it, ' \" ` ~ and ^ are accent keys: they wait for the next key, so ' then e gives é. To type the mark on its own, press Space after it; this app accepts that. If it feels clumsy, switch to the ABC or U.S. layout in the input menu while you practise.","If a number key gives ě, š or č, your Czech keyboard is active. Switch the input source back to U.S.","Some labels on your Czech keyboard may not match what the U.S. layout types (for example Y and Z, or the number row). Follow the keyboard on the screen. Not looking at the keys is the point anyway."])+
   H("Sources")+'<ul class="src">'+src+'</ul></article>',"guide");
  const kb=makeKeyboard($("g-kb"),"fingers");
}

/* ---- Theme (per browser: system / light / dark) ----
   "system" leaves the page to the viewer: the OS setting, or the data-theme claude.ai sets on the root.
   A light/dark choice writes data-theme itself; the host's own value is remembered so "system" can restore it. */
const THEME_KEY="homerow.theme",ROOT=document.documentElement;
let themePref="system",hostTheme=ROOT.getAttribute("data-theme"),themeWritten=null;
try{const v=localStorage.getItem(THEME_KEY);if(v==="light"||v==="dark")themePref=v}catch(e){}
function applyTheme(){
  const want=themePref==="system"?hostTheme:themePref;themeWritten=want;
  if(want)ROOT.setAttribute("data-theme",want);else ROOT.removeAttribute("data-theme");
}
new MutationObserver(()=>{
  const now=ROOT.getAttribute("data-theme");if(now===themeWritten)return;
  hostTheme=now;if(themePref!=="system")applyTheme();else themeWritten=now;
}).observe(ROOT,{attributes:true,attributeFilter:["data-theme"]});
function setThemePref(v){
  themePref=v==="light"||v==="dark"?v:"system";
  try{if(themePref==="system")localStorage.removeItem(THEME_KEY);else localStorage.setItem(THEME_KEY,themePref)}catch(e){}
  applyTheme();
}
applyTheme();

/* ---- Settings ---- */
const SEGS={"set-soundpack":["soundPack",String],"set-hints":["hints",String],"set-goal":["goal",Number],"set-target":["target",Number],"set-pace":["pace",String],"set-layout":["layout",String]};
function syncSettingsUI(){
  const s=S.settings;
  for(const id in SEGS)document.querySelectorAll("#"+id+" [data-v]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.v===String(s[SEGS[id][0]]))));
  document.querySelectorAll("#set-theme [data-v]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.v===themePref)));
  $("set-stop").checked=s.stop;$("set-unlock").checked=s.unlockAll;
  $("save-status").textContent=STATUS_TXT[saveStatus];syncWeeklyUI();
}
function settingChanged(){
  S.settingsAt=Date.now();save();renderRing();
}
function wireSettings(){
  const reset=()=>{$("reset-confirm").hidden=true;$("set-reset").hidden=false};
  $("open-settings").addEventListener("click",()=>{syncSettingsUI();reset();dlg.showModal()});
  $("set-close").addEventListener("click",()=>dlg.close());
  dlg.addEventListener("click",e=>{
    if(e.target===dlg){dlg.close();return}
    const b=e.target.closest(".seg [data-v]");if(!b)return;
    const id=b.closest(".seg").id;
    if(id==="set-theme"){setThemePref(b.dataset.v);syncSettingsUI();return}
    const m=SEGS[id];if(!m)return;
    S.settings[m[0]]=m[1](b.dataset.v);
    if(id==="set-soundpack")S.settings.sound=S.settings.soundPack!=="off";
    settingChanged();syncSettingsUI();
    if(id==="set-soundpack")soundPreview(S.settings.soundPack);
    if(id==="set-layout")rebuildKeyboards();
  });
  dlg.addEventListener("close",()=>{if(EX&&!EX.done)EX.refreshHints();if(UI.kind==="learn"||UI.kind==="idle"||UI.kind==="coach")renderTab()});
  $("set-stop").addEventListener("change",e=>{S.settings.stop=e.target.checked;settingChanged()});
  $("set-weekly").addEventListener("change",e=>{
    S.settings.weekly=e.target.checked;settingChanged();
    if(e.target.checked)weeklyRun({force:true});else{WK.msg="";syncWeeklyUI()}
  });
  $("set-welcome").addEventListener("click",()=>{dlg.close();showWelcome(1)});
  $("set-unlock").addEventListener("change",e=>{S.settings.unlockAll=e.target.checked;settingChanged()});
  $("set-reset").addEventListener("click",()=>{$("set-reset").hidden=true;$("reset-confirm").hidden=false});
  $("set-reset-no").addEventListener("click",reset);
  $("set-reset-yes").addEventListener("click",()=>{resetAll();reset();dlg.close();renderRing();route()});
}
function onRemoteApplied(){
  afterRemote();renderRing();syncSettingsUI();
  if(UI.kind==="learn"||UI.kind==="idle")renderTab();
}
statusHooks.push(()=>{document.querySelectorAll(".save-line").forEach(p=>p.textContent=STATUS_TXT[saveStatus])});

