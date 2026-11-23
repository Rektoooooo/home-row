
/* ============================ TYPING ENGINE ============================ */
const $=id=>document.getElementById(id);
const view=$("view"),sink=$("sink");
const reduceMotion=()=>window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;
const PACE_LIVE=new Set();
let EX=null,UI={kind:"learn"},VK="",czechShown=false,lastComp=null;
const TIPS={dead:"Your U.S. International layout treats ' and \" as accent keys. Press Space after them to type the mark on its own; the app accepts that. Or switch to the ABC or U.S. layout while you practise.",
  czech:"Your Czech keyboard is active. Switch the input source back to U.S. to match this course."};
/* ---- key sounds: WebAudio only, no audio files. No steady tones anywhere: a steady sine reads as a beep. ---- */
let actx=null,nbuf=null,mgain=null;
function audio(){
  if(!actx){const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;
    try{actx=new C({latencyHint:"interactive"})}catch(e){actx=new C()}
    mgain=actx.createGain();mgain.gain.value=.5;
    const comp=actx.createDynamicsCompressor();comp.threshold.value=-18;comp.ratio.value=4;comp.attack.value=.001;comp.release.value=.05;
    mgain.connect(comp);comp.connect(actx.destination);
    nbuf=actx.createBuffer(1,actx.sampleRate,actx.sampleRate);const d=nbuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1}
  if(actx.state==="suspended")actx.resume();return actx;
}
const jit=(x,p)=>x*(1+(Math.random()*2-1)*p);
/* gain envelope: 1.5 ms attack, exponential decay */
function env(t,dur,vol){const g=actx.createGain();g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+.0015);g.gain.exponentialRampToValueAtTime(.0001,t+dur);g.connect(mgain);return g}
/* filtered noise from a random slice of a 1 s buffer, so no two presses are identical */
function noise(type,f,q,dur,vol,t){const s=actx.createBufferSource(),fl=actx.createBiquadFilter();s.buffer=nbuf;fl.type=type;fl.frequency.value=f;fl.Q.value=q;s.connect(fl);fl.connect(env(t,dur,vol));s.start(t,Math.random()*.8,dur+.02)}
/* the body of a key: a sine that falls fast in pitch, heard as a short thud, never as a beep */
function knock(f0,f1,dur,vol,t){const o=actx.createOscillator();o.type="sine";o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(f1,t+dur*.8);o.connect(env(t,dur,vol));o.start(t);o.stop(t+dur+.02)}
const KEYPACKS={
  soft:(sp,t)=>{noise("lowpass",jit(sp?900:1300,.08),.6,sp?.045:.03,sp?.6:.5,t);knock(jit(sp?150:190,.06),70,sp?.05:.035,.24,t)},
  /* creamy: lubed linear switches. Deep muffled thock, almost no high click, a soft release a moment later */
  cream:(sp,t)=>{knock(jit(sp?150:205,.05),sp?70:95,sp?.07:.045,jit(sp?.34:.28,.12),t);noise("bandpass",jit(sp?260:380,.06),2.2,sp?.07:.05,jit(sp?.42:.34,.12),t);noise("bandpass",jit(sp?850:1150,.08),1.2,sp?.024:.018,jit(.2,.15),t+.001);noise("lowpass",2400,.7,.006,.07,t);const r=t+jit(sp?.11:.085,.15);noise("bandpass",jit(sp?1000:1450,.08),1.5,.012,jit(.07,.2),r);knock(jit(sp?220:300,.06),sp?140:180,.014,.04,r)},
  click:(sp,t)=>{noise("highpass",jit(3200,.1),.5,.004,.35,t);noise("bandpass",jit(sp?1500:2300,.08),3,sp?.04:.028,.22,t+.002);knock(jit(sp?170:240,.06),90,sp?.05:.035,.18,t+.001)},
  type:(sp,t)=>{noise("highpass",jit(2600,.1),.6,.006,.4,t);noise("bandpass",jit(sp?700:1100,.08),6,sp?.06:.04,.25,t+.003);noise("lowpass",jit(500,.1),.7,sp?.07:.05,.3,t+.004)}
};
/* a short burst of keys, to preview a pack in Settings and in the welcome */
function soundPreview(pk){
  if(!KEYPACKS[pk])return;
  try{const a=audio();if(!a)return;let t=a.currentTime+.02;
    [0,0,0,1,0,0].forEach(sp=>{KEYPACKS[pk](!!sp,t);t+=.1+Math.random()*.05});
  }catch(e){}
}
function keySound(kind){
  const pk=S.settings.soundPack;if(!pk||pk==="off"||!KEYPACKS[pk])return;
  try{const a=audio();if(!a)return;const t=a.currentTime+.001;
    if(kind==="error"){noise("lowpass",jit(320,.05),.7,.06,.26,t);knock(jit(120,.04),60,.05,.12,t);return}
    KEYPACKS[pk](kind==="space",t);
  }catch(e){}
}
function hintHTML(ch){
  if(ch==="\n")return '<span class="dot" style="--fc:'+fcol("RP")+'"></span><b>Enter</b> · '+FING.RP.n+', new line';
  const i=charInfo(ch);if(!i)return "";
  const lay=LAY();const lbl=ch===" "?"Space":esc(ch);
  if(ch===" ")return "<b>Space</b> · either thumb";
  const k=i.key,f=FING[k.f],r=reach(k.id);
  const where=r.home?"home key":"reach "+r.phrase+" from "+esc(r.from);
  const dot='<span class="dot" style="--fc:'+fcol(k.f)+'"></span>';
  if(i.shift){const sf=FING[lay.byId[i.shiftId].f];
    return dot+"<b>"+lbl+"</b> · hold "+(i.shiftId==="ShiftLeft"?"left":"right")+" Shift with your "+sf.n+", then "+f.n+", "+where}
  return dot+"<b>"+lbl.toUpperCase().replace("&AMP;","&amp;")+"</b> · "+f.n+", "+where;
}
function stageHTML(o){
  return '<section class="stage" id="stage"><div class="stage-bar"><button class="btn quiet sm" type="button" data-act="stage-back">'+ico("back")+'Back</button>'+
   '<div class="crumb">'+esc(o.crumb||"")+'</div><button class="btn ghost sm" type="button" data-act="stage-restart">'+ico("restart")+'Restart<span class="kh" aria-hidden="true">esc</span></button></div>'+
   '<div class="live"><div class="stat"><span class="num" id="l-wpm">0</span><span class="label">WPM</span></div>'+
   '<div class="stat"><span class="num" id="l-acc">100%</span><span class="label">Accuracy</span></div>'+
   '<div class="stat"><span class="num" id="l-prog">0</span><span class="label" id="l-prog-l">Typed</span></div>'+
   (o.pace?'<div class="stat pace" title="The faint second cursor moves at this speed"><i class="gb" aria-hidden="true"></i><span class="label">Pace</span><span class="num" id="l-pace">'+Math.round(o.pace)+'</span><span class="label">WPM</span></div>':"")+'</div>'+
   '<div class="sheet" id="sheet"><div class="vp" id="vp"><div class="txt" id="txt"></div></div><div class="pause" id="pause" hidden role="button" tabindex="0">Paused. Click here or press any key to continue.</div></div>'+
   '<div class="tip" id="tip" hidden><p id="tip-t"></p><button class="btn ghost sm" type="button" data-act="tip-x">Got it</button></div>'+
   '<div class="hint" id="hint" aria-live="off"></div><div class="kbwrap" id="kbwrap"><svg class="kb" id="kb" role="img" aria-label="Keyboard"></svg><svg class="hands" id="hands" role="img" aria-label="Hands"></svg></div></section>';
}
function stopExercise(){
  if(EX){EX.destroy();EX=null}
  try{sink.blur()}catch(e){}
}
function mountStage(o){
  stopExercise();KBS=[];UI={kind:"stage",opts:o};VK="stage";
  view.innerHTML=(SESSION?sessionBar():"")+stageHTML(o);
  EX=createExercise(o);
  sink.value="";sink.focus({preventScroll:true});
  return EX;
}
function createExercise(o){
  let text=o.text,N=text.length;const free=o.mode==="free";
  const marks=new Array(N).fill(0),missed=new Array(N).fill(0),firstDone=new Array(N).fill(0),firstMiss=new Array(N).fill(0);
  const E={o,text,pos:0,auto:0,presses:0,correct:0,ok:0,started:false,paused:false,done:false,seg:0,act:0,last:0,missBy:{},ev:[],reveal:false,lastCode:"",lastCodeT:0};
  const txt=$("txt"),vp=$("vp"),pauseEl=$("pause"),hintEl=$("hint");
  const kb=makeKeyboard($("kb"),"stage"),hands=makeHands($("hands"));
  /* render text */
  let html="";
  /* o.code: one block per line; a newline is its own .c.nl cell, leading spaces are .c.ind. xc keeps those extra classes through paint() */
  const xc=o.code?[]:null,rows=o.code?6:3;
  if(o.code){
    vp.classList.add("code");
    text.split("\n").forEach((ln,li,all)=>{
      const ind=/^ */.exec(ln)[0].length;
      html+='<div class="ln">'+'<span class="c ind"> </span>'.repeat(ind);
      for(let i=0;i<ind;i++)xc.push(" ind");
      ln.slice(ind).split(/(?<= )/).forEach(w=>{if(!w)return;html+='<span class="w">'+[...w].map(ch=>{xc.push("");return '<span class="c">'+esc(ch)+'</span>'}).join("")+"</span>"});
      if(li<all.length-1){html+='<span class="c nl">\u21b5</span>';xc.push(" nl")}
      html+='</div>';
    });
  }else text.split(/(?<= )/).forEach((w,wi)=>{html+='<span class="w">'+[...w].map(ch=>'<span class="c">'+esc(ch)+'</span>').join("")+"</span>"});
  txt.innerHTML=html;
  const cs=[...txt.querySelectorAll(".c")];
  const caret=document.createElement("span");caret.className="caret idle";txt.appendChild(caret);
  const hintsMode=()=>S.settings.hints;
  let idleT=0,revealT=0,lineH=0,caretY=null;
  const elapsed=now=>E.act+(E.started&&!E.paused?now-E.seg:0);
  const chars=()=>free?E.ok:E.pos-E.auto;
  /* pace caret: a faint ghost that moves at a steady WPM, driven by rAF while the exercise runs */
  const paceWpm=o.pace||0;let paceRaf=0,paceT=0;
  const ghost=paceWpm?document.createElement("span"):null;
  if(ghost){ghost.className="pacegh";ghost.hidden=true;txt.insertBefore(ghost,caret)}
  E.ghostPos=()=>Math.max(0,Math.min(N-1,Math.floor(elapsed(performance.now())*paceWpm*5/60000)));
  function paceTick(){
    paceRaf=0;paceT=0;
    if(!ghost||E.done||E.paused||!E.started){PACE_LIVE.delete(E);return}
    const el=cs[E.ghostPos()];
    if(el){ghost.style.transform="translate("+el.offsetLeft+"px,"+el.offsetTop+"px)";ghost.hidden=false}
    if(reduceMotion())paceT=setTimeout(paceTick,250);else paceRaf=requestAnimationFrame(paceTick);
  }
  function startPace(){if(!ghost||paceRaf||paceT||E.done)return;PACE_LIVE.add(E);paceTick()}
  function stopPace(){cancelAnimationFrame(paceRaf);clearTimeout(paceT);paceRaf=0;paceT=0;PACE_LIVE.delete(E)}
  E.secs=[];E.missAt=[];
  function extend(){
    const add=o.more&&o.more();if(!add)return;
    const tmp=document.createElement("div");let h="";
    add.split(/(?<= )/).forEach(w=>{h+='<span class="w">'+[...w].map(ch=>'<span class="c">'+esc(ch)+'</span>').join("")+"</span>"});
    tmp.innerHTML=h;[...tmp.children].forEach(n=>txt.insertBefore(n,caret));
    cs.length=0;cs.push(...txt.querySelectorAll(".c"));
    for(let i=0;i<add.length;i++){marks.push(0);missed.push(0);firstDone.push(0);firstMiss.push(0)}
    text+=add;N=text.length;E.text=text;
  }
  function placeCaret(){
    const el=cs[Math.min(E.pos,N-1)];if(!el)return;
    lineH=vp.clientHeight/rows;
    const x=el.offsetLeft+(E.pos>=N?el.offsetWidth:0),y=el.offsetTop;
    if(o.code){const r=x+el.offsetWidth+24;if(r>vp.scrollLeft+vp.clientWidth)vp.scrollLeft=r-vp.clientWidth;else if(x<vp.scrollLeft+8)vp.scrollLeft=Math.max(0,x-24)}
    /* glides along a line (CSS transition); a line change jumps so it never swoops across the text */
    if(y!==caretY&&caretY!=null){caret.style.transition="none";caret.style.transform="translate("+x+"px,"+y+"px)";void caret.offsetWidth;caret.style.transition=""}
    else caret.style.transform="translate("+x+"px,"+y+"px)";
    caretY=y;
    const line=Math.round(y/lineH),sc=Math.max(0,line-(o.code?rows-2:1));
    txt.style.transform="translateY("+(-sc*lineH)+"px)";
    if(!reduceMotion()){caret.classList.remove("idle");clearTimeout(idleT);idleT=setTimeout(()=>caret.classList.add("idle"),600)}
    else caret.classList.remove("idle");
  }
  function showNext(){
    const mode=hintsMode();
    const hide=mode==="hidden"||o.noKb;$("kbwrap").hidden=hide;hintEl.hidden=hide;
    const lab=(i,show)=>{const t=i&&show?"Next key "+(text[E.pos]===" "?"Space":text[E.pos]==="\n"?"Enter":text[E.pos].toUpperCase())+", "+(i.shift?"with Shift, ":"")+FING[i.key.f].n:"Keyboard";$("kb").setAttribute("aria-label",t);$("hands").setAttribute("aria-label",i&&show?"Use your "+i.fingers.map(f=>FING[f].n).join(" and your "):"Hands")};
    if(E.pos>=N){kb.set({next:[]});hands.set([]);hintEl.innerHTML="";return}
    const i=text[E.pos]==="\n"?enterInfo():charInfo(text[E.pos]),show=mode==="always"||(mode==="hesitate"&&E.reveal);lab(i,show);
    if(!i||!show){kb.set({next:[]});hands.set(text[E.pos]===" "&&show?["TH"]:[]);hintEl.innerHTML=show&&i?hintHTML(text[E.pos]):"";if(!i)return;return}
    kb.set({next:i.ids});hands.set(i.fingers);hintEl.innerHTML=hintHTML(text[E.pos]);
  }
  function armReveal(){
    clearTimeout(revealT);E.reveal=false;
    if(hintsMode()==="hesitate")revealT=setTimeout(()=>{E.reveal=true;showNext()},1200);
  }
  function live(now){
    const ms=elapsed(now);
    $("l-wpm").textContent=ms>2000?Math.round(wpmCalc(chars(),ms)):"0";
    $("l-acc").textContent=(E.presses?Math.round(E.correct/E.presses*100):100)+"%";
    if(o.timeLimit){const s=Math.floor(Math.min(ms,o.timeLimit)/1000);while(E.secs.length<s)E.secs.push(chars())}
    if(o.timeLimit){$("l-prog").textContent=Math.max(0,Math.ceil((o.timeLimit-ms)/1000))+"s";$("l-prog-l").textContent="Time left"}
    else{$("l-prog").textContent=E.pos+" / "+N;$("l-prog-l").textContent="Typed"}
  }
  const enterInfo=()=>{const k=LAY().byId.Enter;return k?{key:k,shift:false,shiftId:null,ids:[k.id],fingers:[k.f]}:null};
  function paint(i){
    const el=cs[i],m=marks[i];el.className="c"+(xc?xc[i]:"")+(m===1?" ok":m===2?" fx":m===3?" bad":m===4?" auto":"");
  }
  function showTip(k){const t=$("tip");if(!t)return;$("tip-t").textContent=TIPS[k];t.hidden=false}
  function accept(ch,now){
    if(!E.started){E.started=true;E.seg=now;startPace()}
    const exp=text[E.pos],hit=ch===exp,dt=E.presses>0?now-E.last:null;
    E.presses++;E.last=now;
    if(!firstDone[E.pos]){firstDone[E.pos]=1;
      firstMiss[E.pos]=hit?0:1;
      E.ev.push({c:exp,miss:!hit,dt:hit&&dt!=null&&dt<3000?dt:null,pc:E.pos>0?text[E.pos-1]:"",pmiss:E.pos>0?!!firstMiss[E.pos-1]:false});
      if(!hit){const k=exp.toLowerCase();E.missBy[k]=(E.missBy[k]||0)+1}}
    if(!hit)E.missAt.push(Math.floor(elapsed(now)/1000)+1);
    if(!hit&&/[ěščřžýáíéůú]/.test(ch)&&!/[ěščřžýáíéůú]/.test(exp)&&!czechShown){czechShown=true;showTip("czech")}
    if(hit)E.correct++;keySound(hit?(exp===" "?"space":"key"):"error");
    if(hit||free){
      marks[E.pos]=hit?(missed[E.pos]?2:1):3;if(free&&!hit)missed[E.pos]=1;if(marks[E.pos]===1||marks[E.pos]===2){if(free)E.ok+=marks[E.pos]===1?1:0}
      paint(E.pos);E.pos++;
      if(o.code&&exp==="\n")while(E.pos<N&&text[E.pos]===" "&&xc[E.pos]===" ind"){marks[E.pos]=4;firstDone[E.pos]=1;E.auto++;paint(E.pos);E.pos++}
      if(hit)armReveal();else{E.reveal=true}
    }else{
      marks[E.pos]=3;missed[E.pos]=1;paint(E.pos);
      const el=cs[E.pos];if(!reduceMotion()){el.classList.remove("shake");void el.offsetWidth;el.classList.add("shake")}
      E.reveal=true;clearTimeout(revealT);
    }
    if(!hit){const mi=(performance.now()-E.lastCodeT<300&&E.lastCode&&LAY().byId[E.lastCode])?E.lastCode:(CM()[ch]&&CM()[ch].id);if(mi)kb.err(mi)}
  }
  E.type=function(str,fromComp){
    if(E.done||E.paused)return;
    const arr=[...(o.code?str.replace(/\r\n?/g,"\n"):str)].filter(c=>c!=="\r"&&c!=="\t"&&(c!=="\n"||o.code));
    const now=performance.now();
    if(fromComp&&arr.length===1&&DEAD.includes(arr[0])&&text[E.pos]===arr[0]&&text[E.pos+1]===" "&&E.pos+1<N){
      accept(arr[0],now);if(E.pos<N&&text[E.pos]===" ")accept(" ",now);
    }else for(const ch of arr){if(E.pos>=N)break;accept(ch,now)}
    afterInput(now);
  };
  function afterInput(now){
    if(o.more&&E.pos>N-40)extend();
    placeCaret();showNext();live(now);
    if(E.pos>=N)finish(now);
  }
  E.back=function(word){
    if(!free||E.done||E.pos===0)return;
    let to=E.pos-1;
    if(word){to=E.pos;while(to>0&&text[to-1]===" ")to--;while(to>0&&text[to-1]!==" "&&!(o.code&&text[to-1]==="\n"))to--}
    if(o.code){if(to>=E.pos)to=E.pos-1;while(to>0&&marks[to]===4)to--}/* auto indentation goes with its newline */
    while(E.pos>to){E.pos--;if(marks[E.pos]===1)E.ok--;if(marks[E.pos]===4)E.auto--;marks[E.pos]=0;paint(E.pos)}
    placeCaret();showNext();live(performance.now());
  };
  E.flash=code=>{E.lastCode=code;E.lastCodeT=performance.now();kb.press(code)};
  E.deadTip=()=>{if(!S.seenTips.deadKey){S.seenTips.deadKey=true;showTip("dead");save()}};
  E.pause=function(){
    if(E.done||E.paused)return;
    if(E.started)E.act+=performance.now()-E.seg;
    E.paused=true;pauseEl.hidden=false;stopPace();
  };
  E.resume=function(){
    if(E.done||!E.paused)return;
    E.paused=false;E.seg=performance.now();pauseEl.hidden=true;if(E.started)startPace();
  };
  E.refreshHints=()=>{armReveal();showNext()};
  E.restart=()=>{mountStage(o)};
  function finish(now){
    if(E.done)return;
    let ms=elapsed(now);if(o.timeLimit)ms=Math.min(ms,o.timeLimit);
    if(o.timeLimit){const s=Math.floor(o.timeLimit/1000);while(E.secs.length<s)E.secs.push(chars())}
    E.done=true;window.removeEventListener("resize",onResize);stopPace();if(ghost)ghost.hidden=true;clearInterval(tick);clearTimeout(revealT);clearTimeout(idleT);
    caret.classList.remove("idle");
    const res={ms,chars:chars(),presses:E.presses,correct:E.correct,wpm:wpmCalc(chars(),ms),raw:wpmCalc(E.presses,ms),acc:E.presses?E.correct/E.presses:1,missBy:E.missBy,len:N,secs:E.secs.slice(),missAt:E.missAt.slice(),mistakes:E.presses-E.correct};
    if(!o.noStats){applyKeyEvents(E.ev);addDay(ms,res.chars,E.presses,E.correct)}
    try{sink.blur()}catch(e){}
    setTimeout(()=>{if(EX===E&&o.onFinish)o.onFinish(res);save();renderRing()},o.delay==null?350:o.delay);
  }
  E.finish=()=>finish(performance.now());
  const onResize=()=>{if(!E.done)placeCaret()};window.addEventListener("resize",onResize);
  E.destroy=()=>{window.removeEventListener("resize",onResize);stopPace();clearInterval(tick);clearTimeout(revealT);clearTimeout(idleT);E.done=true};
  const tick=setInterval(()=>{if(E.done)return;const now=performance.now();live(now);if(o.timeLimit&&E.started&&!E.paused&&elapsed(now)>=o.timeLimit)finish(now)},250);
  $("stage").addEventListener("click",e=>{if(e.target.closest("button"))return;if(E.paused)E.resume();sink.focus({preventScroll:true})});
  pauseEl.addEventListener("click",()=>{E.resume();sink.focus({preventScroll:true})});
  placeCaret();showNext();live(performance.now());armReveal();
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>{if(EX===E)placeCaret()});
  return E;
}
/* sink + global key handling (registered once) */
sink.addEventListener("input",e=>{
  if(e.isComposing)return;
  const v=sink.value;sink.value="";if(!EX||!v)return;
  if(lastComp&&performance.now()-lastComp.t<60&&v===lastComp.s){lastComp=null;return}
  EX.type(v,false);
});
sink.addEventListener("compositionend",e=>{
  const v=sink.value||e.data||"";sink.value="";if(!EX||!v)return;
  lastComp={s:v,t:performance.now()};EX.type(v,true);
});
sink.addEventListener("focus",()=>{if(EX&&EX.paused)EX.resume()});
sink.addEventListener("blur",()=>{
  if(!EX||EX.done)return;
  setTimeout(()=>{if(!EX||EX.done)return;const a=document.activeElement;if(a&&a!==sink&&a.closest&&a.closest(".stage-bar"))return;EX.pause()},0);
});
document.addEventListener("visibilitychange",()=>{if(document.hidden&&EX&&!EX.done)EX.pause()});
const dlg=$("settings");
document.addEventListener("keydown",e=>{
  if(dlg.open)return;
  if(S.settings.soundPack!=="off"&&!actx)audio();
  if(EX&&!EX.done&&UI.kind==="stage"){
    if(EX.paused){if(!["Shift","Control","Alt","Meta","CapsLock"].includes(e.key)){EX.resume();sink.focus({preventScroll:true})}if(e.key==="Escape"||e.key==="Tab")e.preventDefault();return}
    if(e.code)EX.flash(e.code);
    if(e.key==="Dead")EX.deadTip();
    if(e.key==="Escape"){e.preventDefault();EX.restart();return}
    if(e.key==="Tab"){e.preventDefault();return}
    if(e.key==="Backspace"){e.preventDefault();EX.back(e.altKey);return}
    if(e.target!==sink&&!e.metaKey&&!e.ctrlKey&&e.key.length===1){sink.focus({preventScroll:true})}
    return;
  }
  if(e.key==="Enter"&&!e.target.closest("button,a,input,select,textarea,summary,dialog")){
    const p=view.querySelector("[data-primary]");if(p){e.preventDefault();p.click()}
  }else if(e.key==="Escape"&&UI.escape){UI.escape()}
});
