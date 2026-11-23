
/* ============================ TODAY'S SESSION (part C) ============================ */
/* SESSION lives in memory only. Steps run in order; each exercise saves exactly as it does outside a session. */
let SESSION=null;
const TICK='<svg width="10" height="10" viewBox="0 0 8 8" aria-hidden="true" style="margin-right:5px"><path d="M1.5 4.2l1.8 1.8 3.2-3.8" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
function buildSteps(){
  const nx=nextLessonN(),steps=[];
  if(poolLetters().length)steps.push({id:"warm",label:"Warm-up",rounds:1});
  steps.push(nx?{id:"lesson",label:"Lesson",n:nx}:{id:"extra",label:"Practice round",rounds:1});
  steps.push({id:"practice",label:"Practice",rounds:2});
  steps.push(lessonDone(18)||S.settings.unlockAll?{id:"test",label:"Test"}:{id:"review",label:"Review",rounds:1});
  return steps;
}
function sessionBar(noEnd){
  const n=SESSION.steps.length,i=Math.min(SESSION.i,n-1);
  const pills=SESSION.steps.map((s,k)=>'<span class="spill'+(k<SESSION.i?" done":k===SESSION.i?" cur":"")+'"'+(k===SESSION.i?' aria-current="step"':"")+'>'+(k<SESSION.i?TICK:"")+esc(s.label)+'</span>').join("");
  const segs=SESSION.steps.map((s,k)=>'<i'+(k<SESSION.i?' class="d"':"")+'></i>').join("");
  return '<div class="sbar'+(noEnd?" noend":"")+'" role="navigation" aria-label="Today\'s session"><span class="sname sb-desk">Today\'s session</span><span class="spills sb-desk">'+pills+'</span>'+
    '<div class="sb-mob"><span class="t">Step '+(i+1)+' of '+n+' · '+esc(SESSION.steps[i].label)+'</span><span class="segs" aria-hidden="true">'+segs+'</span></div>'+
    '<button class="btn quiet sm sx" type="button" data-act="s-end" aria-label="End session"'+(noEnd?' tabindex="-1" aria-hidden="true"':"")+'>'+ico("x")+'<span class="sx-t">End session</span></button></div>';
}
function startSession(){
  SESSION={steps:buildSteps(),i:0,round:0,rs:[],all:[],focus:[]};
  runSessionStep();
}
function endSession(){SESSION=null;renderLearn()}
function runSessionStep(){
  const st=SESSION.steps[SESSION.i];
  if(!st)return sessionDone();
  SESSION.round=0;SESSION.rs=[];
  if(st.id==="lesson")return openIntro(st.n);
  if(st.id==="test")return startTest({dur:60,o:{pool:"c200",caps:false,punct:false,nums:false},back:endSession,
    onDone:res=>{SESSION.rs.push(res);stepFinished()}});
  if(!poolLetters().length){SESSION.i++;return runSessionStep()}
  sessionRound();
}
function sessionRound(){
  const st=SESSION.steps[SESSION.i];
  startRound({avoid:SESSION.focus.map(f=>f.focus),crumb:st.label+(st.rounds>1?" "+(SESSION.round+1)+" of "+st.rounds:""),back:endSession,
    onDone:(res,info)=>{SESSION.rs.push(res);SESSION.focus.push(info);SESSION.round++;if(SESSION.round<st.rounds)sessionRound();else stepFinished()}});
}
const sumRes=a=>{const t=a.reduce((x,r)=>({ms:x.ms+r.ms,chars:x.chars+r.chars,presses:x.presses+r.presses,correct:x.correct+r.correct}),{ms:0,chars:0,presses:0,correct:0});
  return {wpm:wpmCalc(t.chars,t.ms),acc:t.presses?t.correct/t.presses:1,ms:t.ms,chars:t.chars,presses:t.presses,correct:t.correct}};
function upNextHTML(st){
  let inner;
  if(st.id==="lesson"){const L=LESSONS[st.n-1];inner=newKeyCaps(L)+'<span class="txt2">Lesson '+st.n+' · '+esc(L.title)+'</span>'}
  else if(st.id==="test")inner='<span class="txt2">60 seconds</span>';
  else{
    const pool=poolLetters(),f=pool.length?chooseFocus(pool,SESSION.focus.map(x=>x.focus)):"";
    const caps=f?'<span class="caps">'+[...f].map(c=>'<span class="bigcap xs" style="--fc:'+fcol(charInfo(c).key.f)+'">'+esc(c.toUpperCase())+'</span>').join("")+'</span>':"";
    inner=caps+'<span class="txt2">'+st.rounds+(st.rounds===1?" round":" rounds")+'</span>';
  }
  return '<div class="upnext"><span class="label">Up next</span>'+inner+'</div>';
}
function stepFinished(){
  const st=SESSION.steps[SESSION.i],r=sumRes(SESSION.rs);
  SESSION.all.push(...SESSION.rs);SESSION.i++;
  const nx=SESSION.steps[SESSION.i];
  if(!nx)return sessionDone();
  setView('<div class="result">'+panel({eyebrow:'Step '+SESSION.i+' of '+SESSION.steps.length,title:esc(st.label)+' done',
    stats:pstat(Math.round(r.wpm),"WPM")+pstat(Math.round(r.acc*100)+"%","Accuracy"),statsCls:"c2",body:upNextHTML(nx),
    foot:btn("End session",{act:"s-end",cls:"quiet",icon:"x"})+btn("Continue",{act:"s-continue",primary:1,hint:ENTER})})+'</div>',"session");
}
function sessionDone(){
  const all=sumRes(SESSION.all),m=minutesToday(),g=S.settings.goal,st=streak();
  let best=null;SESSION.focus.forEach(f=>{if(f.before!=null&&f.after!=null&&f.after>f.before&&(!best||f.after-f.before>best.after-best.before))best=f});
  const more=m<g&&poolLetters().length>0;
  SESSION=null;
  setView('<div class="result">'+panel({eyebrow:"Today's session",title:"Session done",
    msg:best?'Most improved: <b>'+esc(best.focus.toUpperCase())+'</b>, '+best.before+' → '+best.after+' WPM.':"",
    stats:pstat(all.ms?Math.round(all.wpm):"–","Average WPM")+pstat(all.presses?Math.round(all.acc*100)+"%":"–","Average accuracy")+pstat(st+" day"+(st===1?"":"s"),"Streak"),statsCls:"c3",
    body:'<div><div class="label" style="display:flex;justify-content:space-between"><span>Practised today</span><span>'+Math.floor(m)+' of '+g+' min</span></div><div class="bar" style="max-width:none" aria-hidden="true"><i style="width:'+Math.min(100,m/g*100).toFixed(0)+'%"></i></div></div>',
    foot:(more?btn("One more practice round",{act:"s-more",cls:"ghost"}):"")+btn("Back to Learn",{act:"s-back",primary:1,hint:ENTER})})+'</div>',"session");
  UI.escape=()=>renderLearn();
}
view.addEventListener("click",e=>{
  const b=e.target.closest("[data-act]");if(!b)return;
  switch(b.dataset.act){
    case "s-start":startSession();break;
    case "s-end":case "s-back":endSession();break;
    case "s-continue":runSessionStep();break;
    case "s-lesson-done":stepFinished();break;
    case "s-more":startRound({back:()=>renderLearn(),onDone:()=>renderLearn()});break;
  }
});
