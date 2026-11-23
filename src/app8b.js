
/* ---- Learn tab: Coach panel and From Claude ---- */
const fmtDay=ts=>{const d=new Date(ts);return d.getDate()+" "+MON[d.getMonth()]};
function coachPanelHTML(){
  if(!SAMPLE||!ACCT||coachOff||!LESSONS.some(l=>lessonDone(l.n)))return "";
  const body=ASK.ok?'<p class="small muted">New lesson added below.</p>':ASK.err?'<p class="small coach-err" role="alert">'+esc(ASK.err)+'</p>':"";
  const foot=ASK.running?'<span class="grow muted thinking" role="status">Thinking<i>.</i><i>.</i><i>.</i></span>'+btn("Stop",{act:"c-stop",cls:"quiet"}):btn("Ask Claude for a lesson",{act:"c-ask",cls:"ghost"});
  return '<section class="section-s">'+panel({flat:1,tag:"h2",eyebrow:"Coach",title:"A lesson made for you",
    msg:"Claude looks at your weakest keys and letter pairs and writes a short lesson for you. It uses your Claude usage.",body,foot})+'</section>';
}
function lessonCardHTML(l){
  const r=S.custom[l.id],date=l.created?" · "+fmtDay(l.created):"";
  const meta=r&&r.attempts?starsSVG(r.stars,14)+'<span>'+Math.round(r.wpm)+' WPM · '+Math.round(r.acc*100)+'%</span>':'<span class="muted">Not started</span>';
  const foot=RM_ID===l.id?'<span class="grow small">Remove this lesson?</span><button type="button" class="btn danger sm" data-act="c-rm-yes" data-id="'+esc(l.id)+'">Remove</button><button type="button" class="btn quiet sm" data-act="c-rm-no">Keep</button>':
    '<button type="button" class="btn quiet sm" data-act="c-rm" data-id="'+esc(l.id)+'">Remove</button><button type="button" class="btn sm" data-act="c-open" data-id="'+esc(l.id)+'">Start</button>';
  return panel({flat:1,tag:"h3",eyebrow:(l.id.indexOf("weekly-")===0?"This week · made by Claude":l.by==="app"?"Made in the app":"Made in chat")+esc(date),title:esc(l.title),
    msg:l.why?'<span class="clamp2">'+esc(l.why)+'</span>':"",body:'<div class="cmeta">'+meta+'</div>',foot});
}
function fromClaudeHTML(){
  if(!COACH.lessons.length&&!COACH.note&&!COACH.dropped)return "";
  let h='<section class="section-s"><div class="stage-h"><h2>From Claude</h2><span class="scount">'+COACH.lessons.length+(COACH.lessons.length===1?" lesson":" lessons")+'</span></div>';
  if(COACH.note)h+='<div class="coach-note"><span class="label">Claude\'s note'+(COACH.note.at?" · "+fmtDay(COACH.note.at):"")+'</span><p>'+esc(COACH.note.text)+'</p></div>';
  if(COACH.lessons.length)h+='<div class="cgrid">'+COACH.lessons.map(lessonCardHTML).join("")+'</div>';
  if(COACH.dropped)h+='<p class="small muted" style="margin-top:12px">'+COACH.dropped+(COACH.dropped===1?" lesson from Claude couldn't":" lessons from Claude couldn't")+' be used on this keyboard.</p>';
  return h+'</section>';
}

/* ---- running a custom lesson (reuses the lesson flow) ---- */
const customById=id=>COACH.lessons.find(l=>l.id===id);
function openCustomIntro(id){
  const l=customById(id);if(!l)return renderLearn();
  const steps='<ol class="csteps">'+l.steps.map(s=>'<li><span class="cname">'+esc(s.name)+'</span><code>'+esc(s.text.length>48?s.text.slice(0,48)+"…":s.text)+'</code></li>').join("")+'</ol>';
  setView('<div class="intro">'+panel({eyebrow:l.by==="app"?"From Claude · made in the app":"From Claude",title:esc(l.title),msg:esc(l.why),body:steps,
    foot:btn("Back to lessons",{act:"to-learn",cls:"quiet",icon:"back"})+'<button type="button" class="btn" data-act="c-run" data-id="'+esc(l.id)+'" data-primary>Start lesson<span class="kh" aria-hidden="true">'+ENTER+'</span></button>'})+'</div>',"intro");
  UI.escape=()=>renderLearn();
}
function startCustom(id){
  const l=customById(id);if(!l)return renderLearn();
  RUN={custom:id,title:l.title,step:1,texts:l.steps.map(s=>s.text),names:l.steps.map(s=>s.name),agg:{ms:0,chars:0,presses:0,correct:0,missBy:{}}};
  runStep();
}
function customResults(){
  const a=RUN.agg,id=RUN.custom,title=RUN.title,target=S.settings.target;
  const wpm=wpmCalc(a.chars,a.ms),acc=a.presses?a.correct/a.presses:1,passed=acc>=.95;
  let stars=0;if(passed){stars=1;if(wpm>=target)stars=2;if(acc>=.98&&wpm>=target+5)stars=3}
  const r=S.custom[id]||(S.custom[id]={wpm:0,acc:0,stars:0,attempts:0,last:0});
  const prevStars=r.stars;
  r.attempts++;r.last=Date.now();r.stars=Math.max(r.stars,stars);r.wpm=Math.max(r.wpm,wpm);r.acc=Math.max(r.acc,acc);rewardsLesson(passed&&stars>prevStars);
  const ids=Object.keys(S.custom);if(ids.length>100)ids.sort((x,y)=>S.custom[x].last-S.custom[y].last).slice(0,ids.length-100).forEach(k=>delete S.custom[k]);
  const pk=Object.entries(a.missBy).sort((x,y)=>y[1]-x[1]).slice(0,3);
  const sec=Math.round(a.ms/1000),time=Math.floor(sec/60)+":"+String(sec%60).padStart(2,"0");
  const msg=passed?"":"Accuracy "+Math.round(acc*100)+"%. You need 95% to pass. Slow down a little and keep your eyes on the screen.";
  const keys=pk.length?'<div><span class="label">Keys to watch</span><div class="pkrow" style="margin-top:10px">'+pk.map(([k,c])=>{const i=charInfo(k)||charInfo(k.toUpperCase());return '<span class="pk"><span class="bigcap sm" style="--fc:'+fcol(i?i.key.f:"TH")+'">'+(k===" "?"space":esc(k.toUpperCase()))+'</span>'+c+(c===1?" miss":" misses")+'</span>'}).join("")+'</div></div>':"";
  setView('<div class="result">'+panel({eyebrow:"From Claude",title:esc(title),status:statusChip(passed),msg:msg?esc(msg):"",
    stats:pstat(Math.round(wpm),"WPM","target "+target)+pstat(Math.round(acc*100)+"%","Accuracy","needs 95%")+pstat(time,"Time"),
    body:(passed?'<div class="stars-lg">'+starsSVG(stars,36,true)+'</div>':"")+keys,
    foot:'<button type="button" class="btn ghost" data-act="c-run" data-id="'+esc(id)+'">Try again</button>'+btn("Back to lessons",{act:"to-learn",primary:1,hint:ENTER})})+'</div>',"results");
  UI.escape=()=>renderLearn();
}

/* ---- Progress tab: Share with Claude ---- */
/* without an account Claude can't read the progress, so the card copies the whole progress instead of a prompt */
const shareLocal=()=>saveStatus==="local"||saveStatus==="offline"||saveStatus==="failed";
/* inside claude.ai the copy can be moved into the owner's account; on the website it only asks for advice and lessons */
const progressExport=()=>(window.claude?"Here is my Home Row typing progress. It is saved in this browser only. Check it, move it to my account and make me custom lessons: "+ARTIFACT_URL:"Here is my Home Row typing progress. Check it, tell me what to work on, and write me 2 short practice lessons for my weakest keys, using only keys I have learned.")+"\n\n"+JSON.stringify(S);
function shareCardHTML(){
  if(shareLocal())return '<section class="sect-gap">'+panel({flat:1,tag:"h2",eyebrow:"Share with Claude",title:"Send your progress to Claude",
    msg:window.claude?"This copy saves your progress in this browser only, so Claude can’t see it. Copy it and paste it into a Claude chat. Claude can check it, move it to your account and add custom lessons.":"Your progress is saved in this browser. Copy it and paste it into a Claude chat. Claude can check it and write lessons for your weakest keys.",
    body:'<textarea class="promptbox exportbox" id="share-box" readonly rows="4" hidden aria-label="Your progress, ready to copy"></textarea><p class="small muted" id="share-msg" role="status"></p>',
    foot:'<button type="button" class="btn ghost" id="share-copy" data-act="c-copy">Copy my progress</button>'})+'</section>';
  return '<section class="sect-gap">'+panel({flat:1,tag:"h2",eyebrow:"Share with Claude",title:"Let Claude see your progress",
    msg:"Your progress is saved privately in your claude.ai account. In any Claude chat, ask Claude to check it. It can read your stats and add custom lessons to the Learn tab.",
    body:'<pre class="promptbox" id="share-box" tabindex="0">'+esc(SHARE_PROMPT)+'</pre><p class="small muted" id="share-msg" role="status"></p>',
    foot:'<button type="button" class="btn ghost" id="share-copy" data-act="c-copy">Copy prompt</button>'})+'</section>';
}
function copyShare(btnEl){
  const local=$("share-box")&&$("share-box").tagName==="TEXTAREA",text=local?progressExport():SHARE_PROMPT,label=btnEl.textContent,m=$("share-msg");
  const done=()=>{btnEl.textContent="Copied";if(m&&local)m.textContent="Copied. Paste it into a chat with Claude.";setTimeout(()=>{btnEl.textContent=label},1600)};
  const fallback=()=>{const b=$("share-box");if(!b)return;
    if(local){b.value=text;b.hidden=false;b.focus();b.select()}
    else{const r=document.createRange();r.selectNodeContents(b);const s=getSelection();s.removeAllRanges();s.addRange(r)}
    if(m)m.textContent="Press ⌘C to copy";};
  try{navigator.clipboard.writeText(text).then(done,fallback)}catch(e){fallback()}
}

view.addEventListener("click",e=>{
  const b=e.target.closest("[data-act]");if(!b)return;
  const id=b.dataset.id;
  switch(b.dataset.act){
    case "c-ask":askClaude();break;
    case "c-stop":if(ASK.ctl)ASK.ctl.abort();break;
    case "c-open":openCustomIntro(id);break;
    case "c-run":startCustom(id);break;
    case "c-rm":{const y=scrollY;RM_ID=id;renderLearn();scrollTo(0,y);break}
    case "c-rm-no":{const y=scrollY;RM_ID="";renderLearn();scrollTo(0,y);break}
    case "c-rm-yes":RM_ID="";{const y=scrollY;coachRemove(id).then(()=>{if(UI.kind==="learn"){renderLearn();scrollTo(0,y)}});break}
    case "c-copy":copyShare(b);break;
  }
});

/* ============================ WEEKLY COACH (phase D) ============================ */
const WK={running:false,fired:false,msg:""},WK_TRY="homerow.weeklyTry";
const WK_GONE="Claude isn't available for this page.";
/* ISO week: weeks start on Monday, week 1 holds the first Thursday */
function isoWeek(d){
  const t=new Date(d.getFullYear(),d.getMonth(),d.getDate());
  t.setDate(t.getDate()+3-((t.getDay()+6)%7));
  const y=t.getFullYear(),w1=new Date(y,0,4);
  return {y,w:1+Math.round(((t-w1)/864e5-3+((w1.getDay()+6)%7))/7)};
}
const weekId=d=>{const x=isoWeek(d||new Date());return "weekly-"+x.y+"-w"+String(x.w).padStart(2,"0")};
function weekBrief(mon){
  const s=weekStats(mon);let n=0;
  for(let i=0;i<7;i++){const d=S.days[dateKey(addDays(mon,i))];if(d&&d.ms>0)n++}
  return {minutes:Math.round(s.min),daysPracticed:n,avgWpm:s.wpm==null?null:Math.round(s.wpm),accuracyPercent:s.acc==null?null:Math.round(s.acc*100),tests:s.tests,bestTestWpm:s.best?Math.round(s.best):null};
}
function practiceMs7(){let ms=0;for(let i=0;i<7;i++){const r=S.days[dateKey(addDays(new Date(),-i))];if(r)ms+=r.ms}return ms}
function syncWeeklyUI(){
  const off=$("set-coach-off"),on=$("set-coach-on");if(!off||!on)return;
  const gone=coachOff||WK.msg===WK_GONE,none=!SAMPLE&&!gone;
  on.hidden=none||gone;off.hidden=!(none||gone);
  off.textContent=gone?WK_GONE:"Available when Home Row runs inside Claude.";
  $("set-weekly").checked=!!S.settings.weekly;
  const m=$("set-weekly-msg");if(m)m.textContent=gone?"":WK.msg;
}
async function weeklyRun(o){
  const force=!!(o&&o.force);
  if(!SAMPLE||coachOff||WK.running||(!force&&!S.settings.weekly))return;
  const id=weekId();
  if((Array.isArray(COACH_RAW.lessons)?COACH_RAW.lessons:[]).some(l=>isObj(l)&&l.id===id)){
    if(force){WK.msg="Done. Find it under From Claude on Learn.";syncWeeklyUI()}
    return;
  }
  const today=dateKey();let tried="";
  try{tried=localStorage.getItem(WK_TRY)||""}catch(e){}
  if(!force&&tried===today)return;
  try{localStorage.setItem(WK_TRY,today)}catch(e){}
  if(!force&&practiceMs7()<300000)return;
  WK.running=true;WK.msg="Writing this week's lesson…";syncWeeklyUI();
  try{
    const allowed=allowedChars(),mon=mondayOf(new Date()),sum=buildSummary();
    sum.lastWeek=weekBrief(addDays(mon,-7));sum.thisWeekSoFar=weekBrief(mon);
    const prompt=buildPrompt(sum,allowed,"The note starts with a one-sentence recap of last week (time, speed, accuracy), then one piece of advice.");
    const data=await SAMPLE.json(prompt,{modelTier:"default",cache:false});
    const v=validateReply(data,allowed);if(!v)throw {code:"invalid_json"};
    const now=Date.now(),lesson={id,title:v.title,why:v.why,by:"app",created:now,steps:v.steps};
    await coachMutate(raw=>{
      const ls=(Array.isArray(raw.lessons)?raw.lessons:[]).filter(l=>!(isObj(l)&&typeof l.id==="string"&&l.id.indexOf("weekly-")===0));
      ls.unshift(lesson);raw.lessons=ls.slice(0,20);raw.note={text:v.note,at:now};return raw;
    });
    WK.msg="Done. Find it under From Claude on Learn.";
    toast({icon:'<span class="medal" style="--ac:var(--fg);width:36px;height:36px">'+aico("bolt",20)+'</span>',title:"This week's lesson is ready",sub:v.title});
  }catch(e){
    const code=e&&e.code;
    if(HIDE_CODES.includes(code)){coachOff=true;S.settings.weekly=false;settingChanged();WK.msg=WK_GONE}
    else WK.msg=force?(ASK_COPY[code]||"Something went wrong. Try again."):"";
  }
  WK.running=false;syncWeeklyUI();
}
/* automatic run: once per page load, after the account status, the sampler and the first coach snapshot are all in */
function weeklyAuto(){
  if(WK.fired||!SAMPLE||!COACH_SNAP||saveStatus==="connecting")return;
  WK.fired=true;weeklyRun({});
}
statusHooks.push(()=>weeklyAuto());
