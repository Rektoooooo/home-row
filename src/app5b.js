
/* ============================ PROGRESS ============================ */
let HEAT="speed",HK=null;
const MON=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],DOW=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const dLabel=d=>DOW[d.getDay()]+" "+d.getDate()+" "+MON[d.getMonth()];
const dayWpm=d=>d&&d.ms>=60000?d.chars/5/(d.ms/60000):null;
const addDays=(d,n)=>{const x=new Date(d.getFullYear(),d.getMonth(),d.getDate());x.setDate(x.getDate()+n);return x};
function heatMap(){
  const m={};
  LAY().keys.forEach(k=>{
    if(!k.base||k.space||k.nochar)return;
    const st=S.keys[k.base];if(!st||st.n<8)return;
    if(HEAT==="speed"){const sv=strengthOf(st);if(sv==null)return;const pct=10+75*Math.min(sv,1);m[k.id]={pct,label:String(keyWpm(st)||0),hot:pct>=50}}
    else{const a=1-st.errEma,pct=10+75*Math.max(0,Math.min(1,(a-.85)/.15));m[k.id]={pct,label:Math.round(a*100)+"%",hot:pct>=50}}
  });
  return m;
}
function renderHeat(){
  if(!HK)return;
  HK.setHeat(heatMap());
  document.querySelectorAll('[data-seg="Heat"]').forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.v===HEAT)));
  const rl=$("ramp-l"),rr=$("ramp-r");if(rl){rl.textContent=HEAT==="speed"?"Slower":"85%";rr.textContent=HEAT==="speed"?"At target":"100%"}
}
function calendarSVG(){
  const today=new Date(),idx=(today.getDay()+6)%7,start=addDays(today,-(idx+77)),P=17,LW=30,TH=16;
  let h="",prevM=-1;
  for(let c=0;c<12;c++){const d0=addDays(start,c*7);if(d0.getMonth()!==prevM&&(c>0||true)){prevM=d0.getMonth();h+='<text x="'+(LW+c*P)+'" y="10">'+MON[prevM]+'</text>'}}
  [[0,"Mon"],[2,"Wed"],[4,"Fri"]].forEach(r=>{h+='<text x="0" y="'+(TH+r[0]*P+10)+'">'+r[1]+'</text>'});
  const goal=S.settings.goal,tk=dateKey(today);
  for(let i=0;i<84;i++){
    const d=addDays(start,i);if(d>today)break;
    const c=Math.floor(i/7),r=i%7,key=dateKey(d),rec=S.days[key],min=rec?rec.ms/60000:0;
    const pct=min<=0?0:min<5?30:min<goal?55:85;
    const w=rec&&rec.ms>0?Math.round(rec.chars/5/(rec.ms/60000)):null;
    const tip=dLabel(d)+" · "+(min>0?Math.round(min)+" min"+(w?" · "+w+" WPM":""):"no practice");
    h+='<rect x="'+(LW+c*P)+'" y="'+(TH+r*P)+'" width="14" height="14" rx="3" style="fill:color-mix(in oklab,var(--f-middle) '+pct+'%,var(--surface-2))" data-tip="'+esc(tip)+'" tabindex="0" aria-label="'+esc(tip)+'"/>';
    if(key===tk)h+='<rect class="today" x="'+(LW+c*P-1)+'" y="'+(TH+r*P-1)+'" width="16" height="16" rx="4"/>';
  }
  return '<svg class="cal" viewBox="0 0 '+(LW+12*P)+' '+(TH+7*P)+'" role="img" aria-label="Practice calendar for the last 12 weeks">'+h+'</svg>';
}
function trendChart(){
  const today=new Date(),days=[];for(let i=29;i>=0;i--)days.push(addDays(today,-i));
  const W=640,H=240,L=38,R=56,T=14,B=28,pw_=W-L-R,ph=H-T-B;
  const prac=days.map(d=>dayWpm(S.days[dateKey(d)]));
  const tests=days.map(()=>[]);S.tests.forEach(t=>{const k=dateKey(new Date(t.ts));const i=days.findIndex(d=>dateKey(d)===k);if(i>=0)tests[i].push(t.wpm)});
  const have=prac.filter(v=>v!=null).length;
  const vals=[...prac.filter(v=>v!=null),...tests.flat()],mxv=Math.max(20,...vals),step=niceStep(mxv,5),ymax=Math.ceil(mxv/step)*step;
  const X=i=>L+i/29*pw_,Y=v=>T+ph-v/ymax*ph;
  let g="";
  for(let v=0;v<=ymax;v+=step)g+='<line class="grid" x1="'+L+'" x2="'+(W-R)+'" y1="'+Y(v)+'" y2="'+Y(v)+'"/><text x="'+(L-8)+'" y="'+(Y(v)+4)+'" text-anchor="end">'+v+'</text>';
  for(let i=29;i>=0;i-=7)g+='<text x="'+X(i)+'" y="'+(H-8)+'" text-anchor="'+(i===29?"end":"middle")+'">'+days[i].getDate()+" "+MON[days[i].getMonth()]+'</text>';
  let line="",dots="",lastI=-1;
  prac.forEach((v,i)=>{if(v==null)return;line+=(line?"L":"M")+X(i).toFixed(1)+" "+Y(v).toFixed(1)+" ";lastI=i;dots+='<circle class="dot-p" cx="'+X(i)+'" cy="'+Y(v)+'" r="4"/>'});
  let td="";tests.forEach((a,i)=>a.forEach(v=>{td+='<circle class="dot-t" cx="'+X(i)+'" cy="'+Y(v)+'" r="4"/>'}));
  const lab=lastI>=0?'<text class="lbl" x="'+(X(lastI)+9)+'" y="'+(Y(prac[lastI])+4)+'">'+Math.round(prac[lastI])+'</text>':"";
  const pts=[];days.forEach((d,i)=>{const a=[];if(prac[i]!=null)a.push(Math.round(prac[i])+" WPM practice");if(tests[i].length)a.push(tests[i].map(v=>Math.round(v)).join(", ")+" WPM test");if(a.length)pts.push({x:X(i),y:Y(prac[i]!=null?prac[i]:tests[i][0]),text:dLabel(d)+" · "+a.join(" · ")})});
  const empty=have<2;
  return {html:'<div class="legrow"><span><svg width="26" height="10" viewBox="0 0 26 10" aria-hidden="true" style="vertical-align:middle;margin-right:6px"><path d="M1 5h24" stroke="var(--fg-2)" stroke-width="2" stroke-linecap="round"/><circle cx="13" cy="5" r="3.5" fill="var(--surface)" stroke="var(--fg-2)" stroke-width="2"/></svg>Practice and lessons</span><span><svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" style="vertical-align:middle;margin-right:6px"><circle cx="6" cy="6" r="4" fill="var(--f-ring)" stroke="var(--surface)" stroke-width="2"/></svg>Tests</span></div>'+
    '<div class="chart-wrap"><svg class="chart" id="trend" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Line chart of your daily speed over the last 30 days. '+(empty?"Not enough practice days yet.":have+" practice days recorded.")+'" style="'+(empty?"opacity:.45":"")+'">'+g+
    '<path class="ln" d="'+line+'"/>'+dots+td+lab+'<line class="cross" id="tcross2" y1="'+T+'" y2="'+(T+ph)+'"/></svg>'+(empty?'<div class="chart-empty"><p>Practise on two different days to see your speed trend.</p></div>':"")+'</div>',pts,W,H};
}
function renderProgress(){
  const st=S.settings,m=minutesToday(),g=st.goal,sk=streak();
  const passed=LESSONS.filter(l=>lessonDone(l.n)).length;
  let bt=null;S.tests.forEach(t=>{if(!bt||t.wpm>bt.wpm)bt=t});
  const tiles='<div class="tiles"><div class="tile"><span class="s">Today</span><span class="v num">'+Math.floor(m)+' of '+g+' min</span><div class="bar" aria-hidden="true"><i style="width:'+Math.min(100,m/g*100).toFixed(0)+'%"></i></div></div>'+
    '<div class="tile"><span class="s">Streak</span><span class="v num">'+sk+' day'+(sk===1?"":"s")+'</span></div>'+
    '<div class="tile"><span class="s">Best test</span><span class="v num">'+(bt?Math.round(bt.wpm)+' WPM':"None yet")+'</span>'+(bt?'<span class="s">'+bt.dur+' s test</span>':"")+'</div>'+
    '<div class="tile"><span class="s">Lessons</span><span class="v num">'+passed+' of '+LESSONS.length+' passed</span></div></div>';
  const tr=trendChart();
  const learned=Object.keys(S.keys).filter(k=>k!=="shift"&&S.keys[k].n>=8).map(k=>({k,s:strengthOf(S.keys[k]),st:S.keys[k]})).filter(x=>x.s!=null).sort((a,b)=>a.s-b.s);
  const slow=learned.slice(0,5).map(x=>{const i=charInfo(x.k);return '<span class="pk"><span class="bigcap sm" style="--fc:'+fcol(i?i.key.f:"TH")+'">'+esc(x.k.toUpperCase())+'</span>'+(keyWpm(x.st)||0)+' WPM · '+keyAcc(x.st)+'%</span>'}).join("");
  const sp8=slowPairs(8);
  const pairChips=sp8.length?'<div class="chips">'+sp8.map(x=>'<span class="pchip"><b>'+esc(x.p)+'</b>'+keyWpm(x.st)+' WPM · '+keyAcc(x.st)+'%</span>').join("")+'</div>':'<div class="empty" style="margin-top:10px">Practise a little more to see your slowest letter pairs.</div>';
  const prows=Object.keys(S.pairs).filter(usefulPair).sort((x,y)=>S.pairs[y].n-S.pairs[x].n).slice(0,60).map(p=>{const s=S.pairs[p],sv=strengthOf(s,6);
    return '<tr><td>'+esc(p)+'</td><td>'+s.n+'</td><td>'+(keyWpm(s)||"–")+'</td><td>'+keyAcc(s)+'%</td><td>'+(sv==null?"new":sv.toFixed(2))+'</td></tr>'}).join("");
  const rows=Object.keys(S.keys).filter(k=>k!=="shift").sort().map(k=>{const s=S.keys[k],i=charInfo(k),sv=strengthOf(s);
    return '<tr><td>'+esc(k.toUpperCase())+'</td><td>'+(i?FING[i.key.f].n:"")+'</td><td>'+s.n+'</td><td>'+(keyWpm(s)||"–")+'</td><td>'+keyAcc(s)+'%</td><td>'+(sv==null?"new":sv.toFixed(2))+'</td></tr>'}).join("");
  const les=LESSONS.map(l=>{const r=S.lessons[l.n],lock=!unlocked(l.n);
    return '<button type="button" class="crow" '+(lock?'aria-disabled="true"':'data-act="go-lesson" data-n="'+l.n+'"')+'><span class="lnum">'+l.n+'</span><span class="t">'+esc(l.title)+'</span><span class="m">'+(lock?'Locked':starsSVG(r?r.stars:0,14)+(r&&r.attempts?'<span>'+Math.round(r.wpm)+' WPM</span><span>'+Math.round(r.acc*100)+'%</span>':'<span>Not started</span>'))+'</span></button>'}).join("");
  const tests=S.tests.slice(-10).reverse().map(t=>{const d=new Date(t.ts);return '<tr><td>'+dLabel(d)+'</td><td>'+t.dur+' s</td><td>'+(POOL_NAME[t.pool]||t.pool)+(t.opts?" · "+[...t.opts].map(c=>({c:"capitals",p:"punctuation",n:"numbers"})[c]).filter(Boolean).join(", "):"")+'</td><td>'+Math.round(t.wpm)+'</td><td>'+Math.round(t.acc*100)+'%</td></tr>'}).join("");
  setView('<div class="view-head"><h1>Progress</h1></div>'+levelHeroHTML()+recapHTML()+tiles+shareCardHTML()+
    '<div class="pg-duo"><section class="sect-gap"><h2>Practice calendar</h2><p class="small muted" style="margin-bottom:12px">Last 12 weeks. The darkest squares mean you reached your daily goal.</p>'+calendarSVG()+
    '<div class="cal-leg"><span>Less</span><svg width="64" height="14" viewBox="0 0 64 14" aria-hidden="true">'+[0,30,55,85].map((p,i)=>'<rect x="'+i*17+'" width="14" height="14" rx="3" style="fill:color-mix(in oklab,var(--f-middle) '+p+'%,var(--surface-2))"/>').join("")+'</svg><span>More</span></div></section>'+
    '<section class="sect-gap"><h2>Speed trend</h2><p class="small muted">Last 30 days, in words per minute.</p>'+tr.html+'</section></div>'+
    achHTML()+'<section class="sect-gap"><h2>Key heatmap</h2><div class="optrow" style="margin-bottom:12px">'+seg("Heat",[["speed","Speed"],["acc","Accuracy"]],HEAT)+'</div><svg class="kb" id="heat-kb" role="img" aria-label="Keyboard coloured by key '+(HEAT==="speed"?"speed":"accuracy")+'"></svg>'+
    '<div class="ramp"><span id="ramp-l">Slower</span><i></i><span id="ramp-r">At target</span></div>'+
    '<h3 style="margin-top:24px">Slowest keys</h3>'+(slow?'<div class="slow">'+slow+'</div>':'<div class="empty" style="margin-top:10px">Type at least 8 presses of a key to see it here.</div>')+
    (rows?'<details><summary>Show all keys as a table</summary><div class="tblwrap"><table class="tbl"><thead><tr><th>Key</th><th>Finger</th><th>Presses</th><th>WPM</th><th>Accuracy</th><th>Strength</th></tr></thead><tbody>'+rows+'</tbody></table></div></details>':"")+'<h3 style="margin-top:24px">Slowest letter pairs</h3>'+pairChips+(prows?'<details><summary>Show all letter pairs as a table</summary><div class="tblwrap"><table class="tbl"><thead><tr><th>Pair</th><th>Presses</th><th>WPM</th><th>Accuracy</th><th>Strength</th></tr></thead><tbody>'+prows+'</tbody></table></div></details>':"")+'</section>'+
    '<section class="sect-gap"><h2>Lessons</h2>'+les+'</section>'+
    '<section class="sect-gap"><h2>Recent tests</h2>'+(tests?'<div class="tblwrap"><table class="tbl tt"><thead><tr><th>Date</th><th>Length</th><th>Words</th><th>WPM</th><th>Accuracy</th></tr></thead><tbody>'+tests+'</tbody></table></div>':panel({flat:1,eyebrow:"Recent tests",msg:"No tests yet. Try a 30 second test to set your first score.",foot:'<button class="btn ghost" type="button" data-nav="test">Go to Test</button>'}))+'</section>'+
    '<section class="sect-gap"><h2>Saving</h2>'+panel({flat:1,eyebrow:"Save status",body:'<p class="save-line" aria-live="polite">'+esc(STATUS_TXT[saveStatus])+'</p><div id="pr-reset-zone"><button class="btn ghost sm" type="button" data-act="pr-reset">Reset progress</button></div>'})+'</section>',"idle");
  HK=makeKeyboard($("heat-kb"),"heat");renderHeat();
  attachChart($("trend"),tr.pts,tr.W,tr.H,$("tcross2"));
}
view.addEventListener("click",e=>{
  const b=e.target.closest("[data-act],[data-nav]");if(!b)return;
  if(b.dataset.nav){location.hash=b.dataset.nav;return}
  if(b.dataset.act==="pr-reset")$("pr-reset-zone").innerHTML='<div class="confirm"><p>This erases all lessons, key stats and history, here and in your account.</p><div class="actions"><button class="btn danger sm" type="button" data-act="pr-yes">Yes, erase all progress</button><button class="btn quiet sm" type="button" data-act="pr-no">Cancel</button></div></div>';
  else if(b.dataset.act==="pr-no")$("pr-reset-zone").innerHTML='<button class="btn ghost sm" type="button" data-act="pr-reset">Reset progress</button>';
  else if(b.dataset.act==="pr-yes"){resetAll();renderRing();renderProgress()}
});
