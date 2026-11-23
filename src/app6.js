/* ============================ BOOT ============================ */
S=loadLocal();loadCoach();
document.getElementById("tabs").addEventListener("click",e=>{
  const b=e.target.closest(".tab");if(!b)return;
  const h="#"+b.dataset.tab;if(location.hash===h||(!location.hash&&h==="#learn"))route();else location.hash=b.dataset.tab;
});
window.addEventListener("hashchange",route);
try{if(window.matchMedia&&matchMedia("(pointer: coarse)").matches)$("touch-note").hidden=false}catch(e){}
document.addEventListener("keydown",()=>{$("touch-note").hidden=true},{once:true});
$("touch-x").addEventListener("click",()=>{$("touch-note").hidden=true});
$("brand-mark").innerHTML=logoSVG(30);addFavicon();
wireSettings();syncSettingsUI();renderRing();route();
setSaveStatus("connecting");connectAccount();
/*DEBUG-START*/
window.App={state:()=>S,gen:genLesson,genStep,wpm:wpmCalc,LESSONS,charInfo,reach,pseudoWord,
  debugStage:(text,mode)=>mountStage({crumb:"Debug",text,mode:mode||"stop",onFinish:r=>{window.App.last=r}}),ex:()=>EX,lastComp:()=>lastComp,merge,sanitize,emptyState,words:()=>WL,
  seedKeys:m=>{Object.assign(S.keys,m);S.keysAt=Date.now();save()},
  seedDays:(n,per)=>{const now=new Date();for(let i=0;i<n;i++){const d=addDays(now,-i);if(Math.random()<.25&&i>0)continue;const ms=(per||600000)*(.5+Math.random());S.days[dateKey(d)]={ms,chars:Math.round(ms/60000*5*(18+(n-i)*.4)),presses:0,correct:0,ex:3,t:Date.now()}}save()},
  seedLessons:k=>{for(let n=1;n<=k;n++)S.lessons[n]={done:true,stars:2,wpm:20,acc:.97,attempts:1,last:Date.now()};save()},
  pass:k=>{for(let n=1;n<=k;n++)S.lessons[n]={done:true,stars:2,wpm:20,acc:.97,attempts:1,last:Date.now()};save()},
  seedCoach:o=>applyCoachRaw(o),coach:()=>COACH,validCoach:o=>sanitizeCoach(o),startCustom,coachPrompt:()=>buildPrompt(buildSummary(),allowedChars()),coachSummary:buildSummary,coachValidate:d=>validateReply(d,allowedChars()),allowedChars:()=>[...allowedChars()].join(""),
  pool:poolLetters,focus:()=>focusKey(poolLetters()),chooseFocus:()=>chooseFocus(poolLetters()),seedPairs:m=>{Object.assign(S.pairs,m);S.pairsAt=Date.now();save()},slowPairs,pace:()=>({live:PACE_LIVE.size,ghost:EX&&EX.ghostPos?EX.ghostPos():null}),session:()=>SESSION,startSession,paceFor,genPractice,testChunk,practice:()=>PRI,render:()=>renderTab(),strength:strengthOf,
  mergeTest:(a,b)=>merge(sanitize(a),sanitize(b)),setStatus:s=>setSaveStatus(s),levelInfo,xpWords,ACH,checkAchievements,liveCheck,weekStats,drawShareCard,openShare,toast,confetti,testCard,weekCard,lastLv:()=>LASTLV,showWelcome,welcome:()=>WEL,save,cleanText,splitParts,TEXTS,SNIPPETS,BADDEAD,pmode:()=>pmode(),mtList,setState:o=>{S=sanitize(o);writeLocal()}};
window.App.wk={run:weeklyRun,isoWeek,weekId,state:()=>({WK,coachOff,sample:!!SAMPLE,snap:COACH_SNAP,raw:COACH_RAW}),setCoachOff:v=>{coachOff=v;syncWeeklyUI()}};
window.App.snd={KEYPACKS,noise,knock,jit,use:(c,g,b)=>{actx=c;mgain=g;nbuf=b}};
/*DEBUG-END*/
})();
