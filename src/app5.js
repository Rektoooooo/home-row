
/* ============================ PART B: SHARED ============================ */
const pop=document.createElement("div");pop.className="pop";pop.hidden=true;$("app").appendChild(pop);
function showPop(text,x,y){pop.textContent=text;pop.hidden=false;const w=pop.offsetWidth;pop.style.left=Math.max(8,Math.min(innerWidth-w-8,x-w/2))+"px";pop.style.top=Math.max(8,y-pop.offsetHeight-8)+"px"}
function hidePop(){pop.hidden=true}
function tipOn(e){const t=e.target.closest&&e.target.closest("[data-tip]");if(!t)return;const r=t.getBoundingClientRect();showPop(t.dataset.tip,r.left+r.width/2,r.top)}
view.addEventListener("mouseover",tipOn);view.addEventListener("focusin",tipOn);
view.addEventListener("mouseout",e=>{if(e.target.closest("[data-tip]"))hidePop()});
view.addEventListener("focusout",hidePop);
view.addEventListener("click",e=>{if(e.target.closest("[data-tip]"))tipOn(e);else hidePop()});
const seg=(id,opts,cur)=>'<div class="seg" role="group" aria-label="'+id+'">'+opts.map(o=>'<button type="button" data-seg="'+id+'" data-v="'+o[0]+'" aria-pressed="'+(String(o[0])===String(cur))+'">'+esc(o[1])+'</button>').join("")+'</div>';
const tog=(key,label,on)=>'<button type="button" class="tbtn" data-tog="'+key+'" aria-pressed="'+!!on+'">'+label+'</button>';
const keyWpm=st=>st&&st.timeEma?Math.round(12000/st.timeEma):null;
const keyAcc=st=>st&&st.n>0?Math.round((1-st.errEma)*100):null;
const CHECK='<svg width="8" height="8" viewBox="0 0 8 8" aria-hidden="true"><path d="M1.5 4.2l1.8 1.8 3.2-3.8" fill="none" stroke="var(--surface)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=rnd(i+1);[a[i],a[j]]=[a[j],a[i]]}return a};
const niceStep=(m,maxTicks)=>{for(const s of [10,20,25,50,100,200])if(Math.ceil(m/s)<=maxTicks)return s;return 200};

/* token extras shared by Practice and Test: numbers, punctuation, capitals */
function extras(toks,o){
  const out=toks.slice(),digs=o.digits||"0123456789";
  if(o.nums)for(let i=0;i<out.length;i++)if(Math.random()<.1){const len=1+rnd(4);let x="";for(let j=0;j<len;j++)x+=pick(digs.split(""));out[i]=x}
  if(o.punct)for(let i=0;i<out.length;i++){
    const w=out[i];let r=Math.random();
    if(r<.03&&o.contr)out[i]=pick(CONTR);
    else if(r<.06&&/^[a-z]+$/.test(w)&&!/^[aeiouycn]/.test(w))out[i]='"'+w+'"';
    r=Math.random();if(r<.2)out[i]+=r<.02?"?":r<.04?"!":r<.12?",":".";
  }
  if(o.caps)for(let i=0;i<out.length;i++){
    const prev=i>0?out[i-1]:(o.prev||"");
    if(Math.random()<.25||/[.?!]"?$/.test(prev))out[i]=out[i].replace(/[a-z]/,c=>c.toUpperCase());
  }
  return out.map(t=>BADDEAD.test(t)?t.replace(/[`'"~^]/g,""):t);
}

/* ============================ PRACTICE ============================ */
function poolLetters(){
  const out=[];LESSONS.forEach(L=>{if(S.settings.unlockAll||lessonDone(L.n))L.keys.forEach(k=>{if(isLetter(k)&&!out.includes(k))out.push(k)})});
  return out;
}
function focusKey(pool,avoid){
  if(avoid&&avoid.length){const rest=pool.filter(k=>!avoid.includes(k));if(rest.length)pool=rest}
  let best=null,bv=9;
  pool.forEach(k=>{const sv=strengthOf(S.keys[k]);if(sv!=null&&sv<bv){bv=sv;best=k}});
  if(best)return best;
  return pool.slice().sort((a,b)=>((S.keys[a]||{n:0}).n)-((S.keys[b]||{n:0}).n))[0];
}
function slowPairs(max,pool,avoid){
  const set=pool?new Set(pool):null;
  return Object.keys(S.pairs).filter(p=>!(avoid&&avoid.includes(p))&&usefulPair(p)&&(!set||(set.has(p[0])&&set.has(p[1])))).map(p=>({p,st:S.pairs[p],sv:strengthOf(S.pairs[p],6)})).filter(x=>x.sv!=null).sort((a,b)=>a.sv-b.sv).slice(0,max);
}
/* focus is a single key ("h") or a letter pair ("th") */
function chooseFocus(pool,avoid){
  const key=focusKey(pool,avoid),ksv=strengthOf(S.keys[key]),wp=slowPairs(1,pool,avoid)[0];
  if(wp&&ksv!=null&&wp.sv<=ksv-.05)return wp.p;
  return key;
}
const focusStat=f=>f.length===2?S.pairs[f]:S.keys[f];
const pairFingers=p=>FING[charInfo(p[0]).key.f].n+" then "+FING[charInfo(p[1]).key.f].n;
function genPairRound(pool,pair,o){
  const set=new Set(pool),real=realPool(set,2,9);
  const wf=real.filter(w=>w.includes(pair)),wo=real.filter(w=>!w.includes(pair));
  const n=12+rnd(3),k=Math.ceil(n*.7),slots=[];
  for(let i=0;i<n;i++)slots.push(i<k);shuffle(slots);
  const pseudoPair=()=>{for(let g=0;g<30;g++){const b=pw(pool,{min:2,max:4}),p=rnd(b.length+1),w=b.slice(0,p)+pair+b.slice(p);if(!/(.)\1\1/.test(w)&&!BLOCK.test(w))return w}return pair+pair[0]};
  const toks=[];let last="";
  slots.forEach(has=>{
    let w,g=0;
    do{
      if(has)w=(wf.length>=4&&Math.random()<.7)?pickF(wf):pseudoPair();
      else w=(wo.length>=6&&Math.random()<.7)?pickF(wo):pw(pool,{min:3,max:5});
    }while((w===last||BLOCK.test(w))&&g++<12);
    toks.push(w);last=w;
  });
  const dg=o.nums?practiceDigits():"";
  return extras(toks,{caps:o.caps,punct:o.punct,nums:o.nums&&dg,digits:dg||undefined}).join(" ");
}
function practiceDigits(){const s=new Set();LESSONS.forEach(L=>{if(L.digits&&(S.settings.unlockAll||lessonDone(L.n)))L.keys.forEach(k=>s.add(k))});return [...s].join("")}
function genPractice(pool,focus,o){
  o=o||{};if(focus.length===2)return genPairRound(pool,focus,o);
  const set=new Set(pool),real=realPool(set,2,9);
  const wf=real.filter(w=>w.includes(focus)),wo=real.filter(w=>!w.includes(focus));
  const n=12+rnd(3),k=Math.ceil(n*.62),slots=[];
  for(let i=0;i<n;i++)slots.push(i<k);shuffle(slots);
  const toks=[];let last="";
  slots.forEach(has=>{
    let w,g=0;
    do{
      if(has)w=(wf.length>=6&&Math.random()<.7)?pickF(wf):pw(pool,{min:3,max:6,must:focus});
      else w=(wo.length>=6&&Math.random()<.7)?pickF(wo):pw(pool,{min:3,max:5});
    }while((w===last||BLOCK.test(w))&&g++<12);
    toks.push(w);last=w;
  });
  const dg=o.nums?practiceDigits():"";
  return extras(toks,{caps:o.caps,punct:o.punct,nums:o.nums&&dg,digits:dg||undefined}).join(" ");
}
let PRI=null,NEXT=null,SHOWALL=false,PINFO=null;
const capFirst=t=>t.charAt(0).toUpperCase()+t.slice(1);
const pOpts=()=>{const st=S.settings;return {caps:st.pCaps&&(st.unlockAll||lessonDone(19)),punct:st.pPunct&&(st.unlockAll||lessonDone(20)),nums:st.pNums&&(st.unlockAll||lessonDone(21)||lessonDone(22))}};
const pSig=pool=>[S.settings.pCaps,S.settings.pPunct,S.settings.pNums].map(Number).join("")+"|"+pool.length;
function nextRound(pool,fresh){
  const focus=chooseFocus(pool),sig=pSig(pool);
  if(fresh||!NEXT||NEXT.sig!==sig||NEXT.focus!==focus)NEXT={focus,text:genPractice(pool,focus,pOpts()),sig};
  return NEXT;
}
/* one row of the Your keys / Slowest pairs lists; id is a key or a letter pair */
function krow(id,st,sv){
  const pair=id.length===2,w=keyWpm(st),a=keyAcc(st),isNew=sv==null,done=!isNew&&sv>=1;
  const lab=isNew?"Practise "+id.toUpperCase()+": still new":"Practise "+id.toUpperCase()+": "+(w?w+" WPM, ":"")+a+"% accuracy";
  const num=isNew?"Still new":(w?w+" WPM · ":"")+a+"%"+(done?'<span class="ok">'+ico("check",14)+'</span>':"");
  return '<button type="button" class="krow'+(isNew?" new":"")+'" data-act="p-focus" data-f="'+esc(id)+'" aria-label="'+esc(lab)+'"><span class="kc'+(pair?" pair":"")+'" style="--fc:'+fcol(charInfo(id[0]).key.f)+'">'+esc(id.toUpperCase())+'</span><span class="kbar"><i'+(done?' class="ok"':"")+' style="width:'+(isNew?0:Math.round(Math.min(sv,1)*100))+'%"></i></span><span class="knum">'+num+'</span><span class="go">'+ico("next",16)+'</span></button>';
}
function renderPractice(info){
  if(pmode()!=="adaptive")return renderPMode(info);
  const pool=poolLetters();PINFO=info||null;
  if(!pool.length){
    setView('<div class="view-head"><h1>Practice</h1></div>'+pmSwitchHTML()+'<div class="pw560">'+panel({flat:1,eyebrow:"Practice",title:"Nothing to practise yet",msg:"Pass lesson 1 to start practising. Practice builds rounds from the keys you have learned.",
      foot:btn("Go to lesson 1",{act:"go-lesson",n:1,primary:1,hint:ENTER})})+'</div>',"idle");
    return;
  }
  const nr=nextRound(pool),focus=nr.focus,isPair=focus.length===2,ci=charInfo(isPair?focus[0]:focus),f=ci.key.f,st=S.settings;
  const sp=slowPairs(6,pool);
  const strong=pool.filter(k=>{const sv=strengthOf(S.keys[k]);return sv!=null&&sv>=1}).length;
  const all=strong===pool.length,nx=nextLessonN();
  const keys=pool.map(k=>({k,st:S.keys[k],sv:strengthOf(S.keys[k])})).sort((a,b)=>(a.sv==null)-(b.sv==null)||(a.sv-b.sv));
  const shown=SHOWALL?keys:keys.slice(0,8);
  const toggles=[];
  if(st.unlockAll||lessonDone(19))toggles.push(tog("pCaps","Capitals",st.pCaps));
  if(st.unlockAll||lessonDone(20))toggles.push(tog("pPunct","Punctuation",st.pPunct));
  if(st.unlockAll||lessonDone(21)||lessonDone(22))toggles.push(tog("pNums","Numbers",st.pNums));
  let summary="";
  if(info){
    const has=info.before!=null&&info.after!=null,up=has&&info.after>=info.before;
    const chg=has?'<span class="chg '+(up?"up":"down")+'">'+ico(up?"up":"down")+esc(info.focus.toUpperCase())+': '+info.before+' → '+info.after+' WPM</span>':"";
    summary='<section class="panel flat rstrip" aria-label="Round result"><span class="label">Round done</span><span class="rs"><span class="num">'+Math.round(info.wpm)+'</span><span class="label">WPM</span></span><span class="rs"><span class="num">'+Math.round(info.acc*100)+'%</span><span class="label">Accuracy</span></span>'+chg+'</section>';
  }
  const focusBlock='<div class="focus">'+(isPair?'<span class="pairfocus">'+[...focus].map(c=>'<span class="bigcap" style="--fc:'+fcol(charInfo(c).key.f)+'">'+esc(c.toUpperCase())+'</span>').join("")+'</span><p><strong>'+esc(focus.toUpperCase())+'</strong><br><span class="muted">'+capFirst(pairFingers(focus))+'</span></p>':'<span class="bigcap" style="--fc:'+fcol(f)+'">'+esc(focus.toUpperCase())+'</span><p><strong>'+esc(focus.toUpperCase())+'</strong><br><span class="muted">'+capFirst(FING[f].n)+'</span></p>')+'</div>';
  const fs=focusStat(focus),fw=keyWpm(fs),fa=keyAcc(fs);
  const reason=all?"Picked to keep every key fresh.":isPair?"Your weakest letter pair right now.":"Your weakest key right now.";
  const fstats=fs&&fs.n>0?'<div class="pstats">'+pstat(fw||"–","WPM")+pstat(fa+"%","Accuracy")+pstat(fs.n,"Presses")+'</div>':'<p class="muted">New key: no data yet.</p>';
  const pc=paceFor("practice"),pace=pc?'<p class="small muted">Pace caret: '+(st.pace==="best"&&S.bests.practice>0?"your best, ":"")+Math.round(pc)+' WPM</p>':"";
  const left=focusBlock+'<p class="muted">'+reason+'</p>'+fstats+(all?'<div class="upnext"><p>All your keys are strong at '+st.target+' WPM. Continue with the next lesson, or raise the target speed in Settings.</p>'+(nx?btn("Go to lesson "+nx,{act:"go-lesson",n:nx,cls:"ghost sm"}):"")+'</div>':"");
  const right='<span class="label">Preview</span><div class="preview" role="group" aria-label="Preview of the round"><span>'+esc(nr.text.slice(0,90))+'</span></div>'+(toggles.length?'<div class="optrow"><span class="label">Include</span><div class="seg">'+toggles.join("")+'</div></div>':"")+pace;
  const hero=panel({flat:1,eyebrow:"Next round",title:"Focus on "+esc(focus.toUpperCase()),tag:"h2",
    body:'<div class="nr-grid"><div class="nr-l">'+left+'</div><div class="nr-r">'+right+'</div></div>',
    foot:btn("New words",{act:"p-shuffle",cls:"quiet",icon:"restart"})+btn(info?"Next round":"Start round",{act:"p-start",primary:1,hint:ENTER})});
  const keysP=panel({flat:1,eyebrow:"Your keys",msg:"Weakest first. Tap a key to practise it.",body:'<div class="klist">'+shown.map(x=>krow(x.k,x.st,x.sv)).join("")+'</div>'+
    (keys.length>8?'<button type="button" class="btn quiet sm showall" data-act="p-all">'+(SHOWALL?"Show fewer":"Show all "+keys.length+" keys")+'</button>':"")+
    '<p class="small muted">Strong: '+strong+' of '+pool.length+' at '+st.target+' WPM and 95% accuracy.</p>'});
  const pairsP=panel({flat:1,eyebrow:"Slowest letter pairs",msg:"Tap a pair to practise it.",body:sp.length?'<div class="klist">'+sp.map(x=>krow(x.p,x.st,x.sv)).join("")+'</div>':'<div class="empty">Pairs show up here after a few rounds.</div>'});
  setView('<div class="view-head"><h1>Practice</h1><p>Short rounds built around your weakest key or letter pair.</p></div>'+pmSwitchHTML()+summary+hero+'<div class="pgrid2">'+keysP+pairsP+'</div>',"idle");
}
function paceFor(kind,dur){
  const p=S.settings.pace;if(p==="off")return 0;
  if(p==="best"){const b=kind==="test"?S.bests["test"+dur]:S.bests.practice;if(b>0)return b}
  return S.settings.target;
}
/* o.focus / o.text override the chosen focus and the generated text. o.onDone(res,info) replaces the Practice summary (used by Today's session); o.back overrides Back */
function startRound(o){
  o=o||{};const pool=poolLetters();if(!pool.length)return;
  const focus=o.focus||chooseFocus(pool,o.avoid),before=keyWpm(focusStat(focus)),st=S.settings;
  const text=o.text||genPractice(pool,focus,pOpts());
  PRI={text,focus};
  mountStage({crumb:(o.crumb||"Practice")+" · Focus "+(focus.length===2?"pair ":"key ")+focus.toUpperCase(),text,mode:st.stop?"stop":"free",pace:paceFor("practice"),back:o.back||(()=>renderPractice()),
    onFinish:res=>{
      S.bests.practice=Math.max(S.bests.practice||0,res.wpm);liveCheck(false);
      const info={wpm:res.wpm,acc:res.acc,ms:res.ms,focus,before,after:keyWpm(focusStat(focus))};
      if(o.onDone)o.onDone(res,info);else renderPractice(info);
    }});
  UI.escape=null;
}

/* ============================ TEST ============================ */
const POOLS={c200:()=>[...new Set(WORDS_CORE)].filter(w=>w.length>=2),e950:()=>WL.filter(w=>w.length>=2)};
const POOL_NAME={c200:"Common 200",e950:"Everyday 950"};
function testChunk(n,o,prev){
  const pool=POOLS[o.pool](),t=[];let last="";
  while(t.length<n){const w=pick(pool);if(w!==last){t.push(w);last=w}}
  const out=extras(t,{caps:o.caps,punct:o.punct,nums:o.nums,contr:true,prev});
  return {text:out.join(" ")+" ",last:out[out.length-1]};
}
function renderTest(){
  const st=S.settings,pool=POOL_NAME[st.tPool]?st.tPool:"c200";
  const sample=testChunk(12,{pool,caps:st.tCaps,punct:st.tPunct,nums:st.tNums},"").text.trim();
  const opts=panel({flat:1,eyebrow:"Options",body:'<div class="opts"><div class="optrow"><span class="label">Duration</span>'+seg("Duration",[[15,"15 s"],[30,"30 s"],[60,"60 s"],[120,"120 s"]],st.tDur)+'</div>'+
    '<div class="optrow"><span class="label">Words</span>'+seg("Words",[["c200","Common 200"],["e950","Everyday 950"]],st.tPool)+'</div>'+
    '<div class="optrow"><span class="label">Include</span><div class="seg">'+tog("tCaps","Capitals",st.tCaps)+tog("tPunct","Punctuation",st.tPunct)+tog("tNums","Numbers",st.tNums)+'</div></div></div>'+
    '<div class="nr-r"><span class="label">Sample</span><div class="preview" role="group" aria-label="Sample words"><span>'+esc(sample)+'</span></div></div>',
    foot:btn("Start test",{act:"t-start",primary:1,hint:ENTER})});
  const tiles=[15,30,60,120].map(d=>{
    const b=Math.round(S.bests["test"+d]||0),t=S.tests.filter(x=>x.dur===d).sort((x,y)=>y.wpm-x.wpm)[0];
    return '<button type="button" class="best" data-seg="Duration" data-v="'+d+'" aria-pressed="'+(st.tDur===d)+'"><span class="label">'+d+' s</span><span class="num">'+(b||"–")+'</span><span class="sub">'+(!b?"No test yet":t?Math.round(t.acc*100)+"% accuracy":"")+'</span></button>';
  }).join("");
  const rows=S.tests.slice(-5).reverse().map(t=>'<tr><td>'+dLabel(new Date(t.ts))+'</td><td>'+t.dur+' s</td><td>'+esc(POOL_NAME[t.pool]||t.pool)+'</td><td class="wv">'+Math.round(t.wpm)+'</td><td>'+Math.round(t.acc*100)+'%</td></tr>').join("");
  const res=panel({flat:1,eyebrow:"Your results",body:'<div class="bests">'+tiles+'</div>'+shareBestHTML()+'<div><span class="label">Recent tests</span>'+
    (rows?'<div class="tblwrap"><table class="tbl tt rt"><thead><tr><th>Date</th><th>Time</th><th>Words</th><th>WPM</th><th>Accuracy</th></tr></thead><tbody>'+rows+'</tbody></table></div>':'<div class="empty" style="margin-top:10px">No tests yet. Your results show up here.</div>')+'</div>',
    foot:rows?'<a class="btn ghost" href="#progress">See your speed trend</a>':""});
  setView('<div class="view-head"><h1>Test</h1><p>Type as much as you can before the timer ends. Mistakes stay in the text. Backspace fixes them.</p></div><div class="tgrid opts-panel">'+opts+res+'</div>',"idle");
}
let TS=null;
function startTest(ov){
  ov=ov||{};const st=S.settings,o=ov.o||{pool:st.tPool,caps:st.tCaps,punct:st.tPunct,nums:st.tNums},dur=ov.dur||st.tDur;
  const c=testChunk(45,o,"");/* ov.baseline: the welcome typing check. It records no key, pair, day, test or best stats and shows no pace ghost */
  TS={last:c.last,o,dur,onDone:ov.onDone,baseline:!!ov.baseline};
  mountStage({crumb:ov.crumb||"Test · "+dur+" s · "+POOL_NAME[o.pool],text:c.text,mode:"free",timeLimit:dur*1000,noKb:true,noStats:!!ov.baseline,pace:ov.baseline?0:paceFor("test",dur),back:ov.back||(()=>renderTest()),
    more:()=>{const n=testChunk(15,o,TS.last);TS.last=n.last;return n.text},onFinish:testDone});
  UI.escape=null;
}
function testDone(res){
  if(TS.baseline){TS.onDone&&TS.onDone(res,false);return}
  const o=TS.o,dur=TS.dur,key="test"+dur,isBest=res.wpm>(S.bests[key]||0);
  S.tests.push({ts:Date.now(),dur,pool:o.pool,opts:(o.caps?"c":"")+(o.punct?"p":"")+(o.nums?"n":""),wpm:Math.round(res.wpm*10)/10,raw:Math.round(res.raw*10)/10,acc:res.acc});
  S.tests=S.tests.slice(-100);if(isBest)S.bests[key]=res.wpm;
  rewardsTest(res,dur,o,isBest);
  if(TS.onDone){TS.onDone(res,isBest);return}
  const pts=res.secs.map((c,i)=>({sec:i+1,wpm:c/5/((i+1)/60)}));
  const miss={};res.missAt.forEach(s=>{const k=Math.min(dur,Math.max(1,s));miss[k]=(miss[k]||0)+1});
  const W=640,H=250,L=38,R=54,T=14,B=28,pw_=W-L-R,ph=H-T-B;
  const mxv=Math.max(10,...pts.map(p=>p.wpm)),step=niceStep(mxv,4),ymax=Math.ceil(mxv/step)*step;
  const X=s=>L+(dur<=1?0:(s-1)/(dur-1))*pw_,Y=v=>T+ph-(v/ymax)*ph;
  const xs=dur===15?5:dur===30?10:dur===60?15:30;
  let g="";
  for(let v=0;v<=ymax;v+=step)g+='<line class="grid" x1="'+L+'" x2="'+(W-R)+'" y1="'+Y(v)+'" y2="'+Y(v)+'"/><text x="'+(L-8)+'" y="'+(Y(v)+4)+'" text-anchor="end">'+v+'</text>';
  for(let s=xs;s<=dur;s+=xs)g+='<text x="'+X(s)+'" y="'+(H-8)+'" text-anchor="middle">'+s+' s</text>';
  const line=pts.map((p,i)=>(i?"L":"M")+X(p.sec).toFixed(1)+" "+Y(p.wpm).toFixed(1)).join(" ");
  const area=line+" L"+X(dur).toFixed(1)+" "+Y(0)+" L"+X(1).toFixed(1)+" "+Y(0)+" Z";
  const last=pts[pts.length-1]||{sec:1,wpm:0};
  let xm="";for(const s in miss){const p=pts[s-1];if(!p)continue;const x=X(+s),y=Y(p.wpm)-9;xm+='<path class="xm" d="M'+(x-3.5)+' '+(y-3.5)+'l7 7m0-7l-7 7"/>'}
  const svg='<svg class="chart" id="tchart" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Line chart of your speed during the test. It ends at '+Math.round(last.wpm)+' words per minute after '+dur+' seconds, with '+res.mistakes+' mistakes.">'+g+
    '<path class="wash" d="'+area+'"/><path class="ln" d="'+line+'"/>'+xm+'<line class="cross" id="tcross" y1="'+T+'" y2="'+(T+ph)+'"/><circle class="dot-end" cx="'+X(last.sec)+'" cy="'+Y(last.wpm)+'" r="4"/><text class="lbl" x="'+(X(last.sec)+10)+'" y="'+(Y(last.wpm)+4)+'">'+Math.round(last.wpm)+'</text></svg>';
  const tpts=pts.map(p=>({x:X(p.sec),y:Y(p.wpm),text:p.sec+" s · "+Math.round(p.wpm)+" WPM"+(miss[p.sec]?" · "+miss[p.sec]+(miss[p.sec]===1?" mistake":" mistakes"):"")}));
  const opts=[o.caps?"capitals":"",o.punct?"punctuation":"",o.nums?"numbers":""].filter(Boolean);
  const eyebrow='Test · '+dur+' s · '+POOL_NAME[o.pool]+(opts.length?" · "+opts.join(", "):"");
  const legend='<span><svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" style="vertical-align:middle;margin-right:6px"><path d="M3 3l8 8m0-8l-8 8" stroke="var(--error)" stroke-width="2" stroke-linecap="round"/></svg>mistake</span>';
  setView('<div class="result">'+panel({wide:1,eyebrow,title:"Test done",status:isBest?'<span class="status ok">'+ico("check",14)+'New best</span>':"",
    stats:pstat(Math.round(res.wpm),"WPM",isBest?"your best at "+dur+" s":"",'lead')+pstat(Math.round(res.raw),"Raw WPM")+pstat(pctTxt(res.acc),"Accuracy")+pstat(res.correct+' · '+res.mistakes,"Correct · mistakes"),statsCls:"c4",
    body:'<div><h3>Speed during the test</h3><div class="legrow">'+legend+'</div><div class="chart-wrap">'+svg+'</div></div>',
    foot:btn("Change settings",{act:"t-settings",cls:"ghost"})+btn("Share",{act:"sh-test",cls:"ghost"})+btn("Try again",{act:"t-start",primary:1,hint:ENTER})})+'</div>',"results");
  UI.escape=()=>renderTest();
  attachChart($("tchart"),tpts,W,H,$("tcross"));
}
function attachChart(svg,pts,W,H,cross){
  if(!svg||!pts.length)return;
  const move=e=>{
    const r=svg.getBoundingClientRect(),vx=(e.clientX-r.left)/r.width*W;
    let best=pts[0];for(const p of pts)if(Math.abs(p.x-vx)<Math.abs(best.x-vx))best=p;
    cross.setAttribute("x1",best.x);cross.setAttribute("x2",best.x);cross.style.display="block";
    showPop(best.text,r.left+best.x/W*r.width,r.top+best.y/H*r.height);
  };
  svg.addEventListener("pointermove",move);svg.addEventListener("pointerdown",move);
  svg.addEventListener("pointerleave",()=>{cross.style.display="none";hidePop()});
}

/* clicks for part B */
view.addEventListener("click",e=>{
  const b=e.target.closest("[data-act],[data-seg],[data-tog]");if(!b)return;
  if(b.dataset.act==="p-start"){const n=NEXT;NEXT=null;startRound(n?{focus:n.focus,text:n.text}:{})}
  else if(b.dataset.act==="p-focus")startRound({focus:b.dataset.f});
  else if(b.dataset.act==="p-shuffle"){const pool=poolLetters(),y=scrollY;if(pool.length){NEXT=null;nextRound(pool);renderPractice(PINFO);scrollTo(0,y)}}
  else if(b.dataset.act==="p-all"){const y=scrollY;SHOWALL=!SHOWALL;renderPractice(PINFO);scrollTo(0,y)}
  else if(b.dataset.act==="t-start")startTest();
  else if(b.dataset.act==="t-settings")renderTest();
  else if(b.dataset.seg){
    const k=b.dataset.seg,v=b.dataset.v;
    if(k==="Duration")S.settings.tDur=+v;else if(k==="Words")S.settings.tPool=v;else if(k==="Heat"){HEAT=v;renderHeat();return}
    settingChanged();const y=scrollY;renderTest();scrollTo(0,y);
  }else if(b.dataset.tog){
    const k=b.dataset.tog,y=scrollY;S.settings[k]=!S.settings[k];settingChanged();
    if(k[0]==="p")renderPractice(PINFO);else renderTest();scrollTo(0,y);
  }
});
