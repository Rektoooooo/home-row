/* ============================ PRACTICE MODES: Real text, Code, Your text (phase C) ============================ */
/* The mode is a per-browser choice (localStorage). Texts you paste never enter S or the account. */
const PM_KEY="homerow.pmode",PM_LANG="homerow.clang",PM_DONE="homerow.textsDone",PM_MINE="homerow.mytexts";
const pmGet=(k,d)=>{try{const v=localStorage.getItem(k);return v==null?d:v}catch(e){return d}};
const pmSet=(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}};
const pmJSON=(k,d)=>{try{const v=JSON.parse(localStorage.getItem(k));return v==null?d:v}catch(e){return d}};
const PMODES=[["adaptive","Adaptive"],["text","Real text"],["code","Code"],["mine","Your text"]];
const PMLANGS=["All","JavaScript","Python","Swift","CSS","SQL","Shell"];
const pmLockN=m=>m==="text"?20:m==="code"?22:0;
const pmLocked=m=>{const n=pmLockN(m);return !!n&&!(lessonDone(n)||S.settings.unlockAll)};
function pmode(){const m=pmGet(PM_KEY,"adaptive");return PMODES.some(x=>x[0]===m)?m:"adaptive"}
function pmSwitchHTML(){
  const cur=pmode();
  return '<div class="pmodes"><div class="seg" role="group" aria-label="Practice mode">'+PMODES.map(m=>'<button type="button" data-pm="'+m[0]+'" aria-pressed="'+(m[0]===cur)+'">'+esc(m[1])+(pmLocked(m[0])?'<span class="lk">'+ico("lock",13)+'<span class="vh"> (locked)</span></span>':"")+'</button>').join("")+'</div></div>';
}
const pmHead=sub=>'<div class="view-head"><h1>Practice</h1><p>'+sub+'</p></div>'+pmSwitchHTML();
const pmChars=n=>n+(n===1?" character":" characters");
function pmStrip(info,extra){
  if(!info||info.wpm==null)return "";
  return '<section class="panel flat rstrip" aria-label="Round result"><span class="label">Round done</span><span class="rs"><span class="num">'+Math.round(info.wpm)+'</span><span class="label">WPM</span></span><span class="rs"><span class="num">'+Math.round(info.acc*100)+'%</span><span class="label">Accuracy</span></span>'+(extra||"")+'</section>';
}
/* one round in a mode: o={text,code,crumb,back,done(res)} */
function pmRound(o){
  mountStage({text:o.text,code:!!o.code,mode:S.settings.stop?"stop":"free",crumb:o.crumb,pace:paceFor("practice"),back:o.back||(()=>renderPractice()),
    onFinish:res=>{S.modes.at=Date.now();o.done(res);liveCheck(false)}});
  UI.escape=null;
}
const pmInfo=res=>({wpm:res.wpm,acc:res.acc});

/* ---- Real text ---- */
let RT=null;
const pmDone=()=>{const a=pmJSON(PM_DONE,[]);return Array.isArray(a)?a.filter(x=>typeof x==="string"):[]};
function pmMarkDone(id){pmSet(PM_DONE,JSON.stringify(pmDone().filter(x=>x!==id).concat(id).slice(-20)))}
function pmPickText(){
  const done=new Set(pmDone()),fresh=TEXTS.filter(t=>!done.has(t.t)&&t!==RT);
  RT=pick(fresh.length?fresh:TEXTS.filter(t=>t!==RT));
}
function pmMinutes(n){const w=S.bests.practice||S.settings.target||20,m=Math.max(1,Math.round(n/5/w));return "about "+m+(m===1?" minute":" minutes")}
function pmPaceLine(){const pc=paceFor("practice");return pc?'<p class="small muted">Pace caret: '+(S.settings.pace==="best"&&S.bests.practice>0?"your best, ":"")+Math.round(pc)+' WPM</p>':""}
function pmStartText(t,crumb){
  pmRound({text:t.x,crumb:crumb||"Practice · Real text",done:res=>{S.modes.text++;pmMarkDone(t.t);RT=null;renderPractice(pmInfo(res))}});
}
function pmTextPage(info){
  if(!RT)pmPickText();
  const t=RT,done=new Set(pmDone());
  const hero=panel({flat:1,eyebrow:"Real text",title:esc(t.t),tag:"h2",
    body:'<div class="nr-grid"><div class="nr-l"><p class="muted">'+pmChars(t.x.length)+' · '+pmMinutes(t.x.length)+' at your speed</p><p class="muted">Capitals, punctuation and numbers are part of the text.</p>'+pmPaceLine()+'</div>'+
      '<div class="nr-r"><span class="label">Preview</span><div class="preview l4" role="group" aria-label="Preview of the text"><span>'+esc(t.x)+'</span></div></div></div>',
    foot:btn("New text",{act:"pm-new",cls:"quiet",icon:"restart"})+btn("Start",{act:"pm-start",primary:1,hint:ENTER})});
  const lib=panel({flat:1,eyebrow:"All texts",msg:"Tap a text to start it. Texts you finished are checked.",
    body:'<div class="tlist">'+TEXTS.map((x,i)=>{const d=done.has(x.t);return '<button type="button" class="trow'+(d?" done":"")+'" data-act="pm-text" data-i="'+i+'"><span class="tt">'+esc(x.t)+'</span>'+(d?'<span class="ok" role="img" aria-label="Done">'+ico("check",14)+'</span>':"")+'<span class="go">'+ico("next",16)+'</span></button>'}).join("")+'</div>'});
  setView(pmHead("Type real passages with capitals, punctuation and numbers.")+pmStrip(info)+hero+'<div class="pmlib">'+lib+'</div>',"idle");
}

/* ---- Code ---- */
let CS=null;
const pmLang=()=>{const l=pmGet(PM_LANG,"All");return PMLANGS.includes(l)?l:"All"};
const pmSnips=()=>{const l=pmLang();return l==="All"?SNIPPETS:SNIPPETS.filter(s=>s.lang===l)};
function pmPickSnip(){const l=pmSnips().filter(s=>s!==CS);CS=pick(l.length?l:SNIPPETS)}
function pmStartCode(s){
  pmRound({text:s.x,code:true,crumb:"Practice · Code",done:res=>{S.modes.code++;CS=null;renderPractice(pmInfo(res))}});
}
function pmCodePage(info){
  if(!CS||(pmLang()!=="All"&&CS.lang!==pmLang()))pmPickSnip();
  const s=CS,lines=s.x.split("\n").length;
  const chips='<div class="pmodes"><div class="seg" role="group" aria-label="Language">'+PMLANGS.map(l=>'<button type="button" data-pml="'+l+'" aria-pressed="'+(l===pmLang())+'">'+esc(l)+'</button>').join("")+'</div></div>';
  const hero=panel({flat:1,eyebrow:"Code · "+esc(s.lang),title:esc(s.t),tag:"h2",
    body:'<div class="nr-grid"><div class="nr-l"><p class="muted">Press Enter for a new line. Indentation is typed for you.</p><p class="small muted">'+lines+(lines===1?" line":" lines")+' · '+pmChars(s.x.length)+'</p>'+pmPaceLine()+'</div>'+
      '<div class="nr-r"><span class="label">Preview</span><div class="preview code" role="group" aria-label="Preview of the snippet" tabindex="0">'+esc(s.x)+'</div></div></div>',
    foot:btn("New snippet",{act:"pm-new",cls:"quiet",icon:"restart"})+btn("Start",{act:"pm-start",primary:1,hint:ENTER})});
  const list=pmSnips();
  const lib=panel({flat:1,eyebrow:"Snippets",msg:pmLang()==="All"?"All "+list.length+" snippets. Tap one to start it.":list.length+" "+pmLang()+" snippets. Tap one to start it.",
    body:'<div class="tlist">'+list.map(x=>'<button type="button" class="trow" data-act="pm-snip" data-i="'+SNIPPETS.indexOf(x)+'"><span class="ltag">'+esc(x.lang)+'</span><span class="tt">'+esc(x.t)+'</span><span class="go">'+ico("next",16)+'</span></button>').join("")+'</div>'});
  setView(pmHead("Type short code snippets with real indentation and symbols.")+chips+pmStrip(info)+hero+'<div class="pmlib">'+lib+'</div>',"idle");
}

/* ---- locked modes ---- */
function pmLockedPage(m,info){
  const n=pmLockN(m),label=m==="text"?"Real text":"Code",stage=LESSONS[n-1].stage,nx=nextLessonN();
  let sample;
  if(m==="text"){if(!RT)pmPickText();sample='<span class="label">A sample</span><div class="preview l4" role="group" aria-label="Sample text"><span>'+esc(RT.x)+'</span></div>'}
  else{if(!CS||pmLang()!=="All")CS=pick(SNIPPETS);sample='<span class="label">A sample</span><div class="preview code" role="group" aria-label="Sample snippet" tabindex="0">'+esc(CS.x)+'</div>'}
  const what=m==="text"?TEXTS.length+" short passages, from a few lines to a paragraph. Real sentences with capitals, punctuation and numbers.":SNIPPETS.length+" short snippets in JavaScript, Python, Swift, CSS, SQL and Shell. Enter starts a new line, and indentation is typed for you.";
  const hero=panel({flat:1,eyebrow:ico("lock",14)+" "+label,title:esc(label)+" unlocks after lesson "+n+" ("+esc(stage)+").",tag:"h2",
    body:'<div class="nr-grid"><div class="nr-l"><p class="muted">'+what+'</p></div><div class="nr-r">'+sample+'</div></div>',
    foot:btn("Try one anyway",{act:"pm-try",cls:"quiet"})+(nx?btn("Go to lesson "+nx,{act:"go-lesson",n:nx,primary:1,hint:ENTER}):"")});
  setView(pmHead(m==="text"?"Type real passages with capitals, punctuation and numbers.":"Type short code snippets with real indentation and symbols.")+pmStrip(info)+hero,"idle");
}

/* ---- Your text ---- */
const MT_MAX=20;
function cleanText(s){
  let n=0;
  s=String(s).replace(/[\s  -   　]+/g," ");/* line breaks, tabs, no-break and thin spaces */
  const MAP={"‘":"'","’":"'","‚":"'","‛":"'","“":'"',"”":'"',"„":'"',"‟":'"',"–":"-","—":"-","−":"-","…":"...","•":"-","×":"x"};
  let o="";for(const ch of s){if(own(MAP,ch)){o+=MAP[ch];n++}else o+=ch}
  let d="";for(const ch of o.normalize("NFD")){if(/[̀-ͯ]/.test(ch))n++;else d+=ch}
  let r="";for(const ch of d){if(ch===" "||charInfo(ch))r+=ch;else n++}
  return {text:r.replace(/ {2,}/g," ").trim(),changed:n};
}
/* parts of about 300 characters (220 to 360), split at sentence ends when possible, otherwise at a space */
function splitParts(text,max){
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
const mtList=()=>{const a=pmJSON(PM_MINE,[]);return Array.isArray(a)?a.filter(x=>x&&typeof x.id==="string"&&Array.isArray(x.parts)&&x.parts.length):[]};
const mtSave=a=>pmSet(PM_MINE,JSON.stringify(a.slice(0,5)));
let MT_DRAFT="",MT_RES=null;
function mtFeedback(raw,submit){
  const c=cleanText(raw),sp=splitParts(c.text);let h="";
  if(submit&&c.text.length<20)return {err:true,html:"Add at least 20 characters that can be typed."};
  if(c.changed>0)h+="Changed "+c.changed+(c.changed===1?" character":" characters")+" so everything can be typed. ";
  if(sp.cut)h+="Only the first "+MT_MAX+" parts are kept.";
  return {err:false,html:h.trim(),c,sp};
}
function mtRow(t,first){
  const done=t.next>=t.parts.length,lab=done?"Done":"Part "+(t.next+1)+" of "+t.parts.length;
  return '<li class="mrow"><div class="mt"><strong>'+esc(t.title)+'</strong><span class="small muted">'+lab+'</span></div><div class="ma">'+
    '<button type="button" class="btn sm" data-act="pm-mine-cont" data-id="'+esc(t.id)+'"'+(first?' data-mt-first':"")+'>'+(done?"Start again":"Continue")+(first?'<span class="kh" aria-hidden="true">'+ENTER+'</span>':"")+'</button>'+
    '<button type="button" class="btn quiet sm" data-act="pm-mine-rm" data-id="'+esc(t.id)+'" aria-label="Remove '+esc(t.title)+'">Remove</button></div></li>';
}
function mtSyncPrimary(){
  const ta=$("mt-in"),go=view.querySelector('[data-act="pm-mine-go"]'),first=view.querySelector("[data-mt-first]");
  if(!ta||!go||view.querySelector(".mt-strip [data-primary]"))return;
  const useGo=!first||ta.value.trim().length>0;
  go.toggleAttribute("data-primary",useGo);if(first)first.toggleAttribute("data-primary",!useGo);
}
function pmMinePage(info){
  const list=mtList(),res=MT_RES;MT_RES=null;
  let strip="";
  if(res&&info&&info.wpm!=null){
    const last=res.idx+1>=res.total;
    strip=pmStrip(info,'<span class="rbtns">'+(last?btn("Done",{act:"pm-mine-back",primary:1}):btn("Next part",{act:"pm-mine-cont",primary:1,hint:ENTER}).replace('data-act="pm-mine-cont"','data-act="pm-mine-cont" data-id="'+esc(res.id)+'"')+btn("Back to your texts",{act:"pm-mine-back",cls:"quiet"}))+'</span>').replace('class="panel flat rstrip"','class="panel flat rstrip mt-strip"');
    if(last)strip=strip.replace('<span class="label">Round done</span>','<span class="label">Round done</span><span class="status ok">'+ico("check",14)+'All parts done</span>');
  }
  const input=panel({flat:1,eyebrow:"Your text",title:"Type your own writing",tag:"h2",
    body:'<label class="vh" for="mt-in">Your text</label><textarea id="mt-in" class="mtarea" rows="6" maxlength="6000" placeholder="Paste an email, notes or any text you write often." spellcheck="false" autocomplete="off">'+esc(MT_DRAFT)+'</textarea>'+
      '<p class="small mtmsg" id="mt-msg" role="status" aria-live="polite"></p><p class="small muted">Saved in this browser only. Your text never leaves this device.</p>',
    foot:btn("Clean up and start",{act:"pm-mine-go",primary:!res&&!list.length?1:0})});
  const recent=list.length?panel({flat:1,eyebrow:"Recent texts",msg:"Pick up where you left off. The last 5 are kept.",body:'<ul class="mlist">'+list.map((t,i)=>mtRow(t,i===0&&!res)).join("")+'</ul>'}):"";
  setView(pmHead("Practise with your own writing, in parts of about 300 characters.")+strip+'<div class="mtgrid'+(recent?" two":"")+'">'+input+recent+'</div>',"idle");
  const ta=$("mt-in");
  if(ta){
    const upd=()=>{MT_DRAFT=ta.value;const f=mtFeedback(ta.value,false);$("mt-msg").className="small mtmsg muted";$("mt-msg").textContent=ta.value.trim()?f.html:"";mtSyncPrimary()};
    ta.addEventListener("input",upd);
    if(MT_DRAFT)upd();else mtSyncPrimary();
  }
}
function mtStart(t,idx){
  const total=t.parts.length;
  pmRound({text:t.parts[idx],crumb:"Practice · Your text · Part "+(idx+1)+" of "+total,done:res=>{
    S.modes.mine++;
    const a=mtList(),e=a.find(x=>x.id===t.id);if(e){e.next=Math.max(e.next>=total?0:e.next,idx+1);e.at=Date.now();mtSave(a)}
    MT_RES={id:t.id,idx,total};renderPractice(pmInfo(res));
  }});
}
function mtGo(){
  const ta=$("mt-in");if(!ta)return;
  const f=mtFeedback(ta.value,true);
  if(f.err){const m=$("mt-msg");m.className="small mtmsg err";m.textContent=f.html;ta.focus();return}
  const parts=f.sp.parts,title=f.c.text.slice(0,40).trim();
  let a=mtList().filter(x=>!(x.parts[0]===parts[0]&&x.parts.length===parts.length));
  const t={id:Date.now().toString(36)+Math.random().toString(36).slice(2,6),title,parts,next:0,at:Date.now()};
  a.unshift(t);mtSave(a);MT_DRAFT="";
  mtStart(t,0);
}

/* ---- routing into the modes (called from renderPractice) ---- */
function renderPMode(info){
  const m=pmode();
  if(m==="text"||m==="code"){if(pmLocked(m))return pmLockedPage(m,info);return m==="text"?pmTextPage(info):pmCodePage(info)}
  pmMinePage(info);
}
view.addEventListener("click",e=>{
  const b=e.target.closest("[data-pm],[data-pml],[data-act]");if(!b||TAB!=="practice"||UI.kind!=="idle")return;
  if(b.dataset.pm){pmSet(PM_KEY,b.dataset.pm);renderPractice();return}
  if(b.dataset.pml){pmSet(PM_LANG,b.dataset.pml);CS=null;renderPractice();return}
  const a=b.dataset.act;if(!a||a.slice(0,3)!=="pm-")return;
  const m=pmode();
  if(a==="pm-new"){const y=scrollY;if(m==="text")pmPickText();else pmPickSnip();renderPractice();scrollTo(0,y)}
  else if(a==="pm-start"){if(m==="text")pmStartText(RT);else pmStartCode(CS)}
  else if(a==="pm-try"){if(m==="text"){if(!RT)pmPickText();pmStartText(RT)}else{if(!CS)CS=pick(SNIPPETS);pmStartCode(CS)}}
  else if(a==="pm-text")pmStartText(TEXTS[+b.dataset.i]);
  else if(a==="pm-snip")pmStartCode(SNIPPETS[+b.dataset.i]);
  else if(a==="pm-mine-go")mtGo();
  else if(a==="pm-mine-cont"){const t=mtList().find(x=>x.id===b.dataset.id);if(t)mtStart(t,t.next>=t.parts.length?0:t.next)}
  else if(a==="pm-mine-rm"){mtSave(mtList().filter(x=>x.id!==b.dataset.id));renderPractice()}
  else if(a==="pm-mine-back")renderPractice();
});
