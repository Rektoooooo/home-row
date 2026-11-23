/* ============================ MOVE FROM THE OLD ADDRESS ============================ */
/* The website moved from home-row-lime.vercel.app to homerow.sebthe.dev. Progress lives in each address's own browser
   storage, so the old address forwards it once inside the URL fragment (a fragment is never sent to a server). The new
   address asks before combining it with what is already saved here; nothing is replaced. */
const OLD_HOST="home-row-lime.vercel.app",NEW_APP="https://homerow.sebthe.dev/app/";
let MOVE=null;
function forwardFromOldHost(){
  if(location.hostname!==OLD_HOST)return false;
  let frag="";
  try{
    const s=localStorage.getItem(LSK),c=localStorage.getItem(COACH_LS);
    if(s||c)frag="#move="+encodeURIComponent(JSON.stringify({s:s?JSON.parse(s):null,c:c?JSON.parse(c):null}));
  }catch(e){}
  location.replace(NEW_APP+frag);
  return true;
}
/* reads #move=… once and removes it from the address bar */
function readMove(){
  if(location.hash.indexOf("#move=")!==0)return;
  try{
    const o=JSON.parse(decodeURIComponent(location.hash.slice(6)));
    if(isObj(o)){
      const s=o.s?sanitize(o.s):null,c=isObj(o.c)?sanitizeCoach(o.c):null;
      const lessons=s?LESSONS.filter(l=>s.lessons[l.n]&&s.lessons[l.n].done).length:0;
      const mins=s?Math.round(Object.values(s.days).reduce((a,d)=>a+(fin(d.ms)?d.ms:0),0)/60000):0;
      const coach=c?c.lessons.length:0;
      if(lessons||mins||(s&&s.tests.length)||coach)MOVE={s,c:coach?o.c:null,lessons,mins,coach};
    }
  }catch(e){}
  try{history.replaceState(null,"",location.pathname+location.search+"#learn")}catch(e){}
}
function moveSummary(){
  const p=[];
  if(MOVE.lessons)p.push(MOVE.lessons+(MOVE.lessons===1?" lesson":" lessons")+" passed");
  if(MOVE.mins)p.push(MOVE.mins+(MOVE.mins===1?" minute":" minutes")+" of practice");
  if(MOVE.coach)p.push(MOVE.coach+(MOVE.coach===1?" lesson":" lessons")+" from Claude");
  return p.length>1?p.slice(0,-1).join(", ")+" and "+p[p.length-1]:p[0]||"your progress";
}
function showMove(){
  if(!MOVE)return;
  /* already brought over (the old link was opened again): nothing new, so no question */
  const have=new Set((COACH.lessons||[]).map(l=>l.id)),newCoach=MOVE.c&&(MOVE.c.lessons||[]).some(l=>isObj(l)&&!have.has(l.id));
  if(!newCoach&&(!MOVE.s||stable(merge(S,MOVE.s))===stable(merge(S,S)))){MOVE=null;return}
  const d=document.createElement("dialog");d.className="movedlg";d.setAttribute("aria-labelledby","move-t");
  d.innerHTML=panel({flat:1,eyebrow:"New address",title:'<span id="move-t">Bring your progress here?</span>',
    msg:"Home Row moved to homerow.sebthe.dev. Your progress from the old address came along: "+esc(moveSummary())+". It is added to anything already saved here, so nothing is lost.",
    foot:'<button type="button" class="btn quiet" data-mv="no">Not now</button><button type="button" class="btn" data-mv="yes" autofocus>Bring it over</button>'});
  $("app").appendChild(d);
  const done=yes=>{
    const m=MOVE;MOVE=null;d.close();d.remove();
    if(yes){
      if(m.s){S=merge(S,m.s);save()}
      if(m.c){
        const cur=isObj(COACH_RAW)?clone(COACH_RAW):{},ids=new Set((Array.isArray(cur.lessons)?cur.lessons:[]).map(l=>isObj(l)&&l.id));
        cur.lessons=(Array.isArray(cur.lessons)?cur.lessons:[]).concat((m.c.lessons||[]).filter(l=>isObj(l)&&!ids.has(l.id))).slice(0,20);
        if(!cur.note&&m.c.note)cur.note=m.c.note;
        applyCoachRaw(cur,true);
      }
      renderRing();route();
      toast({icon:'<span class="medal" style="--ac:var(--ok);width:36px;height:36px">'+ico("check",20)+'</span>',title:"Progress moved",sub:"Everything from the old address is here."});
    }else if(!S.seenTips.welcome&&!wlHasProgress())showWelcome(1);
  };
  d.addEventListener("click",e=>{const b=e.target.closest("[data-mv]");if(b)done(b.dataset.mv==="yes")});
  d.addEventListener("cancel",e=>{e.preventDefault();done(false)});
  d.showModal();
}
