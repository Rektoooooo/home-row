/* ============================ REWARDS, WEEKLY RECAP, SHARE CARD (phase B) ============================ */
/* ---- level: derived from the words typed correctly, nothing stored ---- */
const xpWords=()=>{let c=0;for(const k in S.days)c+=S.days[k].correct||0;return Math.floor(c/5)};
/* level n needs 300+150*(n-1) more words to reach n+1: totals 300, 750, 1350, 2100 … */
function levelInfo(w){
  if(w==null)w=xpWords();
  let level=1,base=0,need=300;
  while(w>=base+need){base+=need;level++;need=300+150*(level-1)}
  return {level,into:w-base,need,pct:Math.round((w-base)/need*100)};
}
function levelRowHTML(cls){
  const L=levelInfo(),left=L.need-L.into;
  return '<div class="lvl'+(cls?" "+cls:"")+'"><span class="lvl-n">Level '+L.level+'</span><div class="bar" aria-hidden="true"><i style="width:'+L.pct+'%"></i></div><span class="lvl-t">'+left+(left===1?" word":" words")+' to level '+(L.level+1)+'</span></div>';
}
const levelHeroHTML=()=>'<div class="card lvl-card">'+levelRowHTML("big")+'</div>';

/* ---- streak flame in the header ---- */
const FLAME_D="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z";
const FLAME='<path d="'+FLAME_D+'"/>';
/* the header flame: filled warm gradient with an inner glow when today counts, a quiet outline when it does not yet */
const flameSVG=lit=>'<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">'+(lit?'<defs><linearGradient id="flg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFD66B"/><stop offset=".55" stop-color="#FF8A3D"/><stop offset="1" stop-color="#EE4B2B"/></linearGradient></defs>'+
  '<path d="'+FLAME_D+'" fill="url(#flg)"/><path d="M12 21.2a3.4 3.4 0 0 1-3.4-3.4c0-1.5 1-2.5 1.9-3.4.3 1.2 1 1.9 1.9 2.1.2-1.3 0-2.6-.5-3.6 2 1 3.4 2.9 3.4 4.9a3.4 3.4 0 0 1-3.3 3.4z" fill="#FFE7A1"/>'
  :'<path d="'+FLAME_D+'" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>')+'</svg>';
const AIC={
  key:'<rect x="4.5" y="4" width="15" height="13.5" rx="4"/><path d="M8 20.5h8M9.5 10.8h5"/>',
  keys:'<rect x="2.5" y="8" width="5" height="8" rx="1.6"/><rect x="9.5" y="8" width="5" height="8" rx="1.6"/><rect x="16.5" y="8" width="5" height="8" rx="1.6"/>',
  flag:'<path d="M5 21V4M5 4h12l-2.5 4 2.5 4H5"/>',
  trophy:'<path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H4.5v1A3.5 3.5 0 0 0 8 10.5M16 6h3.5v1A3.5 3.5 0 0 1 16 10.5M12 13v4M8.5 20h7M10 17h4"/>',
  star:'<path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7z"/>',
  stars:'<path d="M10 6l2 4.2 4.5.5-3.4 3.1.9 4.5L10 16l-4 2.3.9-4.5L3.5 10.7 8 10.2z"/><path d="M19 3v4M17 5h4"/>',
  flame:FLAME,
  bolt:'<path d="M13 3L5.5 13.5h5.8L10.5 21 18.5 10h-5.8z"/>',
  target:'<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4"/><path d="M12 12h.01"/>',
  shield:'<path d="M12 3l7 3v5.5c0 4.2-2.8 7.6-7 9.5-4.2-1.9-7-5.3-7-9.5V6z"/><path d="M9 12l2.2 2.2L15.2 10"/>',
  rocket:'<path d="M12 3c3 2 5 5 5 9l-2 3H9l-2-3c0-4 2-7 5-9z"/><circle cx="12" cy="10" r="1.5"/><path d="M9 15l-2 4 3-1M15 15l2 4-3-1"/>',
  calendar:'<rect x="4" y="5" width="16" height="15" rx="3"/><path d="M4 10h16M9 3v4M15 3v4"/>',
  chevron:'<path d="M6 13l6-6 6 6M6 19l6-6 6 6"/>',
  page:'<path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4M10 12h5M10 16h5"/>',
  brackets:'<path d="M9 5H6v14h3M15 5h3v14h-3"/>'
};
const aico=(k,sz)=>'<svg width="'+sz+'" height="'+sz+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+AIC[k]+'</svg>';
const ACOL={lesson:"--f-index",streak:"--f-pinky",speed:"--f-ring",accuracy:"--f-middle",special:"--fg"};
function longestRun(){
  const ks=Object.keys(S.days).filter(k=>S.days[k].ms>=60000).sort();let best=0,run=0,prev=null;
  ks.forEach(k=>{const d=new Date(k+"T00:00:00");run=prev&&Math.round((d-prev)/864e5)===1?run+1:1;prev=d;if(run>best)best=run});
  return best;
}
const passedAll=(a,b)=>{for(let n=a;n<=b;n++)if(!lessonDone(n))return false;return true};
const starsOn=n=>Object.values(S.lessons).filter(l=>l.stars>=3).length>=n;
const testOk=w=>S.tests.some(t=>t.wpm>=w&&t.acc>=.9);
const ACH=[
  {id:"first-lesson",title:"First lesson",desc:"Pass lesson 1",cat:"lesson",icon:"key",test:()=>lessonDone(1)},
  {id:"home-row",title:"Home row",desc:"Pass lessons 1 to 6",cat:"lesson",icon:"keys",test:()=>passedAll(1,6)},
  {id:"all-letters",title:"All letters",desc:"Pass lessons 1 to 17",cat:"lesson",icon:"flag",test:()=>passedAll(1,17)},
  {id:"course",title:"Course complete",desc:"Pass all "+LESSONS.length+" lessons",cat:"lesson",icon:"trophy",test:()=>passedAll(1,LESSONS.length)},
  {id:"three-stars",title:"Three stars",desc:"Get 3 stars on a lesson",cat:"lesson",icon:"star",test:()=>starsOn(1)},
  {id:"star-collector",title:"Star collector",desc:"Get 3 stars on 10 lessons",cat:"lesson",icon:"stars",test:()=>starsOn(10)},
  {id:"streak-3",title:"3-day streak",desc:"Practise 3 days in a row",cat:"streak",icon:"flame",test:()=>longestRun()>=3},
  {id:"streak-7",title:"7-day streak",desc:"Practise 7 days in a row",cat:"streak",icon:"flame",test:()=>longestRun()>=7},
  {id:"streak-30",title:"30-day streak",desc:"Practise 30 days in a row",cat:"streak",icon:"calendar",test:()=>longestRun()>=30},
  {id:"wpm-20",title:"20 WPM",desc:"A test at 20 WPM or more, with 90% accuracy or better",cat:"speed",icon:"bolt",test:()=>testOk(20)},
  {id:"wpm-30",title:"30 WPM",desc:"A test at 30 WPM or more, with 90% accuracy or better",cat:"speed",icon:"bolt",test:()=>testOk(30)},
  {id:"wpm-40",title:"40 WPM",desc:"A test at 40 WPM or more, with 90% accuracy or better",cat:"speed",icon:"rocket",test:()=>testOk(40)},
  {id:"wpm-60",title:"60 WPM",desc:"A test at 60 WPM or more, with 90% accuracy or better",cat:"speed",icon:"rocket",test:()=>testOk(60)},
  {id:"sharp",title:"Sharpshooter",desc:"A test of 30 s or longer with 98% accuracy or better",cat:"accuracy",icon:"target",test:()=>S.tests.some(t=>t.dur>=30&&t.acc>=.98)},
  {id:"home-strong",title:"Home row mastered",desc:"Make every home row key strong",cat:"accuracy",icon:"shield",test:()=>[..."asdfjkl;"].every(k=>{const v=strengthOf(S.keys[k]);return v!=null&&v>=1})},
  {id:"faster",title:"Faster than before",desc:"Beat your starting speed in a test, with 95% accuracy or better",cat:"speed",icon:"chevron",test:()=>!!S.baseline&&S.tests.some(t=>t.wpm>S.baseline.wpm&&t.acc>=.95)},
  {id:"goal-5",title:"Five good days",desc:"Reach your daily goal on 5 days",cat:"streak",icon:"calendar",test:()=>Object.values(S.days).filter(d=>d.ms>=S.settings.goal*60000).length>=5},
  {id:"level-5",title:"Level 5",desc:"Reach level 5",cat:"special",icon:"chevron",test:()=>levelInfo().level>=5},
  {id:"level-10",title:"Level 10",desc:"Reach level 10",cat:"special",icon:"chevron",test:()=>levelInfo().level>=10},
  {id:"first-text",title:"First real text",desc:"Finish a text in Practice",cat:"special",icon:"page",test:()=>S.modes.text>=1},
  {id:"first-code",title:"First code",desc:"Finish a code snippet in Practice",cat:"special",icon:"brackets",test:()=>S.modes.code>=1}
];
const achBy=id=>ACH.find(a=>a.id===id);
const medal=(a,sz,ic)=>'<span class="medal" style="--ac:var('+ACOL[a.cat]+');width:'+sz+'px;height:'+sz+'px">'+aico(a.icon,ic)+'</span>';
let LASTLV=null;
/* grants every newly met achievement; silent skips the celebration. Returns the new ids */
function checkAchievements(o){
  const silent=!!(o&&o.silent),now=Date.now(),got=[];
  ACH.forEach(a=>{
    if(own(S.ach,a.id))return;
    let ok=false;try{ok=!!a.test()}catch(e){}
    if(ok){S.ach[a.id]=now;got.push(a.id)}
  });
  if(got.length){save();if(!silent)got.forEach(id=>{const a=achBy(id);toast({icon:medal(a,36,20),title:"Achievement unlocked",sub:a.title})})}
  return got;
}
/* one call after every finished exercise: celebrations for a level up and new badges, then confetti when asked */
function liveCheck(conf){
  if(conf)CEL=Date.now();
  const lv=levelInfo().level,up=LASTLV!=null&&lv>LASTLV;LASTLV=lv;
  if(up){const L=levelInfo(),left=L.need-L.into;toast({icon:'<span class="medal" style="--ac:var(--fg);width:36px;height:36px">'+aico("chevron",20)+'</span>',title:"Level "+lv,sub:"Keep going. Level "+(lv+1)+" is "+left+" words away."})}
  checkAchievements({silent:false});
}
function afterRemote(){LASTLV=levelInfo().level;checkAchievements({silent:true})}
let achBooted=false;
statusHooks.push(s=>{
  if(s==="connecting"||achBooted)return;achBooted=true;
  LASTLV=levelInfo().level;
  if(checkAchievements({silent:true}).length&&TAB==="progress"&&UI.kind==="idle")renderTab();
});
/* hooks from the lesson, custom lesson and test flows */
function rewardsLesson(conf){liveCheck(conf)}
function rewardsTest(res,dur,o,isBest){
  SHT={wpm:res.wpm,acc:res.acc,dur,pool:o.pool,ts:Date.now()};
  if(isBest){CEL=Date.now();toast({icon:'<span class="medal" style="--ac:var(--f-ring);width:36px;height:36px">'+aico("bolt",20)+'</span>',title:"New best · "+Math.round(res.wpm)+" WPM at "+dur+" s"})}
  liveCheck(false);
}
let SHT=null;

/* ---- flame chip ---- */
function flameUpdate(){
  const el=$("flame");if(!el)return;
  const n=streak(),lit=minutesToday()>=1,hide=n===0&&minutesToday()===0;
  el.hidden=hide;if(hide)return;
  const lab=n===0?"No streak yet. Practise today to start one.":n+"-day streak"+(lit?"":". Practise today to keep it.");
  el.className="flame"+(lit?" lit":"");el.title=lab;el.setAttribute("aria-label",lab);el.setAttribute("role","img");
  el.innerHTML=flameSVG(lit)+'<span aria-hidden="true">'+n+'</span>';
}

/* ---- toasts ---- */
const TQ=[];let TON=0;
function toast(o){TQ.push(o);pumpToasts()}
function pumpToasts(){
  let box=$("toasts");
  if(!box){box=document.createElement("div");box.id="toasts";box.className="toasts";$("app").appendChild(box)}
  while(TON<3&&TQ.length){
    const o=TQ.shift();TON++;
    const el=document.createElement("div");el.className="toast"+(reduceMotion()?" pulse":"");el.setAttribute("role","status");el.setAttribute("aria-live","polite");
    el.innerHTML=(o.icon||"")+'<div class="toast-t"><b>'+esc(o.title)+'</b>'+(o.sub?'<span>'+esc(o.sub)+'</span>':"")+'</div>';
    box.appendChild(el);
    setTimeout(()=>{el.classList.add("out");setTimeout(()=>{el.remove();TON--;pumpToasts()},reduceMotion()?0:200)},4500);
  }
}

/* ---- confetti and count-up ---- */
let CEL=0;
function confetti(){
  if(reduceMotion())return;
  const pn=document.querySelector("#view .panel"),r=pn?pn.getBoundingClientRect():{left:0,width:innerWidth,top:innerHeight*.25};
  const ox=r.left+r.width/2,oy=Math.max(48,Math.min(innerHeight*.5,r.top+20));
  const cs=getComputedStyle(document.documentElement),cols=["--f-pinky","--f-ring","--f-middle","--f-index","--f-thumb"].map(n=>cs.getPropertyValue(n).trim());
  const cv=document.createElement("canvas"),dpr=Math.min(2,window.devicePixelRatio||1),W=innerWidth,H=innerHeight;
  cv.className="confetti";cv.width=W*dpr;cv.height=H*dpr;cv.setAttribute("aria-hidden","true");$("app").appendChild(cv);
  const c=cv.getContext("2d");c.scale(dpr,dpr);
  const ps=[];for(let i=0;i<80;i++){const a=-Math.PI/2+(Math.random()-.5)*1.5,v=380+Math.random()*520;
    ps.push({x:ox+(Math.random()-.5)*60,y:oy,vx:Math.cos(a)*v,vy:Math.sin(a)*v,s:5+Math.random()*5,col:cols[i%5],r:Math.random()*6.28,vr:(Math.random()-.5)*14})}
  const t0=performance.now();let last=t0;
  const step=t=>{
    const e=(t-t0)/1000,dt=Math.min(.05,(t-last)/1000);last=t;
    if(e>=1.1||!cv.isConnected){cv.remove();return}
    c.clearRect(0,0,W,H);
    ps.forEach(p=>{p.vy+=1500*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.r+=p.vr*dt;
      c.save();c.globalAlpha=Math.max(0,Math.min(1,(1.1-e)/.4));c.translate(p.x,p.y);c.rotate(p.r);c.fillStyle=p.col;c.fillRect(-p.s/2,-p.s/3,p.s,p.s*.6);c.restore()});
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
function countUp(){
  if(reduceMotion())return;
  const items=[...document.querySelectorAll("#view .result .pstat .num")].filter(e=>/\d/.test(e.textContent)&&!/:/.test(e.textContent)).map(e=>({e,f:e.textContent}));
  if(!items.length)return;
  const t0=performance.now(),D=500;
  const step=t=>{
    const p=Math.min(1,(t-t0)/D),k=1-Math.pow(1-p,3);
    items.forEach(it=>{if(it.e.isConnected)it.e.textContent=p>=1?it.f:it.f.replace(/\d+/g,n=>String(Math.round(+n*k)))});
    if(p<1)requestAnimationFrame(step);
  };
  step(t0);requestAnimationFrame(step);
}
/* called at the end of setView */
function viewHook(kind){
  if(kind==="results"||kind==="summary")countUp();
  if(CEL){const fresh=Date.now()-CEL<4000;CEL=0;if(fresh)confetti()}
}

/* ---- Progress: achievements ---- */
const fmtEarned=ts=>{const d=new Date(ts);return d.getDate()+" "+MON[d.getMonth()]};
function achHTML(){
  const n=ACH.filter(a=>own(S.ach,a.id)).length,now=Date.now();
  const items=ACH.map(a=>{
    const on=own(S.ach,a.id),ts=S.ach[a.id],fresh=on&&now-ts<864e5;
    return '<li class="ach '+(on?"on":"off")+'" tabindex="0" data-tip="'+esc(a.desc)+'" style="--ac:var('+ACOL[a.cat]+')">'+(fresh?'<i class="ach-new" title="New"><span class="vh">New</span></i>':"")+
      '<span class="medal">'+aico(a.icon,24)+'</span><span class="ach-t">'+esc(a.title)+'</span><span class="ach-s">'+(on?"Earned "+fmtEarned(ts):esc(a.desc))+'</span></li>';
  }).join("");
  return '<section class="sect-gap"><div class="stage-h" style="margin-top:0"><h2>Achievements</h2><span class="scount">'+n+' of '+ACH.length+'</span></div><ul class="ach-grid">'+items+'</ul></section>';
}

/* ---- Progress: weekly recap ---- */
const mondayOf=d=>addDays(d,-((d.getDay()+6)%7));
function weekStats(mon){
  let ms=0,chars=0,pr=0,co=0;
  for(let i=0;i<7;i++){const d=S.days[dateKey(addDays(mon,i))];if(d){ms+=d.ms;chars+=d.chars;pr+=d.presses;co+=d.correct}}
  const t0=mon.getTime(),t1=addDays(mon,7).getTime(),ts=S.tests.filter(t=>t.ts>=t0&&t.ts<t1);
  return {ms,min:ms/60000,wpm:ms>0&&chars>0?chars/5/(ms/60000):null,acc:pr>0?co/pr:null,tests:ts.length,best:ts.reduce((m,t)=>Math.max(m,t.wpm),0),has:ms>0||ts.length>0};
}
function fmtMin(m){
  const r=Math.round(m);if(m>0&&r<1)return "<1 min";
  return r>=60?Math.floor(r/60)+" h"+(r%60?" "+r%60+" min":""):r+" min";
}
const MINUS="−";
function chip(d,txt){
  if(d===0)return '<span class="delta same">No change</span>';
  return '<span class="delta '+(d>0?"up":"down")+'">'+ico(d>0?"up":"down",12)+(d>0?"+":MINUS)+txt+'</span>';
}
function weekTitle(mon){
  const sun=addDays(mon,6),a=DOW[mon.getDay()]+" "+mon.getDate(),b=DOW[sun.getDay()]+" "+sun.getDate()+" "+MON[sun.getMonth()];
  return mon.getMonth()===sun.getMonth()?a+" – "+b:a+" "+MON[mon.getMonth()]+" – "+b;
}
function recapHTML(){
  const mon=mondayOf(new Date()),c=weekStats(mon),p=weekStats(addDays(mon,-7));
  if(!c.has)return '<section class="wrecap">'+panel({flat:1,tag:"h2",eyebrow:"This week",title:esc(weekTitle(mon)),msg:"No practice yet this week. Even 10 minutes counts."})+'</section>';
  const dm=p.ms>0?Math.round(c.min)-Math.round(p.min):null;
  const stats=pstat(fmtMin(c.min),"Time",dm==null?"":chip(dm,fmtMin(Math.abs(dm))))+
    pstat(c.wpm==null?"–":Math.round(c.wpm),"Avg WPM",c.wpm==null||p.wpm==null?"":chip(Math.round(c.wpm)-Math.round(p.wpm),Math.abs(Math.round(c.wpm)-Math.round(p.wpm))+" WPM"))+
    pstat(c.acc==null?"–":Math.round(c.acc*100)+"%","Accuracy",c.acc==null||p.acc==null?"":chip(Math.round(c.acc*100)-Math.round(p.acc*100),Math.abs(Math.round(c.acc*100)-Math.round(p.acc*100))+"%"))+
    pstat(c.tests,"Tests",c.best?"best "+Math.round(c.best)+" WPM":"");
  return '<section class="wrecap">'+panel({flat:1,tag:"h2",eyebrow:"This week",title:esc(weekTitle(mon)),stats,statsCls:"c4e",foot:btn("Share week",{act:"sh-week",cls:"ghost"})})+'</section>';
}

/* ---- share card ---- */
const SW=1200,SH=630;
function rrect(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath()}
/* the logo on a canvas: same geometry as logoSVG (64 unit grid) */
function drawLogo(c,x,y,s){
  c.save();c.translate(x,y);c.scale(s/64,s/64);
  const t=c.createLinearGradient(0,0,64,64);t.addColorStop(0,"#2B3147");t.addColorStop(1,"#0C0F18");
  rrect(c,0,0,64,64,15);c.fillStyle=t;c.fill();c.strokeStyle="rgba(255,255,255,.14)";c.lineWidth=1.5;rrect(c,.75,.75,62.5,62.5,14.25);c.stroke();
  LOGO_KEYS.forEach(([cx,cy,a,p],i)=>{
    c.save();c.translate(cx,cy);c.rotate(a*Math.PI/180);
    if(i){rrect(c,-15.75,-15.75,31.5,35.5,8.75);c.fillStyle=LOGO_GAP;c.fill()}
    rrect(c,-14,-10,28,28,7);c.fillStyle=LOGO_EDGE;c.fill();
    const f=c.createLinearGradient(0,-14,0,14);f.addColorStop(0,"#FFFFFF");f.addColorStop(1,"#E3DED3");rrect(c,-14,-14,28,28,7);c.fillStyle=f;c.fill();
    c.strokeStyle=LOGO_INK;c.lineWidth=3.2;c.lineCap="round";c.lineJoin="round";c.stroke(new Path2D(p));
    rrect(c,-4,6.6,8,2.4,1.2);c.fillStyle=LOGO_BUMP;c.fill();
    c.restore();
  });
  c.restore();
}
/* a big 3D keycap with a glowing home bump */
function drawKey(c,x,y,s,ch,ang,disp){
  const h=s*.9,r=s*.2;
  c.save();c.translate(x,y);c.rotate(ang);
  c.save();c.shadowColor="rgba(0,0,0,.6)";c.shadowBlur=60;c.shadowOffsetY=30;rrect(c,-s/2,-h/2+s*.08,s,h,r);c.fillStyle="#8F887B";c.fill();c.restore();
  const f=c.createLinearGradient(0,-h/2,0,h/2);f.addColorStop(0,"#FFFFFF");f.addColorStop(1,"#E2DCCF");rrect(c,-s/2,-h/2,s,h,r);c.fillStyle=f;c.fill();
  const d=c.createLinearGradient(0,-h/2,0,h/2);d.addColorStop(0,"rgba(0,0,0,0)");d.addColorStop(1,"rgba(0,0,0,.07)");rrect(c,-s/2+s*.09,-h/2+s*.07,s-s*.18,h-s*.17,r*.75);c.fillStyle=d;c.fill();
  c.fillStyle=LOGO_INK;c.font="800 "+Math.round(s*.44)+"px "+disp;c.textAlign="center";c.textBaseline="middle";c.fillText(ch,0,-s*.06);
  c.save();c.shadowColor="rgba(255,176,59,.95)";c.shadowBlur=s*.12;rrect(c,-s*.15,s*.2,s*.3,s*.06,s*.03);c.fillStyle=LOGO_BUMP;c.fill();c.restore();
  c.restore();
}
/* o={kind:"test"|"week", big, unit, items:[[label,value]], tag}. One premium dark look in every theme. */
async function drawShareCard(o){
  const cs=getComputedStyle(document.documentElement),disp=cs.getPropertyValue("--font-display").trim(),mono=cs.getPropertyValue("--font-mono").trim();
  try{await document.fonts.ready;await Promise.all(["800 250px ","800 86px ","700 34px ","700 30px ","700 52px "].map(f=>document.fonts.load(f+disp)).concat(["600 18px ","600 15px "].map(f=>document.fonts.load(f+mono))))}catch(e){}
  const cv=document.createElement("canvas");cv.width=SW;cv.height=SH;const c=cv.getContext("2d"),M=72;
  const ls=px=>{if("letterSpacing" in c)c.letterSpacing=px+"px"};
  /* background: deep indigo, finger-colour glows, a faint dot grid */
  const bg=c.createLinearGradient(0,0,SW,SH);bg.addColorStop(0,"#0A0D18");bg.addColorStop(1,"#17113A");c.fillStyle=bg;c.fillRect(0,0,SW,SH);
  const glow=(x,y,r,col)=>{const q=c.createRadialGradient(x,y,0,x,y,r);q.addColorStop(0,col);q.addColorStop(1,"rgba(0,0,0,0)");c.fillStyle=q;c.fillRect(0,0,SW,SH)};
  glow(1010,40,560,"rgba(124,77,219,.55)");glow(90,660,480,"rgba(13,143,132,.42)");glow(960,600,380,"rgba(47,111,224,.30)");glow(330,330,360,"rgba(245,165,36,.13)");
  c.fillStyle="rgba(255,255,255,.045)";for(let y=14;y<SH;y+=28)for(let x=14;x<SW;x+=28){c.beginPath();c.arc(x,y,1.2,0,7);c.fill()}
  /* the F and J keys */
  glow(940,300,270,"rgba(245,165,36,.22)");
  drawKey(c,852,262,196,"F",-.16,disp);drawKey(c,1042,318,196,"J",.12,disp);
  /* top row: logo, wordmark, glass tag */
  drawLogo(c,M,58,64);
  c.textBaseline="alphabetic";c.textAlign="left";ls(0);c.fillStyle="#FFFFFF";c.font="700 34px "+disp;c.fillText("Home Row",M+82,58+44);
  c.font="600 18px "+mono;ls(3);const tg=o.tag.toUpperCase(),tw=c.measureText(tg).width,pw=tw+40,px=SW-M-pw,py=67;
  rrect(c,px,py,pw,46,23);c.fillStyle="rgba(255,255,255,.08)";c.fill();c.strokeStyle="rgba(255,255,255,.18)";c.lineWidth=1.5;c.stroke();
  c.fillStyle="rgba(255,255,255,.92)";c.fillText(tg,px+22,py+30);ls(0);
  /* the big number, glowing */
  c.font="800 250px "+disp;const bx=M-8,by=408,bw=c.measureText(o.big).width;
  c.save();c.shadowColor="rgba(167,139,250,.65)";c.shadowBlur=64;c.fillStyle="#E9E4FF";c.fillText(o.big,bx,by);c.restore();
  const ng=c.createLinearGradient(0,by-190,0,by);ng.addColorStop(0,"#FFFFFF");ng.addColorStop(1,"#C8BCFF");c.fillStyle=ng;c.fillText(o.big,bx,by);
  c.font="700 52px "+disp;c.fillStyle="rgba(255,255,255,.62)";c.fillText(o.unit,bx+bw+22,by);
  /* glass stat chips */
  let x=M;const cy=462,ch=94;
  o.items.forEach(it=>{
    c.font="600 15px "+mono;ls(2);const lw=c.measureText(it[0].toUpperCase()).width;ls(0);
    c.font="700 30px "+disp;const vw=c.measureText(it[1]).width,w=Math.max(lw,vw)+48;
    if(x+w>SW-M)return;
    rrect(c,x,cy,w,ch,20);c.fillStyle="rgba(255,255,255,.07)";c.fill();c.strokeStyle="rgba(255,255,255,.15)";c.lineWidth=1.5;c.stroke();
    c.fillStyle="rgba(255,255,255,.58)";c.font="600 15px "+mono;ls(2);c.fillText(it[0].toUpperCase(),x+24,cy+35);ls(0);
    c.fillStyle="#FFFFFF";c.font="700 30px "+disp;c.fillText(it[1],x+24,cy+74);
    x+=w+16;
  });
  c.fillStyle="rgba(255,255,255,.42)";c.font="600 15px "+mono;ls(2);c.textAlign="right";c.fillText("TOUCH TYPING · ALL TEN FINGERS",SW-M,SH-42);ls(0);c.textAlign="left";
  /* glowing finger-colour line */
  const bar=c.createLinearGradient(0,0,SW,0);[["#7C4DDB",0],["#2F6FE0",.34],["#0D8F84",.67],["#F5A524",1]].forEach(([col,p])=>bar.addColorStop(p,col));
  c.save();c.shadowColor="rgba(124,77,219,.85)";c.shadowBlur=26;c.fillStyle=bar;c.fillRect(0,SH-8,SW,8);c.restore();
  return new Promise((res,rej)=>cv.toBlob(b=>b?res(b):rej(new Error("no blob")),"image/png"));
}
const longDate=ts=>{const d=new Date(ts);return d.getDate()+" "+MON[d.getMonth()]+" "+d.getFullYear()};
function testCard(t){
  const items=[];
  if(t.acc!=null)items.push(["Accuracy",Math.round(t.acc*100)+"%"]);
  items.push(["Test",t.dur+" s test · "+(POOL_NAME[t.pool]||t.pool)],["Date",longDate(t.ts)]);
  return {kind:"test",big:String(Math.round(t.wpm)),unit:"WPM",tag:"Typing test",items,name:"home-row-"+Math.round(t.wpm)+"-wpm.png",alt:"Share card: "+Math.round(t.wpm)+" WPM"+(t.acc!=null?" at "+Math.round(t.acc*100)+"% accuracy":"")};
}
function weekCard(){
  const mon=mondayOf(new Date()),c=weekStats(mon),items=[];
  if(c.wpm!=null)items.push(["Average speed",Math.round(c.wpm)+" WPM"]);
  if(c.acc!=null)items.push(["Accuracy",Math.round(c.acc*100)+"%"]);
  items.push(["Week","Week of "+mon.getDate()+" "+MON[mon.getMonth()]]);
  return {kind:"week",big:String(Math.round(c.min)),unit:"MIN",tag:"This week",items,name:"home-row-week-"+dateKey(mon)+".png",alt:"Share card: "+Math.round(c.min)+" minutes of practice this week"};
}
function bestCard(){
  const d=S.settings.tDur,w=S.bests["test"+d]||0,t=S.tests.filter(x=>x.dur===d).sort((x,y)=>y.wpm-x.wpm)[0];
  return testCard({wpm:w,acc:t?t.acc:null,dur:d,pool:t?t.pool:S.settings.tPool,ts:t?t.ts:Date.now()});
}
const shareBestHTML=()=>(S.bests["test"+S.settings.tDur]||0)>0?'<div><button type="button" class="btn quiet sm" data-act="sh-best">'+ico("up",14)+'Share best · '+S.settings.tDur+' s</button></div>':"";

/* share dialog */
let SHR=null;
function shDlg(){
  let d=$("share");if(d)return d;
  d=document.createElement("dialog");d.id="share";d.setAttribute("aria-labelledby","sh-title");
  d.innerHTML='<div class="dlg-head"><h2 id="sh-title">Share your result</h2><button class="icon-btn" id="sh-x" type="button" aria-label="Close"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg></button></div>'+
    '<div class="dlg-body"><div class="sh-pic"><img id="sh-img" alt="" hidden><p class="small muted" id="sh-wait">Making your card…</p></div><p class="small muted" id="sh-msg" role="status"></p>'+
    '<div class="sh-foot"><button class="btn quiet" id="sh-close" type="button">Close</button><button class="btn" id="sh-save" type="button" hidden>Save image</button></div></div>';
  $("app").appendChild(d);
  d.addEventListener("click",e=>{if(e.target===d)d.close()});
  $("sh-x").addEventListener("click",()=>d.close());$("sh-close").addEventListener("click",()=>d.close());
  $("sh-save").addEventListener("click",shSave);
  d.addEventListener("close",()=>{if(SHR&&SHR.url)URL.revokeObjectURL(SHR.url);SHR=null;$("sh-img").removeAttribute("src")});
  return d;
}
async function openShare(o){
  const d=shDlg(),me=SHR={o,blob:null,url:"",dl:null,busy:false};
  $("sh-img").hidden=true;$("sh-wait").hidden=false;$("sh-wait").textContent="Making your card…";$("sh-msg").textContent="";$("sh-save").hidden=true;
  d.showModal();
  /* the downloads capability, if this page has one (use() resolves null when it isn't available) */
  const dlP=window.claude&&typeof window.claude.use==="function"?Promise.resolve().then(()=>window.claude.use("downloads")).catch(()=>null):Promise.resolve(null);
  let blob;
  try{blob=await drawShareCard(o)}catch(e){if(SHR===me)$("sh-wait").textContent="Couldn't make the image.";return}
  const dl=await dlP;
  if(SHR!==me)return;
  me.blob=blob;me.dl=dl;me.url=URL.createObjectURL(blob);
  const img=$("sh-img");img.alt=o.alt;img.src=me.url;img.hidden=false;$("sh-wait").hidden=true;
  if(window.claude&&!dl){$("sh-msg").textContent="Right-click or long-press the image to save it."}
  else{$("sh-save").hidden=false;$("sh-save").focus()}
}
async function shSave(){
  const me=SHR;if(!me||!me.blob||me.busy)return;
  const m=$("sh-msg");m.textContent="";
  if(me.dl){
    me.busy=true;
    try{await me.dl.save({filename:me.o.name,data:me.blob});m.textContent="Saved."}
    catch(e){const code=e&&e.code;if(code==="declined"){}else if(code==="rate_limited")m.textContent="Try again in a moment.";else m.textContent="Saving isn't available here."}
    me.busy=false;
  }else{
    const a=document.createElement("a"),u=URL.createObjectURL(me.blob);a.href=u;a.download=me.o.name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1000);
  }
}
view.addEventListener("click",e=>{
  const b=e.target.closest("[data-act]");if(!b)return;
  const a=b.dataset.act;
  if(a==="sh-test"&&SHT)openShare(testCard(SHT));
  else if(a==="sh-best")openShare(bestCard());
  else if(a==="sh-week")openShare(weekCard());
});
