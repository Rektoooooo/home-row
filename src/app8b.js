
/* ---- Coach tab: ask Claude (claude.ai) or paste its reply (website), and the lessons it wrote ---- */
const fmtDay=ts=>{const d=new Date(ts);return d.getDate()+" "+MON[d.getMonth()]};
function coachPanelHTML(){
  if(!SAMPLE||!ACCT||coachOff||!LESSONS.some(l=>lessonDone(l.n)))return "";
  const body=ASK.ok?'<p class="small muted">New lesson added below.</p>':ASK.err?'<p class="small coach-err" role="alert">'+esc(ASK.err)+'</p>':"";
  const foot=ASK.running?'<span class="grow muted thinking" role="status">Thinking<i>.</i><i>.</i><i>.</i></span>'+btn("Stop",{act:"c-stop",cls:"quiet"}):btn("Ask Claude for a lesson",{act:"c-ask",cls:"ghost"});
  return '<section class="section-s">'+panel({flat:1,tag:"h2",eyebrow:"Ask Claude",title:"A lesson made for you",
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
function renderCoach(){
  const ready=LESSONS.some(l=>lessonDone(l.n));
  let h='<div class="view-head"><h1>Coach</h1><p>Claude reads your progress and writes short lessons for the keys you miss most.</p></div>';
  if(!ready)h+='<div class="empty"><p>Pass lesson 1 first. Claude needs some of your typing to write lessons for you.</p>'+btn("Go to lesson 1",{act:"go-lesson",n:1,cls:"ghost"})+'</div>';
  else h+=window.claude?coachPanelHTML():pastePanelHTML();
  h+=coachLessonsHTML(ready);
  if(window.claude)h+=shareCardHTML();
  setView(h,"coach");
}
function coachLessonsHTML(ready){
  const n=COACH.lessons.length;
  if(!n&&!COACH.note&&!COACH.dropped&&!ready)return "";
  let h='<section class="section-s"><div class="stage-h"><h2>Your lessons</h2>'+(n?'<span class="scount">'+n+(n===1?" lesson":" lessons")+'</span>':"")+'</div>';
  if(COACH.note)h+='<div class="coach-note"><span class="label">Claude\'s note'+(COACH.note.at?" · "+fmtDay(COACH.note.at):"")+'</span><p>'+esc(COACH.note.text)+'</p></div>';
  h+=n?'<div class="cgrid">'+COACH.lessons.map(lessonCardHTML).join("")+'</div>':'<div class="empty">No lessons yet. '+(window.claude?"Ask Claude above, or ask in any Claude chat.":"Paste Claude's reply above and they show up here.")+'</div>';
  if(COACH.dropped)h+='<p class="small muted" style="margin-top:12px">'+COACH.dropped+(COACH.dropped===1?" lesson from Claude couldn't":" lessons from Claude couldn't")+' be used on this keyboard.</p>';
  return h+'</section>';
}

/* ---- website: paste Claude's reply to add lessons ---- */
let PASTE={open:false,text:"",msg:"",err:false};
const keepScroll=fn=>{const y=scrollY;fn();scrollTo(0,y)};
function pastePanelHTML(){
  const msg='<p class="small '+(PASTE.err?"coach-err":"muted")+'" id="paste-msg" role="'+(PASTE.err?"alert":"status")+'">'+esc(PASTE.msg)+'</p>';
  const body=PASTE.open?'<label class="vh" for="paste-in">Claude\'s reply</label><textarea id="paste-in" class="mtarea" rows="6" maxlength="40000" spellcheck="false" placeholder="Paste Claude\'s whole reply here">'+esc(PASTE.text)+'</textarea>'+msg:
    '<ol class="psteps"><li><b>Copy your progress.</b> It tells Claude your weakest keys and how to write the lessons.</li><li><b>Paste it into a chat with Claude</b> on claude.ai or in the Claude app.</li><li><b>Paste Claude\'s reply here.</b> Its lessons appear below.</li></ol>'+msg;
  const foot=PASTE.open?btn("Cancel",{act:"p-cancel",cls:"quiet"})+btn("Add lessons",{act:"p-add"}):btn("Copy my progress",{act:"p-copy",cls:"ghost"})+btn("Paste Claude's reply",{act:"p-open"});
  return '<section class="section-s">'+panel({flat:1,tag:"h2",eyebrow:"Three steps",title:"Get new lessons from Claude",msg:"",body,foot})+'</section>';
}
function pasteMsg(text,err){PASTE.msg=text;PASTE.err=!!err;const m=$("paste-msg");if(m){m.textContent=text;m.className="small "+(err?"coach-err":"muted");m.setAttribute("role",err?"alert":"status")}}
function pasteCopy(b){
  const text=progressExport(),label=b.textContent;
  const ok=()=>{b.textContent="Copied";pasteMsg("Copied. Paste it into a chat with Claude.");setTimeout(()=>{b.textContent=label},1600)};
  const fail=()=>{PASTE={open:false,text:"",msg:"",err:false};pasteMsg("Your browser blocked copying. Select the text below and copy it.");
    const m=$("paste-msg");if(m&&!$("paste-copy")){m.insertAdjacentHTML("afterend",'<textarea id="paste-copy" class="mtarea" rows="5" readonly aria-label="Your progress, ready to copy"></textarea>');const t=$("paste-copy");t.value=text;t.focus();t.select()}};
  try{navigator.clipboard.writeText(text).then(ok,fail)}catch(e){fail()}
}
/* the end of the JSON object that starts at st, or -1 (skips braces inside strings) */
function braceEnd(t,st){
  let d=0,inS=false,bs=false;
  for(let k=st;k<t.length;k++){
    const c=t[k];
    if(inS){if(bs)bs=false;else if(c==="\\")bs=true;else if(c==='"')inS=false;continue}
    if(c==='"')inS=true;else if(c==="{")d++;else if(c==="}"&&--d===0)return k;
  }
  return -1;
}
/* finds {"homerow":1,...} (or any object with "lessons") in a pasted chat reply */
function findLessonJSON(t){
  for(const mark of ['"homerow"','"lessons"']){
    for(let i=t.indexOf(mark);i>=0;i=t.indexOf(mark,i+1)){
      const st=t.lastIndexOf("{",i);if(st<0)continue;
      const end=braceEnd(t,st);if(end<0)continue;
      try{const o=JSON.parse(t.slice(st,end+1));if(isObj(o)&&Array.isArray(o.lessons))return o}catch(e){}
    }
  }
  return null;
}
function hash36(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0).toString(36)}
/* checks every lesson like a chat-made one; the same lesson pasted twice keeps one copy */
function importLessons(text){
  const o=findLessonJSON(String(text||""));
  if(!o)return null;
  const now=Date.now(),added=[];let bad=0;
  o.lessons.slice(0,6).forEach((l,i)=>{
    if(!isObj(l)){bad++;return}
    const steps=Array.isArray(l.steps)?l.steps:[];
    const c=cleanLesson({id:"chat-"+hash36(JSON.stringify([l.title,steps.map(s=>isObj(s)?s.text:"")])),title:l.title,why:l.why,by:"chat",created:now-i,steps});
    if(c&&!added.some(a=>a.id===c.id))added.push(c);else if(!c)bad++;
  });
  const note=typeof o.note==="string"&&o.note.trim()?{text:o.note.trim().slice(0,600),at:now}:null;
  return {added,bad,note};
}
function pasteAdd(){
  const t=$("paste-in"),r=importLessons(t?t.value:"");
  if(!r)return pasteMsg("No lessons found. Paste Claude's whole reply, including the block that starts with {\"homerow\".",true);
  if(!r.added.length)return pasteMsg(r.bad===1?"That lesson can't be used: it has characters this keyboard can't type, or a step is too short or too long. Ask Claude to fix it.":"These lessons can't be used: they have characters this keyboard can't type, or steps that are too short or too long. Ask Claude to fix them.",true);
  const ids=new Set(r.added.map(l=>l.id)),n=r.added.length;
  PASTE={open:false,text:"",err:false,msg:"Added "+n+(n===1?" lesson":" lessons")+" below."+(r.bad?" "+r.bad+(r.bad===1?" lesson":" lessons")+" couldn't be used.":"")};
  const y=scrollY;
  coachMutate(raw=>{
    const ls=(Array.isArray(raw.lessons)?raw.lessons:[]).filter(x=>!(isObj(x)&&ids.has(x.id)));
    raw.lessons=r.added.concat(ls).slice(0,20);if(r.note)raw.note=r.note;return raw;
  }).then(()=>{if(UI.kind==="coach")scrollTo(0,y)});
}

/* ---- running a custom lesson (reuses the lesson flow) ---- */
const customById=id=>COACH.lessons.find(l=>l.id===id);
function openCustomIntro(id){
  const l=customById(id);if(!l)return renderCoach();
  const steps='<ol class="csteps">'+l.steps.map(s=>'<li><span class="cname">'+esc(s.name)+'</span><code>'+esc(s.text.length>48?s.text.slice(0,48)+"…":s.text)+'</code></li>').join("")+'</ol>';
  setView('<div class="intro">'+panel({eyebrow:l.by==="app"?"From Claude · made in the app":"From Claude",title:esc(l.title),msg:esc(l.why),body:steps,
    foot:btn("Back to Coach",{act:"to-coach",cls:"quiet",icon:"back"})+'<button type="button" class="btn" data-act="c-run" data-id="'+esc(l.id)+'" data-primary>Start lesson<span class="kh" aria-hidden="true">'+ENTER+'</span></button>'})+'</div>',"intro");
  UI.escape=()=>renderCoach();
}
function startCustom(id){
  const l=customById(id);if(!l)return renderCoach();
  RUN={custom:id,title:l.title,step:1,texts:l.steps.map(s=>s.text),names:l.steps.map(s=>s.name),agg:{ms:0,chars:0,presses:0,correct:0,missBy:{}}};
  runStep();
}
function customResults(){
  const a=RUN.agg,id=RUN.custom,title=RUN.title,target=S.settings.target;
  const wpm=wpmCalc(a.chars,a.ms),acc=a.presses?a.correct/a.presses:1,passed=acc>=.95;
  let stars=0;if(passed){stars=1;if(Math.round(wpm)>=target)stars=2;if(acc>=.98&&Math.round(wpm)>=target+5)stars=3}
  const r=S.custom[id]||(S.custom[id]={wpm:0,acc:0,stars:0,attempts:0,last:0});
  const prevStars=r.stars;
  r.attempts++;r.last=Date.now();r.stars=Math.max(r.stars,stars);r.wpm=Math.max(r.wpm,wpm);r.acc=Math.max(r.acc,acc);rewardsLesson(passed&&stars>prevStars);
  const ids=Object.keys(S.custom);if(ids.length>100)ids.sort((x,y)=>S.custom[x].last-S.custom[y].last).slice(0,ids.length-100).forEach(k=>delete S.custom[k]);
  const pk=Object.entries(a.missBy).sort((x,y)=>y[1]-x[1]).slice(0,3);
  const sec=Math.round(a.ms/1000),time=Math.floor(sec/60)+":"+String(sec%60).padStart(2,"0");
  const msg=passed?"":"Accuracy "+pctTxt(acc)+". You need 95% to pass. Slow down a little and keep your eyes on the screen.";
  const keys=pk.length?'<div><span class="label">Keys to watch</span><div class="pkrow" style="margin-top:10px">'+pk.map(([k,c])=>{const i=charInfo(k)||charInfo(k.toUpperCase());return '<span class="pk"><span class="bigcap sm" style="--fc:'+fcol(i?i.key.f:"TH")+'">'+(k===" "?"space":esc(k.toUpperCase()))+'</span>'+c+(c===1?" miss":" misses")+'</span>'}).join("")+'</div></div>':"";
  setView('<div class="result">'+panel({eyebrow:"From Claude",title:esc(title),status:statusChip(passed),msg:msg?esc(msg):"",
    stats:pstat(Math.round(wpm),"WPM","target "+target)+pstat(pctTxt(acc),"Accuracy","needs 95%")+pstat(time,"Time"),
    body:(passed?'<div class="stars-lg">'+starsSVG(stars,36,true)+'</div>':"")+keys,
    foot:'<button type="button" class="btn ghost" data-act="c-run" data-id="'+esc(id)+'">Try again</button>'+btn("Back to Coach",{act:"to-coach",primary:1,hint:ENTER})})+'</div>',"results");
  UI.escape=()=>renderCoach();
}

/* ---- Coach tab (claude.ai): Share with Claude ---- */
/* without an account Claude can't read the progress, so the card copies the whole progress instead of a prompt */
const shareLocal=()=>!window.claude||saveStatus==="local"||saveStatus==="offline"||saveStatus==="failed";
/* inside claude.ai the copy can be moved into the owner's account; on the website it only asks for advice and lessons */
const progressExport=()=>window.claude?"Here is my Home Row typing progress. It is saved in this browser only. Check it, move it to my account and make me custom lessons: "+ARTIFACT_URL+"\n\n"+JSON.stringify(S):coachAsk();
/* website: Claude can't reach the app, so the copied text asks for the lessons as one JSON block the learner pastes back */
function coachAsk(){
  let allowed=[...allowedChars()];if(!allowed.length)allowed=[...LESSONS[0].keys];
  return "I'm learning to touch type with Home Row. Here is my progress. Tell me in 2 or 3 sentences what to work on, then write me 2 short practice lessons for my weakest keys and letter pairs.\n\n"+
  "My progress (JSON):\n"+JSON.stringify(buildSummary())+"\n\nRules for the lessons:\n"+
  "- Use only these characters: "+allowed.join("")+" and the space bar.\n"+
  "- 3 steps per lesson. Step 1, 40-80 characters: a drill on my weakest keys and pairs. Steps 2 and 3, 80-200 characters each: real, common English words and short phrases full of those keys. No names.\n"+
  "- Single spaces, no line breaks. Never put ' \" ` ~ or ^ directly before a vowel, c, n or y.\n"+
  "- title: up to 40 characters. why: one sentence to me, up to 140 characters. note: your advice, up to 300 characters.\n\n"+
  "End your reply with one code block that holds only this JSON, so I can paste it into the app:\n"+
  '{"homerow":1,"note":"...","lessons":[{"title":"...","why":"...","steps":[{"name":"...","text":"..."},{"name":"...","text":"..."},{"name":"...","text":"..."}]}]}';
}
function shareCardHTML(){
  if(shareLocal())return '<section class="sect-gap">'+panel({flat:1,tag:"h2",eyebrow:"Share with Claude",title:"Send your progress to Claude",
    msg:"This copy saves your progress in this browser only, so Claude can’t see it. Copy it and paste it into a Claude chat. Claude can check it, move it to your account and add custom lessons.",
    body:'<textarea class="promptbox exportbox" id="share-box" readonly rows="4" hidden aria-label="Your progress, ready to copy"></textarea><p class="small muted" id="share-msg" role="status"></p>',
    foot:'<button type="button" class="btn ghost" id="share-copy" data-act="c-copy">Copy my progress</button>'})+'</section>';
  return '<section class="sect-gap">'+panel({flat:1,tag:"h2",eyebrow:"Share with Claude",title:"Let Claude see your progress",
    msg:"Your progress is saved privately in your claude.ai account. In any Claude chat, ask Claude to check it. It can read your stats and add custom lessons to the Coach tab.",
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
    case "c-rm":{const y=scrollY;RM_ID=id;renderCoach();scrollTo(0,y);break}
    case "c-rm-no":{const y=scrollY;RM_ID="";renderCoach();scrollTo(0,y);break}
    case "c-rm-yes":RM_ID="";{const y=scrollY;coachRemove(id).then(()=>{if(UI.kind==="coach"){renderCoach();scrollTo(0,y)}});break}
    case "c-copy":copyShare(b);break;
    case "p-copy":pasteCopy(b);break;
    case "p-open":PASTE={open:true,text:"",msg:"",err:false};keepScroll(renderCoach);{const t=$("paste-in");if(t)t.focus({preventScroll:true})}break;
    case "p-cancel":PASTE={open:false,text:"",msg:"",err:false};keepScroll(renderCoach);break;
    case "p-add":pasteAdd();break;
  }
});
view.addEventListener("input",e=>{if(e.target.id==="paste-in")PASTE.text=e.target.value});

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
  off.textContent=gone?WK_GONE:window.claude?"Available on the published link.":"Available when Home Row runs inside Claude.";
  $("set-weekly").checked=!!S.settings.weekly;
  const m=$("set-weekly-msg");if(m)m.textContent=gone?"":WK.msg;
}
async function weeklyRun(o){
  const force=!!(o&&o.force);
  if(!SAMPLE||coachOff||WK.running||(!force&&!S.settings.weekly))return;
  const id=weekId();
  if((Array.isArray(COACH_RAW.lessons)?COACH_RAW.lessons:[]).some(l=>isObj(l)&&l.id===id)){
    if(force){WK.msg="Done. Find it in the Coach tab.";syncWeeklyUI()}
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
    WK.msg="Done. Find it in the Coach tab.";
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
